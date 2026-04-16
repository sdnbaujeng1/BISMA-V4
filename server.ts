import express from 'express';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import cron from 'node-cron';
import { GoogleGenAI } from "@google/genai";

const envUrl = process.env.VITE_SUPABASE_URL;
const supabaseUrl = (envUrl && envUrl.startsWith('http')) ? envUrl : 'https://qisjuugbxrcjvpdnzxhz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpc2p1dWdieHJjanZwZG56eGh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI1NTczNywiZXhwIjoyMDg0ODMxNzM3fQ.5oKj5RL6OnI5kw9ciLIjAmxL1dNZwkZTEuijtnSCO5Q';

const supabase = createClient(supabaseUrl, supabaseKey);

let waProgress = {
  isRunning: false,
  total: 0,
  sent: 0,
  failed: 0,
  logs: [] as string[]
};

async function sendWAReminders() {
  if (waProgress.isRunning) {
    return { success: false, message: 'Proses pengiriman sedang berjalan.' };
  }
  
  waProgress = { isRunning: true, total: 0, sent: 0, failed: 0, logs: [] };
  
  try {
    // 1. Get Fonnte API Key and Message Template
    const { data: settingsData } = await supabase.from('pengaturan').select('key, value');
    const fonnteToken = settingsData?.find(s => s.key === 'whatsapp_api_key')?.value;
    const waTemplate = settingsData?.find(s => s.key === 'wa_message_template')?.value;

    if (!fonnteToken) {
      waProgress.logs.push('WhatsApp API Key (Fonnte) belum dikonfigurasi di Pengaturan.');
      waProgress.isRunning = false;
      return { success: false, message: 'WhatsApp API Key (Fonnte) belum dikonfigurasi di Pengaturan.' };
    }

    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Jakarta', weekday: 'long' };
    const hariIniIndo = new Intl.DateTimeFormat('id-ID', options).format(today);
    const todayDateStr = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).toISOString().split('T')[0];
    const formattedDate = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const formattedTime = today.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');

    // 2. Get all teachers with phone numbers
    const { data: teachers, error: teacherError } = await supabase
      .from('guru')
      .select('nip, nama_guru, "No. Hp"');
    
    if (teacherError) throw teacherError;

    // 3. Get today's schedule
    const { data: schedules, error: scheduleError } = await supabase
      .from('jadwal_real')
      .select('guru, jam, kelas, mapel')
      .eq('hari', hariIniIndo)
      .order('jam');

    if (scheduleError) throw scheduleError;

    // 4. Get today's journals
    const { data: journals, error: journalError } = await supabase
      .from('jurnal')
      .select('nama_guru, kelas, jam_pembelajaran')
      .gte('timestamp', `${todayDateStr}T00:00:00Z`)
      .lte('timestamp', `${todayDateStr}T23:59:59Z`);

    if (journalError) throw journalError;

    // Filter teachers who need reminders
    const teachersToRemind = [];
    for (const teacher of teachers) {
      const phone = teacher['No. Hp'];
      if (!phone) continue;

      const mySchedules = schedules.filter(s => s.guru === teacher.nama_guru);
      if (mySchedules.length === 0) continue;

      let hasMissingJournal = false;
      let scheduleDetails = '';
      let classesTaught = new Set<string>();

      for (let i = 1; i <= 8; i++) {
        const sch = mySchedules.find(s => String(s.jam) === String(i));
        if (sch) {
          classesTaught.add(sch.kelas);
          const myJournals = journals.filter(j => j.nama_guru === teacher.nama_guru && j.kelas === sch.kelas);
          const isFilled = myJournals.some(j => {
            if (!j.jam_pembelajaran) return true;
            const jamList = String(j.jam_pembelajaran).split(',').map(x => x.trim());
            return jamList.includes(String(i));
          });

          if (!isFilled) hasMissingJournal = true;
          scheduleDetails += `Jam ke-${i} :  ${sch.kelas}/ ${sch.mapel} berikan simbol ${isFilled ? '✅' : '❌'} (jika ${isFilled ? 'mengisi' : 'belum mengisi'})\n`;
        } else {
          scheduleDetails += `Jam ke-${i} :  - / - berikan simbol - (jika tidak ada jadwal jam pelajaran)\n`;
        }
      }

      if (hasMissingJournal) {
        teachersToRemind.push({ teacher, phone, classesTaught, scheduleDetails });
      }
    }

    waProgress.total = teachersToRemind.length;
    waProgress.logs.push(`Ditemukan ${teachersToRemind.length} guru yang perlu diingatkan.`);

    if (teachersToRemind.length === 0) {
      waProgress.isRunning = false;
      return { success: true, count: 0 };
    }

    // 5. Process each teacher
    for (const item of teachersToRemind) {
      const { teacher, phone, classesTaught, scheduleDetails } = item;
      const classListStr = Array.from(classesTaught).join(', ');
      
      let message = '';
      if (waTemplate && waTemplate.trim() !== '') {
        message = waTemplate
          .replace(/\{\{nama_guru\}\}/g, teacher.nama_guru)
          .replace(/\{\{kelas\}\}/g, classListStr)
          .replace(/\{\{hari\}\}/g, hariIniIndo)
          .replace(/\{\{tanggal\}\}/g, formattedDate)
          .replace(/\{\{waktu\}\}/g, formattedTime)
          .replace(/\{\{jadwal\}\}/g, scheduleDetails);
      } else {
        message = `SDN BAUJENG I BEJI
BISMA
=============
Yth. ${teacher.nama_guru}

Berikut ini kami sampaikan laporan keterlaksanaan KBM Bapak/Ibu di kelas ${classListStr} pada hari ${hariIniIndo}, ${formattedDate}, pukul ${formattedTime} WIB.
===============
${scheduleDetails}=================
Segera masuk kelas untuk melaksanakan KBM sesuai jadwal dan semoga menjadi amal ibadah. Amiin
===============
Raih Berkah dengan Khidmah
Ket: ✅ = Hadir  |  ❌ = Tidak Hadir |`;
      }

      // Send via Fonnte
      try {
        const response = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            'Authorization': fonnteToken
          },
          body: new URLSearchParams({
            target: phone,
            message: message,
            countryCode: '62'
          })
        });
        const result = await response.json();
        if (result.status) {
          waProgress.sent++;
          waProgress.logs.push(`Berhasil mengirim ke ${teacher.nama_guru} (${phone})`);
        } else {
          waProgress.failed++;
          waProgress.logs.push(`Gagal mengirim ke ${teacher.nama_guru} (${phone}): ${result.reason}`);
          console.error(`Fonnte error for ${teacher.nama_guru}:`, result.reason);
        }
      } catch (err: any) {
        waProgress.failed++;
        waProgress.logs.push(`Error jaringan saat mengirim ke ${teacher.nama_guru} (${phone}): ${err.message}`);
        console.error(`Failed to send WA to ${teacher.nama_guru}:`, err);
      }
      
      // Delay 10 seconds before sending the next message to avoid WhatsApp ban
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    waProgress.isRunning = false;
    waProgress.logs.push('Proses pengiriman selesai.');
    return { success: true, count: waProgress.sent };

  } catch (e: any) {
    console.error('Send WA error:', e);
    waProgress.isRunning = false;
    waProgress.logs.push(`Terjadi kesalahan sistem: ${e.message}`);
    return { success: false, message: e.message };
  }
}

