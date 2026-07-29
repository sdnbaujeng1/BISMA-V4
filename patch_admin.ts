import fs from 'fs';
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

content = content.replace(
  /<label className="block text-xs font-bold text-slate-500 uppercase mb-1">\s*Tahun Ajaran\s*<\/label>/,
  `<label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Tahun Ajaran (Filter Data Aktif)
                  </label>`
);

content = content.replace(
  /onChange=\{\(e\) => setTahunAjaran\(e\.target\.value\)\}\s*className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white"\s*\/>/,
  `onChange={(e) => setTahunAjaran(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white"
                  />
                  <p className="text-[10px] text-amber-600 mt-1">Mengubah ini akan memfilter data (Jurnal, Presensi, Kasih Ibu, Bank Sampah) di seluruh aplikasi.</p>`
);

fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
console.log('patched admin');
