import express from 'express';
import { createClient } from '@supabase/supabase-js';

const envUrl = process.env.VITE_SUPABASE_URL;
const supabaseUrl = (envUrl && envUrl.startsWith('http')) ? envUrl : 'https://qisjuugbxrcjvpdnzxhz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpc2p1dWdieHJjanZwZG56eGh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI1NTczNywiZXhwIjoyMDg0ODMxNzM3fQ.5oKj5RL6OnI5kw9ciLIjAmxL1dNZwkZTEuijtnSCO5Q';

const supabase = createClient(supabaseUrl, supabaseKey);

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
      // Adjust to Indonesia Time (UTC+7)
      const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Jakarta', weekday: 'long' };
      const hariIniIndo = new Intl.DateTimeFormat('id-ID', options).format(today);
      const todayDateStr = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).toISOString().split('T')[0];

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
      if (nip === '1' && password === '1') {
        return res.json({ success: true, user: { role: 'monitoring', Username: '1', Nama: 'Monitoring Account' } });
      }
      return res.status(401).json({ success: false, message: 'ID atau Password salah' });
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
        // Adjust to Indonesia Time (UTC+7)
        const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Jakarta', weekday: 'long' };
        const hariIniIndo = new Intl.DateTimeFormat('id-ID', options).format(today);
        
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

  app.get('/api/tendik/stats', async (req, res) => {
    const { nip } = req.query;
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Get start and end of month
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    // Calculate total working days (Mon-Sat) in the month so far (or total month?)
    // "persentase kehadiran pengisian dalam satu bulan penuh (Sesuai bulan)"
    // Let's calculate total working days in the *entire* month to see target.
    let totalWorkingDays = 0;
    for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
        const day = d.getDay();
        if (day !== 0) totalWorkingDays++; // Exclude Sunday
    }

    // Get journal entries for this tendik in this month
    // Assuming we store tendik journal in 'jurnal' table with nama_guru = tendik_name (or nip?)
    // We need to know how we identify tendik in jurnal.
    // Let's assume we use the name.
    
    // First get tendik name from nip
    const { data: tendik } = await supabase.from('tendik').select('nama_tendik').eq('nip', nip).single();
    const nama = tendik ? tendik.nama_tendik : nip;

    const { data: journals } = await supabase
        .from('jurnal')
        .select('timestamp')
        .eq('nama_guru', nama) // Using nama_guru column for tendik name
        .gte('timestamp', startOfMonth.toISOString())
        .lte('timestamp', endOfMonth.toISOString());

    // Count unique days filled
    const filledDays = new Set();
    if (journals) {
        journals.forEach(j => {
            const date = new Date(j.timestamp).toISOString().split('T')[0];
            filledDays.add(date);
        });
    }

    const filledCount = filledDays.size;
    const percentage = totalWorkingDays > 0 ? (filledCount / totalWorkingDays) * 100 : 0;
    const category = percentage >= 60 ? 'Sesuai Ekspektasi' : 'Perlu Ditingkatkan';

    res.json({
        success: true,
        data: {
            filledCount,
            totalWorkingDays,
            percentage: percentage.toFixed(1),
            category
        }
    });
  });

  app.post('/api/jurnal-tendik', async (req, res) => {
    const { nip, nama, aktivitas, tanggal } = req.body;
    
    // Reuse jurnal table
    // mapel = 'Aktivitas Harian'
    // kelas = 'Tendik'
    // materi = aktivitas
    
    const { error } = await supabase.from('jurnal').insert({
        nama_guru: nama,
        kelas: 'Tendik',
        mata_pelajaran: 'Aktivitas Harian',
        materi: aktivitas,
        jam_pembelajaran: '-',
        jumlah_jam: 0,
        siswa_hadir: 0,
        siswa_ijin: 0,
        siswa_sakit: 0,
        siswa_alpha: 0,
        kebersihan_kelas: 'Baik',
        timestamp: new Date().toISOString() // Use current time or passed date
    });

    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, message: 'Aktivitas harian berhasil disimpan' });
  });

  app.get('/api/guru/latest-jurnal', async (req, res) => {
    const { namaGuru } = req.query;
    
    if (!namaGuru) {
      return res.status(400).json({ success: false, message: 'Nama Guru is required' });
    }

    try {
      const { data, error } = await supabase
        .from('jurnal')
        .select('*')
        .eq('nama_guru', namaGuru)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows"
        throw error;
      }

      res.json({ success: true, data: data || null });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get('/api/main-stats', async (req, res) => {
    const { namaGuru } = req.query;
    const today = new Date();
    // Adjust to Indonesia Time (UTC+7)
    const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Jakarta', weekday: 'long' };
    const hariIniIndo = new Intl.DateTimeFormat('id-ID', options).format(today);
    const todayDateStr = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).toISOString().split('T')[0];

    // Get start of week (Monday) and end of week (Sunday)
    const dayOfWeek = today.getDay() || 7; // Make Sunday 7
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startOfWeekStr = startOfWeek.toISOString();
    const endOfWeekStr = endOfWeek.toISOString();

    const { data: todaysSchedule } = await supabase.from('jadwal_real').select('jam, kelas, mapel').eq('hari', hariIniIndo).eq('guru', namaGuru).order('jam');
    const { data: todaysJurnal } = await supabase.from('jurnal').select('kelas, jam_pembelajaran').eq('nama_guru', namaGuru).gte('timestamp', `${todayDateStr}T00:00:00Z`).lte('timestamp', `${todayDateStr}T23:59:59Z`);

    const { data: weeklySchedule } = await supabase.from('jadwal_real').select('jam').eq('guru', namaGuru);
    const finalTarget = weeklySchedule?.length || 0;

    const { data: weeklyJurnal } = await supabase.from('jurnal').select('jam_pembelajaran').eq('nama_guru', namaGuru).gte('timestamp', startOfWeekStr).lte('timestamp', endOfWeekStr);
    
    let currentWeeklyJP = 0;
    if (weeklyJurnal) {
      weeklyJurnal.forEach(j => {
        if (j.jam_pembelajaran) {
          currentWeeklyJP += j.jam_pembelajaran.split(',').length;
        }
      });
    }

    const groupedSchedule: any[] = [];
    if (todaysSchedule) {
      todaysSchedule.forEach(sch => {
        const lastGroup = groupedSchedule[groupedSchedule.length - 1];
        if (lastGroup && lastGroup.kelas === sch.kelas && lastGroup.mapel === sch.mapel) {
          lastGroup.jam = `${lastGroup.jam},${sch.jam}`;
        } else {
          groupedSchedule.push({ ...sch, jam: String(sch.jam) });
        }
      });
    }

    const todaysScheduleBoxes = groupedSchedule.map(sch => {
      const isDone = todaysJurnal?.some(j => {
        if (j.kelas !== sch.kelas) return false;
        const schJams = sch.jam.split(',');
        const jJams = j.jam_pembelajaran ? String(j.jam_pembelajaran).split(',').map(s => s.trim()) : [];
        return schJams.some((sj: string) => jJams.includes(sj.trim()));
      });
      return { ...sch, status: isDone };
    });

    const percent = finalTarget > 0 ? Math.min(100, (currentWeeklyJP / finalTarget) * 100).toFixed(1) : "0.0";

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
      // Adjust to Indonesia Time (UTC+7)
      const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Jakarta', weekday: 'long' };
      const hariIniIndo = new Intl.DateTimeFormat('id-ID', options).format(today);

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
      // Adjust to Indonesia Time (UTC+7)
      const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Jakarta', weekday: 'long' };
      const hariIniIndo = new Intl.DateTimeFormat('id-ID', options).format(today);
      const todayDateStr = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).toISOString().split('T')[0];

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
    const { nip, nama, roles, password, jabatan } = req.body;
    
    try {
      const rolesArray = Array.isArray(roles) ? roles : [roles];
      
      if (rolesArray.includes('Guru')) {
        await supabase.from('guru').insert({ nip, nama_guru: nama, password: password || '123456' });
      }
      if (rolesArray.includes('Tendik')) {
        await supabase.from('tendik').insert({ nip, nama_tendik: nama, jabatan, password: password || '123456' });
      }
      if (rolesArray.includes('Admin')) {
        await supabase.from('admin').insert({ username: nip, nama, password: password || '123456' });
      }
      
      res.json({ success: true, message: 'User berhasil ditambahkan' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/siswa/kehadiran', async (req, res) => {
    try {
      const { nis, semester } = req.query;
      
      // 1. Get student info
      const { data: student } = await supabase.from('murid').select('"Nama Lengkap", "Kelas"').eq('NIS', nis).single();
      if (!student) return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });

      const studentName = student['Nama Lengkap'];
      const studentClass = student['Kelas'];

      // 2. Query journals for this class
      let query = supabase.from('jurnal').select('timestamp, ketidakhadiran, mata_pelajaran').eq('kelas', studentClass).order('timestamp', { ascending: false });
      
      const { data: journals, error } = await query;
      if (error) throw error;

      const attendanceMap: Record<string, any> = {};

      // 3. Process journals
      journals?.forEach(j => {
        const date = j.timestamp.split('T')[0];
        
        let status = 'Hadir';
        let keterangan = '-';

        try {
          const absents = typeof j.ketidakhadiran === 'string' ? JSON.parse(j.ketidakhadiran) : j.ketidakhadiran;
          if (Array.isArray(absents)) {
            // Check if student name is in the list. The list usually contains objects { nama: "...", type: "...", keterangan: "..." }
            // Or sometimes just strings if older schema. Based on Jurnal.tsx, it pushes names to arrays: { Sakit: [name1], ... }
            // Wait, Jurnal.tsx handleSubmit sends: ketidakhadiran: [{ type: 'Sakit', students: ['Name1'] }]
            // Let's check Jurnal.tsx again.
            // const ketidakhadiran = Object.keys(attData).filter(...).map(k => ({ type: k, students: attData[k] }));
            
            // So structure is [{ type: 'Sakit', students: ['Name1', 'Name2'] }, ...]
            
            absents.forEach((record: any) => {
              if (record.students && record.students.includes(studentName)) {
                status = record.type;
                keterangan = '-'; // Jurnal.tsx doesn't seem to save specific reason per student in the array, just the type.
              }
            });
          }
        } catch (e) {}

        if (!attendanceMap[date]) {
          attendanceMap[date] = { date, status, keterangan };
        } else {
           if (attendanceMap[date].status === 'Hadir' && status !== 'Hadir') {
             attendanceMap[date] = { date, status, keterangan };
           }
        }
      });

      const attendanceList = Object.values(attendanceMap).sort((a: any, b: any) => b.date.localeCompare(a.date));

      res.json({ success: true, data: attendanceList });

    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // --- TUGAS ENDPOINTS ---

  app.get('/api/tugas', async (req, res) => {
    try {
      const { kelas, teacherId, studentId } = req.query;
      
      let query = supabase.from('tugas').select('*').order('created_at', { ascending: false });

      if (kelas) {
        query = query.eq('kelas', kelas);
      }
      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      }

      const { data: tugasList, error } = await query;
      if (error) throw error;

      // If studentId is provided, fetch submission status
      if (studentId && tugasList) {
        const { data: submissions } = await supabase.from('pengumpulan_tugas').select('*').eq('student_id', studentId);
        
        const tugasWithStatus = tugasList.map(t => {
          const sub = submissions?.find(s => s.tugas_id === t.id);
          return {
            ...t,
            submission: sub ? {
              status: sub.status, // 'Selesai', 'Menunggu Validasi', 'Belum'
              validation_status: sub.validation_status, // 'Valid', 'Invalid', 'Pending'
              submitted_at: sub.submitted_at
            } : null
          };
        });
        return res.json({ success: true, data: tugasWithStatus });
      }

      res.json({ success: true, data: tugasList });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post('/api/tugas', async (req, res) => {
    try {
      const { teacher_id, kelas, mapel, judul, deskripsi, deadline } = req.body;
      const { error } = await supabase.from('tugas').insert({
        teacher_id, kelas, mapel, judul, deskripsi, deadline, created_at: new Date()
      });
      if (error) throw error;
      res.json({ success: true, message: 'Tugas berhasil dibuat' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post('/api/tugas/submit', async (req, res) => {
    try {
      const { tugas_id, student_id, content } = req.body;
      // Check if already submitted
      const { data: existing } = await supabase.from('pengumpulan_tugas').select('id').eq('tugas_id', tugas_id).eq('student_id', student_id).single();
      
      if (existing) {
        const { error } = await supabase.from('pengumpulan_tugas').update({
          status: 'Menunggu Validasi',
          submitted_at: new Date(),
          content: content,
          validation_status: 'Pending'
        }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pengumpulan_tugas').insert({
          tugas_id, student_id, status: 'Menunggu Validasi', submitted_at: new Date(), content, validation_status: 'Pending'
        });
        if (error) throw error;
      }
      res.json({ success: true, message: 'Tugas berhasil dikumpulkan' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.put('/api/tugas/validate', async (req, res) => {
    try {
      const { submission_id, validation_status } = req.body; // 'Valid' or 'Invalid'
      const status = validation_status === 'Valid' ? 'Selesai' : 'Belum Selesai';
      
      const { error } = await supabase.from('pengumpulan_tugas').update({
        validation_status,
        status
      }).eq('id', submission_id);
      
      if (error) throw error;
      res.json({ success: true, message: 'Tugas divalidasi' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.delete('/api/tugas/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabase.from('tugas').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true, message: 'Tugas berhasil dihapus' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // --- KASIH IBU / HABITS ---

  app.get('/api/kasih-ibu', async (req, res) => {
    try {
      const { kelas, nis } = req.query;
      let query = supabase.from('jurnal_kebiasaan').select('*').order('timestamp', { ascending: false });
      
      if (kelas) query = query.eq('kelas', kelas);
      if (nis) query = query.eq('nis', nis);
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Map to frontend expected format if needed, or just return as is
      // Frontend expects: id, nama, kelas, habit_label, tanggal, keterangan, status
      const formatted = data?.map(d => ({
        id: d.id,
        nama: d.nama,
        kelas: d.kelas,
        habit_label: d.habit_type || d.habit_label, // Handle both naming conventions if schema varies
        tanggal: d.timestamp,
        keterangan: d.content || d.keterangan,
        status: d.status || 'Menunggu Validasi', // 'Valid', 'Ditolak', 'Menunggu Validasi'
        details: d.details
      }));

      res.json({ success: true, data: formatted });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.put('/api/kasih-ibu/validate', async (req, res) => {
    try {
      const { id, status } = req.body; // 'Valid' or 'Ditolak'
      const { error } = await supabase.from('jurnal_kebiasaan').update({ status }).eq('id', id);
      if (error) throw error;
      res.json({ success: true, message: 'Laporan berhasil divalidasi' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post('/api/kasih-ibu', async (req, res) => {
    try {
      const { nis, nama, kelas, habit_label, keterangan, tanggal, habit_id } = req.body;
      
      // Map frontend fields to DB columns
      // Assuming DB has: nis, nama, kelas, habit_type (for label), content (for keterangan), timestamp, status
      
      const { error } = await supabase.from('jurnal_kebiasaan').insert({
        nis, 
        nama, 
        kelas, 
        habit_type: habit_label, 
        content: keterangan, 
        timestamp: tanggal || new Date(),
        status: 'Menunggu Validasi',
        details: { habit_id } // Store ID in details JSON if needed
      });
      
      if (error) throw error;
      res.json({ success: true, message: 'Kebiasaan dicatat' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // --- JURNAL SISWA (Combined) ---

  app.get('/api/jurnal-siswa', async (req, res) => {
    try {
      const { nis, kelas } = req.query;
      
      // 1. Teacher's Journal for this class
      const { data: teacherJournal } = await supabase.from('jurnal').select('*').eq('kelas', kelas).order('timestamp', { ascending: false });
      
      // 2. Student's Habit Journal
      const { data: studentJournal } = await supabase.from('jurnal_kebiasaan').select('*').eq('nis', nis).order('timestamp', { ascending: false });

      const combined = [
        ...(teacherJournal || []).map(j => ({ ...j, source: 'Guru', type: 'KBM' })),
        ...(studentJournal || []).map(j => ({ ...j, source: 'Siswa', type: 'Kebiasaan' }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      res.json({ success: true, data: combined });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // --- API SETTINGS ---
  import fs from 'fs';
  import path from 'path';
  const API_KEYS_FILE = path.join(process.cwd(), 'api_keys.json');

  app.get('/api/api-settings', (req, res) => {
    try {
      if (fs.existsSync(API_KEYS_FILE)) {
        const data = fs.readFileSync(API_KEYS_FILE, 'utf-8');
        res.json({ success: true, data: JSON.parse(data) });
      } else {
        res.json({ success: true, data: {} });
      }
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post('/api/api-settings', (req, res) => {
    try {
      const keys = req.body;
      fs.writeFileSync(API_KEYS_FILE, JSON.stringify(keys, null, 2));
      res.json({ success: true, message: 'API Keys saved' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // --- CHATBOT ---
  import { GoogleGenAI } from "@google/genai";

  app.post('/api/chatbot', async (req, res) => {
    try {
      const { message } = req.body;
      
      let apiKey = process.env.GEMINI_API_KEY;
      
      // Try to load from settings if env not set or if we want to override
      if (fs.existsSync(API_KEYS_FILE)) {
        const settings = JSON.parse(fs.readFileSync(API_KEYS_FILE, 'utf-8'));
        if (settings.gemini_api_key) {
          apiKey = settings.gemini_api_key;
        }
      }

      if (!apiKey) {
        return res.status(400).json({ success: false, message: 'API Key not configured' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: message,
      });

      res.json({ success: true, reply: response.text });
    } catch (e: any) {
      console.error("Chatbot error:", e);
      res.status(500).json({ success: false, message: 'Failed to generate response' });
    }
  });

  app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { nip, nama, roles, password, jabatan } = req.body;

    try {
      const rolesArray = Array.isArray(roles) ? roles : [roles];

      // Update or insert into Guru
      if (rolesArray.includes('Guru')) {
        const { data: existingGuru } = await supabase.from('guru').select('nip').eq('nip', id).single();
        const updateData: any = { nip, nama_guru: nama };
        if (password) updateData.password = password;
        
        if (existingGuru) {
          await supabase.from('guru').update(updateData).eq('nip', id);
        } else {
          await supabase.from('guru').insert({ ...updateData, password: password || '123456' });
        }
      } else {
        await supabase.from('guru').delete().eq('nip', id);
      }

      // Update or insert into Tendik
      if (rolesArray.includes('Tendik')) {
        const { data: existingTendik } = await supabase.from('tendik').select('nip').eq('nip', id).single();
        const updateData: any = { nip, nama_tendik: nama, jabatan };
        if (password) updateData.password = password;

        if (existingTendik) {
          await supabase.from('tendik').update(updateData).eq('nip', id);
        } else {
          await supabase.from('tendik').insert({ ...updateData, password: password || '123456' });
        }
      } else {
        await supabase.from('tendik').delete().eq('nip', id);
      }

      // Update or insert into Admin
      if (rolesArray.includes('Admin')) {
        const { data: existingAdmin } = await supabase.from('admin').select('username').eq('username', id).single();
        const updateData: any = { username: nip, nama };
        if (password) updateData.password = password;

        if (existingAdmin) {
          await supabase.from('admin').update(updateData).eq('username', id);
        } else {
          await supabase.from('admin').insert({ ...updateData, password: password || '123456' });
        }
      } else {
        await supabase.from('admin').delete().eq('username', id);
      }

      res.json({ success: true, message: 'User berhasil diupdate' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
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
      const { data: admin, error: errorAdmin } = await supabase.from('admin').select('*');

      if (errorGuru) throw errorGuru;
      if (errorTendik) throw errorTendik;
      if (errorAdmin) throw errorAdmin;

      const userMap = new Map();

      (guru || []).forEach((g: any) => {
        if (!userMap.has(g.nip)) {
          userMap.set(g.nip, { id: g.nip, nip: g.nip, nama: g.nama_guru, roles: [], type: 'guru' });
        }
        userMap.get(g.nip).roles.push('Guru');
      });

      (tendik || []).forEach((t: any) => {
        if (!userMap.has(t.nip)) {
          userMap.set(t.nip, { id: t.nip, nip: t.nip, nama: t.nama_tendik, roles: [], type: 'tendik' });
        }
        userMap.get(t.nip).roles.push('Tendik');
      });

      (admin || []).forEach((a: any) => {
        if (!userMap.has(a.username)) {
          userMap.set(a.username, { id: a.username, nip: a.username, nama: a.nama, roles: [], type: 'admin' });
        }
        userMap.get(a.username).roles.push('Admin');
      });

      const allUsers = Array.from(userMap.values()).map(u => ({
        ...u,
        role: u.roles.join(', ')
      }));

      res.json({ success: true, data: allUsers });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
      await supabase.from('guru').delete().eq('nip', id);
      await supabase.from('tendik').delete().eq('nip', id);
      await supabase.from('admin').delete().eq('username', id);

      res.json({ success: true, message: 'User berhasil dihapus' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
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
    const viteModule = 'vite';
    const { createServer: createViteServer } = await import(viteModule);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

export default app;
