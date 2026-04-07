import fetch from 'node-fetch';

async function run() {
  const res = await fetch('http://localhost:3000/api/admin/send-wa-reminder', { method: 'POST' });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
