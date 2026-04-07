import fetch from 'node-fetch';

async function run() {
  const res = await fetch('http://localhost:3000/api/siswa/kehadiran?nisn=3160176227&month=semua&year=semua');
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
