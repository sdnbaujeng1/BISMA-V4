import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qisjuugbxrcjvpdnzxhz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpc2p1dWdieHJjanZwZG56eGh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI1NTczNywiZXhwIjoyMDg0ODMxNzM3fQ.5oKj5RL6OnI5kw9ciLIjAmxL1dNZwkZTEuijtnSCO5Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const rs = await supabase.from('helpdesk_config').select('*').limit(1);
  console.log('Query result:', rs);

  if (rs.error && rs.error.code === '42P01') {
    console.log('Table helpdesk_config does not exist.');
  }

  const { error } = await supabase.from('helpdesk_config').upsert({
    key: 'default',
    value: {
      "pie_data": [
        { "name": "Lainnya", "value": 15 },
        { "name": "SD/MI", "value": 45 },
        { "name": "SMA/SMK/MA", "value": 10 },
        { "name": "SMP/MTs", "value": 30 }
      ],
      "word_cloud": [
        { "text": "Inovatif", "count": 100 },
        { "text": "Luar biasa", "count": 80 },
        { "text": "responsive", "count": 65 },
        { "text": "Keren", "count": 55 },
        { "text": "Mudah", "count": 40 },
        { "text": "Aman", "count": 85 },
        { "text": "Lengkap", "count": 70 }
      ]
    }
  });

  console.log('Upsert result:', error);
}

run();
