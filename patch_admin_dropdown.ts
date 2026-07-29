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
                    <option value="2023/2024">2023/2024</option>
                    <option value="2024/2025">2024/2025</option>
                    <option value="2025/2026">2025/2026</option>
                    <option value="2026/2027">2026/2027</option>
                    <option value="2027/2028">2027/2028</option>
                    <option value="2028/2029">2028/2029</option>
                    <option value="2029/2030">2029/2030</option>
                    <option value="2030/2031">2030/2031</option>
                  </select>
                  <p className="text-[10px] text-amber-600 mt-1">Mengubah ini akan memfilter data (Jurnal, Presensi, Kasih Ibu, Bank Sampah) di seluruh aplikasi.</p>`;

content = content.replace(
  /<label className="block text-xs font-bold text-slate-500 uppercase mb-1">\s*Tahun Ajaran \(Filter Data Aktif\)\s*<\/label>\s*<input\s*type="text"\s*value=\{tahunAjaran\}\s*onChange=\{\(e\) => setTahunAjaran\(e\.target\.value\)\}\s*className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white"\s*\/>\s*<p className="text-\[10px\] text-amber-600 mt-1">Mengubah ini akan memfilter data \(Jurnal, Presensi, Kasih Ibu, Bank Sampah\) di seluruh aplikasi\.<\/p>/,
  replacement
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
console.log('patched admin dropdown');
