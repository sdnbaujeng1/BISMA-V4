import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://qisjuugbxrcjvpdnzxhz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: oldMurid } = await supabase.from('pengaturan').select('key').like('key', 'backup%');
  console.log('Backups:', oldMurid);
}
run();
