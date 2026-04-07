import fetch from 'node-fetch';

async function run() {
  const res = await fetch('http://localhost:3000/api/api-settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ whatsapp_api_key: 'test_token_123' })
  });
  const data = await res.json();
  console.log('POST result:', data);

  const res2 = await fetch('http://localhost:3000/api/api-settings');
  const data2 = await res2.json();
  console.log('GET result:', data2);
}
run();
