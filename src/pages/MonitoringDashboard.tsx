import React, { useState, useEffect } from 'react';
import { Monitor, Calendar, RefreshCw, AlertTriangle, Users, Percent, Sparkles, Clock, CheckCircle2, XCircle, LogOut, X, HeartHandshake, Star, MessageSquare, Briefcase } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isSpike = data.visitors >= 5000;
    
    return (
      <div className="bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl">
        <p className="font-bold text-slate-800 dark:text-white mb-2">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-teal-500"></div>
          <span className="text-sm text-slate-600 dark:text-slate-300">
            Total Kunjungan: <span className="font-bold text-slate-800 dark:text-white">{new Intl.NumberFormat('id-ID').format(data.visitors)}</span>
          </span>
        </div>
        {isSpike && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs text-teal-600 dark:text-teal-400 font-medium break-words max-w-[200px] leading-relaxed">
              Lonjakan Signifikan <br/> Estimasi setara puncak <span className="font-bold text-teal-700 dark:text-teal-300">{(data.visitors / 30).toFixed(0)} kunjungan/hari</span> (akumulasi 30 hari).
            </p>
          </div>
        )}
      </div>
    );
  }
  return null;
};

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
  const [kasihIbuStats, setKasihIbuStats] = useState<any[]>([]);
  const [showConclusion, setShowConclusion] = useState(false);
  const [visitorStats, setVisitorStats] = useState<{ month: string, visitors: number }[]>([]);

  // Telemetry config state
  const [pieData, setPieData] = useState([{ name: 'SD/MI', value: 45 }, { name: 'SMP/MTs', value: 25 }, { name: 'SMA/SMK/MA', value: 15 }, { name: 'Lainnya', value: 15 }]);
  const [wordCloud, setWordCloud] = useState([{ text: 'Inovatif', count: 120 }, { text: 'Aman', count: 90 }, { text: 'Keren', count: 85 }]);
  const [testimonials, setTestimonials] = useState<any[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('visitor_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.monthly_stats) {
          setVisitorStats(parsed.monthly_stats);
        } else {
          setVisitorStats([
            { month: 'Jun 24', visitors: 300 },
            { month: 'Jul 24', visitors: 400 },
            { month: 'Ags 24', visitors: 520 },
            { month: 'Sep 24', visitors: 650 },
            { month: 'Okt 24', visitors: 780 },
            { month: 'Nov 24', visitors: 850 },
            { month: 'Des 24', visitors: 860 },
            { month: 'Jan 25', visitors: 890 },
            { month: 'Feb 25', visitors: 920 },
            { month: 'Mar 25', visitors: 960 },
            { month: 'Apr 25', visitors: 990 },
            { month: 'Mei 25', visitors: 28000 },
            { month: 'Jun 25', visitors: 30000 },
          ]);
        }
      }
    } catch (e) {}

    const fetchHelpdeskData = async () => {
        try {
          let testmonialsFromConfig: any[] = [];
          const configRes = await fetch('/api/helpdesk-config');
          if (configRes.ok) {
            const configData = await configRes.json();
            if (configData.success && configData.data) {
              const parsed = configData.data;
              if (parsed.pie_data && parsed.pie_data.length > 0) setPieData(parsed.pie_data);
              if (parsed.word_cloud && parsed.word_cloud.length > 0) setWordCloud(parsed.word_cloud);
              if (parsed.testimonials) testmonialsFromConfig = parsed.testimonials;
            }
          }
          
          const testiRes = await fetch('/api/testimoni');
          if (testiRes.ok) {
            const testiData = await testiRes.json();
            if (testiData.success && Array.isArray(testiData.data)) {
              const tests = testiData.data;
              // Combine both sets - live submitted and configured mock ones
              setTestimonials([...tests, ...testmonialsFromConfig]);

              // If there's no custom pie data set by config, compute it
              const pieCounts: Record<string, number> = { 'SD/MI': 0, 'SMP/MTs': 0, 'SMA/SMK/MA': 0, 'Lainnya': 0 };
              let hasPieData = false;
              if (tests.length > 0) {
                // Compute Asal Pengunjung
                tests.forEach((t: any) => {
                  const l = (t.lembaga || '').toUpperCase();
                  if (l.includes('SD') || l.includes('MI')) pieCounts['SD/MI']++;
                  else if (l.includes('SMP') || l.includes('MTS')) pieCounts['SMP/MTs']++;
                  else if (l.includes('SMA') || l.includes('SMK') || l.includes('MA')) pieCounts['SMA/SMK/MA']++;
                  else pieCounts['Lainnya']++;
                });
                const computedPie = Object.keys(pieCounts).map(k => ({ name: k, value: pieCounts[k] })).filter(d => d.value > 0);
                // Only override if we didn't just load it from config overrides
                if (computedPie.length > 0 && (!testmonialsFromConfig || testmonialsFromConfig.length === 0)) {
                   setPieData(computedPie);
                   hasPieData = true;
                }

                // Only override Word Cloud if not set by config overlays
                if (!testmonialsFromConfig || testmonialsFromConfig.length === 0) {
                   const stopWords = ['dan', 'yang', 'di', 'ke', 'dari', 'pada', 'untuk', 'dengan', 'ini', 'itu', 'juga', 'adalah', 'sebagai', 'saya', 'kami', 'kita', 'dalam', 'sangat', 'bisa', 'akan', 'atau', 'lebih', 'sudah', 'secara', 'karena', 'saat'];
                   const wordCounts: Record<string, number> = {};
                   tests.forEach((t: any) => {
                     const words = (t.testimoni || '').toLowerCase().match(/\b[a-z]+\b/g) || [];
                     words.forEach((w: string) => {
                       if (w.length > 3 && !stopWords.includes(w)) {
                         wordCounts[w] = (wordCounts[w] || 0) + 1;
                       }
                     });
                   });
                   const computedWords = Object.keys(wordCounts)
                     .map(w => ({ text: w, count: wordCounts[w] }))
                     .sort((a, b) => b.count - a.count)
                     .slice(0, 20);
                   if (computedWords.length > 0) setWordCloud(computedWords);
                }
              }
            } else {
              setTestimonials(testmonialsFromConfig);
            }
          } else {
             setTestimonials(testmonialsFromConfig);
          }
        } catch (e) {
          console.error("Error fetching helpdesk data", e);
        }
      };
      
      fetchHelpdeskData();
  }, []);

  const renderCustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    const value = payload.A;
    let fill = "#ef4444"; // Merah (Belum terbiasa)
    if (value >= 8) fill = "#22c55e"; // Hijau (Terbiasa)
    else if (value >= 4) fill = "#eab308"; // Kuning (Mulai terbiasa)

    return (
      <circle cx={cx} cy={cy} r={6} fill={fill} stroke="#fff" strokeWidth={2} />
    );
  };

  const getConclusionText = () => {
    if (!kasihIbuStats || kasihIbuStats.length === 0) return "Belum ada data yang cukup untuk menarik kesimpulan.";
    
    const sorted = [...kasihIbuStats].sort((a, b) => b.A - a.A);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    
    return `Berdasarkan data input siswa, pembiasaan "${best.subject}" menunjukkan capaian tertinggi, menandakan mayoritas siswa sudah mulai terbiasa. Sebaliknya, pembiasaan "${worst.subject}" masih perlu ditingkatkan perhatiiannya karena memiliki capaian terendah.`;
  };

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

  const fetchKasihIbuStats = async () => {
    try {
      const res = await fetch(`/api/monitoring/kasih-ibu-stats?month=${analisaMonth}`);
      const json = await res.json();
      if (json.success) {
        setKasihIbuStats(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch kasih ibu stats", error);
    }
  };

  useEffect(() => {
    fetchKasihIbuStats();
  }, [analisaMonth]);

  const [selectedHabit, setSelectedHabit] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const handleSpiderClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      setSelectedHabit(data.activePayload[0].payload);
    }
  };

  const handleStudentClick = (student: any, type: 'absen' | 'disiplin') => {
    setSelectedStudent({ ...student, type });
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
    fetchKasihIbuStats();
    const interval = setInterval(fetchData, 3000); // Auto-refresh every 3 seconds
    const analisaInterval = setInterval(fetchAnalisa, 60000); // Refresh analisa every 60 seconds
    const kasihIbuInterval = setInterval(fetchKasihIbuStats, 60000);
    return () => {
      clearInterval(interval);
      clearInterval(analisaInterval);
      clearInterval(kasihIbuInterval);
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div 
          onClick={() => setActiveModal('ketidakhadiran')}
          className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2 md:gap-4 cursor-pointer hover:shadow-md hover:border-red-300 dark:hover:border-red-700 transition-all"
        >
          <div className="p-2 md:p-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl shrink-0"><Users className="w-5 h-5 md:w-6 md:h-6" /></div>
          <div className="min-w-0">
            <div className="text-[10px] md:text-xs font-bold text-slate-500 uppercase leading-tight truncate md:whitespace-normal">Ketidakhadiran</div>
            <div className="text-lg md:text-2xl font-bold text-red-600 dark:text-red-400 truncate">{data?.stats?.ketidakhadiran || 0}</div>
          </div>
        </div>
        <div 
          onClick={() => setActiveModal('keterlaksanaan')}
          className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2 md:gap-4 cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all"
        >
          <div className="p-2 md:p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl shrink-0"><Percent className="w-5 h-5 md:w-6 md:h-6" /></div>
          <div className="min-w-0">
            <div className="text-[10px] md:text-xs font-bold text-slate-500 uppercase leading-tight truncate md:whitespace-normal">Keterlaksanaan</div>
            <div className="text-lg md:text-2xl font-bold text-blue-600 dark:text-blue-400 truncate">{data?.stats?.keterlaksanaan || 0}%</div>
          </div>
        </div>
        <div 
          onClick={() => setActiveModal('kebersihan')}
          className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2 md:gap-4 cursor-pointer hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
        >
          <div className="p-2 md:p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-xl shrink-0"><Sparkles className="w-5 h-5 md:w-6 md:h-6" /></div>
          <div className="min-w-0">
            <div className="text-[10px] md:text-xs font-bold text-slate-500 uppercase leading-tight truncate md:whitespace-normal">Kelas Terbersih</div>
            <div className="text-lg md:text-2xl font-bold text-emerald-600 dark:text-emerald-400 truncate">{data?.stats?.kelasTerbersih || '-'}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2 md:gap-4">
          <div className="p-2 md:p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-500 rounded-xl shrink-0"><Clock className="w-5 h-5 md:w-6 md:h-6" /></div>
          <div className="min-w-0">
            <div className="text-[10px] md:text-xs font-bold text-slate-500 uppercase leading-tight truncate md:whitespace-normal">Total JP</div>
            <div className="text-lg md:text-2xl font-bold text-purple-600 dark:text-purple-400 truncate">{data?.stats?.totalJP || 0} JP</div>
          </div>
        </div>
      </div>

      {/* Visitor Statistics Chart */}
      <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-500" /> Statistik Pengunjung Dashboard Publik
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">Grafik Tren Pengunjung Halaman Publik (Juni 2024 - Juni 2025)</p>
          </div>
          <div className="text-xs bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 px-3 py-1.5 rounded-full font-medium border border-teal-100 dark:border-teal-800">
            Prediksi Lonjakan: Mei & Juni (±1000 Kunjungan Hari)
          </div>
        </div>
        
        <div className="h-64 md:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={visitorStats}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                dy={10} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                dx={-10}
                tickFormatter={(value) => value > 999 ? `${(value/1000).toFixed(1)}k` : value}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line 
                type="monotone" 
                dataKey="visitors" 
                name="Total Kunjungan"
                stroke="#14b8a6" 
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                activeDot={{ r: 6, strokeWidth: 0, fill: '#0f766e' }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
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

      {/* Testimonials & Demographics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">Asal Pengunjung</h2>
          </div>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#6366f1'][index % 4]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Word Cloud */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">Kata Kunci Testimoni</h2>
          </div>
          <div className="flex-1 flex flex-wrap items-center justify-center gap-3 py-4">
            {wordCloud.map((wc, i) => {
              const maxCount = Math.max(...wordCloud.map(w => w.count));
              const fontSize = Math.max(12, (wc.count / maxCount) * 36);
              const colors = ['text-teal-500', 'text-blue-500', 'text-indigo-500', 'text-purple-500', 'text-rose-500', 'text-orange-500'];
              return (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`font-black ${colors[i % colors.length]} dark:opacity-90 leading-none`}
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {wc.text}
                </motion.span>
              );
            })}
          </div>
        </div>

        {/* Testimonials */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-stretch lg:col-span-1 overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-lg">
              <Star className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">Testimoni</h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 md:max-h-[300px]">
            {testimonials.map((t, i) => (
              <div key={i} className="p-4 bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">{t.name}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{t.lembaga}</p>
                  </div>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, starIndex) => (
                      <Star key={starIndex} className={`w-3 h-3 ${starIndex < t.rating ? 'fill-current' : 'text-slate-300 dark:text-slate-600'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 italic mb-2">"{t.testimoni}"</p>
                <div className="inline-block px-2 py-1 bg-white dark:bg-slate-800 rounded text-[9px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  {t.fitur}
                </div>
              </div>
            ))}
            {testimonials.length === 0 && (
              <div className="text-center py-8 text-slate-400 italic text-sm">Belum ada testimoni.</div>
            )}
          </div>
        </div>
      </div>

      {/* Analisa Data Siswa */}
      <div className="mt-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
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
        
        {/* Kasih Ibu Spider Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-lg">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">Pembiasaan 7KAIH Satuan Pendidikan</h2>
          </div>
          <div className="w-full h-[300px] md:h-[400px]">
            {kasihIbuStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={kasihIbuStats} onClick={handleSpiderClick} className="cursor-pointer">
                  <PolarGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Radar name="Capaian" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} dot={renderCustomDot} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 italic text-sm">
                Belum ada data pembiasaan
              </div>
            )}
          </div>

          <AnimatePresence>
            {selectedHabit && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
                onClick={() => setSelectedHabit(null)}
              >
                <motion.div 
                  className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <HeartHandshake className="w-6 h-6 text-pink-500" />
                      {selectedHabit.subject}
                    </h3>
                    <button onClick={() => setSelectedHabit(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                      <X className="w-5 h-5 text-slate-500" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">Skor Capaian</span>
                      <span className="text-2xl font-black text-pink-600 dark:text-pink-400">{selectedHabit.A}/10</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {selectedHabit.A >= 8 ? `Luar biasa! Mayoritas siswa sudah terbiasa dengan ${selectedHabit.subject}. Terus pertahankan!` : 
                       selectedHabit.A >= 4 ? `Cukup baik. Siswa mulai terbiasa dengan ${selectedHabit.subject}, namun masih perlu dorongan lebih lanjut.` : 
                       `Perhatian khusus diperlukan. Capaian ${selectedHabit.subject} masih rendah dan butuh intervensi segera.`}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Belum Terbiasa (0-3)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Mulai Terbiasa (4-7)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Terbiasa (8-10)</span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setShowConclusion(!showConclusion)}
              className="px-6 py-2.5 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 font-bold rounded-xl hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors"
            >
              {showConclusion ? 'Sembunyikan Kesimpulan' : 'Lihat Kesimpulan'}
            </button>
            
            {showConclusion && (
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl text-sm text-slate-700 dark:text-slate-300 text-left animate-in fade-in slide-in-from-top-4 duration-300">
                <p className="font-medium leading-relaxed">
                  {getConclusionText()}
                </p>
              </div>
            )}
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
                    <tr key={idx} onClick={() => handleStudentClick(s, 'absen')} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer">
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
                    <tr key={idx} onClick={() => handleStudentClick(s, 'disiplin')} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer">
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

      <AnimatePresence>
        {selectedStudent && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setSelectedStudent(null)}
          >
            <motion.div 
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  {selectedStudent.type === 'absen' ? <Users className="w-6 h-6 text-red-500" /> : <AlertTriangle className="w-6 h-6 text-orange-500" />}
                  Detail Siswa
                </h3>
                <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
                  <p className="text-lg font-bold text-slate-800 dark:text-white mb-1">{selectedStudent.nama}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{selectedStudent.kelas}</p>
                </div>
                
                {selectedStudent.type === 'absen' ? (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Sakit</p>
                      <p className="text-xl font-black text-blue-700 dark:text-blue-300">{selectedStudent.s}</p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-xl border border-yellow-100 dark:border-yellow-800">
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium mb-1">Izin</p>
                      <p className="text-xl font-black text-yellow-700 dark:text-yellow-300">{selectedStudent.i}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-800">
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Alpa</p>
                      <p className="text-xl font-black text-red-700 dark:text-red-300">{selectedStudent.a}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
                      <span className="text-sm text-orange-700 dark:text-orange-300 font-medium">Total Pelanggaran</span>
                      <span className="text-xl font-black text-orange-600 dark:text-orange-400">{selectedStudent.violations}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                      <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Status Tindak Lanjut</span>
                      {selectedStudent.unhandled === 0 ? (
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Sudah Ditangani</span>
                      ) : (
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">{selectedStudent.unhandled} Belum</span>
                      )}
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-slate-500 dark:text-slate-400 italic text-center mt-4">
                  * Data ini memerlukan perhatian khusus dari Wali Kelas dan Guru BK.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