// Setup cron jobs for 07:30 and 12:00 Asia/Jakarta time
cron.schedule('30 7 * * *', () => {
  console.log('Running scheduled WA reminder at 07:30');
  sendWAReminders();
}, {
  timezone: "Asia/Jakarta"
});

cron.schedule('0 12 * * *', () => {
  console.log('Running scheduled WA reminder at 12:00');
  sendWAReminders();
}, {
  timezone: "Asia/Jakarta"
});

const app = express();
app.use(express.json());
const PORT = 3000;

app.get('/api/admin/stats', async (req, res) => {
    try {
      // 1. Student Counts per Class
      const { data: muridData, error: muridError } = await supabase.from('murid').select('"Kelas"');
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
      const { data: todaysPresensi } = await supabase.from('presensi').select('*').gte('timestamp', `${todayDateStr}T00:00:00Z`).lte('timestamp', `${todayDateStr}T23:59:59Z`);

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

      if (todaysPresensi) {
        todaysPresensi.forEach(p => {
          if (p.presensi !== 'Hadir' && p.presensi !== 'H' && p.presensi !== 'Terlambat') {
            if (!absentStudents.some(s => s.name === p.nama_murid && s.class === p.kelas)) {
              absentStudents.push({
                name: p.nama_murid,
                class: p.kelas || '-',
                reason: p.presensi
              });
            }
          }
        });
      }

      if (todaysJurnal) {
        todaysJurnal.forEach(j => {
          try {
            const absenList = typeof j.ketidakhadiran === 'string' ? JSON.parse(j.ketidakhadiran) : j.ketidakhadiran;
            if (Array.isArray(absenList)) {
              absenList.forEach((absenGroup: any) => {
                const type = absenGroup.type || 'Tidak Hadir';
                const students = absenGroup.students || [];
                students.forEach((studentName: string) => {
                  if (!absentStudents.some(s => s.name === studentName && s.class === j.kelas)) {
                    absentStudents.push({
                      name: studentName,
                      class: j.kelas,
                      reason: type
                    });
                  }
                });
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
    const { role } = req.query;
    let query = supabase.from('pengumuman').select('*').order('tanggal', { ascending: false }).order('id', { ascending: false });
    
    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, message: error.message });

    let filteredData = data;
    if (role && role !== 'admin') {
      let targetRole = 'Publik';
      if (role === 'student') targetRole = 'Siswa';
      else if (role === 'guru') targetRole = 'Guru';
      else if (role === 'tendik') targetRole = 'Staff';

      const today = new Date().toISOString().split('T')[0];
      
      filteredData = data.filter(item => {
        // Date check
        const isPublished = !item.tanggal_terbit || item.tanggal_terbit <= today;
        const isNotExpired = !item.tanggal_kedaluwarsa || item.tanggal_kedaluwarsa >= today;
        if (!isPublished || !isNotExpired) return false;

        // Role check
        if (!item.target_roles || item.target_roles.length === 0) return true; // Default to all
        if (item.target_roles.includes('Publik')) return true; // Publik means all
        return item.target_roles.includes(targetRole);
      });
    }
    res.json({ success: true, data: filteredData });
  });

  app.post('/api/pengumuman', async (req, res) => {
    const { judul, isi, target_roles, tanggal_terbit, tanggal_kedaluwarsa } = req.body;
    
    // We'll just insert a new record for now, or we could update the latest one.
    // Let's insert a new one so we keep history.
    const { error } = await supabase.from('pengumuman').insert({
      judul,
      isi,
      target_roles,
      tanggal_terbit,
      tanggal_kedaluwarsa
    });

    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, message: 'Pengumuman berhasil disimpan' });
  });

  app.put('/api/pengumuman/:id', async (req, res) => {
    const { id } = req.params;
    const { judul, isi, target_roles, tanggal_terbit, tanggal_kedaluwarsa } = req.body;
    
    const { error } = await supabase.from('pengumuman').update({
      judul,
      isi,
      target_roles,
      tanggal_terbit,
      tanggal_kedaluwarsa
    }).eq('id', id);

    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, message: 'Pengumuman diperbarui' });
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
      const { data: user } = await supabase.from('murid').select('"NISN", "NIS", "Nama Lengkap", "Kelas", "Password (Default: baujeng(kelas))"').eq('"NIS"', nip).single();
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
    const { namaGuru, nip } = req.query;
    
    if (!namaGuru && !nip) {
      return res.status(400).json({ success: false, message: 'Nama Guru or NIP is required' });
    }

    try {
      let query = supabase.from('jurnal').select('*');
      
      if (namaGuru && nip) {
        query = query.or(`nama_guru.eq."${namaGuru}",nip.eq."${nip}"`);
      } else if (namaGuru) {
        query = query.eq('nama_guru', namaGuru);
      } else {
        query = query.eq('nip', nip);
      }

      const { data, error } = await query
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

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
        const existingGroup = groupedSchedule.find(g => g.kelas === sch.kelas && g.mapel === sch.mapel);
        if (existingGroup) {
          existingGroup.jam = `${existingGroup.jam}, ${sch.jam}`;
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

    const { error } = await supabase.from('murid').update(updateData).eq('"NISN"', nisn);
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, message: 'Data murid berhasil diupdate' });
  });

  app.delete('/api/murid/:nisn', async (req, res) => {
    const { nisn } = req.params;
    const { error } = await supabase.from('murid').delete().eq('"NISN"', nisn);
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

    // Insert into presensi table
    try {
      // Get all students in this class
      const { data: students, error: studentError } = await supabase
        .from('murid')
        .select('"NISN", "Nama Lengkap"')
        .eq('"Kelas"', kelas);

      if (!studentError && students) {
        const presensiRecords: any[] = [];
        
        students.forEach(student => {
          let status = 'Hadir';
          
          if (Array.isArray(ketidakhadiran)) {
            ketidakhadiran.forEach((k: any) => {
              if (k.students && Array.isArray(k.students) && k.students.includes(student['Nama Lengkap'])) {
                status = k.type;
              }
            });
          }

          let presensiCode = 'H';
          if (status === 'Sakit') presensiCode = 'S';
          else if (status === 'Izin') presensiCode = 'I';
          else if (status === 'Alpa') presensiCode = 'A';
          else if (status === 'Dispensasi') presensiCode = 'D';

          if (presensiCode !== 'H') {
            presensiRecords.push({
              nip: nip,
              nama_guru: guru,
              nisn: student.NISN,
              nama_murid: student['Nama Lengkap'],
              kelas: kelas,
              presensi: presensiCode,
              ekstra: jamPembelajaranStr // Store JP in ekstra for calculation
            });
          }
        });

        if (presensiRecords.length > 0) {
          await supabase.from('presensi').insert(presensiRecords);
        }
      }
    } catch (e) {
      console.error("Failed to insert presensi:", e);
    }

    res.json({ success: true, message: 'Data jurnal berhasil disimpan.' });
  });

  app.get('/api/keterlaksanaan', async (req, res) => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Jakarta', weekday: 'long' };
    let hariIniIndo = new Intl.DateTimeFormat('id-ID', options).format(today);
    hariIniIndo = hariIniIndo.charAt(0).toUpperCase() + hariIniIndo.slice(1);

    const { data: scheduleList } = await supabase.from('jadwal_real').select('kelas, jam, guru, mapel').eq('hari', hariIniIndo);
    const todayDateStr = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).toISOString().split('T')[0];
    const { data: todaysJurnal } = await supabase.from('jurnal').select('*').gte('timestamp', `${todayDateStr}T00:00:00Z`).lte('timestamp', `${todayDateStr}T23:59:59Z`);

    const dataByClass: any = {};
    if (scheduleList) {
      scheduleList.forEach(item => {
        const matchedJurnal = todaysJurnal?.find(j => {
          if (j.kelas !== item.kelas || j.nama_guru !== item.guru) return false;
          if (!j.jam_pembelajaran) return true; // fallback if jam_pembelajaran is empty
          const jamList = j.jam_pembelajaran.split(',').map((s: string) => s.trim());
          return jamList.includes(String(item.jam));
        });
        
        if (!dataByClass[item.kelas]) dataByClass[item.kelas] = [];
        dataByClass[item.kelas].push({
          ...item,
          isCompleted: !!matchedJurnal,
          materi: matchedJurnal ? matchedJurnal.materi : '-',
          kebersihan: matchedJurnal ? matchedJurnal.kebersihan_kelas : '-'
        });
      });
    }

    res.json({ success: true, data: dataByClass });
  });

  app.post('/api/admin/send-wa-reminder', async (req, res) => {
    try {
      // Run in background to prevent timeout due to 10s delay per message
      sendWAReminders().then(result => {
        console.log('Manual WA reminder finished:', result);
      }).catch(e => {
        console.error('Manual WA reminder failed:', e);
      });
      
      res.json({ success: true, message: 'Proses pengiriman notifikasi WA sedang berjalan di latar belakang.' });
    } catch (e: any) {
      console.error('Send WA error:', e);
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get('/api/admin/wa-progress', (req, res) => {
    res.json({ success: true, data: waProgress });
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

      // 2.5 Get today's journals for all teachers
      const todayDateStr = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).toISOString().split('T')[0];
      const { data: journals, error: journalError } = await supabase
        .from('jurnal')
        .select('nama_guru, kelas, jam_pembelajaran')
        .gte('timestamp', `${todayDateStr}T00:00:00Z`)
        .lte('timestamp', `${todayDateStr}T23:59:59Z`);

      if (journalError) throw journalError;

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
            let isFilled = false;
            if (journals) {
              const myJournals = journals.filter(j => j.nama_guru === teacher.nama_guru && j.kelas === s.kelas);
              isFilled = myJournals.some(j => {
                if (!j.jam_pembelajaran) return true; // If no specific jam, assume filled for the class
                const jamList = String(j.jam_pembelajaran).split(',').map(x => x.trim());
                return jamList.includes(String(s.jam));
              });
            }

            teacherSchedule[s.jam] = {
              kelas: s.kelas,
              mapel: s.mapel,
              isFilled
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

  app.get('/api/monitoring/analisa-siswa', async (req, res) => {
    try {
      const { month } = req.query;
      let query = supabase.from('jurnal').select('ketidakhadiran, catatan_mengajar, kelas, timestamp');

      if (month) {
        const [year, m] = (month as string).split('-');
        const startDate = `${year}-${m}-01T00:00:00Z`;
        const endDate = new Date(Number(year), Number(m), 0, 23, 59, 59).toISOString();
        query = query.gte('timestamp', startDate).lte('timestamp', endDate);
      }

      const { data: journals, error } = await query;

      if (error) throw error;

      const attendanceMap: Record<string, { nama: string, kelas: string, s: number, i: number, a: number, total: number }> = {};
      const disciplineMap: Record<string, { nama: string, kelas: string, violations: number, handled: number, unhandled: number }> = {};

      journals.forEach(j => {
        // Process Attendance
        if (j.ketidakhadiran && j.ketidakhadiran !== 'Nihil' && j.ketidakhadiran !== '[]') {
          try {
            const parsed = JSON.parse(j.ketidakhadiran);
            if (Array.isArray(parsed)) {
              parsed.forEach((absent: any) => {
                const key = `${absent.nama}-${j.kelas}`;
                if (!attendanceMap[key]) {
                  attendanceMap[key] = { nama: absent.nama, kelas: j.kelas, s: 0, i: 0, a: 0, total: 0 };
                }
                const ket = (absent.keterangan || '').toLowerCase();
                if (ket.includes('sakit') || ket === 's') attendanceMap[key].s++;
                else if (ket.includes('izin') || ket === 'i') attendanceMap[key].i++;
                else if (ket.includes('alpa') || ket.includes('alpha') || ket === 'a') attendanceMap[key].a++;
                
                attendanceMap[key].total = attendanceMap[key].s + attendanceMap[key].i + attendanceMap[key].a;
              });
            }
          } catch (e) {
            // ignore
          }
        }

        // Process Discipline
        if (j.catatan_mengajar && j.catatan_mengajar !== 'Nihil' && j.catatan_mengajar !== '[]') {
          try {
            const parsed = typeof j.catatan_mengajar === 'string' ? JSON.parse(j.catatan_mengajar) : j.catatan_mengajar;
            if (Array.isArray(parsed)) {
              parsed.forEach((d: any) => {
                const key = `${d.student}-${j.kelas}`;
                if (!disciplineMap[key]) {
                  disciplineMap[key] = { nama: d.student, kelas: j.kelas, violations: 0, handled: 0, unhandled: 0 };
                }
                disciplineMap[key].violations++;
                if (d.penanganan) {
                  disciplineMap[key].handled++;
                } else {
                  disciplineMap[key].unhandled++;
                }
              });
            }
          } catch (e) {
            // ignore
          }
        }
      });

      const topAbsentees = Object.values(attendanceMap)
        .filter(s => s.total > 3)
        .sort((a, b) => b.total - a.total);

      const topViolators = Object.values(disciplineMap)
        .filter(s => s.violations > 3)
        .sort((a, b) => b.violations - a.violations);

      res.json({
        success: true,
        data: {
          absentees: topAbsentees,
          violators: topViolators
        }
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get('/api/monitoring/ketidakhadiran', async (req, res) => {
    try {
      const { start, end } = req.query;
      if (!start || !end) {
        return res.status(400).json({ success: false, message: 'Start and end dates are required' });
      }

      const startDate = new Date(start as string);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(end as string);
      endDate.setHours(23, 59, 59, 999);

      const { data: journals, error } = await supabase
        .from('jurnal')
        .select('timestamp, kelas, ketidakhadiran')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (error) throw error;

      const absentStudents: any[] = [];

      if (journals) {
        journals.forEach(j => {
          try {
            const absenList = typeof j.ketidakhadiran === 'string' ? JSON.parse(j.ketidakhadiran) : j.ketidakhadiran;
            if (Array.isArray(absenList)) {
              absenList.forEach((absenGroup: any) => {
                const type = absenGroup.type || 'Tidak Hadir';
                const students = absenGroup.students || [];
                students.forEach((studentName: string) => {
                  // Avoid duplicates for the same student on the same day
                  const dateStr = new Date(j.timestamp).toISOString().split('T')[0];
                  if (!absentStudents.some(s => s.nama === studentName && s.kelas === j.kelas && s.tanggal === dateStr)) {
                    absentStudents.push({
                      tanggal: dateStr,
                      nama: studentName,
                      kelas: j.kelas,
                      keterangan: type
                    });
                  }
                });
              });
            }
          } catch (e) {
            console.error("Error parsing ketidakhadiran", e);
          }
        });
      }

      // Sort by date descending
      absentStudents.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

      res.json({ success: true, data: absentStudents });
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
      const { data: allMurid } = await supabase.from('murid').select('"Kelas"');
      const studentCountByClass: Record<string, number> = {};
      (allMurid || []).forEach(m => {
        const cls = String(m.Kelas).replace(/\D/g, ''); // Normalize "Kelas 1" to "1"
        studentCountByClass[cls] = (studentCountByClass[cls] || 0) + 1;
      });

      // Fetch all schedules to calculate total JP for today
      const { data: allTodaySchedules } = await supabase.from('jadwal_real').select('jam').eq('hari', hariIniIndo);
      const totalJP = allTodaySchedules?.length || 0;

      const monitoringData: any[] = [];
      const belumMengisi: any[] = [];
      
      // Derive classes dynamically from schedules and students
      const classSet = new Set<string>();
      (todaysSchedule || []).forEach(s => {
        const cls = String(s.kelas).replace(/\D/g, '');
        if (cls) classSet.add(cls);
      });
      Object.keys(studentCountByClass).forEach(c => {
        if (c) classSet.add(c);
      });
      const classes = Array.from(classSet).sort((a, b) => {
        // Try to sort numerically first, then alphabetically
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) {
          if (numA !== numB) return numA - numB;
        }
        return a.localeCompare(b);
      });
      
      // Calculate Stats
      let totalKetidakhadiran = 0;
      const detailKetidakhadiran: any[] = [];
      const kebersihanPerKelas: Record<string, number> = {};
      
      if (todaysJurnal) {
        todaysJurnal.forEach(j => {
          const jCls = String(j.kelas).replace(/\D/g, '');
          // Ketidakhadiran
          try {
            const absen = typeof j.ketidakhadiran === 'string' ? JSON.parse(j.ketidakhadiran) : j.ketidakhadiran;
            if (Array.isArray(absen)) {
              totalKetidakhadiran += absen.length;
              absen.forEach(a => {
                detailKetidakhadiran.push({
                  nama: a.nama || a,
                  kelas: jCls,
                  guru: j.nama_guru,
                  mapel: j.pembelajaran
                });
              });
            }
          } catch (e) {}

          // Kebersihan (assuming 'sudah_bersih' or similar indicates clean)
          if (j.kebersihan_kelas === 'sudah_bersih') {
            kebersihanPerKelas[jCls] = (kebersihanPerKelas[jCls] || 0) + 1;
          }
        });
      }

      // Determine Kelas Terbersih
      let kelasTerbersih = '-';
      let maxKebersihan = 0;
      const detailKebersihan: { kelas: string, skor: number }[] = [];
      Object.keys(kebersihanPerKelas).forEach(k => {
        detailKebersihan.push({ kelas: k, skor: kebersihanPerKelas[k] });
        if (kebersihanPerKelas[k] > maxKebersihan) {
          maxKebersihan = kebersihanPerKelas[k];
          kelasTerbersih = k;
        } else if (kebersihanPerKelas[k] === maxKebersihan && maxKebersihan > 0) {
          kelasTerbersih += `, ${k}`;
        }
      });

      const totalJadwal = todaysSchedule?.length || 0;
      const totalJurnal = todaysJurnal?.length || 0;
      const keterlaksanaan = totalJadwal > 0 ? Math.round((totalJurnal / totalJadwal) * 100) : 0;

      // Keterlaksanaan per class
      const detailKeterlaksanaan: { kelas: string, total: number, done: number, percentage: number }[] = [];
      classes.forEach(cls => {
        const classJadwal = todaysSchedule?.filter(s => {
          const sCls = String(s.kelas).replace(/\D/g, '');
          return sCls === cls;
        }) || [];
        const classJurnal = todaysJurnal?.filter(j => {
          const jCls = String(j.kelas).replace(/\D/g, '');
          return jCls === cls;
        }) || [];
        
        // Count unique schedules done
        let doneCount = 0;
        classJadwal.forEach(sch => {
          const isDone = classJurnal.some(j => j.nama_guru === sch.guru);
          if (isDone) doneCount++;
        });

        const total = classJadwal.length;
        const percentage = total > 0 ? Math.round((doneCount / total) * 100) : 0;
        detailKeterlaksanaan.push({
          kelas: cls,
          total,
          done: doneCount,
          percentage
        });
      });

      // Logic for monitoring grid (all schedules for today)
      classes.forEach(cls => {
        const classSchedule = todaysSchedule?.filter(s => {
          const sCls = String(s.kelas).replace(/\D/g, '');
          return sCls === cls;
        }) || [];
        
        if (classSchedule.length > 0) {
          classSchedule.forEach(sch => {
            const isDone = todaysJurnal?.some(j => {
              const jCls = String(j.kelas).replace(/\D/g, '');
              return jCls === cls && j.nama_guru === sch.guru;
            });
            monitoringData.push({
              kelas: cls, // Use normalized class
              status: isDone,
              guru: sch.guru,
              mapel: sch.mapel,
              jam: String(sch.jam)
            });
          });
        }
      });

      // Logic for Belum Mengisi (Teachers who haven't filled journal for today's schedule)
      if (todaysSchedule) {
        const uniqueBelumMengisi = new Set<string>();
        todaysSchedule.forEach(sch => {
          const isDone = todaysJurnal?.some(j => j.kelas === sch.kelas && j.nama_guru === sch.guru);
          if (!isDone) {
            const key = `${sch.guru}-${sch.kelas}-${sch.mapel}`;
            if (!uniqueBelumMengisi.has(key)) {
              uniqueBelumMengisi.add(key);
              belumMengisi.push({
                guru: sch.guru,
                kelas: sch.kelas,
                mapel: sch.mapel
              });
            }
          }
        });
      }

      res.json({ 
        success: true, 
        data: {
          jadwal: monitoringData,
          classes: classes,
          studentCountByClass: studentCountByClass,
          stats: {
            ketidakhadiran: totalKetidakhadiran,
            keterlaksanaan: keterlaksanaan,
            kelasTerbersih: kelasTerbersih,
            jamKosongMax: 0, // Placeholder
            totalJP: totalJP
          },
          details: {
            ketidakhadiran: detailKetidakhadiran,
            keterlaksanaan: detailKeterlaksanaan,
            kebersihan: detailKebersihan
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
      const { nip, namaGuru } = req.query;
      let query = supabase.from('jurnal').select('*').order('timestamp', { ascending: false });
      
      if (nip || namaGuru) {
        // If user has multiple roles (like tendik and something else), they might have entries under nip or nama_guru
        if (nip && namaGuru) {
          query = query.or(`nip.eq."${nip}",nama_guru.eq."${namaGuru}"`);
        } else if (nip) {
          query = query.eq('nip', nip);
        } else {
          query = query.eq('nama_guru', namaGuru);
        }
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
      const { nisn, month, year } = req.query;
      
      // 1. Get student info using NISN or NIS
      const { data: student } = await supabase.from('murid').select('"Nama Lengkap", "Kelas"').or(`"NISN".eq."${nisn}","NIS".eq."${nisn}"`).single();
      if (!student) return res.status(404).json({ success: false, message: 'Siswa tidak ditemukan' });

      const studentName = student['Nama Lengkap'];
      const studentClass = student['Kelas'];

      // 2. Query journals for this class
      let query = supabase.from('jurnal').select('id, timestamp, ketidakhadiran, mata_pelajaran, jam_pembelajaran').eq('kelas', studentClass).order('timestamp', { ascending: false });
      
      const { data: journals, error } = await query;
      if (error) throw error;

      // 2.5 Query presensi_qr for this student (using name and class)
      let qrData: any[] = [];
      try {
        const { data, error } = await supabase.from('presensi_qr').select('timestamp, jenis, detail').eq('nama', studentName).eq('kelas', studentClass).order('timestamp', { ascending: false });
        if (!error) {
          qrData = data || [];
        }
      } catch (e) {
        // Ignore if table doesn't exist
      }

      // 2.6 Query presensi table for this student (using name and class)
      const { data: presensiData, error: presensiError } = await supabase.from('presensi').select('id, timestamp, presensi, ekstra').eq('nama_murid', studentName).eq('kelas', studentClass).order('timestamp', { ascending: false });
      if (presensiError) throw presensiError;

      console.log(`Attendance for ${studentName} (${nisn}):`);
      console.log(`Journals: ${journals?.length}`);
      console.log(`QR Data: ${qrData?.length}`);
      console.log(`Presensi Data: ${presensiData?.length}`);

      const attendanceMap: Record<string, any> = {};
      
      let totalJP = 0;
      let sakitJP = 0;
      let izinJP = 0;
      let alphaJP = 0;

      // Filter journals by month and year if provided
      const filteredJournals = (journals || []).filter(j => {
        const date = new Date(j.timestamp);
        const recordMonth = date.getMonth().toString();
        const recordYear = date.getFullYear().toString();
        
        if (month && month !== 'semua' && recordMonth !== month) return false;
        if (year && year !== 'semua' && recordYear !== year) return false;
        return true;
      });

      // Filter QR data by month and year if provided
      const filteredQrData = (qrData || []).filter(q => {
        const date = new Date(q.timestamp);
        const recordMonth = date.getMonth().toString();
        const recordYear = date.getFullYear().toString();
        
        if (month && month !== 'semua' && recordMonth !== month) return false;
        if (year && year !== 'semua' && recordYear !== year) return false;
        return true;
      });

      // Filter Presensi data by month and year if provided
      const filteredPresensiData = (presensiData || []).filter(p => {
        const date = new Date(p.timestamp);
        const recordMonth = date.getMonth().toString();
        const recordYear = date.getFullYear().toString();
        
        if (month && month !== 'semua' && recordMonth !== month) return false;
        if (year && year !== 'semua' && recordYear !== year) return false;
        return true;
      });

      const dayTotalJP: Record<string, number> = {};
      const studentAbsentJP: Record<string, number> = {};
      const studentDailyStatus: Record<string, Set<string>> = {};
      const processedPresensiDates = new Set<string>();
      const allDates = new Set<string>();

      // Calculate total JP per day from journals
      filteredJournals.forEach(j => {
        const date = j.timestamp.split('T')[0];
        allDates.add(date);
        let jpCount = 1;
        if (j.jam_pembelajaran) {
          jpCount = String(j.jam_pembelajaran).split(',').filter(s => s.trim() !== '').length;
          if (jpCount === 0) jpCount = 1;
        }
        dayTotalJP[date] = (dayTotalJP[date] || 0) + jpCount;
        totalJP += jpCount;
      });

      // Process QR presensi first
      filteredQrData.forEach(q => {
        const date = q.timestamp.split('T')[0];
        allDates.add(date);
        if (q.jenis === 'Hadir') {
          if (!studentDailyStatus[date]) studentDailyStatus[date] = new Set();
          studentDailyStatus[date].add('H');
        }
      });

      // Process Presensi table data
      filteredPresensiData.forEach(p => {
        const date = p.timestamp.split('T')[0];
        allDates.add(date);
        let status = p.presensi;
        processedPresensiDates.add(date);
        
        let jpCount = 1;
        if (p.ekstra) {
          jpCount = String(p.ekstra).split(',').filter(s => s.trim() !== '').length;
          if (jpCount === 0) jpCount = 1;
        }

        studentAbsentJP[date] = (studentAbsentJP[date] || 0) + jpCount;
        if (!studentDailyStatus[date]) studentDailyStatus[date] = new Set();

        if (status === 'Sakit' || status === 'S') { sakitJP += jpCount; studentDailyStatus[date].add('S'); }
        else if (status === 'Izin' || status === 'I') { izinJP += jpCount; studentDailyStatus[date].add('I'); }
        else if (status === 'Alpa' || status === 'A' || status === 'Tidak Hadir') { alphaJP += jpCount; studentDailyStatus[date].add('A'); }
        else if (status === 'Dispensasi' || status === 'D') { studentDailyStatus[date].add('D'); }
        else if (status === 'Hadir' || status === 'H') { 
          studentDailyStatus[date].add('H'); 
          studentAbsentJP[date] -= jpCount; // Hadir is not absent
        }
      });

      // Process journals for old data (where presensi might not exist)
      filteredJournals.forEach(j => {
        const date = j.timestamp.split('T')[0];
        
        let jpCount = 1;
        if (j.jam_pembelajaran) {
          jpCount = String(j.jam_pembelajaran).split(',').filter(s => s.trim() !== '').length;
          if (jpCount === 0) jpCount = 1;
        }

        try {
          const absents = typeof j.ketidakhadiran === 'string' ? JSON.parse(j.ketidakhadiran) : j.ketidakhadiran;
          if (Array.isArray(absents)) {
            let alreadyCounted = false;
            absents.forEach((record: any) => {
              if (!alreadyCounted && record.students && record.students.includes(studentName) && !processedPresensiDates.has(date)) {
                if (!studentDailyStatus[date]) studentDailyStatus[date] = new Set();
                studentAbsentJP[date] = (studentAbsentJP[date] || 0) + jpCount;

                let status = record.type || 'Alpa'; // Default to Alpa if type is missing
                if (status === 'Sakit') { sakitJP += jpCount; studentDailyStatus[date].add('S'); }
                else if (status === 'Izin') { izinJP += jpCount; studentDailyStatus[date].add('I'); }
                else if (status === 'Alpa' || status === 'Tidak Hadir' || status === 'A') { alphaJP += jpCount; studentDailyStatus[date].add('A'); }
                else if (status === 'Dispensasi') { studentDailyStatus[date].add('D'); }
                alreadyCounted = true;
              }
            });
          }
        } catch (e) {}
      });

      // Build attendanceMap based on priority
      Array.from(allDates).forEach(date => {
        const statuses = studentDailyStatus[date] || new Set();
        const absentJP = studentAbsentJP[date] || 0;
        const totalDay = dayTotalJP[date] || 0;

        if (totalDay > 0 && absentJP < totalDay) {
          statuses.add('H');
        } else if (totalDay === 0 && statuses.size === 0) {
           // If no journal and no specific status, but date exists (e.g. from QR), assume Hadir
           statuses.add('H');
        }

        let finalStatus = 'Hadir';
        if (statuses.has('S')) finalStatus = 'Sakit';
        else if (statuses.has('I')) finalStatus = 'Izin';
        else if (statuses.has('D')) finalStatus = 'Dispensasi';
        else if (statuses.has('A') && !statuses.has('H')) finalStatus = 'Alpa';

        attendanceMap[date] = { date, status: finalStatus, keterangan: '-' };
      });

      const attendanceList = Object.values(attendanceMap).sort((a: any, b: any) => b.date.localeCompare(a.date));
      
      let dispensasiJP = 0;
      Object.keys(studentDailyStatus).forEach(date => {
        if (studentDailyStatus[date].has('D')) {
          dispensasiJP += studentAbsentJP[date] || 0;
        }
      });

      const totalAbsenJP = sakitJP + izinJP + alphaJP + dispensasiJP;
      let hadirPercent = 100;
      if (totalJP > 0) {
        hadirPercent = Math.min(100, Math.max(0, Math.round(((totalJP - totalAbsenJP) / totalJP) * 100)));
      } else if (attendanceList.length > 0) {
        // Fallback to days if no JP data
        let totalAbsenHari = 0;
        attendanceList.forEach((record: any) => {
          if (record.status === 'Sakit' || record.status === 'Izin' || record.status === 'Alpa' || record.status === 'Tidak Hadir' || record.status === 'Dispensasi') {
            totalAbsenHari++;
          }
        });
        hadirPercent = Math.min(100, Math.max(0, Math.round(((attendanceList.length - totalAbsenHari) / attendanceList.length) * 100)));
      }

      // Calculate absence in days
      let sakitHari = 0;
      let izinHari = 0;
      let alphaHari = 0;
      let dispensasiHari = 0;
      
      attendanceList.forEach((record: any) => {
        if (record.status === 'Sakit') sakitHari++;
        else if (record.status === 'Izin') izinHari++;
        else if (record.status === 'Alpa' || record.status === 'Tidak Hadir') alphaHari++;
        else if (record.status === 'Dispensasi') dispensasiHari++;
      });

      res.json({ 
        success: true, 
        data: attendanceList,
        summary: {
          hadirPercent,
          totalJP,
          sakit: sakitHari,
          izin: izinHari,
          alpha: alphaHari,
          dispensasi: dispensasiHari
        }
      });

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
        // Filter tasks by target_students if it exists
        const filteredTugasList = tugasList.filter(t => {
          if (t.target_students) {
            try {
              const targets = typeof t.target_students === 'string' ? JSON.parse(t.target_students) : t.target_students;
              if (Array.isArray(targets) && targets.length > 0) {
                return targets.includes(studentId);
              }
            } catch (e) {}
          }
          return true; // If no target_students, it's for everyone in the class
        });

        const { data: submissions } = await supabase.from('pengumpulan_tugas').select('*').eq('student_id', studentId);
        
        const tugasWithStatus = filteredTugasList.map(t => {
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
      const { guru_id, guru_nama, kelas, mapel, judul, deskripsi, deadline, target_students } = req.body;
      const { error } = await supabase.from('tugas').insert({
        teacher_id: guru_id, 
        guru_nama,
        kelas, 
        mapel, 
        judul, 
        deskripsi, 
        deadline, 
        target_students: target_students && target_students.length > 0 ? JSON.stringify(target_students) : null,
        created_at: new Date()
      });
      if (error) throw error;
      res.json({ success: true, message: 'Tugas berhasil dibuat' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get('/api/tugas/:id/submissions', async (req, res) => {
    try {
      const { id } = req.params;
      const { data: tugas } = await supabase.from('tugas').select('*').eq('id', id).single();
      if (!tugas) throw new Error('Tugas tidak ditemukan');

      const { data: submissions, error } = await supabase.from('pengumpulan_tugas').select('*').eq('tugas_id', id);
      if (error) throw error;

      // Fetch student names
      let studentsQuery = supabase.from('murid').select('"NISN", "Nama Lengkap", "Kelas"');
      if (tugas.kelas) {
        // Filter by class
        studentsQuery = studentsQuery.or(`"Kelas".eq.${tugas.kelas},"Kelas".eq.${tugas.kelas.replace('Kelas ', '')}`);
      }
      const { data: students } = await studentsQuery;

      let targetStudents = students || [];
      if (tugas.target_students) {
        try {
          const targets = typeof tugas.target_students === 'string' ? JSON.parse(tugas.target_students) : tugas.target_students;
          if (Array.isArray(targets) && targets.length > 0) {
            targetStudents = targetStudents.filter(s => targets.includes(s.NISN));
          }
        } catch (e) {}
      }
      
      const submissionsWithNames = targetStudents.map(student => {
        const sub = submissions?.find(s => s.student_id === student.NISN);
        return {
          id: sub ? sub.id : `mock-${student.NISN}`,
          tugas_id: id,
          student_id: student.NISN,
          siswa_nama: student['Nama Lengkap'],
          status: sub ? sub.status : 'Belum',
          validation_status: sub ? sub.validation_status : 'Pending',
          tanggal_kumpul: sub && sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('id-ID') : '-',
          content: sub ? sub.content : null,
          is_mock: !sub
        };
      });

      res.json({ success: true, data: submissionsWithNames });
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
      const { submission_id, validation_status, status, tugas_id, student_id } = req.body; 
      
      // Support both old validation_status and new status
      let finalStatus = status;
      let finalValidation = validation_status;
      
      if (status) {
        finalStatus = status;
        finalValidation = status === 'Selesai' ? 'Valid' : 'Invalid';
      } else if (validation_status) {
        finalStatus = validation_status === 'Valid' ? 'Selesai' : 'Belum Selesai';
        finalValidation = validation_status;
      }

      if (typeof submission_id === 'string' && submission_id.startsWith('mock-')) {
        // Insert new record
        const { error } = await supabase.from('pengumpulan_tugas').insert({
          tugas_id,
          student_id,
          status: finalStatus,
          validation_status: finalValidation,
          submitted_at: new Date(),
          content: 'Dinilai oleh guru'
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pengumpulan_tugas').update({
          validation_status: finalValidation,
          status: finalStatus
        }).eq('id', submission_id);
        if (error) throw error;
      }
      
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

  app.get('/api/monitoring/kasih-ibu-stats', async (req, res) => {
    try {
      const { month } = req.query; // format: YYYY-MM
      
      let query = supabase.from('kasih_ibu').select('jenis_kebiasaan, timestamp');
      
      if (month) {
        const startDate = `${month}-01T00:00:00Z`;
        // Get last day of month
        const [year, m] = String(month).split('-');
        const lastDay = new Date(Number(year), Number(m), 0).getDate();
        const endDate = `${month}-${lastDay}T23:59:59Z`;
        
        query = query.gte('timestamp', startDate).lte('timestamp', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      const counts: Record<string, number> = {
        'Bangun Pagi': 0,
        'Beribadah': 0,
        'Berolahraga': 0,
        'Makan Sehat': 0,
        'Gemar Belajar': 0,
        'Bermasyarakat': 0,
        'Tidur Cepat': 0
      };

      let maxCount = 0;

      if (data && data.length > 0) {
        data.forEach(item => {
          const label = item.jenis_kebiasaan;
          if (counts[label] !== undefined) {
            counts[label]++;
            if (counts[label] > maxCount) maxCount = counts[label];
          }
        });
      }

      let chartData;
      
      if (data && data.length > 0) {
        const scaleFactor = maxCount > 0 ? 10 / maxCount : 1;
        chartData = [
          { subject: 'Bangun Pagi', A: Math.round(counts['Bangun Pagi'] * scaleFactor), fullMark: 10 },
          { subject: 'Beribadah', A: Math.round(counts['Beribadah'] * scaleFactor), fullMark: 10 },
          { subject: 'Berolahraga', A: Math.round(counts['Berolahraga'] * scaleFactor), fullMark: 10 },
          { subject: 'Makan Sehat & Bergizi', A: Math.round(counts['Makan Sehat'] * scaleFactor), fullMark: 10 },
          { subject: 'Gemar Belajar', A: Math.round(counts['Gemar Belajar'] * scaleFactor), fullMark: 10 },
          { subject: 'Bermasyarakat', A: Math.round(counts['Bermasyarakat'] * scaleFactor), fullMark: 10 },
          { subject: 'Tidur Cepat', A: Math.round(counts['Tidur Cepat'] * scaleFactor), fullMark: 10 },
        ];
      } else {
        // Default varied score between 5 and 8 if no data
        chartData = [
          { subject: 'Bangun Pagi', A: 7, fullMark: 10 },
          { subject: 'Beribadah', A: 8, fullMark: 10 },
          { subject: 'Berolahraga', A: 5, fullMark: 10 },
          { subject: 'Makan Sehat & Bergizi', A: 6, fullMark: 10 },
          { subject: 'Gemar Belajar', A: 7, fullMark: 10 },
          { subject: 'Bermasyarakat', A: 6, fullMark: 10 },
          { subject: 'Tidur Cepat', A: 5, fullMark: 10 },
        ];
      }

      res.json({ success: true, data: chartData });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.get('/api/kasih-ibu', async (req, res) => {
    try {
      const { kelas, nis, nama, tanggal } = req.query;
      let query = supabase.from('kasih_ibu').select('*').order('timestamp', { ascending: false });
      
      if (kelas) query = query.eq('kelas', kelas);
      if (tanggal) query = query.eq('tanggal_kegiatan', tanggal);
      
      if (nis && nis !== '' && nama && nama !== '') {
        query = query.or(`nisn.eq."${nis}",nama_murid.eq."${nama}"`);
      } else if (nis && nis !== '') {
        query = query.eq('nisn', nis);
      } else if (nama && nama !== '') {
        query = query.eq('nama_murid', nama);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      const formatted = data?.map(d => {
        let dateStr = d.timestamp;
        if (d.tanggal_kegiatan) {
          // waktu_kegiatan might be HH:mm:ss or HH:mm
          const waktu = d.waktu_kegiatan || '00:00:00';
          dateStr = `${d.tanggal_kegiatan}T${waktu}`;
        }
        
        let habit_id = '';
        if (d.jenis_kebiasaan === 'Bangun Pagi') habit_id = 'bangun_pagi';
        if (d.jenis_kebiasaan === 'Beribadah') habit_id = 'beribadah';
        if (d.jenis_kebiasaan === 'Berolahraga') habit_id = 'berolahraga';
        if (d.jenis_kebiasaan === 'Makan Sehat') habit_id = 'makan_sehat';
        if (d.jenis_kebiasaan === 'Gemar Belajar') habit_id = 'gemar_belajar';
        if (d.jenis_kebiasaan === 'Bermasyarakat') habit_id = 'bermasyarakat';
        if (d.jenis_kebiasaan === 'Tidur Cepat') habit_id = 'tidur_cepat';

        return {
          id: d.id,
          nama: d.nama_murid,
          kelas: d.kelas,
          habit_id: habit_id,
          habit_label: d.jenis_kebiasaan,
          tanggal: dateStr,
          keterangan: d.keterangan,
          status: d.validasi_walikelas || 'Belum',
          perasaan: d.perasaan
        };
      });

      res.json({ success: true, data: formatted });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.put('/api/kasih-ibu/validate', async (req, res) => {
    try {
      const { id, status } = req.body; // 'Valid' or 'Ditolak'
      const { error } = await supabase.from('kasih_ibu').update({ validasi_walikelas: status }).eq('id', id);
      if (error) throw error;
      res.json({ success: true, message: 'Laporan berhasil divalidasi' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  app.post('/api/kasih-ibu', async (req, res) => {
    try {
      const { nis, nama, kelas, habit_label, keterangan, tanggal, waktu, perasaan } = req.body;
      
      const { error } = await supabase.from('kasih_ibu').insert({
        nisn: nis, 
        nama_murid: nama, 
        kelas, 
        jenis_kebiasaan: habit_label, 
        keterangan, 
        tanggal_kegiatan: tanggal,
        waktu_kegiatan: waktu,
        perasaan: perasaan || 'Senang',
        validasi_walikelas: 'Belum'
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
  app.get('/api/api-settings', async (req, res) => {
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

  app.post('/api/api-settings', async (req, res) => {
    try {
      const keys = req.body;
      const updates = Object.entries(keys).map(([key, value]) => ({
        key,
        value: String(value)
      }));

      const { error } = await supabase.from('pengaturan').upsert(updates);
      if (error) throw error;

      res.json({ success: true, message: 'API Keys saved to database' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // --- CHATBOT ---

  app.post('/api/chatbot', async (req, res) => {
    try {
      const { message } = req.body;
      
      let apiKey = process.env.GEMINI_API_KEY;
      
      // Try to load from settings if env not set or if we want to override
      const { data: settings } = await supabase.from('pengaturan').select('value').eq('key', 'gemini_api_key').single();
      if (settings?.value) {
        apiKey = settings.value;
      }

      if (!apiKey) {
        return res.status(400).json({ success: false, message: 'API Key not configured' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: message,
      });

      res.json({ success: true, reply: response.text });
    } catch (e: any) {
      console.error("Chatbot error:", e);
      let errorMessage = 'Gagal terhubung ke AI. Silakan coba lagi.';
      if (e.message && e.message.includes('API key not valid')) {
        errorMessage = 'API Key Gemini tidak valid. Silakan periksa kembali di menu Konfigurasi API.';
      } else if (e.message && e.message.includes('high demand')) {
        errorMessage = 'Server AI sedang sibuk. Silakan coba beberapa saat lagi.';
      }
      res.status(500).json({ success: false, message: errorMessage });
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
    const { kelas, hari, guru } = req.query;
    let query = supabase.from('jadwal_real').select('*').order('jam');
    
    if (kelas) query = query.eq('kelas', kelas);
    if (hari) query = query.eq('hari', hari);
    if (guru) query = query.eq('guru', guru);
    
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
    (async () => {
      const viteModule = 'vite';
      const { createServer: createViteServer } = await import(viteModule);
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    })();
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

export default app;
