import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

// /api/jurnal-siswa
content = content.replace(
  /const \{ data: studentJournal \} = await supabase\.from\('jurnal_kebiasaan'\)\.select\('\*'\)\.eq\('nis', nis\)\.order\('timestamp', \{ ascending: false \}\);/,
  `const { start, end } = await getTahunAjaranFilter();
      const { data: studentJournal } = await supabase.from('jurnal_kebiasaan').select('*').eq('nis', nis).gte('timestamp', start).lte('timestamp', end).order('timestamp', { ascending: false });`
);

content = content.replace(
  /const \{ data: teacherJournal \} = await supabase\.from\('jurnal'\)\.select\('\*'\)\.eq\('kelas', kelas\)\.order\('timestamp', \{ ascending: false \}\);/,
  `const { start, end } = await getTahunAjaranFilter();
      const { data: teacherJournal } = await supabase.from('jurnal').select('*').eq('kelas', kelas).gte('timestamp', start).lte('timestamp', end).order('timestamp', { ascending: false });`
);

// /api/siswa/kehadiran -> it uses month/year filtering specifically, so we don't need to add tahunAjaran. If user selects a month/year in UI, it fetches exactly that month.

fs.writeFileSync('server.ts', content);
console.log('patched 2');
