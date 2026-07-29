import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://qisjuugbxrcjvpdnzxhz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const result = await fetch('http://localhost:3000/api/pengaturan', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ tahunAjaran: '2025/2026' })
  });
  console.log('Switched to 25/26:', await result.json());
  
  const { data: m25 } = await supabase.from('murid').select('*');
  console.log('Murid in 25/26:', m25?.length);
  
  const result2 = await fetch('http://localhost:3000/api/pengaturan', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ tahunAjaran: '2024/2025' })
  });
  console.log('Switched back to 24/25:', await result2.json());
  
  const { data: m24 } = await supabase.from('murid').select('*');
  console.log('Murid in 24/25:', m24?.length);
}
run();
