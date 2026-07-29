import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const helper = `
async function getTahunAjaranFilter() {
  const { data } = await supabase.from('pengaturan').select('value').eq('key', 'tahunAjaran').maybeSingle();
  const ta = data?.value || "2024/2025";
  const parts = ta.split("/");
  const startYear = parseInt(parts[0]) || 2024;
  const endYear = parseInt(parts[1]) || 2025;
  return {
    start: \`\${startYear}-07-01T00:00:00.000Z\`,
    end: \`\${endYear}-06-30T23:59:59.999Z\`
  };
}
`;

// Insert helper after supabase init
content = content.replace(/(const supabase = createClient[^;]+;)/, '$1\n' + helper);

// 1. /api/laporan
content = content.replace(
  /let query = supabase\.from\('jurnal'\)\.select\('\*'\)\.order\('timestamp', \{ ascending: false \}\);/,
  `const { start, end } = await getTahunAjaranFilter();
      let query = supabase.from('jurnal').select('*').gte('timestamp', start).lte('timestamp', end).order('timestamp', { ascending: false });`
);

// 2. /api/keterlaksanaan
content = content.replace(
  /let query = supabase\.from\('jurnal'\)\.select\('ketidakhadiran, catatan_mengajar, kelas, timestamp'\);/,
  `const { start, end } = await getTahunAjaranFilter();
      let query = supabase.from('jurnal').select('ketidakhadiran, catatan_mengajar, kelas, timestamp').gte('timestamp', start).lte('timestamp', end);`
);

// 3. /api/monitoring/analisa-siswa
content = content.replace(
  /let query = supabase\.from\('jurnal'\)\.select\('ketidakhadiran, catatan_mengajar, kelas, timestamp'\);/,
  `const { start, end } = await getTahunAjaranFilter();
      let query = supabase.from('jurnal').select('ketidakhadiran, catatan_mengajar, kelas, timestamp').gte('timestamp', start).lte('timestamp', end);`
);

// 4. /api/kasih-ibu
content = content.replace(
  /let query = supabase\.from\('kasih_ibu'\)\.select\('\*'\)\.order\('timestamp', \{ ascending: false \}\);/,
  `const { start, end } = await getTahunAjaranFilter();
      let query = supabase.from('kasih_ibu').select('*').gte('timestamp', start).lte('timestamp', end).order('timestamp', { ascending: false });`
);

// 5. /api/monitoring/kasih-ibu-stats
content = content.replace(
  /let query = supabase\.from\('kasih_ibu'\)\.select\('jenis_kebiasaan, timestamp'\);/,
  `const { start, end } = await getTahunAjaranFilter();
      let query = supabase.from('kasih_ibu').select('jenis_kebiasaan, timestamp').gte('timestamp', start).lte('timestamp', end);`
);

// 6. /api/tugas
content = content.replace(
  /let query = supabase\.from\('tugas'\)\.select\('\*'\)\.order\('created_at', \{ ascending: false \}\);/,
  `const { start, end } = await getTahunAjaranFilter();
      let query = supabase.from('tugas').select('*').gte('created_at', start).lte('created_at', end).order('created_at', { ascending: false });`
);

// 7. /api/bank-sampah/transactions
content = content.replace(
  /const \{ data, error \} = await supabase\.from\('tabungan_sampah'\)\.select\('\*'\)\.order\('tanggal', \{ ascending: false \}\);/,
  `const { start, end } = await getTahunAjaranFilter();
    const { data, error } = await supabase.from('tabungan_sampah').select('*').gte('tanggal', start).lte('tanggal', end).order('tanggal', { ascending: false });`
);

// 8. /api/bank-sampah/stats
content = content.replace(
  /const \{ data: transactions \} = await supabase\.from\('tabungan_sampah'\)\.select\('kelas, nilai, berat'\);/,
  `const { start, end } = await getTahunAjaranFilter();
      const { data: transactions } = await supabase.from('tabungan_sampah').select('kelas, nilai, berat').gte('tanggal', start).lte('tanggal', end);`
);

fs.writeFileSync('server.ts', content);
console.log('patched');
