import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://qisjuugbxrcjvpdnzxhz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
async function run() {
  const result = await fetch(`${supabaseUrl}/rest/v1/`, { headers: { apikey: supabaseKey }});
  const data = await result.json();
  console.log('murid:', data.definitions.murid.properties);
  console.log('jadwal_real:', data.definitions.jadwal_real.properties);
}
run();
