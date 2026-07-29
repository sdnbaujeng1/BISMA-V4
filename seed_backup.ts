import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://qisjuugbxrcjvpdnzxhz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: currentMurid } = await supabase.from('murid').select('*');
  await supabase.from('pengaturan').upsert([
    { key: 'backup_murid_2024/2025', value: JSON.stringify(currentMurid) }
  ]);
  
  // Also fix the current active year to 2024/2025
  await supabase.from('pengaturan').upsert([
    { key: 'tahunAjaran', value: '2024/2025' }
  ]);
  
  console.log('Fixed TA to 2024/2025 and stored backup');
}
run();
