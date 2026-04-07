import fetch from 'node-fetch';

async function run() {
  const res = await fetch('http://localhost:3000/api/chatbot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Halo, siapa kamu?' })
  });
  const data = await res.json();
  console.log('Chatbot result:', data);
}
run();
