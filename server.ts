import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

const envUrl = process.env.VITE_SUPABASE_URL;
const supabaseUrl = (envUrl && envUrl.startsWith('http')) ? envUrl : 'https://qisjuugbxrcjvpdnzxhz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpc2p1dWdieHJjanZwZG56eGh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI1NTczNywiZXhwIjoyMDg0ODMxNzM3fQ.5oKj5RL6OnI5kw9ciLIjAmxL1dNZwkZTEuijtnSCO5Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  app.get('/api/admin/stats', async (req, res) => {
    try {
      // 1. Student Counts per Class
      const { data: muridData, error: muridError } = await supabase.from('murid').select('Kelas');
      if (muridError) throw muridError;

      const kelasCounts: Record<string, number> = {};
      const totalSiswa = muridData?.length || 0;

      if (muridData) {
        muridData.forEach(m => {
          // Normalize class name (e.g. "Kelas 1", "1", "1A" -> "Kelas 1")
          let className = m.Kelas ? String(m.Kelas).trim() : 'Unassigned';
          // Simple normalization: if it contains a digit, use "Kelas X"
          const digit = className.match(/\d+/);
          if (digit) {
            className = `Kelas ${digit[0]}`;
          }
          
          kelasCounts[className] = (kelasCounts[className] || 0) + 1;
        });
      }

      // 2. Total JP (All records in jadwal_real)
      // The user wants "jumlah semua jp/hari dalam satu sekolah". 
      // Assuming this means the total number of scheduled lesson hours in the database.
      const { count: totalJP, error: jadwalError } = await supabase
        .from('jadwal_real')
        .select('*', { count: 'exact', head: true });
      
      if (jadwalError) throw jadwalError;

      res.json({
        success: true,
        data: {
          studentCounts: kelasCounts,
          totalStudents: totalSiswa,
          totalJP: totalJP || 0
        }
      });

    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get('/api/public-dashboard', async (req, res) => {
    try {
      const today = new Date();
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const hariIniIndo = days[today.getDay()];
      const todayDateStr = today.toISOString().split('T')[0];

      const { data: muridData } = await supabase.from('murid').select('"Kelas"');
      const totalStudents = muridData?.length || 0;
      const kelasCounts: any = { kelas1: 0, kelas2: 0, kelas3: 0, kelas4: 0, kelas5: 0, kelas6: 0 };
      if (muridData) {
        muridData.forEach(m => {
          // Extract the first digit to handle cases like "1A", "1-B", "Kelas 1", etc.
          const classMatch = String(m.Kelas).match(/\d+/);
          const classNum = classMatch ? classMatch[0] : '';
          
          if (['1', '2', '3', '4', '5', '6'].includes(classNum)) {
            kelasCounts[`kelas${classNum}`] = (kelasCounts[`kelas${classNum}`] || 0) + 1;
          }
        });
      }

      // Get Total JP (all scheduled lessons)
      const { count: totalJP } = await supabase.from('jadwal_real').select('*', { count: 'exact', head: true });

      const { data: todaysSchedule } = await supabase.from('jadwal_real').select('*').eq('hari', hariIniIndo);
      const { data: todaysJurnal } = await supabase.from('jurnal').select('*').gte('timestamp', `${todayDateStr}T00:00:00Z`).lte('timestamp', `${todayDateStr}T23:59:59Z`);

      let completedKBM = 0;
      const notYetTaught: any[] = [];
      const absentStudents: any[] = [];

      if (todaysSchedule) {
        todaysSchedule.forEach(schedule => {
          const isDone = todaysJurnal?.some(jurnal => {
            return jurnal.nama_guru === schedule.guru && jurnal.kelas === schedule.kelas;
          });

          if (isDone) {
            completedKBM++;
          } else {
            notYetTaught.push({
              guru: schedule.guru,
              kelas: schedule.kelas,
              mapel: schedule.mapel
            });
          }
        });
      }

      if (todaysJurnal) {
        todaysJurnal.forEach(j => {
          try {
            const absenList = typeof j.ketidakhadiran === 'string' ? JSON.parse(j.ketidakhadiran) : j.ketidakhadiran;
            if (Array.isArray(absenList)) {
              absenList.forEach((absen: any) => {
                // Avoid duplicates if multiple journals record the same student (though unlikely in this schema, good safety)
                if (!absentStudents.some(s => s.name === absen.nama && s.class === j.kelas)) {
                  absentStudents.push({
                    name: absen.nama,
                    class: j.kelas,
                    reason: absen.keterangan
                  });
                }
              });
            }
          } catch (e) {
            console.error("Error parsing ketidakhadiran", e);
          }
        });
      }

      const totalScheduledKBM = todaysSchedule?.length || 0;
      const percentage = totalScheduledKBM > 0 ? ((completedKBM / totalScheduledKBM) * 100).toFixed(1) : 0;

      const { data: pengumuman } = await supabase.from('pengumuman').select('*').order('tanggal', { ascending: false }).order('id', { ascending: false }).limit(1).maybeSingle();

      res.json({
        success: true,
        data: {
          ...kelasCounts,
          totalStudents,
          totalJP: totalJP || 0,
          totalScheduled: totalScheduledKBM,
          completedKBM,
          percentage,
          notYetTaught,
          cleanestClass: '-',
          pengumuman: pengumuman ? pengumuman.isi : 'Tidak ada pengumuman',
          announcementTitle: pengumuman ? pengumuman.judul : '',
          announcementDate: pengumuman ? pengumuman.tanggal : '',
          absentStudents
        }
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get('/api/pengumuman', async (req, res) => {
    const { data, error } = await supabase.from('pengumuman').select('*').order('tanggal', { ascending: false }).order('id', { ascending: false });
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, data });
  });

  app.post('/api/pengumuman', async (req, res) => {
    const { judul, tanggal, isi } = req.body;
    
    // We'll just insert a new record for now, or we could update the latest one.
    // Let's insert a new one so we keep history.
    const { error } = await supabase.from('pengumuman').insert({
      judul,
      tanggal,
      isi
    });

    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, message: 'Pengumuman berhasil disimpan' });
  });

  app.post('/api/login', async (req, res) => {
    const { nip, password, role } = req.body;
    
    if (role === 'monitoring') {
      // Monitoring role login logic if needed, or remove if no longer used.
      // For now, removing the hardcoded '1'/'1' credential as requested.
      // If there is a real monitoring user in DB, we should check that.
      // Assuming monitoring might be accessed by admin or specific users.
      // If the user wants to remove ALL dummy accounts, this hardcoded one must go.
      
      // If we want to allow monitoring login, it should probably be against a DB table.
      // But for now, I will just return 401 if no DB check is implemented.
      return res.status(401).json({ success: false, message: 'Akun monitoring dummy telah dihapus. Silakan gunakan akun valid.' });
    }

    if (role === 'admin') {
      const { data: user } = await supabase.from('admin').select('username, nama').eq('username', nip).eq('password', password).single();
      if (user) {
        return res.json({ success: true, user: { role: 'admin', Username: user.username, Nama: user.nama } });
      }
    } else if (role === 'tendik') {
      const { data: user } = await supabase.from('tendik').select('nip, nama_tendik').eq('nip', nip).eq('password', password).single();
      if (user) {
        return res.json({ success: true, user: { role: 'tendik', NIP: user.nip, 'Nama Guru': user.nama_tendik } });
      }
    } else if (role === 'siswa') {
      const { data: user } = await supabase.from('murid').select('"NISN", "NIS", "Nama Lengkap", "Kelas", "Password (Default: baujeng(kelas))"').eq('NIS', nip).single();
      if (user && user['Password (Default: baujeng(kelas))'] === password) {
        return res.json({ success: true, user: { role: 'siswa', NISN: user.NISN, NIS: user.NIS, Nama_Murid: user['Nama Lengkap'], Kelas: user.Kelas } });
      }
    } else {
      // Default to Guru
      const { data: user } = await supabase.from('guru').select('nip, nama_guru, target_jp, mengajar').eq('nip', nip).eq('password', password).single();
      
      if (user) {
        const today = new Date();
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const hariIniIndo = days[today.getDay()];
        
        const { data: schedule } = await supabase.from('jadwal_real').select('jam, kelas, mapel').eq('hari', hariIniIndo).eq('guru', user.nama_guru).order('jam');
        
        return res.json({
          success: true,
          user: {
            role: 'guru',
            NIP: user.nip,
            'Nama Guru': user.nama_guru,
            Mengajar: user.mengajar
          },
          schedule: schedule || [],
          targetJP: user.target_jp
        });
      }
    }
    
    res.status(401).json({ success: false, message: 'ID atau Password salah' });
  });

  app.get('/api/main-stats', async (req, res) => {
    const { namaGuru, targetJP } = req.query;
    const today = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const hariIniIndo = days[today.getDay()];
    const todayDateStr = today.toISOString().split('T')[0];

    const { data: todaysSchedule } = await supabase.from('jadwal_real').select('jam, kelas, mapel').eq('hari', hariIniIndo).eq('guru', namaGuru).order('jam');
    const { data: todaysJurnal } = await supabase.from('jurnal').select('*').eq('nama_guru', namaGuru).gte('timestamp', `${todayDateStr}T00:00:00Z`).lte('timestamp', `${todayDateStr}T23:59:59Z`);

    const todaysScheduleBoxes = (todaysSchedule || []).map(sch => {
      const isDone = todaysJurnal?.some(j => j.kelas === sch.kelas);
      return { ...sch, status: isDone };
    });

    const currentWeeklyJP = (todaysJurnal?.length || 0) * 2; 
    const finalTarget = Number(targetJP) || 24;
    const percent = Math.min(100, (currentWeeklyJP / finalTarget) * 100).toFixed(1);

    res.json({
      success: true,
      data: {
        todaysScheduleBoxes,
        weeklyProgress: {
          current: currentWeeklyJP,
          target: finalTarget,
          percent
        }
      }
    });
  });

  app.get('/api/initial-data', async (req, res) => {
    const { data: guru } = await supabase.from('guru').select('nip, nama_guru, mengajar');
    const { data: murid } = await supabase.from('murid').select('"NISN", "Nama Lengkap", "Kelas", "Password (Default: baujeng(kelas))", "Tanggal Lahir (YYYY-MM-DD)", "Jenis Kelamin (L/P)", "NIS"');
    
    const formattedGuru = (guru || []).map(g => ({ NIP: g.nip, 'Nama Guru': g.nama_guru, Mengajar: g.mengajar }));
    const formattedMurid = (murid || []).map(m => ({ 
      NISN: m.NISN, 
      'Nama Murid': m['Nama Lengkap'], 
      Kelas: m.Kelas,
      Password: m['Password (Default: baujeng(kelas))'],
      TanggalLahir: m['Tanggal Lahir (YYYY-MM-DD)'],
      JenisKelamin: m['Jenis Kelamin (L/P)'],
      NIS: m.NIS
    }));

    res.json({
      guru: formattedGuru,
      murid: formattedMurid,
      mapel: ['Matematika', 'Bahasa Indonesia', 'IPA', 'IPS', 'PKn', 'Seni Budaya', 'PJOK'],
      catatan: ['Terlambat', 'Tidak Mengerjakan PR', 'Sakit di Sekolah', 'Izin Pulang Cepat'],
      ketidakhadiran: ['Sakit', 'Izin', 'Alpa', 'Dispensasi'],
      jenisPresensi: ['Hadir', 'Sakit', 'Izin', 'Alpa'],
      namaEkstra: ['Pramuka', 'PMR', 'Paskibra', 'Futsal', 'Basket']
    });
  });

  app.get('/api/murid', async (req, res) => {
    const { data: murid, error } = await supabase.from('murid').select('*');
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, data: murid });
  });

  app.post('/api/murid', async (req, res) => {
    const { NISN, NamaLengkap, Kelas, Password, TanggalLahir, JenisKelamin, NIS } = req.body;
    const { error } = await supabase.from('murid').insert({
      "NISN": NISN,
      "Nama Lengkap": NamaLengkap,
      "Kelas": Kelas,
      "Password (Default: baujeng(kelas))": Password || `baujeng${String(Kelas).replace(/\D/g, '')}`,
      "Tanggal Lahir (YYYY-MM-DD)": TanggalLahir,
      "Jenis Kelamin (L/P)": JenisKelamin,
      "NIS": NIS
    });
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, message: 'Data murid berhasil ditambahkan' });
  });

  app.put('/api/murid/:nisn', async (req, res) => {
    const { nisn } = req.params;
    const { NamaLengkap, Kelas, Password, TanggalLahir, JenisKelamin, NIS } = req.body;
    
    const updateData: any = {
      "Nama Lengkap": NamaLengkap,
      "Kelas": Kelas,
      "Tanggal Lahir (YYYY-MM-DD)": TanggalLahir,
      "Jenis Kelamin (L/P)": JenisKelamin,
      "NIS": NIS
    };
    
    if (Password) {
      updateData["Password (Default: baujeng(kelas))"] = Password;
    }

    const { error } = await supabase.from('murid').update(updateData).eq('NISN', nisn);
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, message: 'Data murid berhasil diupdate' });
  });

  app.delete('/api/murid/:nisn', async (req, res) => {
    const { nisn } = req.params;
    const { error } = await supabase.from('murid').delete().eq('NISN', nisn);
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, message: 'Data murid berhasil dihapus' });
  });

  app.post('/api/jurnal', async (req, res) => {
    const { nip, guru, kelas, pembelajaran, ketidakhadiran, catatan, kebersihanKelas, validasi } = req.body;
    
    const mataPelajaranStr = pembelajaran.map((p: any) => p.mataPelajaran).join(', ');
    const jamPembelajaranStr = [...new Set(pembelajaran.flatMap((p: any) => p.jamPembelajaran))].sort((a: any, b: any) => a - b).join(', ');
    const materiJson = JSON.stringify(pembelajaran);

    const { error } = await supabase.from('jurnal').insert({
      nip: nip,
      nama_guru: guru,
      kelas: kelas,
      mata_pelajaran: mataPelajaranStr,
      jam_pembelajaran: jamPembelajaranStr,
      materi: materiJson,
      ketidakhadiran: JSON.stringify(ketidakhadiran),
      catatan_mengajar: JSON.stringify(catatan),
      kebersihan_kelas: kebersihanKelas,
      validasi: validasi.status,
      guru_piket_inval: validasi.guruPiketInval || ''
    });

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.json({ success: true, message: 'Data jurnal berhasil disimpan.' });
  });

  app.get('/api/keterlaksanaan', async (req, res) => {
    const { data: scheduleList } = await supabase.from('jadwal_real').select('kelas, jam, guru, mapel');
    const todayDateStr = new Date().toISOString().split('T')[0];
    const { data: todaysJurnal } = await supabase.from('jurnal').select('*').gte('timestamp', `${todayDateStr}T00:00:00Z`).lte('timestamp', `${todayDateStr}T23:59:59Z`);

    const dataByClass: any = {};
    if (scheduleList) {
      scheduleList.forEach(item => {
        const matchedJurnal = todaysJurnal?.find(j => j.kelas === item.kelas && j.nama_guru === item.guru);
        
        if (!dataByClass[item.kelas]) dataByClass[item.kelas] = [];
        dataByClass[item.kelas].push({
          ...item,
          mapel: matchedJurnal ? matchedJurnal.mata_pelajaran : 'X',
          materi: matchedJurnal ? matchedJurnal.materi : '-',
          kebersihan: matchedJurnal ? matchedJurnal.kebersihan_kelas : '-'
        });
      });
    }

    res.json({ success: true, data: dataByClass });
  });

  app.get('/api/monitoring/matrix', async (req, res) => {
    try {
      const today = new Date();
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const hariIniIndo = days[today.getDay()];

      // 1. Get all teachers
      const { data: teachers, error: teacherError } = await supabase
        .from('guru')
        .select('nip, nama_guru')
        .order('nama_guru');
      
      if (teacherError) throw teacherError;

      // 2. Get today's schedule for all teachers
      const { data: schedules, error: scheduleError } = await supabase
        .from('jadwal_real')
        .select('guru, jam, kelas, mapel')
        .eq('hari', hariIniIndo);

      if (scheduleError) throw scheduleError;

      // 3. Map schedules to teachers
      const matrixData = teachers.map(teacher => {
        const teacherSchedule: Record<string, any> = {};
        
        // Initialize all 8 hours as null
        for (let i = 1; i <= 8; i++) {
          teacherSchedule[i] = null;
        }

        // Fill in actual schedules
        if (schedules) {
          const mySchedules = schedules.filter(s => s.guru === teacher.nama_guru);
          mySchedules.forEach(s => {
            // s.jam is expected to be "1", "2", etc. or maybe "07:00-08:00"
            // If it's just the hour number (1-8), we can use it directly.
            // If it's a time range, we might need to map it.
            // Based on previous code (JadwalModal), jam is stored as integer 1-8.
            // Let's assume it's stored as string "1", "2" or int 1, 2.
            
            teacherSchedule[s.jam] = {
              kelas: s.kelas,
              mapel: s.mapel
            };
          });
        }

        return {
          nama_guru: teacher.nama_guru,
          nip: teacher.nip,
          schedule: teacherSchedule
        };
      });

      res.json({ success: true, data: matrixData });

    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get('/api/monitoring', async (req, res) => {
    try {
      const today = new Date();
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const hariIniIndo = days[today.getDay()];
      const todayDateStr = today.toISOString().split('T')[0];

      // Fetch today's schedule
      const { data: todaysSchedule } = await supabase
        .from('jadwal_real')
        .select('*')
        .eq('hari', hariIniIndo)
        .order('kelas')
        .order('jam');

      // Fetch today's journals
      const { data: todaysJurnal } = await supabase
        .from('jurnal')
        .select('*')
        .gte('timestamp', `${todayDateStr}T00:00:00Z`)
        .lte('timestamp', `${todayDateStr}T23:59:59Z`);

      // Fetch all students to count per class
      const { data: allMurid } = await supabase.from('murid').select('Kelas');
      const studentCountByClass: Record<string, number> = {};
      (allMurid || []).forEach(m => {
        const cls = String(m.Kelas).replace(/\D/g, ''); // Normalize "Kelas 1" to "1"
        studentCountByClass[cls] = (studentCountByClass[cls] || 0) + 1;
      });

      // Fetch all schedules to calculate total JP for today
      const { data: allTodaySchedules } = await supabase.from('jadwal_real').select('jam').eq('hari', hariIniIndo);
      const totalJP = allTodaySchedules?.length || 0;

      const monitoringData: any[] = [];
      const classes = ['1', '2', '3', '4', '5', '6'];
      const belumMengisi: any[] = [];
      
      // Calculate Stats
      let totalKetidakhadiran = 0;
      if (todaysJurnal) {
        todaysJurnal.forEach(j => {
          try {
            const absen = typeof j.ketidakhadiran === 'string' ? JSON.parse(j.ketidakhadiran) : j.ketidakhadiran;
            if (Array.isArray(absen)) {
              totalKetidakhadiran += absen.length;
            }
          } catch (e) {}
        });
      }

      const totalJadwal = todaysSchedule?.length || 0;
      const totalJurnal = todaysJurnal?.length || 0;
      const keterlaksanaan = totalJadwal > 0 ? Math.round((totalJurnal / totalJadwal) * 100) : 0;

      // Logic for monitoring grid (current active class)
      classes.forEach(cls => {
        const classSchedule = todaysSchedule?.filter(s => s.kelas === cls) || [];
        
        if (classSchedule.length === 0) {
          monitoringData.push({
            kelas: cls,
            status: 'Kosong',
            guru: '-',
            mapel: '-',
            jam: '-',
            studentCount: studentCountByClass[cls] || 0
          });
        } else {
          const currentHour = today.getHours() + today.getMinutes() / 60;
          
          // Find active schedule based on time, or default to first/upcoming
          const activeSchedule = classSchedule.find(s => {
            const parts = s.jam.split('-');
            if (parts.length === 2) {
              const [startH, startM] = parts[0].split(':').map(Number);
              const [endH, endM] = parts[1].split(':').map(Number);
              const start = startH + (startM || 0) / 60;
              const end = endH + (endM || 0) / 60;
              return currentHour >= start && currentHour < end;
            }
            return false;
          }) || classSchedule[0];

          const isDone = todaysJurnal?.some(j => j.kelas === cls && j.nama_guru === activeSchedule.guru);

          monitoringData.push({
            kelas: cls,
            status: isDone ? 'Terlaksana' : 'Belum',
            guru: activeSchedule.guru,
            mapel: activeSchedule.mapel,
            jam: activeSchedule.jam,
            studentCount: studentCountByClass[cls] || 0
          });
        }
      });

      // Logic for Belum Mengisi (Teachers who haven't filled journal for today's schedule)
      if (todaysSchedule) {
        todaysSchedule.forEach(sch => {
          const isDone = todaysJurnal?.some(j => j.kelas === sch.kelas && j.nama_guru === sch.guru);
          if (!isDone) {
            belumMengisi.push({
              guru: sch.guru,
              kelas: sch.kelas,
              mapel: sch.mapel
            });
          }
        });
      }

      res.json({ 
        success: true, 
        data: {
          jadwal: monitoringData,
          stats: {
            ketidakhadiran: totalKetidakhadiran,
            keterlaksanaan: keterlaksanaan,
            kelasTerbersih: '-', // Placeholder as we don't have this logic yet
            jamKosongMax: 0, // Placeholder
            totalJP: totalJP
          },
          belumMengisi: belumMengisi
        } 
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post('/api/import-master', async (req, res) => {
    try {
      const { type, data } = req.body;
      
      if (type === 'guru') {
        for (const item of data) {
          await supabase.from('guru').upsert({
            nip: item.NIP,
            nama_guru: item.Nama_Guru,
            mengajar: item.Mengajar,
            password: item.Password || '123456',
            target_jp: item.Target_JP || 24
          });
        }
      } else if (type === 'tendik') {
        for (const item of data) {
          await supabase.from('tendik').upsert({
            nip: item.NIP,
            nama_tendik: item.Nama_Tendik,
            password: item.Password || '123456'
          });
        }
      } else if (type === 'murid') {
        for (const item of data) {
          await supabase.from('murid').upsert({
            "NISN": item.NISN,
            "Nama Lengkap": item.Nama_Murid || item['Nama Lengkap'],
            "Kelas": item.Kelas,
            "Password (Default: baujeng(kelas))": item.Password || '123456',
            "Tanggal Lahir (YYYY-MM-DD)": item['Tanggal Lahir (YYYY-MM-DD)'] || null,
            "Jenis Kelamin (L/P)": item['Jenis Kelamin (L/P)'] || null,
            "NIS": item.NIS || null
          });
        }
      }
      
      res.json({ success: true, message: `Data ${type} berhasil diimport` });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post('/api/import-jurnal', async (req, res) => {
    try {
      const { data } = req.body;
      
      for (const item of data) {
        await supabase.from('jurnal').insert({
          timestamp: item.Timestamp,
          nip: item.NIP,
          nama_guru: item.Nama_Guru,
          kelas: item.Kelas,
          mata_pelajaran: item.Mata_Pelajaran,
          jam_pembelajaran: item.Jam_Pembelajaran,
          materi: item.Materi,
          ketidakhadiran: item.Ketidakhadiran,
          catatan_mengajar: item.Catatan_Mengajar,
          kebersihan_kelas: item.Kebersihan_Kelas,
          validasi: item.Validasi,
          guru_piket_inval: item.Guru_Piket_Inval
        });
      }
      
      res.json({ success: true, message: 'Data jurnal berhasil diimport' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get('/api/laporan', async (req, res) => {
    try {
      const { nip } = req.query;
      let query = supabase.from('jurnal').select('*').order('timestamp', { ascending: false });
      
      if (nip) {
        query = query.eq('nip', nip);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      const formattedData = (data || []).map(item => ({
        Timestamp: item.timestamp,
        NIP: item.nip,
        Nama_Guru: item.nama_guru,
        Kelas: item.kelas,
        Mata_Pelajaran: item.mata_pelajaran,
        Jam_Pembelajaran: item.jam_pembelajaran,
        Materi: item.materi,
        Ketidakhadiran: item.ketidakhadiran,
        Catatan_Mengajar: item.catatan_mengajar,
        Kebersihan_Kelas: item.kebersihan_kelas,
        Validasi: item.validasi,
        Guru_Piket_Inval: item.guru_piket_inval
      }));

      res.json({ success: true, data: formattedData });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get('/api/jadwal-mengajar', async (req, res) => {
    try {
      const { namaGuru } = req.query;
      let query = supabase.from('jadwal_real').select('hari, jam, kelas, mapel').order('hari').order('jam');
      
      if (namaGuru) {
        query = query.eq('guru', namaGuru);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      res.json({ success: true, data });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post('/api/users', async (req, res) => {
    const { nip, nama, role, password, jabatan } = req.body;
    
    let table = 'guru';
    let data: any = { nip, password: password || '123456' };

    if (role === 'Tendik') {
      table = 'tendik';
      data.nama_tendik = nama;
      data.jabatan = jabatan;
    } else {
      // Guru or Admin
      data.nama_guru = nama;
      // Admin might be a flag in guru table or separate
    }

    const { error } = await supabase.from(table).insert(data);
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, message: 'User berhasil ditambahkan' });
  });

  app.get('/api/jadwal', async (req, res) => {
    const { kelas, hari } = req.query;
    let query = supabase.from('jadwal_real').select('*').order('jam');
    
    if (kelas) query = query.eq('kelas', kelas);
    if (hari) query = query.eq('hari', hari);
    
    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, data });
  });

  app.delete('/api/jadwal/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('jadwal_real').delete().eq('id', id);
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, message: 'Jadwal berhasil dihapus' });
  });
  
  app.put('/api/jadwal/:id', async (req, res) => {
    const { id } = req.params;
    const { hari, kelas, mapel, guru, jam, peran } = req.body;
    const { error } = await supabase.from('jadwal_real').update({
      hari, kelas, mapel, guru, jam
    }).eq('id', id);
    
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, message: 'Jadwal berhasil diupdate' });
  });

  // --- Bank Sampah Endpoints ---

  app.get('/api/bank-sampah/types', async (req, res) => {
    const { data, error } = await supabase.from('jenis_sampah').select('*').order('nama');
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, data });
  });

  app.post('/api/bank-sampah/types', async (req, res) => {
    const { nama, harga } = req.body;
    const { error } = await supabase.from('jenis_sampah').insert({ nama, harga });
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, message: 'Jenis sampah berhasil ditambahkan' });
  });

  app.put('/api/bank-sampah/types/:id', async (req, res) => {
    const { id } = req.params;
    const { nama, harga } = req.body;
    const { error } = await supabase.from('jenis_sampah').update({ nama, harga }).eq('id', id);
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, message: 'Jenis sampah berhasil diupdate' });
  });

  app.delete('/api/bank-sampah/types/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase.from('jenis_sampah').delete().eq('id', id);
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, message: 'Jenis sampah berhasil dihapus' });
  });

  app.get('/api/bank-sampah/transactions', async (req, res) => {
    const { data, error } = await supabase.from('tabungan_sampah').select('*').order('tanggal', { ascending: false });
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, data });
  });

  app.post('/api/bank-sampah/transactions', async (req, res) => {
    const { siswa, kelas, jenis_sampah, berat, nilai, tanggal } = req.body;
    const { error } = await supabase.from('tabungan_sampah').insert({
      siswa, kelas, jenis_sampah, berat, nilai, tanggal
    });
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, message: 'Transaksi berhasil disimpan' });
  });

  app.get('/api/pengaturan', async (req, res) => {
    try {
      const { data, error } = await supabase.from('pengaturan').select('*');
      if (error) throw error;
      
      const settings: Record<string, string> = {};
      if (data) {
        data.forEach((item: any) => {
          settings[item.key] = item.value;
        });
      }
      res.json({ success: true, data: settings });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post('/api/pengaturan', async (req, res) => {
    try {
      const settings = req.body;
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value: String(value)
      }));

      const { error } = await supabase.from('pengaturan').upsert(updates);
      if (error) throw error;

      res.json({ success: true, message: 'Pengaturan berhasil disimpan' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get('/api/bank-sampah/stats', async (req, res) => {
    try {
      const { data: transactions } = await supabase.from('tabungan_sampah').select('kelas, nilai, berat');
      
      let totalSavings = 0;
      let totalWeight = 0;
      const classStats: Record<string, number> = {};

      if (transactions) {
        transactions.forEach(t => {
          totalSavings += Number(t.nilai) || 0;
          totalWeight += Number(t.berat) || 0;
          const cls = t.kelas || 'Unassigned';
          classStats[cls] = (classStats[cls] || 0) + (Number(t.berat) || 0);
        });
      }

      // Find champion class (highest weight)
      let championClass = '-';
      let maxWeight = 0;
      Object.entries(classStats).forEach(([cls, weight]) => {
        if (weight > maxWeight) {
          maxWeight = weight;
          championClass = cls;
        }
      });

      res.json({
        success: true,
        data: {
          totalSavings,
          totalWeight,
          championClass,
          classStats
        }
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // --- Guru & Jadwal Endpoints ---

  app.get('/api/guru', async (req, res) => {
    const { data, error } = await supabase.from('guru').select('*').order('nama_guru');
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, data });
  });

  app.get('/api/users', async (req, res) => {
    try {
      const { data: guru, error: errorGuru } = await supabase.from('guru').select('*');
      const { data: tendik, error: errorTendik } = await supabase.from('tendik').select('*');

      if (errorGuru) throw errorGuru;
      if (errorTendik) throw errorTendik;

      const allUsers = [
        ...(guru || []).map((g: any) => ({ ...g, role: 'Guru', nama: g.nama_guru, type: 'guru', id: g.nip })),
        ...(tendik || []).map((t: any) => ({ ...t, role: 'Tendik', type: 'tendik', nama: t.nama_tendik, id: t.nip }))
      ];

      res.json({ success: true, data: allUsers });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.delete('/api/users/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    let table = '';
    if (type === 'guru') table = 'guru';
    else if (type === 'tendik') table = 'tendik';
    else return res.status(400).json({ success: false, message: 'Invalid user type' });

    const { error } = await supabase.from(table).delete().eq('nip', id);
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, message: 'User berhasil dihapus' });
  });

  app.post('/api/guru', async (req, res) => {
    const { nip, nama, mapel, waliKelas, password, isExtra, extraName } = req.body;
    
    // If it's an extra curricular teacher, we might handle it differently or just add to 'guru' table with specific flag
    // For now, assuming 'guru' table has 'mengajar' column which stores subjects
    
    const { error } = await supabase.from('guru').insert({
      nip,
      nama_guru: nama,
      mengajar: mapel.join(', '), // Store as comma-separated string
      password: password || '123456',
      // You might need to add columns for wali_kelas or extra_curricular to your Supabase table if they don't exist
      // For this example, I'll assume we store them in a metadata column or similar, or just 'mengajar'
    });

    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, message: 'Data guru berhasil ditambahkan' });
  });

  app.post('/api/jadwal', async (req, res) => {
    const { hari, kelas, mapel, guru, jam, peran } = req.body;
    // Assuming 'jadwal_real' is the table
    const { error } = await supabase.from('jadwal_real').insert({
      hari, kelas, mapel, guru, jam, 
      // peran // Add 'peran' column to database if needed
    });
    
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, message: 'Jadwal berhasil disimpan' });
  });


  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
