const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://qisjuugbxrcjvpdnzxhz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpc2p1dWdieHJjanZwZG56eGh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI1NTczNywiZXhwIjoyMDg0ODMxNzM3fQ.5oKj5RL6OnI5kw9ciLIjAmxL1dNZwkZTEuijtnSCO5Q';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: m } = await supabase.from('murid').select('*').ilike('Nama Lengkap', '%Amirah%');
  console.log("Amirah in murid:", m);
  
  const { data: k } = await supabase.from('kasih_ibu').select('*').ilike('nama_murid', '%Amirah%').limit(1);
  console.log("Amirah in kasih_ibu:", k);
}
check();
