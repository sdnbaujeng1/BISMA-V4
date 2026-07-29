import fs from 'fs';
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const replacement = `<label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Tahun Ajaran (Filter Data Aktif)
                  </label>
                  <select
                    value={tahunAjaran}
                    onChange={(e) => setTahunAjaran(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white"
                  >
                    <option value="2024/2025">2024/2025</option>
                    <option value="2025/2026">2025/2026</option>
                    <option value="2026/2027">2026/2027</option>
                    <option value="2027/2028">2027/2028</option>
                    <option value="2028/2029">2028/2029</option>
                    <option value="2029/2030">2029/2030</option>
                  </select>`;

content = content.replace(
  /<label className="block text-xs font-bold text-slate-500 uppercase mb-1">\s*Tahun Ajaran \(Filter Data Aktif\)\s*<\/label>\s*<select[\s\S]*?<\/select>/,
  replacement
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
console.log('patched admin dropdown');
