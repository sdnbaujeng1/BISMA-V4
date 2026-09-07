const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://qisjuugbxrcjvpdnzxhz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpc2p1dWdieHJjanZwZG56eGh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI1NTczNywiZXhwIjoyMDg0ODMxNzM3fQ.5oKj5RL6OnI5kw9ciLIjAmxL1dNZwkZTEuijtnSCO5Q';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('--- TABUNGAN SAMPAH KELAS 4 ---');
  const { data: t } = await supabase.from('tabungan_sampah').select('*').ilike('kelas', '%4%');
  console.log(t);

  console.log('\n--- KASIH IBU KELAS 4 ---');
  const { data: k } = await supabase.from('kasih_ibu').select('*').ilike('kelas', '%4%');
  console.log(k);

  console.log('\n--- MURID KELAS 4 ---');
  const { data: m } = await supabase.from('murid').select('*').ilike('Kelas', '%4%');
  console.log(m.length, "students found.");
}
check();
