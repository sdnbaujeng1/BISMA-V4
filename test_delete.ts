import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://qisjuugbxrcjvpdnzxhz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { error } = await supabase.from('murid').delete().eq('NISN', 'non_existent_123');
  console.log('Delete test error:', error);
}
run();
