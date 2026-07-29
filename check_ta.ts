import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://qisjuugbxrcjvpdnzxhz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: oldTaData } = await supabase.from('pengaturan').select('value').eq('key', 'tahunAjaran').maybeSingle();
  console.log('Current TA:', oldTaData);
  
  const { data: b1 } = await supabase.from('pengaturan').select('key').like('key', 'backup%');
  console.log('All backups:', b1);
  
  const { data: data26 } = await supabase.from('pengaturan').select('value').eq('key', 'backup_murid_2026/2027').maybeSingle();
  if (data26 && data26.value) {
    const p = JSON.parse(data26.value);
    console.log('Backup 26 length:', p.length);
  }
}
run();
