import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  /let query = supabase\.from\('jurnal'\)\.select\('id, timestamp, ketidakhadiran, mata_pelajaran, jam_pembelajaran'\)\.eq\('kelas', studentClass\)\.order\('timestamp', \{ ascending: false \}\);/,
  `const { start, end } = await getTahunAjaranFilter();
      let query = supabase.from('jurnal').select('id, timestamp, ketidakhadiran, mata_pelajaran, jam_pembelajaran').eq('kelas', studentClass).gte('timestamp', start).lte('timestamp', end).order('timestamp', { ascending: false });`
);

content = content.replace(
  /const \{ data, error \} = await supabase\.from\('presensi_qr'\)\.select\('timestamp, jenis, detail'\)\.eq\('nama', studentName\)\.eq\('kelas', studentClass\)\.order\('timestamp', \{ ascending: false \}\);/,
  `const { data, error } = await supabase.from('presensi_qr').select('timestamp, jenis, detail').eq('nama', studentName).eq('kelas', studentClass).gte('timestamp', start).lte('timestamp', end).order('timestamp', { ascending: false });`
);

content = content.replace(
  /const \{ data: presensiData, error: presensiError \} = await supabase\.from\('presensi'\)\.select\('id, timestamp, presensi, ekstra'\)\.eq\('nama_murid', studentName\)\.eq\('kelas', studentClass\)\.order\('timestamp', \{ ascending: false \}\);/,
  `const { data: presensiData, error: presensiError } = await supabase.from('presensi').select('id, timestamp, presensi, ekstra').eq('nama_murid', studentName).eq('kelas', studentClass).gte('timestamp', start).lte('timestamp', end).order('timestamp', { ascending: false });`
);

fs.writeFileSync('server.ts', content);
console.log('fixed kehadiran');
