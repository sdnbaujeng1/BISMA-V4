const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://qisjuugbxrcjvpdnzxhz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpc2p1dWdieHJjanZwZG56eGh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI1NTczNywiZXhwIjoyMDg0ODMxNzM3fQ.5oKj5RL6OnI5kw9ciLIjAmxL1dNZwkZTEuijtnSCO5Q';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('murid').select('NISN, "Nama Lengkap"').limit(2);
  console.log(data, error);
}
check();
