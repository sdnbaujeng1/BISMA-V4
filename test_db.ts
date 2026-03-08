import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://qisjuugbxrcjvpdnzxhz.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpc2p1dWdieHJjanZwZG56eGh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI1NTczNywiZXhwIjoyMDg0ODMxNzM3fQ.5oKj5RL6OnI5kw9ciLIjAmxL1dNZwkZTEuijtnSCO5Q');
async function run() {
  await supabase.from('pengaturan').insert([
    { key: 'tahunAjaran', value: '2024/2025' },
    { key: 'semester', value: 'Ganjil' }
  ]);
  const { data, error } = await supabase.from('pengaturan').select('*');
  console.log(error ? error : data);
}
run();
