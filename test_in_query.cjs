const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://qisjuugbxrcjvpdnzxhz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpc2p1dWdieHJjanZwZG56eGh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI1NTczNywiZXhwIjoyMDg0ODMxNzM3fQ.5oKj5RL6OnI5kw9ciLIjAmxL1dNZwkZTEuijtnSCO5Q';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: students } = await supabase.from('murid').select('NISN, "Nama Lengkap"').eq('Kelas', 'Kelas 4');
  console.log("Found", students.length, "students in Kelas 4");
  
  const nisnList = students.map(s => s.NISN).filter(Boolean);
  
  const { data: points } = await supabase.from('kasih_ibu').select('*').in('nisn', nisnList);
  console.log("Found", points.length, "points for these students");
  
  const amirahPoints = points.filter(p => p.nama_murid.includes('AMIRAH'));
  console.log("Amirah points:", amirahPoints.length);
}
check();
