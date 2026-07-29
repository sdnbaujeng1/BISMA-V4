import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const replacement = `
  app.post('/api/pengaturan', async (req, res) => {
    try {
      const settings = req.body;
      
      // -- TAHUN AJARAN MIGRATION LOGIC --
      if (settings.tahunAjaran) {
         const { data: oldTaData } = await supabase.from('pengaturan').select('value').eq('key', 'tahunAjaran').maybeSingle();
         const oldTa = oldTaData?.value || "2024/2025";
         if (settings.tahunAjaran !== oldTa) {
            console.log(\`Migrating from \${oldTa} to \${settings.tahunAjaran}\`);
            
            // 1. Fetch current data
            const { data: oldMurid } = await supabase.from('murid').select('*');
            const { data: oldJadwal } = await supabase.from('jadwal_real').select('*');
            
            // 2. Backup to pengaturan
            await supabase.from('pengaturan').upsert([
               { key: \`backup_murid_\${oldTa}\`, value: JSON.stringify(oldMurid || []) },
               { key: \`backup_jadwal_\${oldTa}\`, value: JSON.stringify(oldJadwal || []) }
            ]);
            
            // 3. Clear current tables
            await supabase.from('murid').delete().neq('"NISN"', 'dummy_value_for_delete');
            await supabase.from('jadwal_real').delete().gt('id', -1);
            
            // 4. Restore new data if exists
            const { data: newMuridBackup } = await supabase.from('pengaturan').select('value').eq('key', \`backup_murid_\${settings.tahunAjaran}\`).maybeSingle();
            const { data: newJadwalBackup } = await supabase.from('pengaturan').select('value').eq('key', \`backup_jadwal_\${settings.tahunAjaran}\`).maybeSingle();
            
            if (newMuridBackup?.value) {
               try {
                 const parsedMurid = JSON.parse(newMuridBackup.value);
                 if (parsedMurid.length > 0) {
                    await supabase.from('murid').insert(parsedMurid);
                 }
               } catch(e) { console.error('Failed to parse/restore murid backup', e); }
            }
            if (newJadwalBackup?.value) {
               try {
                 const parsedJadwal = JSON.parse(newJadwalBackup.value);
                 if (parsedJadwal.length > 0) {
                    await supabase.from('jadwal_real').insert(parsedJadwal);
                 }
               } catch(e) { console.error('Failed to parse/restore jadwal backup', e); }
            }
         }
      }
      // -- END TAHUN AJARAN MIGRATION LOGIC --

      const updates = Object.entries(settings).map(([key, value]) => ({`;

content = content.replace(
  /app\.post\('\/api\/pengaturan', async \(req, res\) => \{\n\s*try \{\n\s*const settings = req\.body;\n\s*const updates = Object\.entries\(settings\)\.map\(\(\[key, value\]\) => \(\{/,
  replacement
);

fs.writeFileSync('server.ts', content);
console.log('patched pengaturan');
