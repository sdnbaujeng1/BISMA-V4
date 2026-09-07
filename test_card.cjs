const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://qisjuugbxrcjvpdnzxhz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpc2p1dWdieHJjanZwZG56eGh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI1NTczNywiZXhwIjoyMDg0ODMxNzM3fQ.5oKj5RL6OnI5kw9ciLIjAmxL1dNZwkZTEuijtnSCO5Q';
const supabase = createClient(supabaseUrl, supabaseKey);

const HABIT_POINTS = {
  'Bangun Pagi': { points: 2, icon: '🌅' },
  'Beribadah': { points: 5, icon: '🕌' },
  'Berolahraga': { points: 2, icon: '🏃' },
  'Makan Sehat': { points: 2, icon: '🥗' },
  'Gemar Belajar': { points: 2, icon: '📚' },
  'Bermasyarakat': { points: 2, icon: '🤝' },
  'Tidur Cepat': { points: 2, icon: '😴' },
};

async function check() {
  const user = {
      NISN: '3165360290',
      NIS: '2981',
      "Nama Lengkap": 'Muhammad Arkan Oktaviano',
      Kelas: 'Kelas 4'
  };

  const { data, error } = await supabase
          .from('kasih_ibu')
          .select('nisn, nama_murid, jenis_kebiasaan, timestamp')
          .eq('kelas', user.Kelas)
          .order('timestamp', { ascending: false });
          
  console.log("Fetched kasih ibu for", user.Kelas, ":", data?.length, "rows.");

  const pointsByUser = {};
  const currentStudentBreakdown = {};
  Object.keys(HABIT_POINTS).forEach(habit => {
    currentStudentBreakdown[habit] = 0;
  });
  currentStudentBreakdown['Tukar Poin'] = 0;

  const userNama = user?.Nama_Murid || user?.name || user?.['Nama Lengkap'];

  data?.forEach(entry => {
    let points = 0;
    const habitInfo = HABIT_POINTS[entry.jenis_kebiasaan];
    const isCurrentUser = 
       (entry.nisn && user.NISN && String(entry.nisn).trim() === String(user.NISN).trim()) || 
       (entry.nisn && user.NIS && String(entry.nisn).trim() === String(user.NIS).trim()) || 
       (entry.nisn && user.id && String(entry.nisn).trim() === String(user.id).trim()) ||
       (entry.nama_murid && userNama && String(entry.nama_murid).trim().toLowerCase() === String(userNama).trim().toLowerCase());
    
    if (isCurrentUser) console.log("Matched current user on entry:", entry.jenis_kebiasaan);

    const studentIdentifier = entry.nisn || entry.nama_murid || 'unknown';

    if (habitInfo) {
      points = habitInfo.points;
      if (isCurrentUser) {
        currentStudentBreakdown[entry.jenis_kebiasaan] += points;
      }
    } else if (entry.jenis_kebiasaan.startsWith('Tukar Poin')) {
      const match = entry.jenis_kebiasaan.match(/\(-(\d+)\)/);
      if (match) {
        points = -parseInt(match[1], 10);
        if (isCurrentUser) {
          currentStudentBreakdown['Tukar Poin'] += points;
        }
      }
    }

    if (points !== 0) {
      pointsByUser[String(studentIdentifier)] = (pointsByUser[String(studentIdentifier)] || 0) + points;
    }
  });

  const totalMyPoints = Object.values(currentStudentBreakdown).reduce((sum, pts) => sum + pts, 0);
  console.log("My Points:", totalMyPoints);
  console.log("Points by user:", pointsByUser);
}
check();
