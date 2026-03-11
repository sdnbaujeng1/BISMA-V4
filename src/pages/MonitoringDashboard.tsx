import React, { useState, useEffect } from 'react';
import { Monitor, Calendar, RefreshCw, AlertTriangle, Users, Percent, Sparkles, Clock, CheckCircle2, XCircle, LogOut, X } from 'lucide-react';

export default function MonitoringDashboard({ onLogout }: { onLogout: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [search, setSearch] = useState('');
  const [activeModal, setActiveModal] = useState<'ketidakhadiran' | 'keterlaksanaan' | 'kebersihan' | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [ketidakhadiranData, setKetidakhadiranData] = useState<any[]>([]);
  const [loadingKetidakhadiran, setLoadingKetidakhadiran] = useState(false);
  const [analisaData, setAnalisaData] = useState<{ absentees: any[], violators: any[] }>({ absentees: [], violators: [] });
  const [analisaMonth, setAnalisaMonth] = useState(new Date().toISOString().slice(0, 7));

  const fetchKetidakhadiran = async () => {
    setLoadingKetidakhadiran(true);
    try {
      const res = await fetch(`/api/monitoring/ketidakhadiran?start=${startDate}&end=${endDate}`);
      const json = await res.json();
      if (json.success) {
        setKetidakhadiranData(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch ketidakhadiran data", error);
    } finally {
      setLoadingKetidakhadiran(false);
    }
  };

  useEffect(() => {
    if (activeModal === 'ketidakhadiran') {
      fetchKetidakhadiran();
    }
  }, [activeModal]);

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

  const fetchAnalisa = async () => {
    try {
      const res = await fetch(`/api/monitoring/analisa-siswa?month=${analisaMonth}`);
      const json = await res.json();
      if (json.success) {
        setAnalisaData(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch analisa data", error);
    }
  };

  useEffect(() => {
    fetchAnalisa();
  }, [analisaMonth]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); // Auto-refresh every 3 seconds
    const analisaInterval = setInterval(fetchAnalisa, 60000); // Refresh analisa every 60 seconds
    return () => {
      clearInterval(interval);
      clearInterval(analisaInterval);
    };
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fuchsia-500"></div>
      </div>
    );
  }

  const classes = data?.classes || ['1', '2', '3', '4', '5', '6'];
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
        <div 
          onClick={() => setActiveModal('ketidakhadiran')}
          className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-red-300 dark:hover:border-red-700 transition-all"
        >
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl"><Users className="w-6 h-6" /></div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Ketidakhadiran Murid</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{data?.stats?.ketidakhadiran || 0}</div>
          </div>
        </div>
        <div 
          onClick={() => setActiveModal('keterlaksanaan')}
          className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all"
        >
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl"><Percent className="w-6 h-6" /></div>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase">Keterlaksanaan</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data?.stats?.keterlaksanaan || 0}%</div>
          </div>
        </div>
        <div 
          onClick={() => setActiveModal('kebersihan')}
          className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
        >
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
          const studentCount = data?.studentCountByClass?.[kelas] || 0;
          const filteredJadwalKelas = filteredJadwal.filter((j: any) => j.kelas === kelas);
          
          // Determine header color based on class
          const classMatch = kelas.match(/\d+/);
          const classNum = classMatch ? classMatch[0] : kelas;
          
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
            <div key={kelas} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
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
                      // Group consecutive lessons with same teacher and subject
                      const groupedSchedule: any[] = [];
                      filteredJadwalKelas.forEach((j: any) => {
                        const last = groupedSchedule[groupedSchedule.length - 1];
                        if (last && last.guru === j.guru && last.mapel === j.mapel) {
                          last.jam = `${last.jam}, ${j.jam}`;
                          // If any part is done, mark as done? Or all must be done?
                          // Usually if journal is filled for the lesson, it covers the block.
                          // But let's check if status is consistent.
                          // If one is done, maybe show done? Or show partial?
                          // Let's assume if one is done, it's done.
                          if (j.status) last.status = true; 
                        } else {
                          groupedSchedule.push({ ...j, jam: String(j.jam) });
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

      {/* Analisa Data Siswa */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Analisa Data Siswa</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Pilih Bulan:</span>
            <input 
              type="month" 
              value={analisaMonth} 
              onChange={(e) => setAnalisaMonth(e.target.value)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">Siswa Sering Absen (S, I, A &gt; 3)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4 text-left font-medium rounded-tl-lg">Nama Siswa</th>
                  <th className="py-3 px-4 text-center font-medium">Kelas</th>
                  <th className="py-3 px-4 text-center font-medium">S</th>
                  <th className="py-3 px-4 text-center font-medium">I</th>
                  <th className="py-3 px-4 text-center font-medium">A</th>
                  <th className="py-3 px-4 text-center font-medium rounded-tr-lg">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {analisaData.absentees.length > 0 ? (
                  analisaData.absentees.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-4 font-medium">{s.nama}</td>
                      <td className="py-3 px-4 text-center">{s.kelas}</td>
                      <td className="py-3 px-4 text-center">{s.s}</td>
                      <td className="py-3 px-4 text-center">{s.i}</td>
                      <td className="py-3 px-4 text-center text-red-600 font-bold">{s.a}</td>
                      <td className="py-3 px-4 text-center font-bold">{s.total}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">Tidak ada siswa dengan absensi lebih dari 3 kali.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">Siswa Sering Melanggar Disiplin (&gt; 3)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4 text-left font-medium rounded-tl-lg">Nama Siswa</th>
                  <th className="py-3 px-4 text-center font-medium">Kelas</th>
                  <th className="py-3 px-4 text-center font-medium">Pelanggaran</th>
                  <th className="py-3 px-4 text-center font-medium rounded-tr-lg">Tindak Lanjut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {analisaData.violators.length > 0 ? (
                  analisaData.violators.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 px-4 font-medium">{s.nama}</td>
                      <td className="py-3 px-4 text-center">{s.kelas}</td>
                      <td className="py-3 px-4 text-center font-bold text-orange-600">{s.violations}</td>
                      <td className="py-3 px-4 text-center">
                        {s.unhandled === 0 ? (
                          <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4" /> Sudah
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full text-xs font-bold">
                            <AlertTriangle className="w-4 h-4" /> Belum
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 italic">Tidak ada siswa dengan pelanggaran lebih dari 3 kali.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold">
                {activeModal === 'ketidakhadiran' && 'Detail Ketidakhadiran Murid'}
                {activeModal === 'keterlaksanaan' && 'Detail Keterlaksanaan per Kelas'}
                {activeModal === 'kebersihan' && 'Detail Kelas Terbersih'}
              </h2>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {activeModal === 'ketidakhadiran' && (
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-700"
                    />
                    <span className="text-slate-500">-</span>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-700"
                    />
                    <button 
                      onClick={fetchKetidakhadiran}
                      disabled={loadingKetidakhadiran}
                      className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      {loadingKetidakhadiran ? 'Memuat...' : 'Filter'}
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto">
                    {ketidakhadiranData.length > 0 ? (
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400">
                          <tr>
                            <th className="py-2 px-3 font-medium">Tanggal</th>
                            <th className="py-2 px-3 font-medium">Nama Siswa</th>
                            <th className="py-2 px-3 font-medium">Kelas</th>
                            <th className="py-2 px-3 font-medium">Keterangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                          {ketidakhadiranData.map((k: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                              <td className="py-2 px-3">{new Date(k.tanggal).toLocaleDateString('id-ID')}</td>
                              <td className="py-2 px-3 font-medium">{k.nama}</td>
                              <td className="py-2 px-3">{k.kelas}</td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                  k.keterangan === 'Sakit' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  k.keterangan === 'Izin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                  k.keterangan === 'Alpa' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                }`}>
                                  {k.keterangan}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-8 text-slate-500">Tidak ada data ketidakhadiran pada periode ini.</div>
                    )}
                  </div>
                </div>
              )}

              {activeModal === 'keterlaksanaan' && (
                data?.details?.keterlaksanaan?.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="py-2 px-3 font-medium">Kelas</th>
                        <th className="py-2 px-3 font-medium text-center">Jadwal Selesai</th>
                        <th className="py-2 px-3 font-medium text-center">Total Jadwal</th>
                        <th className="py-2 px-3 font-medium text-right">Persentase</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {data.details.keterlaksanaan.map((k: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="py-2 px-3 font-bold">Kelas {k.kelas}</td>
                          <td className="py-2 px-3 text-center text-emerald-600 dark:text-emerald-400 font-medium">{k.done}</td>
                          <td className="py-2 px-3 text-center">{k.total}</td>
                          <td className="py-2 px-3 text-right font-bold">{k.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-slate-500">Tidak ada data keterlaksanaan.</div>
                )
              )}

              {activeModal === 'kebersihan' && (
                data?.details?.kebersihan?.length > 0 ? (
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="py-2 px-3 font-medium">Kelas</th>
                        <th className="py-2 px-3 font-medium text-right">Skor Kebersihan (Jurnal)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {data.details.kebersihan.sort((a: any, b: any) => b.skor - a.skor).map((k: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                          <td className="py-2 px-3 font-bold">Kelas {k.kelas}</td>
                          <td className="py-2 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400">{k.skor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-slate-500">Belum ada data kebersihan kelas hari ini.</div>
                )
              )}
            </div>
          </div>
        </div>
      )}
      
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
