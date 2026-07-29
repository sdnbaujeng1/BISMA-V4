import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://qisjuugbxrcjvpdnzxhz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: b1 } = await supabase.from('pengaturan').select('key').like('key', 'backup%');
  console.log('All backups:', b1);
  const { data: b2 } = await supabase.from('pengaturan').select('key').like('key', '%murid%');
  console.log('All murid backups:', b2);
}
run();
