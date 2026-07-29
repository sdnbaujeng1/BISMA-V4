import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://qisjuugbxrcjvpdnzxhz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: b } = await supabase.from('pengaturan').select('value').eq('key', 'backup_murid_2025/2026').maybeSingle();
  if (b && b.value) {
    const p = JSON.parse(b.value);
    console.log('2025/2026 length:', p.length);
  } else {
    console.log('2025/2026 no data');
  }
}
run();
