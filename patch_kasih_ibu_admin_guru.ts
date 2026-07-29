import fs from 'fs';

const files = ['src/pages/KasihIbuAdmin.tsx', 'src/pages/KasihIbuGuru.tsx'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Add filter logic
  content = content.replace(
    /const \{ data: pointsData \} = await supabase\.from\("kasih_ibu"\)\.select\("nisn, jenis_kebiasaan, kelas"\);/,
    `const { data: pengaturan } = await supabase.from('pengaturan').select('value').eq('key', 'tahunAjaran').maybeSingle();
      const ta = pengaturan?.value || "2024/2025";
      const parts = ta.split("/");
      const startYear = parseInt(parts[0]) || 2024;
      const endYear = parseInt(parts[1]) || 2025;
      const start = \`\${startYear}-07-01T00:00:00.000Z\`;
      const end = \`\${endYear}-06-30T23:59:59.999Z\`;
      const { data: pointsData } = await supabase.from("kasih_ibu").select("nisn, jenis_kebiasaan, kelas").gte('timestamp', start).lte('timestamp', end);`
  );
  
  fs.writeFileSync(file, content);
  console.log('patched', file);
}
