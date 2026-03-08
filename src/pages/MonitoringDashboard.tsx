import React, { useState, useEffect } from 'react';
import { Monitor, Calendar, RefreshCw, AlertTriangle, Users, Percent, Sparkles, Clock, CheckCircle2, XCircle, LogOut } from 'lucide-react';

export default function MonitoringDashboard({ onLogout }: { onLogout: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/monitoring');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch monitoring data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); // Auto-refresh every 3 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fuchsia-500"></div>
      </div>
    );
  }

  const classes = ['1', '2', '3', '4', '5', '6'];
  const todayStr = lastUpdate.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const filteredJadwal = (data?.jadwal || []).filter((j: any) => 
    (j.guru || '').toLowerCase().includes(search.toLowerCase()) || 
    (j.mapel || '').toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 font-sans text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <div className="bg-slate-800 dark:bg-slate-700 p-3 rounded-xl text-white">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Dashboard Monitoring KBM</h1>
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mt-1">
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {todayStr}</span>
              <span className="flex items-center gap-1 text-emerald-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live Update
              </span>
            </div>
          </div>
        </div>

        {/* Belum Mengisi Jurnal Alert */}
        <div className={`flex-1 max-w-2xl border rounded-xl p-3 flex items-start gap-3 overflow-hidden ${
          data?.belumMengisi?.length > 0 
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50' 
            : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50'
        }`}>
          {data?.belumMengisi?.length > 0 ? (
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className={`text-xs font-bold mb-1 uppercase tracking-wider ${
              data?.belumMengisi?.length > 0 
                ? 'text-amber-600 dark:text-amber-500' 
                : 'text-emerald-600 dark:text-emerald-500'
            }`}>
              {data?.belumMengisi?.length > 0 
                ? "Pengisian Jurnal Dibawah Ekspektasi" 
                : "Pengisian Jurnal Sesuai Ekspektasi"
              }
            </div>
            
            {data?.belumMengisi?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {data.belumMengisi.map((b: any, idx: number) => (
                  <span key={idx} className="font-medium text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded text-sm">
                    {b.guru} <span className="text-amber-600/70 dark:text-amber-500/70 text-xs">({b.kelas})</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Cari Guru / Mapel..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-4 pr-10 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 text-sm w-48 transition-all focus:w-64"
            />
          </div>
          <button onClick={fetchData} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" title="Refresh">
            <RefreshCw className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <button onClick={onLogout} className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors flex items-center gap-2" title="Kembali">
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-bold hidden md:inline">Kembali</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl"><Users className="w-6 h-6" /></div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Ketidakhadiran Murid</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{data?.stats?.ketidakhadiran || 0}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl"><Percent className="w-6 h-6" /></div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Keterlaksanaan</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data?.stats?.keterlaksanaan || 0}%</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-xl"><Sparkles className="w-6 h-6" /></div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Kelas Terbersih</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{data?.stats?.kelasTerbersih || '-'}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-500 rounded-xl"><Clock className="w-6 h-6" /></div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Total JP Hari Ini</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{data?.stats?.totalJP || 0} JP</div>
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {classes.map(kelas => {
          const classData = (data?.jadwal || []).find((j: any) => j.kelas === kelas);
          const studentCount = classData?.studentCount || 0;
          const filteredJadwalKelas = filteredJadwal.filter((j: any) => j.kelas === kelas);
          
          // Determine header color based on class
          const headerColors: Record<string, string> = {
            '1': 'bg-blue-600',
            '2': 'bg-emerald-600',
            '3': 'bg-rose-600',
            '4': 'bg-amber-600',
            '5': 'bg-purple-600',
            '6': 'bg-indigo-600'
          };
          
          return (
            <div key={kelas} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
              <div className={`${headerColors[kelas]} text-white text-center py-2 font-bold tracking-wider relative`}>
                <div className="text-xs opacity-80 font-medium">KELAS</div>
                <div className="text-xl">{kelas}</div>
                <div className="absolute top-1 right-2 bg-white/20 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1">
                  <Users className="w-2.5 h-2.5" /> {studentCount}
                </div>
              </div>
              <div className="p-0 flex-1 overflow-y-auto max-h-[60vh]">
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
                      // Group consecutive lessons with same teacher and subject
                      const groupedSchedule: any[] = [];
                      filteredJadwalKelas.forEach((j: any) => {
                        const last = groupedSchedule[groupedSchedule.length - 1];
                        if (last && last.guru === j.guru && last.mapel === j.mapel) {
                          last.jam += `, ${j.jam}`;
                          // If any part is done, mark as done? Or all must be done?
                          // Usually if journal is filled for the lesson, it covers the block.
                          // But let's check if status is consistent.
                          // If one is done, maybe show done? Or show partial?
                          // Let's assume if one is done, it's done.
                          if (j.status) last.status = true; 
                        } else {
                          groupedSchedule.push({ ...j });
                        }
                      });

                      return groupedSchedule.length > 0 ? (
                        groupedSchedule.map((j: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                            <td className="py-3 px-3 text-slate-500 dark:text-slate-400 font-mono text-xs align-top pt-4">
                              {j.jam.split(',').map((t: string) => (
                                <span key={t} className="block bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-center mb-1 last:mb-0">
                                  {t.trim()}
                                </span>
                              ))}
                            </td>
                            <td className="py-3 px-3 align-top">
                              <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400 transition-colors">
                                {j.guru}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 bg-slate-100 dark:bg-slate-700/50 inline-block px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600">
                                {j.mapel}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center align-middle">
                              {j.status ? (
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
            </div>
          );
        })}
      </div>
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}
