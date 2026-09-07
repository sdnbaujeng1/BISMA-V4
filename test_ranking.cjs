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
  const { data: d } = await supabase.from('kasih_ibu').select('*');
  const pointsByUser = {};
  
  d.forEach(entry => {
    const nisn = entry.nisn || entry.nama_murid;
    if (nisn) {
      if (HABIT_POINTS[entry.jenis_kebiasaan]) {
         pointsByUser[nisn] = (pointsByUser[nisn] || 0) + HABIT_POINTS[entry.jenis_kebiasaan].points;
      } else if (entry.jenis_kebiasaan.startsWith('Tukar Poin')) {
         const match = entry.jenis_kebiasaan.match(/\(-(\d+)\)/);
         if (match) {
           pointsByUser[nisn] = (pointsByUser[nisn] || 0) - parseInt(match[1], 10);
         }
      }
    }
  });

  const sorted = Object.entries(pointsByUser)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  console.log("Top 5:", sorted);
}
check();
