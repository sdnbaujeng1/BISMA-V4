import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function Kedisiplinan({ user, onNavigate }: { user: any, onNavigate: (page: string) => void }) {
  const [kelas, setKelas] = useState('');
  const [tab, setTab] = useState('absensi');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (kelas) {
      setLoading(true);
      // Mocking data
      setTimeout(() => {
        setData([
          { nisn: '001', nama: 'Andi', s: 1, i: 0, a: 0, d: 0, total: 1, catatan: [] },
          { nisn: '002', nama: 'Budi', s: 0, i: 0, a: 0, d: 0, total: 0, catatan: [] },
        ]);
        setLoading(false);
      }, 500);
    }
  }, [kelas]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
      <header className="sticky top-0 z-30 bg-green-600 px-4 pb-4 pt-6 shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button onClick={() => onNavigate('main')} className="p-2 rounded-full hover:bg-white/20 text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-white">Kedisiplinan</h2>
        </div>
      </header>
      
      <main className="flex-grow p-4 md:p-6 mt-4">
        <div className="max-w-7xl mx-auto bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Pilih Kelas</label>
            <select 
              value={kelas} 
              onChange={e => setKelas(e.target.value)}
              className="w-full md:w-1/3 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-700 dark:text-white"
            >
              <option value="">-- Pilih Kelas --</option>
              <option value="1">Kelas 1</option>
              <option value="2">Kelas 2</option>
            </select>
          </div>

          <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button 
                onClick={() => setTab('absensi')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${tab === 'absensi' ? 'border-green-600 text-green-600 dark:border-green-400 dark:text-green-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'}`}
              >
                Ketidakhadiran
              </button>
              <button 
                onClick={() => setTab('catatan')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${tab === 'catatan' ? 'border-green-600 text-green-600 dark:border-green-400 dark:text-green-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'}`}
              >
                Kedisiplinan
              </button>
            </nav>
          </div>

          {kelas && (
            <div className="mt-6 animate-in fade-in duration-300">
              {tab === 'absensi' && (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="p-3 border-b dark:border-slate-600 text-center w-12">No</th>
                        <th className="p-3 border-b dark:border-slate-600 text-left">Nama</th>
                        <th className="p-3 border-b dark:border-slate-600 text-center w-16 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">S</th>
                        <th className="p-3 border-b dark:border-slate-600 text-center w-16 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400">I</th>
                        <th className="p-3 border-b dark:border-slate-600 text-center w-16 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">A</th>
                        <th className="p-3 border-b dark:border-slate-600 text-center w-16 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">D</th>
                        <th className="p-3 border-b dark:border-slate-600 text-center w-20 bg-slate-200 dark:bg-slate-600 font-bold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {loading ? (
                        <tr><td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400 italic">Memuat data...</td></tr>
                      ) : data.map((m, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="p-3 text-center text-slate-500 dark:text-slate-400">{i + 1}</td>
                          <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{m.nama}</td>
                          <td className="p-3 text-center font-mono dark:text-slate-300">{m.s}</td>
                          <td className="p-3 text-center font-mono dark:text-slate-300">{m.i}</td>
                          <td className="p-3 text-center font-mono dark:text-slate-300">{m.a}</td>
                          <td className="p-3 text-center font-mono dark:text-slate-300">{m.d}</td>
                          <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-200">{m.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === 'catatan' && (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="p-3 border-b dark:border-slate-600 text-center w-12">No</th>
                        <th className="p-3 border-b dark:border-slate-600 text-left w-64">Nama</th>
                        <th className="p-3 border-b dark:border-slate-600 text-left">Detail Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {loading ? (
                        <tr><td colSpan={3} className="p-8 text-center text-slate-500 dark:text-slate-400 italic">Memuat data...</td></tr>
                      ) : data.map((m, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="p-3 text-center text-slate-500 dark:text-slate-400 align-top">{i + 1}</td>
                          <td className="p-3 font-medium text-slate-800 dark:text-slate-200 align-top">{m.nama}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">
                            {m.catatan.length === 0 ? (
                              <span className="italic text-slate-400 dark:text-slate-500">Tidak ada catatan</span>
                            ) : (
                              <ul className="list-disc list-inside space-y-1">
                                {m.catatan.map((c: any, j: number) => (
                                  <li key={j}>{c.date}: {c.type} ({c.mapel} - {c.guru})</li>
                                ))}
                              </ul>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
