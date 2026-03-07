import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function Keterlaksanaan({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/keterlaksanaan')
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setData(res.data);
        }
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
      <header className="sticky top-0 z-30 bg-green-600 px-4 pb-4 pt-6 shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button onClick={() => onNavigate('main')} className="p-2 rounded-full hover:bg-white/20 text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-white">Keterlaksanaan KBM</h2>
        </div>
      </header>
      
      <main className="flex-grow p-4 md:p-6 mt-4">
        <div className="max-w-6xl mx-auto bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-green-600 text-white">
                <tr>
                  <th className="p-4 text-center w-24 font-semibold">Kelas</th>
                  <th className="p-4 text-center w-32 font-semibold">Jam</th>
                  <th className="p-4 text-left font-semibold">Guru</th>
                  <th className="p-4 text-center font-semibold">Mapel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400 italic">Memuat data keterlaksanaan...</td>
                  </tr>
                ) : Object.keys(data || {}).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400 italic">Tidak ada data jadwal hari ini.</td>
                  </tr>
                ) : (
                  Object.keys(data || {}).sort().map(cls => (
                    (data[cls] || []).map((row: any, idx: number) => (
                      <tr key={`${cls}-${idx}`} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                        {idx === 0 && (
                          <td rowSpan={(data[cls] || []).length} className="p-4 text-center border-r border-slate-200 dark:border-slate-700 font-bold text-lg text-slate-700 dark:text-slate-200 align-top bg-white dark:bg-slate-800">
                            {cls}
                          </td>
                        )}
                        <td className="p-4 text-center font-mono text-slate-600 dark:text-slate-400">{row.jam}</td>
                        <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{row.guru}</td>
                        <td className={`p-4 text-center font-bold ${row.mapel === 'X' ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          {row.mapel === 'X' ? 'Belum Mengisi' : row.mapel}
                        </td>
                      </tr>
                    ))
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
