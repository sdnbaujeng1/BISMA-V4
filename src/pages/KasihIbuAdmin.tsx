import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, CheckCircle, XCircle, Clock, Gift, X, BarChart3, Users, Trophy, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSchoolIdentity } from '../hooks/useSchoolIdentity';
import { supabase } from "../lib/supabase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const HABIT_POINTS: Record<string, { points: number, icon: string }> = {
  'Bangun Pagi': { points: 2, icon: '🌅' },
  'Beribadah': { points: 5, icon: '🕌' },
  'Berolahraga': { points: 2, icon: '🏃' },
  'Makan Sehat': { points: 2, icon: '🥗' },
  'Gemar Belajar': { points: 2, icon: '📚' },
  'Bermasyarakat': { points: 2, icon: '🤝' },
  'Tidur Cepat': { points: 2, icon: '😴' },
  'bangun_pagi': { points: 2, icon: '🌅' },
  'beribadah': { points: 5, icon: '🕌' },
  'berolahraga': { points: 2, icon: '🏃' },
  'makan_sehat': { points: 2, icon: '🥗' },
  'gemar_belajar': { points: 2, icon: '📚' },
  'bermasyarakat': { points: 2, icon: '🤝' },
  'tidur_cepat': { points: 2, icon: '😴' },
};

