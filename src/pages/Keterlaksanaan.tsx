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
              {Object.keys(data || {}).sort().map((cls, index) => (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={cls} 
                  className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col hover:translate-y-[-5px] transition-transform duration-300"
                >
                  <div className={`bg-gradient-to-br ${getClassColor(cls)} px-6 py-5 text-white relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                    <div className="relative z-10 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider opacity-80">Kelas</span>
                        <h3 className="text-3xl font-black">{cls}</h3>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/30">
                        <span className="text-sm font-bold">{(data[cls] || []).length} JP</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 flex-grow bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="space-y-3">
                      {(() => {
                        const grouped: any[] = [];
                        const rawData = data[cls] || [];
                        
                        // Sort by jam first
                        const sortedData = [...rawData].sort((a: any, b: any) => a.jam - b.jam);

                        sortedData.forEach((row: any) => {
                          const last = grouped[grouped.length - 1];
                          // Group if same teacher and subject and consecutive hours (optional logic for consecutive)
                          // For simplicity, grouping by teacher + subject
                          if (last && last.guru === row.guru && last.mapel === row.mapel) {
                             // Check if jam is consecutive? 
                             // Let's just append for now
                             last.jamEnd = row.jam;
                             last.jams.push(row.jam);
                             if (row.mapel !== 'X') {
                                last.isCompleted = true;
                             }
                          } else {
                            grouped.push({ 
                              ...row, 
                              jamStart: row.jam, 
                              jamEnd: row.jam, 
                              jams: [row.jam],
                              isCompleted: row.mapel !== 'X'
                            });
                          }
                        });

                        return grouped.map((row: any, idx: number) => {
                          const isCompleted = row.isCompleted;
                          const jamDisplay = row.jamStart === row.jamEnd ? `${row.jamStart}` : `${row.jamStart}-${row.jamEnd}`;
                          
                          return (
                            <div 
                              key={idx} 
                              className={`relative overflow-hidden rounded-2xl p-4 transition-all duration-300 border ${
                                isCompleted 
                                  ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm' 
                                  : 'bg-slate-100 dark:bg-slate-900 border-transparent opacity-80'
                              }`}
                            >
                              <div className="flex items-start gap-4 relative z-10">
                                <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl shadow-sm border ${
                                  isCompleted 
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800 text-green-600 dark:text-green-400' 
                                    : 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400'
                                }`}>
                                  <span className="text-[10px] font-bold uppercase">JP</span>
                                  <span className="text-lg font-black leading-none">{jamDisplay}</span>
                                </div>
                                
                                <div className="flex-grow min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <User className="w-3 h-3 text-slate-400" />
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">
                                      {row.guru}
                                    </p>
                                  </div>
                                  <h4 className={`text-sm font-bold truncate ${isCompleted ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500 italic'}`}>
                                    {isCompleted ? row.mapel : 'Belum Terisi'}
                                  </h4>
                                </div>

                                <div className="flex-shrink-0 self-center">
                                  {isCompleted ? (
                                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-200 dark:shadow-none">
                                      <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-600 text-white flex items-center justify-center">
                                      <XCircle className="w-5 h-5" />
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Progress bar decoration */}
                              {isCompleted && (
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-green-100 dark:bg-green-900/30">
                                  <div className="h-full bg-green-500 w-full rounded-r-full"></div>
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
