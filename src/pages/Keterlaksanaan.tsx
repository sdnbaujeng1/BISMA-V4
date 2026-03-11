import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Clock, Calendar, User, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

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
      })
      .catch(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const getClassColor = (cls: string) => {
    const colors: Record<string, string> = {
      '1': 'from-red-500 to-rose-600 shadow-red-200',
      '2': 'from-orange-500 to-amber-600 shadow-orange-200',
      '3': 'from-yellow-500 to-amber-500 shadow-yellow-200',
      '4': 'from-green-500 to-emerald-600 shadow-green-200',
      '5': 'from-blue-500 to-indigo-600 shadow-blue-200',
      '6': 'from-purple-500 to-violet-600 shadow-purple-200',
    };
    return colors[cls] || 'from-slate-500 to-slate-600 shadow-slate-200';
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors font-sans">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-4 py-4 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('main')} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Keterlaksanaan KBM</h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {today}
              </p>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Memuat data keterlaksanaan...</p>
            </div>
          ) : Object.keys(data || {}).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Tidak Ada Jadwal Hari Ini</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Belum ada jadwal KBM yang terdaftar untuk hari ini. Silahkan hubungi admin jika ini adalah kesalahan.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {Object.keys(data || {}).sort().map((cls, index) => {
                const classMatch = cls.match(/\d+/);
                const classNum = classMatch ? classMatch[0] : cls;
                
                const headerColors: Record<string, string> = {
                  '1': 'bg-blue-600',
                  '2': 'bg-emerald-600',
                  '3': 'bg-rose-600',
                  '4': 'bg-orange-600',
                  '5': 'bg-purple-600',
                  '6': 'bg-indigo-600'
                };
                const headerColor = headerColors[classNum] || 'bg-slate-600';

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={cls} 
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col"
                  >
                    <div className={`${headerColor} text-white text-center py-3 font-bold tracking-wider relative`}>
                      <div className="text-xl uppercase">Kelas {classNum}</div>
                    </div>
                    
                    <div className="p-0 flex-1 overflow-y-auto overflow-x-hidden max-h-[60vh]">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 sticky top-0 z-10">
                          <tr>
                            <th className="py-2 px-3 text-left font-medium w-16">Jam</th>
                            <th className="py-2 px-3 text-left font-medium">Guru / Mapel</th>
                            <th className="py-2 px-3 text-center font-medium w-12">Sts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                          {(() => {
                            const grouped: any[] = [];
                            const rawData = data[cls] || [];
                            
                            // Sort by jam first
                            const sortedData = [...rawData].sort((a: any, b: any) => a.jam - b.jam);

                            sortedData.forEach((row: any) => {
                              const last = grouped[grouped.length - 1];
                              // Group if same teacher and subject
                              if (last && last.guru === row.guru && last.mapel === row.mapel) {
                                last.jam = `${last.jam}, ${row.jam}`;
                                if (row.mapel !== 'X') {
                                  last.isCompleted = true;
                                }
                              } else {
                                grouped.push({ 
                                  ...row, 
                                  jam: String(row.jam),
                                  isCompleted: row.mapel !== 'X'
                                });
                              }
                            });

                            return grouped.length > 0 ? (
                              grouped.map((row: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono text-xs align-top pt-4">
                                    {row.jam.split(',').map((t: string) => (
                                      <span key={t} className="block bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-center mb-1 last:mb-0">
                                        {t.trim()}
                                      </span>
                                    ))}
                                  </td>
                                  <td className="py-3 px-3 align-top">
                                    <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400 transition-colors">
                                      {row.guru}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 bg-slate-100 dark:bg-slate-700/50 inline-block px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600">
                                      {row.isCompleted ? row.mapel : 'Belum Terisi'}
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-center align-middle">
                                    {row.isCompleted ? (
                                      <div className="bg-emerald-100 dark:bg-emerald-900/30 p-1.5 rounded-full inline-flex">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                      </div>
                                    ) : (
                                      <div className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-full inline-flex">
                                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3} className="py-12 text-center text-slate-400 dark:text-slate-500 italic">
                                  <div className="flex flex-col items-center gap-2">
                                    <Calendar className="w-8 h-8 opacity-20" />
                                    <span>Tidak ada jadwal</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