export default function KasihIbuAdmin() {
  const schoolIdentity = useSchoolIdentity();
  const [selectedClass, setSelectedClass] = useState('Kelas 1');
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [pointPrice, setPointPrice] = useState<any>(100);

  const [kasihIbuLabel, setKasihIbuLabel] = useState<string>("Kasih Ibu");

  const [exchangeData, setExchangeData] = useState({
    siswa: '',
    namaAtk: '',
    hargaAtk: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [validatingProgress, setValidatingProgress] = useState<{ current: number, total: number } | null>(null);
  const [activeTab, setActiveTab] = useState<"konfigurasi" | "validasi" | "analisis" | "peringkat">("konfigurasi");
  const [chartData, setChartData] = useState<any[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [selectedTopClass, setSelectedTopClass] = useState<string>("Semua Kelas");
  const [topStudents, setTopStudents] = useState<any[]>([]);
  const [lastClick, setLastClick] = useState<{name: string, time: number} | null>(null);

  const getStudentPoints = (studentName: string) => {
    if (!studentName) return 0;
    const studentNameLower = studentName.toLowerCase().trim();
    const studentReports = reports.filter(r => r.nama && r.nama.toLowerCase().trim() === studentNameLower);
    let total = 0;
    studentReports.forEach(r => {
      if (r.habit_label && r.habit_label.startsWith('Tukar Poin')) {
        // Deduct points even if 'Belum' validated to prevent double spending
        const match = r.habit_label.match(/\(-(\d+)\)/);
        if (match) {
          total -= parseInt(match[1]);
        }
      } else if (r.status === 'Valid') {
        const searchKey = r.habit_id || r.habit_label;
        let points = 0;
        if (searchKey) {
            const matchedKey = Object.keys(HABIT_POINTS).find(k => k.toLowerCase() === searchKey.toLowerCase());
            if (matchedKey) points = HABIT_POINTS[matchedKey].points;
        }
        total += points;
      }
    });
    return total;
  };

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("pengaturan")
        .select("key, value")
        .in("key", ["kasih_ibu_point_price", "kasih_ibu_label"]);

      if (data) {
        data.forEach((item) => {
          if (item.key === "kasih_ibu_point_price") setPointPrice(item.value);
          if (item.key === "kasih_ibu_label") setKasihIbuLabel(item.value);
        });
      }
    } catch (e) {
      console.error("Error fetching config", e);
    }
  };

const handleSaveConfig = async () => {
    setLoading(true);
    try {
      const updates = [
        { key: "kasih_ibu_point_price", value: pointPrice },
        { key: "kasih_ibu_label", value: kasihIbuLabel || "Kasih Ibu" },
      ];

      await supabase.from("pengaturan").upsert(updates, { onConflict: "key" });

      // Dispatch event to update identity across app
      window.dispatchEvent(new Event("school-identity-update"));

      showToast("Konfigurasi berhasil disimpan", "success");
    } catch (e) {
      console.error("Error saving config", e);
      showToast("Gagal menyimpan konfigurasi", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kasih-ibu?kelas=${selectedClass}`);
      const result = await res.json();
      if (result.success) {
        setReports(result.data);
      }
    } catch (e) {
      console.error("Failed to fetch reports", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/murid');
      const result = await res.json();
      if (result.success) {
        const filtered = result.data.filter((s: any) => {
          const sClass = String(s.Kelas).toLowerCase().replace(/\s/g, '');
          const fClass = selectedClass.toLowerCase().replace(/\s/g, '');
          return sClass.includes(fClass.replace('kelas', ''));
        });
        setStudents(filtered);
      }
    } catch (e) {
      console.error("Failed to fetch students", e);
    }
  };

  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchReports();
    fetchStudents();
    fetchConfig();
    fetchAnalysisData();
  }, [selectedClass]);

  const fetchAnalysisData = async () => {
    setAnalysisLoading(true);
    try {
      const { data: pengaturan } = await supabase.from('pengaturan').select('value').eq('key', 'tahunAjaran').maybeSingle();
      const ta = pengaturan?.value || "2024/2025";
      const parts = ta.split("/");
      const startYear = parseInt(parts[0]) || 2024;
      const endYear = parseInt(parts[1]) || 2025;
      const start = `${startYear}-07-01T00:00:00.000Z`;
      const end = `${endYear}-06-30T23:59:59.999Z`;
      const { data: pointsData } = await supabase.from("kasih_ibu").select("nisn, jenis_kebiasaan, kelas").gte('timestamp', start).lte('timestamp', end);
      const { data: users } = await supabase.from("murid").select('"NISN", "Nama Lengkap", "NIS"');
      const uMap: Record<string, any> = {};
      if (users) {
        users.forEach((u: any) => { 
          if (u.NISN) uMap[u.NISN] = { nama: u["Nama Lengkap"], nis: u.NIS || '-' }; 
        });
        setUsersMap(uMap as any);
      }
      if (pointsData) {
        setRawData(pointsData);
        const classPoints: Record<string, number> = {};
        pointsData.forEach((entry) => {
          const habitInfo = HABIT_POINTS[entry.jenis_kebiasaan];
          if (habitInfo && entry.kelas) {
            classPoints[entry.kelas] = (classPoints[entry.kelas] || 0) + habitInfo.points;
          }
        });
        const formattedChartData = Object.keys(classPoints).map((cls) => ({ name: cls, total: classPoints[cls] })).sort((a, b) => b.total - a.total);
        setChartData(formattedChartData);
        calculateTopStudents("Semua Kelas", pointsData, uMap);
      }
    } catch (e) {
      console.error("Error fetching analysis data", e);
    } finally {
      setAnalysisLoading(false);
    }
  };
  
  const handleBarClick = (data: any) => {
    const now = new Date().getTime();
    if (lastClick && lastClick.name === data.name && now - lastClick.time < 500) {
      setSelectedTopClass(data.name);
      calculateTopStudents(data.name, rawData, usersMap);
      setActiveTab("peringkat");
      setLastClick(null);
    } else {
      setLastClick({ name: data.name, time: now });
    }
  };
  
  const calculateTopStudents = (kelas: string, pointsData = rawData, uMap = usersMap) => {
    const studentPoints: Record<string, number> = {};
    pointsData.forEach((entry) => {
      if ((kelas === "Semua Kelas" || entry.kelas === kelas) && HABIT_POINTS[entry.jenis_kebiasaan]) {
        const nisn = entry.nisn;
        if (nisn) {
          studentPoints[nisn] = (studentPoints[nisn] || 0) + HABIT_POINTS[entry.jenis_kebiasaan].points;
        }
      }
    });
    const sortedStudents = Object.keys(studentPoints)
      .map((nisn) => {
        const userData = uMap[nisn] as any;
        return {
          nisn,
          name: userData ? userData.nama : `NISN: ${nisn}`,
          nis: userData ? userData.nis : '-',
          points: studentPoints[nisn],
        };
      })
      .sort((a, b) => b.points - a.points)
      .slice(0, 10);
    setTopStudents(sortedStudents);
  };

  useEffect(() => {
    calculateTopStudents(selectedTopClass);
  }, [selectedTopClass]);
  const handleValidate = async (id: number, status: 'Valid' | 'Ditolak') => {
    try {
      const res = await fetch('/api/kasih-ibu/validate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      const result = await res.json();
      if (result.success) {
        // Optimistic update
        setReports(reports.map(r => r.id === id ? { ...r, status: status } : r));
        showToast(`Laporan berhasil divalidasi: ${status}`, "success");
      } else {
        showToast("Gagal memvalidasi: " + result.message, "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan jaringan", "error");
    }
  };

  const handleBulkValidateClick = () => {
    const pendingReports = reports.filter(r => r.status === 'Belum');
    if (pendingReports.length === 0) {
      showToast("Tidak ada laporan yang perlu divalidasi.", "error");
      return;
    }
    setShowConfirmModal(true);
  };

  const executeBulkValidate = async () => {
    setShowConfirmModal(false);
    const pendingReports = reports.filter(r => r.status === 'Belum');
    
    setIsValidating(true);
    setValidatingProgress({ current: 0, total: pendingReports.length });
    
    try {
      let completed = 0;
      // Process sequentially to show progress bar smoothly and avoid hammering the server
      for (const report of pendingReports) {
        await fetch('/api/kasih-ibu/validate', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: report.id, status: 'Valid' })
        });
        completed++;
        setValidatingProgress({ current: completed, total: pendingReports.length });
        // Add a small delay for visual feedback of the progress bar
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      
      // Update state
      setReports(reports.map(r => r.status === 'Belum' ? { ...r, status: 'Valid' } : r));
      showToast(`${pendingReports.length} laporan berhasil divalidasi.`, "success");
    } catch (e) {
      console.error("Bulk validation error", e);
      showToast("Terjadi kesalahan saat validasi massal.", "error");
    } finally {
      setIsValidating(false);
      setValidatingProgress(null);
    }
  };

  // Sort reports: Belum first, then by date descending
  const sortedReports = [...reports].sort((a, b) => {
    if (a.status === 'Belum' && b.status !== 'Belum') return -1;
    if (a.status !== 'Belum' && b.status === 'Belum') return 1;
    return new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
  });

  const handleExchangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const selectedStudent = students.find(s => s['Nama Lengkap'] === exchangeData.siswa);
      if (!selectedStudent) {
        showToast("Pilih siswa terlebih dahulu", "error");
        setSubmitting(false);
        return;
      }

      const pointsToDeduct = Math.ceil(Number(exchangeData.hargaAtk) / pointPrice);

      const res = await fetch('/api/kasih-ibu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nis: selectedStudent.NISN || selectedStudent.NIS,
          nama: selectedStudent['Nama Lengkap'],
          kelas: selectedClass,
          habit_id: 'tukar_poin',
          habit_label: `Tukar Poin: ${exchangeData.namaAtk} (-${pointsToDeduct})`,
          tanggal: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0],
          waktu: new Date().toLocaleTimeString('id-ID', { hour12: false }),
          perasaan: 'Senang',
          keterangan: `Penukaran poin dengan ATK: ${exchangeData.namaAtk} seharga Rp ${exchangeData.hargaAtk}`,
          status: 'Valid' // Auto valid for exchange
        })
      });
      
      const result = await res.json();
      if (result.success) {
        showToast("Penukaran poin berhasil dicatat!", "success");
        setShowExchangeModal(false);
        setExchangeData({ siswa: '', namaAtk: '', hargaAtk: '' });
        fetchReports();
      } else {
        showToast("Gagal menyimpan: " + result.message, "error");
      }
    } catch (error) {
      showToast("Terjadi kesalahan jaringan", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors p-4 md:p-8 font-sans">
      <header className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Validasi {schoolIdentity.kasihIbuLabel || 'Kasih Ibu'}</h1>
            <p className="text-slate-500 dark:text-slate-400">Monitoring Pembiasaan Karakter Siswa</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowExchangeModal(true)}
            className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Gift className="w-5 h-5" /> Tukar Poin
          </button>
          <div className="bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm">
            <Heart className="w-5 h-5" /> Wali Kelas Mode Admin
          </div>
        </div>
      </header>
      
      <div className="flex gap-2 mb-8 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        <button onClick={() => setActiveTab("konfigurasi")} className={`px-4 py-2 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === "konfigurasi" ? "border-pink-600 text-pink-600 dark:text-pink-400" : "border-transparent text-slate-500 hover:text-slate-700"}`}>Konfigurasi</button>
        <button onClick={() => setActiveTab("validasi")} className={`px-4 py-2 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === "validasi" ? "border-pink-600 text-pink-600 dark:text-pink-400" : "border-transparent text-slate-500 hover:text-slate-700"}`}>Validasi</button>

        <button onClick={() => setActiveTab("analisis")} className={`px-4 py-2 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === "analisis" ? "border-pink-600 text-pink-600 dark:text-pink-400" : "border-transparent text-slate-500 hover:text-slate-700"}`}>Analisis Perolehan per Kelas</button>
        <button onClick={() => setActiveTab("peringkat")} className={`px-4 py-2 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === "peringkat" ? "border-pink-600 text-pink-600 dark:text-pink-400" : "border-transparent text-slate-500 hover:text-slate-700"}`}>Peringkat 10 Besar</button>
      </div>
      
      {activeTab === "analisis" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Analisa Perolehan Poin</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total poin yang dikumpulkan per kelas (Klik 2x pada batang grafik untuk melihat Top 10 Siswa)</p>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-[300px]">
            {analysisLoading ? (
              <div className="flex justify-center items-center h-full"><div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div></div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b" }} />
                  <Tooltip cursor={{ fill: "rgba(236, 72, 153, 0.1)" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                  <Bar dataKey="total" fill="#ec4899" radius={[6, 6, 0, 0]} onClick={handleBarClick}>
                    {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#ec4899" : "#db2777"} className="cursor-pointer" />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <BarChart3 className="w-12 h-12 mb-2 opacity-50" />
                <p>Belum ada data poin siswa</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "peringkat" && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Peringkat 10 Besar</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Siswa dengan poin terbanyak</p>
              </div>
            </div>
            <select
              value={selectedTopClass}
              onChange={(e) => setSelectedTopClass(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 outline-none min-w-[150px] text-slate-700 dark:text-white"
            >
              <option value="Semua Kelas">Semua Kelas</option>
              {chartData.map((d) => (<option key={d.name} value={d.name}>{d.name}</option>))}
            </select>
          </div>
          <div className="space-y-3">
            {topStudents.length > 0 ? (
              topStudents.map((student, index) => (
                <div key={student.nisn} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${index === 0 ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" : index === 1 ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300" : index === 2 ? "bg-amber-100/50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-500" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>{index + 1}</div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">{student.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">NIS: {student.nis} | NISN: {student.nisn}</p>
                    </div>
                  </div>
                  <div className="font-bold text-pink-600 dark:text-pink-400 text-lg">
                    {student.points} <span className="text-sm font-medium text-slate-500">Poin</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Belum ada data peringkat untuk {selectedTopClass}</p>
              </div>
            )}
          </div>
        </div>
      )}

      
      {activeTab === "konfigurasi" && (

      <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-xl">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                Konfigurasi Program
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Atur parameter dan label
              </p>
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nama Menu / Program
              </label>
              <input
                type="text"
                value={kasihIbuLabel}
                onChange={(e) => setKasihIbuLabel(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                placeholder="Contoh: Kasih Ibu"
              />
              <p className="text-xs text-slate-500 mt-2">
                Nama ini akan tampil di menu Siswa, Guru, dan Tendik.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Harga per Poin (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  Rp
                </span>
                <input
                  type="number"
                  value={pointPrice}
                  onChange={(e) => setPointPrice(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                  placeholder="Contoh: 100"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Nilai acuan saat siswa menukarkan poin dengan Alat Tulis Kantor
                (ATK).
              </p>
            </div>
            <button
              onClick={handleSaveConfig}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Simpan Konfigurasi
                </>
              )}
            </button>
          </div>
        </div>

      )}

      {activeTab === "validasi" && (
      <>

      <div className="mb-8 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="font-bold text-slate-700 dark:text-slate-300">Pilih Kelas:</span>
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-700 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none font-medium"
          >
            <option>Kelas 1</option>
            <option>Kelas 2</option>
            <option>Kelas 3</option>
            <option>Kelas 4</option>
            <option>Kelas 5</option>
            <option>Kelas 6</option>
          </select>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handleBulkValidateClick}
            disabled={isValidating || reports.filter(r => r.status === 'Belum').length === 0}
            className="bg-green-500 hover:bg-green-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
            Validasi Massal ({reports.filter(r => r.status === 'Belum').length})
          </button>
          {validatingProgress && (
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 mt-1 overflow-hidden">
              <div 
                className="bg-green-500 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${(validatingProgress.current / validatingProgress.total) * 100}%` }}
              ></div>
            </div>
            )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-slate-500">Memuat laporan siswa...</p>
        </div>
      ) : sortedReports.length > 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="border-b border-slate-200 dark:border-slate-700 p-4 text-center w-12 text-slate-600 dark:text-slate-300">No</th>
                  <th className="border-b border-slate-200 dark:border-slate-700 p-4 text-left text-slate-600 dark:text-slate-300">Nama Siswa</th>
                  <th className="border-b border-slate-200 dark:border-slate-700 p-4 text-left text-slate-600 dark:text-slate-300">Hari/Tanggal</th>
                  <th className="border-b border-slate-200 dark:border-slate-700 p-4 text-left text-slate-600 dark:text-slate-300">Aktivitas</th>
                  <th className="border-b border-slate-200 dark:border-slate-700 p-4 text-center text-slate-600 dark:text-slate-300">Perasaan</th>
                  <th className="border-b border-slate-200 dark:border-slate-700 p-4 text-left text-slate-600 dark:text-slate-300">Keterangan</th>
                  <th className="border-b border-slate-200 dark:border-slate-700 p-4 text-center text-slate-600 dark:text-slate-300">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {sortedReports.map((report, idx) => {
                    const dateObj = new Date(report.tanggal);
                    let hariTanggal = report.tanggal;
                    if (!isNaN(dateObj.getTime())) {
                      hariTanggal = dateObj.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    } else if (report.tanggal && report.tanggal.includes('T')) {
                      const fallbackDate = new Date(report.tanggal.split('T')[0]);
                      if (!isNaN(fallbackDate.getTime())) {
                        hariTanggal = fallbackDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                      }
                    }
                    
                    return (
                      <motion.tr 
                        key={report.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
                          report.status === 'Valid' ? 'bg-green-50/30 dark:bg-green-900/10' : 
                          report.status === 'Ditolak' ? 'bg-red-50/30 dark:bg-red-900/10' : ''
                        }`}
                      >
                        <td className="p-4 text-center text-slate-500 dark:text-slate-400">{idx + 1}</td>
                        <td className="p-4 font-bold text-slate-800 dark:text-white">{report.nama}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">{hariTanggal}</td>
                        <td className="p-4 font-medium text-pink-600 dark:text-pink-400">{report.habit_label || report.jenis_kebiasaan}</td>
                        <td className="p-4 text-center text-2xl">{report.perasaan || '😊'}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-300 italic">"{report.keterangan}"</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            {report.status === 'Valid' ? (
                              <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-lg text-xs">
                                <CheckCircle className="w-4 h-4" /> Valid
                              </span>
                            ) : report.status === 'Ditolak' ? (
                              <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-bold bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-lg text-xs">
                                <XCircle className="w-4 h-4" /> Ditolak
                              </span>
                            ) : (
                              <>
                                <button 
                                  onClick={() => handleValidate(report.id, 'Ditolak')}
                                  className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                  title="Tolak"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => handleValidate(report.id, 'Valid')}
                                  className="p-2 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                  title="Validasi"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                              </>
                              )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
          <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Belum Ada Laporan</h3>
          <p className="text-slate-500 dark:text-slate-400">Belum ada siswa yang melaporkan kegiatan pembiasaan.</p>
        </div>
      

      

        )}
      </>
      )}
      {/* Modal Tukar Poin */}
      <AnimatePresence>
        {showExchangeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Gift className="w-6 h-6 text-pink-500" /> Tukar Poin {schoolIdentity.kasihIbuLabel || 'Kasih Ibu'}
                </h3>
                <button onClick={() => setShowExchangeModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleExchangeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Nama Siswa</label>
                  <select 
                    required 
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                    value={exchangeData.siswa}
                    onChange={(e) => setExchangeData({...exchangeData, siswa: e.target.value})}
                  >
                    <option value="">-- Pilih Siswa --</option>
                    {students.map((s, idx) => (
                        <option key={idx} value={s['Nama Lengkap']}>{s['Nama Lengkap']}</option>
                    ))}
                  </select>
                  {exchangeData.siswa && (
                    <div className="mt-2 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-100 dark:border-pink-800 flex items-center justify-between">
                      <span className="text-sm text-pink-700 dark:text-pink-300 font-medium">Poin Tersedia:</span>
                      <span className="text-lg font-bold text-pink-600 dark:text-pink-400">
                        {getStudentPoints(exchangeData.siswa)} Poin <span className="text-sm font-normal text-pink-500">(Rp {getStudentPoints(exchangeData.siswa) * pointPrice})</span>
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Nama ATK</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Contoh: Buku Tulis, Pensil"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                    value={exchangeData.namaAtk}
                    onChange={(e) => setExchangeData({...exchangeData, namaAtk: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Harga ATK (Rp)</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="Contoh: 5000"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
                    value={exchangeData.hargaAtk}
                    onChange={(e) => setExchangeData({...exchangeData, hargaAtk: e.target.value})}
                  />
                  {exchangeData.hargaAtk && (
                    <p className="text-xs text-pink-600 dark:text-pink-400 mt-1 font-medium">
                      Poin yang akan dipotong: {Math.ceil(Number(exchangeData.hargaAtk) / pointPrice)} poin (1 poin = Rp {pointPrice})
                    </p>
                  )}
                </div>
                
                <button type="submit" disabled={submitting} className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-pink-200 dark:shadow-none transition-all mt-4 disabled:opacity-50">
                  {submitting ? 'Memproses...' : 'Tukar Poin'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-lg border flex items-center gap-3 z-50 ${
              toast.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/50 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300' 
                : 'bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <span className="font-medium">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
            >
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Validasi Massal</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Apakah Anda yakin ingin memvalidasi {reports.filter(r => r.status === 'Belum').length} laporan sekaligus?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={executeBulkValidate}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-green-200 dark:shadow-none"
                >
                  Ya, Validasi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
