import React, { useState, useEffect, useRef } from 'react';
import TabunganSampahAdmin from './TabunganSampahAdmin';
import { 
  LayoutDashboard, 
  Users, 
  Moon, 
  Sun, 
  LogOut, 
  Database, 
  Keyboard, 
  Calendar, 
  UserCog, 
  GraduationCap, 
  Settings,
  User,
  X,
  Upload,
  Save,
  Plus,
  Trash2,
  Edit,
  Megaphone,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Table,
  UserPlus,
  Download,
  Key,
  ArrowRightLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function AdminDashboard({ user, onLogout, darkMode, toggleDarkMode }: AdminDashboardProps) {
  const [activeView, setActiveView] = useState('dashboard'); // 'monitoring', 'dashboard', 'input_guru', 'profile'
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [stats, setStats] = useState<{
    studentCounts: Record<string, number>;
    totalStudents: number;
    totalJP: number;
  } | null>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const menuItems = [
    { id: 'monitoring', icon: Table, label: 'KBM Hari Ini' },
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'input_guru', icon: UserPlus, label: 'Input Guru Baru' },
    { id: 'tabungan_sampah', icon: Trash2, label: 'Tabungan Sampah' },
  ];

  const adminCards = [
    { 
      id: 'import_master', 
      title: 'Import Master', 
      subtitle: 'DATABASE CSV', 
      icon: Database, 
      color: 'bg-red-500', 
      shadow: 'shadow-red-200 dark:shadow-red-900/20' 
    },
    { 
      id: 'input_manual', 
      title: 'Input Manual', 
      subtitle: 'INPUT MASSAL CSV', 
      icon: Keyboard, 
      color: 'bg-purple-500', 
      shadow: 'shadow-purple-200 dark:shadow-purple-900/20' 
    },
    { 
      id: 'jadwal', 
      title: 'Jadwal Pelajaran', 
      subtitle: 'SETUP JADWAL', 
      icon: Calendar, 
      color: 'bg-fuchsia-500', 
      shadow: 'shadow-fuchsia-200 dark:shadow-fuchsia-900/20' 
    },
    { 
      id: 'manajemen_user', 
      title: 'Manajemen User', 
      subtitle: 'AKUN GURU', 
      icon: UserCog, 
      color: 'bg-emerald-500', 
      shadow: 'shadow-emerald-200 dark:shadow-emerald-900/20' 
    },
    { 
      id: 'data_murid', 
      title: 'Data Murid', 
      subtitle: 'SISWA & MUTASI', 
      icon: GraduationCap, 
      color: 'bg-sky-500', 
      shadow: 'shadow-sky-200 dark:shadow-sky-900/20' 
    },
    { 
      id: 'pengumuman', 
      title: 'Pengumuman', 
      subtitle: 'INFO PUBLIK', 
      icon: Megaphone, 
      color: 'bg-orange-500', 
      shadow: 'shadow-orange-200 dark:shadow-orange-900/20' 
    },
    { 
      id: 'pengaturan', 
      title: 'Pengaturan', 
      subtitle: 'KONFIGURASI UMUM', 
      icon: Settings, 
      color: 'bg-slate-600', 
      shadow: 'shadow-slate-200 dark:shadow-slate-900/20' 
    },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'monitoring':
        return <MonitoringKBMView />;
      case 'dashboard':
        return (
          <div className="max-w-7xl mx-auto">
            <header className="mb-8 flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Admin Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400">Selamat datang kembali, Administrator</p>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </header>

            {/* Statistics Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Siswa</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{stats?.totalStudents || 0}</h3>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {['1', '2', '3', '4', '5', '6'].map(cls => (
                    <div key={cls} className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg text-center">
                      <span className="block text-slate-400 font-bold mb-1">Kls {cls}</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {stats?.studentCounts?.[`Kelas ${cls}`] || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-fuchsia-100 text-fuchsia-600 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Jam Pelajaran (JP)</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{stats?.totalJP || 0} JP</h3>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Total akumulasi JP dari seluruh jadwal yang telah diinput ke sistem.
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl shadow-lg shadow-blue-200 dark:shadow-none text-white relative overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-1 drop-shadow-md">Informasi Terkini</h3>
                  <p className="text-blue-100 text-sm mb-4 font-medium">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <div className="flex items-center gap-2 text-xs font-bold bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm shadow-inner border border-white/10">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.8)]"></div>
                    Sistem Online
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 transform rotate-12 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-50 rounded-full"></div>
                    <Database className="w-32 h-32 text-white/20 drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {adminCards.map((card, index) => (
                <motion.button
                  key={card.id}
                  onClick={() => setActiveModal(card.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center group h-full"
                >
                  <div className={`${card.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg ${card.shadow} group-hover:scale-110 transition-transform duration-300`}>
                    <card.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{card.title}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.subtitle}</p>
                </motion.button>
              ))}
            </div>
          </div>
        );
      case 'input_guru':
        return <InputGuruBaruView showToast={showToast} />;
      case 'tabungan_sampah':
        return <TabunganSampahAdmin showToast={showToast} />;
      case 'profile':
        return <ProfileView showToast={showToast} />;
      default:
        return null;
    }
  };

  const renderModalContent = () => {
    switch (activeModal) {
      case 'import_master':
        return <ImportMasterModal onClose={() => setActiveModal(null)} showToast={showToast} />;
      case 'input_manual':
        return <InputManualModal onClose={() => setActiveModal(null)} showToast={showToast} />;
      case 'jadwal':
        return <JadwalModal onClose={() => setActiveModal(null)} showToast={showToast} />;
      case 'manajemen_user':
        return <UserManagementModal onClose={() => setActiveModal(null)} showToast={showToast} />;
      case 'data_murid':
        return <DataMuridModal onClose={() => setActiveModal(null)} showToast={showToast} />;
      case 'pengumuman':
        return <PengumumanModal onClose={() => setActiveModal(null)} showToast={showToast} />;
      case 'pengaturan':
        return <PengaturanModal onClose={() => setActiveModal(null)} showToast={showToast} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors font-sans overflow-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-[60] px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 ${
              toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-20 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col items-center py-6 z-20 shadow-sm">
        <div className="mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none">
            <LayoutDashboard className="w-6 h-6" />
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-4 w-full px-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`p-3 rounded-xl flex justify-center transition-all group relative ${
                activeView === item.id 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                  : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <item.icon className="w-6 h-6" />
              <span className="absolute left-16 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="flex flex-col gap-4 w-full px-2 mt-auto">
          <button
            onClick={toggleDarkMode}
            className="p-3 rounded-xl flex justify-center text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
          >
            {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
          <button 
            onClick={() => setActiveView('profile')}
            className={`p-3 rounded-xl flex justify-center transition-all ${
              activeView === 'profile'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <User className="w-6 h-6" />
          </button>
          <button
            onClick={onLogout}
            className="p-3 rounded-xl flex justify-center text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        {renderContent()}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {renderModalContent()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Views ---

function MonitoringKBMView() {
  const [time, setTime] = useState(new Date());
  const [matrixData, setMatrixData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchMatrix = async () => {
      try {
        const res = await fetch('/api/monitoring/matrix');
        const data = await res.json();
        if (data.success) {
          setMatrixData(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch matrix data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatrix();
    // Refresh every minute to keep it somewhat live
    const interval = setInterval(fetchMatrix, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">
            Kegiatan Belajar Mengajar Guru Hari Ini
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-mono font-bold text-xl text-slate-700 dark:text-slate-300 tracking-widest">
            {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':')}
          </span>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-500">Memuat data jadwal...</p>
          </div>
        ) : matrixData.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500">Tidak ada jadwal untuk hari ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 uppercase font-bold text-xs border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-5 w-16 text-center">No</th>
                  <th className="px-6 py-5 min-w-[200px]">Nama Guru</th>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <th key={i} className="px-4 py-5 text-center min-w-[100px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-slate-400">Jam Ke</span>
                        <span className="text-lg font-black text-slate-800 dark:text-white">{i}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {matrixData.map((teacher, index) => (
                  <tr key={teacher.nip || index} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                    <td className="px-6 py-4 text-center font-medium text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {teacher.nama_guru}
                    </td>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(jam => {
                      const schedule = teacher.schedule[jam];
                      return (
                        <td key={jam} className="px-2 py-3 text-center align-middle">
                          {schedule ? (
                            <div className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 group-hover:bg-white dark:group-hover:bg-slate-800 group-hover:shadow-sm transition-all">
                              <span className="font-black text-blue-600 dark:text-blue-400 text-sm">
                                {schedule.kelas}
                              </span>
                              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-tight line-clamp-1 max-w-[100px]" title={schedule.mapel}>
                                {schedule.mapel}
                              </span>
                            </div>
                          ) : (
                            <div className="w-full h-full min-h-[40px] flex items-center justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 group-hover:bg-slate-300 dark:group-hover:bg-slate-600 transition-colors"></span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function InputGuruBaruView({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [extraName, setExtraName] = useState("");
  const [loading, setLoading] = useState(false);

  const subjectsList = [
    "Pendidikan Agama dan Budi Pekerti",
    "Pendidikan Pancasila",
    "Bahasa Indonesia",
    "Matematika",
    "IPAS",
    "Bahasa Inggris",
    "Seni dan Budaya",
    "BTQ",
    "Bahasa Jawa",
    "PJOK"
  ];

  const handleSubjectChange = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const handleExtraChange = () => {
    setSelectedSubjects(prev => 
      prev.includes("Ekstrakurikuler")
        ? prev.filter(s => s !== "Ekstrakurikuler")
        : [...prev, "Ekstrakurikuler"]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    
    const data = {
      nip: formData.get('nip'),
      nama: formData.get('nama'),
      waliKelas: formData.get('waliKelas'),
      mapel: selectedSubjects,
      isExtra: selectedSubjects.includes("Ekstrakurikuler"),
      extraName: extraName
    };

    try {
      const res = await fetch('/api/guru', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.success) {
        showToast("Data Guru Baru berhasil disimpan!", "success");
        // Reset form
        (e.target as HTMLFormElement).reset();
        setSelectedSubjects([]);
        setExtraName("");
      } else {
        showToast(result.message || "Gagal menyimpan data", "error");
      }
    } catch (error) {
      showToast("Terjadi kesalahan jaringan", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Input Guru Baru</h1>
        <p className="text-slate-500 dark:text-slate-400">Tambahkan data pengajar baru ke dalam sistem</p>
      </header>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-2 relative group cursor-pointer overflow-hidden">
               <User className="w-10 h-10 text-slate-400" />
               <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <Upload className="w-6 h-6 text-white" />
               </div>
            </div>
            <span className="text-sm text-slate-500">Upload Foto (Max 500KB)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">NIP (User ID)</label>
              <input type="text" name="nip" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 bg-slate-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: 1985xxxx" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Nama Lengkap</label>
              <input type="text" name="nama" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 bg-slate-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nama Lengkap dengan Gelar" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Mata Pelajaran Diampu</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border border-slate-300 dark:border-slate-600 rounded-xl p-4 bg-slate-50 dark:bg-slate-700/50">
              {subjectsList.map((subject) => (
                <label key={subject} className="flex items-center space-x-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 p-2 rounded-lg transition-colors">
                  <input 
                    type="checkbox" 
                    checked={selectedSubjects.includes(subject)}
                    onChange={() => handleSubjectChange(subject)}
                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300" 
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{subject}</span>
                </label>
              ))}
              <label className="flex items-center space-x-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 p-2 rounded-lg transition-colors">
                <input 
                  type="checkbox" 
                  checked={selectedSubjects.includes("Ekstrakurikuler")}
                  onChange={handleExtraChange}
                  className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300" 
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Ekstrakurikuler</span>
              </label>
            </div>
            
            {selectedSubjects.includes("Ekstrakurikuler") && (
              <div className="mt-4 pl-4 border-l-4 border-blue-500">
                <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 mb-1 uppercase">Nama Ekstrakurikuler</label>
                <input 
                  type="text" 
                  value={extraName}
                  onChange={(e) => setExtraName(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  placeholder="Contoh: Pramuka, Tari, Futsal" 
                  required
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Wali Kelas</label>
            <select name="waliKelas" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 bg-slate-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">-- Bukan Wali Kelas --</option>
              <option value="Kelas 1">Kelas 1</option>
              <option value="Kelas 2">Kelas 2</option>
              <option value="Kelas 3">Kelas 3</option>
              <option value="Kelas 4">Kelas 4</option>
              <option value="Kelas 5">Kelas 5</option>
              <option value="Kelas 6">Kelas 6</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all flex items-center gap-2 disabled:opacity-50">
              <Save className="w-5 h-5" /> {loading ? 'Menyimpan...' : 'Simpan Data Guru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProfileView({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Password berhasil diubah!");
  };

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Profil Admin</h1>
        <p className="text-slate-500 dark:text-slate-400">Kelola akun administrator</p>
      </header>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-slate-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Administrator</h2>
            <p className="text-slate-500">admin@sdnbaujeng1.sch.id</p>
            <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-bold">Super Admin</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <Key className="w-5 h-5 text-slate-400" /> Ubah Password
        </h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Password Lama</label>
            <input type="password" required className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 bg-slate-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Password Baru</label>
            <input type="password" required className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 bg-slate-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Konfirmasi Password Baru</label>
            <input type="password" required className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 bg-slate-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="pt-4 flex justify-end">
            <button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-bold transition-all">
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Modals ---

function ModalHeader({ title, onClose }: { title: string, onClose: () => void }) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h2>
      <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
        <X className="w-5 h-5 text-slate-500" />
      </button>
    </div>
  );
}

function ImportMasterModal({ onClose, showToast }: { onClose: () => void, showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = (type: string) => {
    let content = "";
    let filename = "";

    switch (type) {
      case 'Guru':
        content = "NIP;Nama Lengkap;Mata Pelajaran (Pisahkan dengan koma jika > 1);Wali Kelas (Opsional);Password\n198xxxx;Guru A;Matematika,IPA;Kelas 5;baujeng@1\n199xxxx;Guru B;Bahasa Indonesia;;baujeng@1";
        filename = "template_guru.csv";
        break;
      case 'Tendik':
        content = "NIP;Nama Lengkap;Jabatan;Password\n198xxxx;Tendik A;Tata Usaha;baujeng@1\n199xxxx;Tendik B;Perpustakaan;baujeng@1";
        filename = "template_tendik.csv";
        break;
      case 'Siswa':
        content = "NISN;NIS;Nama Lengkap;Kelas;Jenis Kelamin (L/P);Tanggal Lahir (YYYY-MM-DD);Password (Default: baujeng(kelas))\n1234567890;1001;Siswa A;Kelas 1;L;2017-05-20;baujeng1\n0987654321;1002;Siswa B;Kelas 1;P;2017-08-15;baujeng1";
        filename = "template_siswa.csv";
        break;
    }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Template ${type} berhasil didownload`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      showToast("Pilih file terlebih dahulu", "error");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        let type = '';
        if (text.includes('Mata Pelajaran')) type = 'Guru';
        else if (text.includes('Jabatan')) type = 'Tendik';
        else if (text.includes('NISN')) type = 'Siswa';
        
        if (type) {
          try {
            const res = await fetch('/api/import-master', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type, data: text })
            });
            const result = await res.json();
            if (result.success) {
              showToast(result.message, "success");
              onClose();
            } else {
              showToast(result.message, "error");
            }
          } catch (err) {
            showToast("Terjadi kesalahan saat mengimport data", "error");
          }
        } else {
          showToast("Format file tidak sesuai dengan template", "error");
        }
      }
    };
    reader.readAsText(selectedFile);
  };

  return (
    <>
      <ModalHeader title="Import Master Database" onClose={onClose} />
      <div className="p-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {['Guru', 'Tendik', 'Siswa'].map((type) => (
            <div key={type} className="border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <h4 className="font-bold text-slate-800 dark:text-white mb-2">Data {type}</h4>
              <button 
                onClick={() => downloadTemplate(type)}
                className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1 rounded-full font-bold flex items-center justify-center gap-1 mx-auto hover:bg-blue-200 transition-colors"
              >
                <Download className="w-3 h-3" /> Download Template
              </button>
            </div>
          ))}
        </div>
        
        <input 
          type="file" 
          accept=".csv,.xlsx" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
        />
        
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-12 text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          {selectedFile ? (
            <p className="text-green-600 dark:text-green-400 font-bold">{selectedFile.name}</p>
          ) : (
            <>
              <p className="text-slate-600 dark:text-slate-300 font-medium">Klik atau drag file CSV ke sini</p>
              <p className="text-sm text-slate-400 mt-2">Format yang didukung: .csv, .xlsx</p>
            </>
          )}
        </div>
        
        <div className="mt-6 flex justify-end">
          <button onClick={handleUpload} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
            Upload Database
          </button>
        </div>
      </div>
    </>
  );
}

function InputManualModal({ onClose, showToast }: { onClose: () => void, showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadUniversalTemplate = () => {
    const content = "Tanggal;NIP;Nama Guru;Mata Pelajaran;Kelas;Jam Ke;Kegiatan;Keterangan\n2024-10-14;198xxxx;Guru A;Matematika;Kelas 5;1;Membahas Bab 1;Siswa antusias\n2024-10-14;199xxxx;Guru B;Bahasa Indonesia;Kelas 3;2;Membaca Puisi;";
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', "template_jurnal_universal.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Template Universal berhasil didownload");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      showToast("Pilih file terlebih dahulu", "error");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        if (text.includes('Tanggal') && text.includes('NIP')) {
          try {
            const res = await fetch('/api/import-jurnal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data: text })
            });
            const result = await res.json();
            if (result.success) {
              showToast(result.message, "success");
              onClose();
            } else {
              showToast(result.message, "error");
            }
          } catch (err) {
            showToast("Terjadi kesalahan saat mengimport data", "error");
          }
        } else {
          showToast("Format file tidak sesuai dengan template universal", "error");
        }
      }
    };
    reader.readAsText(selectedFile);
  };

  return (
    <>
      <ModalHeader title="Input Massal Data (CSV)" onClose={onClose} />
      <div className="p-6 overflow-y-auto">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800/30 mb-6">
          <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
            <Download className="w-5 h-5" /> Panduan Format Universal
          </h3>
          <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-400 space-y-1 ml-1">
            <li>Satu baris = Satu kejadian.</li>
            <li>Sistem otomatis menggabungkan baris dengan Jurnal yang sama.</li>
            <li>Format Tanggal: YYYY-MM-DD. Pemisah CSV: Titik Koma (;).</li>
          </ul>
          <button 
            onClick={downloadUniversalTemplate}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Download Template Universal
          </button>
        </div>

        <input 
          type="file" 
          accept=".csv,.xlsx" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
        />

        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-12 text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          {selectedFile ? (
            <p className="text-green-600 dark:text-green-400 font-bold">{selectedFile.name}</p>
          ) : (
            <>
              <p className="text-slate-600 dark:text-slate-300 font-medium">Klik untuk Upload CSV</p>
              <p className="text-sm text-slate-400 mt-2">Mendukung format .csv universal</p>
            </>
          )}
        </div>
        
        <div className="mt-6 flex justify-end">
           <button onClick={handleUpload} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2">
             <Database className="w-4 h-4" /> Migrasi Data Jurnal
           </button>
        </div>
      </div>
    </>
  );
}

function JadwalModal({ onClose, showToast }: { onClose: () => void, showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedClass, setSelectedClass] = useState("Kelas 1");
  const [selectedDay, setSelectedDay] = useState("Senin");
  const [selectedGuru, setSelectedGuru] = useState("Semua Guru");
  const [scheduleData, setScheduleData] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<any[]>([]);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await fetch('/api/guru');
        const data = await res.json();
        if (data.success) setTeachers(data.data);
      } catch (error) {
        console.error("Error fetching teachers", error);
      }
    };
    fetchTeachers();
  }, []);
  
  // Form State
  const [formHari, setFormHari] = useState("Senin");
  const [formKelas, setFormKelas] = useState("Kelas 1");
  const [formGuru, setFormGuru] = useState("");
  const [formJam, setFormJam] = useState<number[]>([]);
  const [formMapel, setFormMapel] = useState("");
  const [formExtra, setFormExtra] = useState("");

  const subjectsList = [
    "Pendidikan Agama dan Budi Pekerti",
    "Pendidikan Pancasila",
    "Bahasa Indonesia",
    "Matematika",
    "IPAS",
    "Bahasa Inggris",
    "Seni dan Budaya",
    "BTQ",
    "Bahasa Jawa",
    "PJOK"
  ];

  const fetchSchedule = async () => {
    try {
      const res = await fetch(`/api/jadwal?kelas=${selectedClass}&hari=${selectedDay}`);
      const data = await res.json();
      if (data.success) {
        setScheduleData(data.data);
      }
    } catch (error) {
      console.error("Error fetching schedule", error);
    }
  };

  useEffect(() => {
    if (selectedClass !== "(-)") {
      fetchSchedule();
    }
  }, [selectedClass, selectedDay]);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus jadwal ini?")) return;
    try {
      const res = await fetch(`/api/jadwal/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        showToast("Jadwal dihapus");
        fetchSchedule();
      } else {
        showToast(result.message, "error");
      }
    } catch (error) {
      showToast("Gagal menghapus jadwal", "error");
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormHari(item.hari);
    setFormKelas(item.kelas);
    setFormGuru(item.guru);
    setFormJam([item.jam]);
    
    if (subjectsList.includes(item.mapel)) {
      setFormMapel(item.mapel);
      setFormExtra("");
    } else {
      setFormMapel("Ekstrakurikuler");
      setFormExtra(item.mapel);
    }
    
    setIsAdding(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formJam.length === 0) {
      showToast("Pilih jam pelajaran terlebih dahulu", "error");
      return;
    }
    
    const finalMapel = formMapel === "Ekstrakurikuler" ? formExtra : formMapel;

    try {
      if (editingId) {
        const payload = {
          hari: formHari,
          kelas: formKelas,
          guru: formGuru,
          jam: formJam[0],
          mapel: finalMapel,
          peran: 'Guru Mapel'
        };

        const res = await fetch(`/api/jadwal/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        const result = await res.json();
        if (result.success) {
          showToast("Jadwal diupdate", "success");
          setIsAdding(false);
          setEditingId(null);
          fetchSchedule();
        } else {
          showToast(result.message, "error");
        }
      } else {
        // Create multiple entries
        const promises = formJam.map(jam => {
          const payload = {
            hari: formHari,
            kelas: formKelas,
            guru: formGuru,
            jam: jam,
            mapel: finalMapel,
            peran: 'Guru Mapel'
          };
          
          return fetch('/api/jadwal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }).then(res => res.json());
        });

        const results = await Promise.all(promises);
        const failures = results.filter(r => !r.success);
        
        if (failures.length === 0) {
          showToast(`Berhasil menyimpan ${formJam.length} jadwal`, "success");
          setIsAdding(false);
          setEditingId(null);
          fetchSchedule();
        } else {
          showToast(`Gagal menyimpan ${failures.length} jadwal`, "error");
        }
      }
    } catch (error) {
      showToast("Gagal menyimpan jadwal", "error");
    }
  };

  return (
    <>
      <ModalHeader title="Jadwal Pelajaran" onClose={onClose} />
      <div className="p-6 overflow-y-auto">
        {!isAdding ? (
          <>
            <div className="flex flex-wrap gap-4 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nama Guru</label>
                <select 
                  value={selectedGuru}
                  onChange={(e) => setSelectedGuru(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-fuchsia-500 outline-none"
                >
                  <option value="Semua Guru">Semua Guru</option>
                  {teachers.map((t) => (
                    <option key={t.nip} value={t.nama_guru}>{t.nama_guru}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Kelas</label>
                <select 
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-fuchsia-500 outline-none"
                >
                  <option value="(-)">(-)</option>
                  <option value="Kelas 1">Kelas 1</option>
                  <option value="Kelas 2">Kelas 2</option>
                  <option value="Kelas 3">Kelas 3</option>
                  <option value="Kelas 4">Kelas 4</option>
                  <option value="Kelas 5">Kelas 5</option>
                  <option value="Kelas 6">Kelas 6</option>
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Hari</label>
                <select 
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-fuchsia-500 outline-none"
                >
                  <option value="Senin">Senin</option>
                  <option value="Selasa">Selasa</option>
                  <option value="Rabu">Rabu</option>
                  <option value="Kamis">Kamis</option>
                  <option value="Jumat">Jumat</option>
                  <option value="Sabtu">Sabtu</option>
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={() => { setEditingId(null); setIsAdding(true); }} className="bg-fuchsia-500 hover:bg-fuchsia-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-bold shadow-lg shadow-fuchsia-200 dark:shadow-none transition-all">
                  <Plus className="w-4 h-4" /> Setup Jadwal
                </button>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 uppercase font-bold text-xs">
                  <tr>
                    <th className="px-6 py-4">Jam Ke</th>
                    <th className="px-6 py-4">Mata Pelajaran</th>
                    <th className="px-6 py-4">Guru</th>
                    <th className="px-6 py-4">Peran</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(jam => {
                    const item = scheduleData.find(s => s.jam === jam);
                    return (
                      <tr key={jam} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-400">#{jam}</td>
                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                          {item ? item.mapel : '-'}
                        </td>
                        <td className="px-6 py-4">{item ? item.guru : '-'}</td>
                        <td className="px-6 py-4">
                          {item && <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs px-2 py-1 rounded-full font-bold">{item.peran}</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {item && (
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleEdit(item)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                              <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
             <div className="bg-fuchsia-50 dark:bg-fuchsia-900/10 p-6 rounded-xl border border-fuchsia-100 dark:border-fuchsia-800/30">
               <h3 className="font-bold text-fuchsia-800 dark:text-fuchsia-300 mb-4 flex items-center gap-2">
                 <Calendar className="w-5 h-5" /> Konfigurasi Jadwal
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Hari</label>
                    <select 
                      value={formHari}
                      onChange={(e) => setFormHari(e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-fuchsia-500 outline-none"
                    >
                      <option>Senin</option>
                      <option>Selasa</option>
                      <option>Rabu</option>
                      <option>Kamis</option>
                      <option>Jumat</option>
                      <option>Sabtu</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Kelas</label>
                    <select 
                      value={formKelas}
                      onChange={(e) => setFormKelas(e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-fuchsia-500 outline-none"
                    >
                      <option value="(-)">(-)</option>
                      <option value="Kelas 1">Kelas 1</option>
                      <option value="Kelas 2">Kelas 2</option>
                      <option value="Kelas 3">Kelas 3</option>
                      <option value="Kelas 4">Kelas 4</option>
                      <option value="Kelas 5">Kelas 5</option>
                      <option value="Kelas 6">Kelas 6</option>
                    </select>
                  </div>
               </div>
             </div>

             <div>
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Nama Guru</label>
                <select 
                  value={formGuru}
                  onChange={(e) => setFormGuru(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-fuchsia-500 outline-none"
                >
                  <option value="">-- Pilih Guru --</option>
                  {teachers.map((t) => (
                    <option key={t.nip} value={t.nama_guru}>{t.nama_guru}</option>
                  ))}
                </select>
             </div>
             
             <div>
               <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Pilih Jam Pelajaran</label>
               <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                 {[1, 2, 3, 4, 5, 6, 7, 8].map(j => (
                   <button 
                     key={j} 
                     type="button" 
                     onClick={() => {
                       setFormJam(prev => {
                         if (prev.includes(j)) return prev.filter(h => h !== j);
                         return [...prev, j];
                       });
                     }}
                     className={`border p-3 rounded-xl transition-all font-bold ${
                       formJam.includes(j)
                         ? 'bg-fuchsia-500 text-white border-fuchsia-600' 
                         : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20'
                     }`}
                   >
                     Jam {j}
                   </button>
                 ))}
               </div>
             </div>

             <div>
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Mata Pelajaran</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border border-slate-300 dark:border-slate-600 rounded-xl p-4 bg-slate-50 dark:bg-slate-700/50">
                  {subjectsList.map((subject) => (
                    <label key={subject} className="flex items-center space-x-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 p-2 rounded-lg transition-colors">
                      <input 
                        type="radio" 
                        name="mapel"
                        value={subject}
                        checked={formMapel === subject}
                        onChange={(e) => setFormMapel(e.target.value)}
                        className="w-5 h-5 text-fuchsia-600 focus:ring-fuchsia-500 border-slate-300" 
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{subject}</span>
                    </label>
                  ))}
                  <label className="flex items-center space-x-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 p-2 rounded-lg transition-colors">
                    <input 
                      type="radio" 
                      name="mapel"
                      value="Ekstrakurikuler"
                      checked={formMapel === "Ekstrakurikuler"}
                      onChange={(e) => setFormMapel(e.target.value)}
                      className="w-5 h-5 text-fuchsia-600 focus:ring-fuchsia-500 border-slate-300" 
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Ekstrakurikuler</span>
                  </label>
                </div>
                
                {formMapel === "Ekstrakurikuler" && (
                  <div className="mt-4 pl-4 border-l-4 border-fuchsia-500">
                    <label className="block text-xs font-bold text-fuchsia-600 dark:text-fuchsia-400 mb-1 uppercase">Nama Ekstrakurikuler</label>
                    <input 
                      type="text" 
                      value={formExtra}
                      onChange={(e) => setFormExtra(e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-fuchsia-500 outline-none" 
                      placeholder="Contoh: Pramuka, Tari, Futsal" 
                      required
                    />
                  </div>
                )}
             </div>

             <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-700">
               <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium transition-colors">Batal</button>
               <button type="submit" className="bg-fuchsia-500 hover:bg-fuchsia-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-fuchsia-200 dark:shadow-none transition-all flex items-center gap-2">
                 <Save className="w-4 h-4" /> Simpan Jadwal
               </button>
             </div>
          </form>
        )}
      </div>
    </>
  );
}

function UserManagementModal({ onClose, showToast }: { onClose: () => void, showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [role, setRole] = useState('Guru');
  const [password, setPassword] = useState('baujeng@1');
  const [nip, setNip] = useState('');
  const [nama, setNama] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [waliKelas, setWaliKelas] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch (error) {
      console.error("Error fetching users", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (type: string, id: string) => {
    if (!confirm("Hapus user ini?")) return;
    try {
      const res = await fetch(`/api/users/${type}/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        showToast("User dihapus");
        fetchUsers();
      } else {
        showToast(result.message, "error");
      }
    } catch (error) {
      showToast("Gagal menghapus user", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nip, nama, role, password, jabatan, wali_kelas: waliKelas })
      });
      const result = await res.json();
      if (result.success) {
        showToast("User berhasil ditambahkan");
        setIsAdding(false);
        setNip(''); setNama(''); setRole('Guru'); setPassword('baujeng@1'); setJabatan(''); setWaliKelas('');
        fetchUsers();
      } else {
        showToast("Gagal menambahkan user: " + result.message, 'error');
      }
    } catch (error) {
      showToast("Terjadi kesalahan jaringan", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ModalHeader title="Manajemen User" onClose={onClose} />
      <div className="p-6 overflow-y-auto">
        {!isAdding ? (
          <>
            <div className="flex justify-between mb-4">
              <input type="text" placeholder="Cari user..." className="border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-700 dark:text-white" />
              <button onClick={() => setIsAdding(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <Plus className="w-4 h-4" /> Tambah User
              </button>
            </div>
            <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 uppercase font-bold">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Nama</th>
                  <th className="px-4 py-3">NIP/Username</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Password</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{user.nama}</td>
                    <td className="px-4 py-3">{user.nip || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'Guru' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">••••••</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDeleteUser(user.type, user.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">Belum ada data user</td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800/30 mb-4">
              <h3 className="font-bold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                <Key className="w-4 h-4" /> Akun Login
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">NIP (User ID)</label>
                  <input 
                    type="text" 
                    className="w-full border rounded px-3 py-2 text-sm" 
                    placeholder="199xxx" 
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Password</label>
                  <input 
                    type="text" 
                    className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Default: baujeng@1</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nama Lengkap</label>
              <input 
                type="text" 
                className="w-full border rounded-lg px-4 py-2 dark:bg-slate-700 dark:border-slate-600" 
                placeholder="Nama Lengkap..." 
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select 
                className="w-full border rounded-lg px-4 py-2 dark:bg-slate-700 dark:border-slate-600"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Guru">User (Guru)</option>
                <option value="Tendik">Tendik</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            {role === 'Tendik' && (
              <div>
                <label className="block text-sm font-medium mb-1">Jabatan</label>
                <input 
                  type="text" 
                  className="w-full border rounded-lg px-4 py-2 dark:bg-slate-700 dark:border-slate-600" 
                  placeholder="Contoh: Tata Usaha, Pustakawan" 
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                />
              </div>
            )}

            {role === 'Guru' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">Wali Kelas</label>
                  <select 
                    className="w-full border rounded-lg px-4 py-2 dark:bg-slate-700 dark:border-slate-600"
                    value={waliKelas}
                    onChange={(e) => setWaliKelas(e.target.value)}
                  >
                    <option value="">-- Bukan Wali Kelas --</option>
                    <option value="Kelas 1">Kelas 1</option>
                    <option value="Kelas 2">Kelas 2</option>
                    <option value="Kelas 3">Kelas 3</option>
                    <option value="Kelas 4">Kelas 4</option>
                    <option value="Kelas 5">Kelas 5</option>
                    <option value="Kelas 6">Kelas 6</option>
                    <option value="Ekstrakurikuler">Ekstrakurikuler</option>
                  </select>
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-4">
               <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">Batal</button>
               <button type="submit" disabled={loading} className="bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50">
                 <Plus className="w-4 h-4" /> {loading ? 'Menyimpan...' : 'Tambah User'}
               </button>
             </div>
          </form>
        )}
      </div>
    </>
  );
}

function DataMuridModal({ onClose, showToast }: { onClose: () => void, showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [tab, setTab] = useState('data'); // 'data', 'mutasi'
  const [viewState, setViewState] = useState<'list' | 'add' | 'edit' | 'mutasi_masuk' | 'mutasi_keluar'>('list');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [muridList, setMuridList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMurid = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/murid');
      const data = await res.json();
      if (data.success) {
        setMuridList(data.data);
      } else {
        showToast(data.message || 'Gagal mengambil data murid', 'error');
      }
    } catch (error) {
      showToast('Terjadi kesalahan jaringan', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMurid();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      NISN: formData.get('nisn'),
      NamaLengkap: formData.get('nama'),
      Kelas: formData.get('kelas'),
      Password: formData.get('password'),
      TanggalLahir: formData.get('tanggalLahir'),
      JenisKelamin: formData.get('jenisKelamin'),
      NIS: formData.get('nis')
    };

    try {
      let res;
      if (viewState === 'add') {
        res = await fetch('/api/murid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } else if (viewState === 'edit') {
        res = await fetch(`/api/murid/${selectedStudent.NISN}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }

      if (res) {
        const result = await res.json();
        if (result.success) {
          showToast(result.message, 'success');
          setViewState('list');
          fetchMurid();
        } else {
          showToast(result.message || 'Gagal menyimpan data', 'error');
        }
      }
    } catch (error) {
      showToast('Terjadi kesalahan jaringan', 'error');
    }
  };

  const handleDelete = async (nisn: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data murid ini?')) return;
    
    try {
      const res = await fetch(`/api/murid/${nisn}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        showToast(result.message, 'success');
        fetchMurid();
      } else {
        showToast(result.message || 'Gagal menghapus data', 'error');
      }
    } catch (error) {
      showToast('Terjadi kesalahan jaringan', 'error');
    }
  };

  const filteredMurid = muridList.filter(m => 
    (m['Nama Lengkap'] || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (m.NISN || '').includes(searchQuery) ||
    (m.Kelas || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderDataSiswa = () => {
    if (viewState === 'list') {
      return (
        <div className="space-y-4">
           <div className="flex gap-4">
              <input 
                type="text" 
                placeholder="Cari siswa (Nama, NISN, Kelas)..." 
                className="flex-1 border rounded-lg px-4 py-2 dark:bg-slate-700 dark:border-slate-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button onClick={() => { setSelectedStudent(null); setViewState('add'); }} className="bg-sky-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <Plus className="w-4 h-4" /> Tambah
              </button>
           </div>
           
           {loading ? (
             <div className="text-center py-8 text-slate-500">Memuat data...</div>
           ) : filteredMurid.length === 0 ? (
             <div className="text-center py-8 text-slate-500">Tidak ada data murid ditemukan.</div>
           ) : (
             <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
               {filteredMurid.map((m, i) => (
                 <div key={i} className="border rounded-xl p-4 flex justify-between items-center dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center">
                       <User className="w-5 h-5 text-slate-500 dark:text-slate-300" />
                     </div>
                     <div>
                       <h4 className="font-bold text-slate-800 dark:text-white">{m['Nama Lengkap']} ({m.Kelas})</h4>
                       <p className="text-xs text-slate-500">NISN: {m.NISN} | NIS: {m.NIS || '-'}</p>
                     </div>
                   </div>
                   <div className="flex gap-2">
                     <button 
                       onClick={() => { setSelectedStudent(m); setViewState('edit'); }} 
                       className="text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg transition-colors"
                       title="Edit"
                     >
                       <Edit className="w-4 h-4" />
                     </button>
                     <button 
                       onClick={() => handleDelete(m.NISN)} 
                       className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                       title="Hapus"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      );
    }

    return (
      <form onSubmit={handleSave} className="space-y-4">
        <div className="flex items-center gap-2 mb-4 text-slate-500 cursor-pointer hover:text-slate-800" onClick={() => setViewState('list')}>
          <ArrowRightLeft className="w-4 h-4 rotate-180" /> Kembali
        </div>
        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">{viewState === 'add' ? 'Tambah Siswa Baru' : 'Edit Data Siswa'}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nama Lengkap</label>
            <input type="text" name="nama" defaultValue={selectedStudent?.['Nama Lengkap']} className="w-full border rounded-lg px-4 py-2 dark:bg-slate-700 dark:border-slate-600" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">NISN</label>
            <input type="text" name="nisn" defaultValue={selectedStudent?.NISN} readOnly={viewState === 'edit'} className={`w-full border rounded-lg px-4 py-2 dark:bg-slate-700 dark:border-slate-600 ${viewState === 'edit' ? 'bg-slate-100 dark:bg-slate-800' : ''}`} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">NIS</label>
            <input type="text" name="nis" defaultValue={selectedStudent?.NIS} className="w-full border rounded-lg px-4 py-2 dark:bg-slate-700 dark:border-slate-600" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Kelas</label>
            <select name="kelas" defaultValue={selectedStudent?.Kelas || 'Kelas 1'} className="w-full border rounded-lg px-4 py-2 dark:bg-slate-700 dark:border-slate-600">
              <option value="Kelas 1">Kelas 1</option>
              <option value="Kelas 2">Kelas 2</option>
              <option value="Kelas 3">Kelas 3</option>
              <option value="Kelas 4">Kelas 4</option>
              <option value="Kelas 5">Kelas 5</option>
              <option value="Kelas 6">Kelas 6</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Jenis Kelamin</label>
            <select name="jenisKelamin" defaultValue={selectedStudent?.['Jenis Kelamin (L/P)'] || 'L'} className="w-full border rounded-lg px-4 py-2 dark:bg-slate-700 dark:border-slate-600">
              <option value="L">Laki-laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tanggal Lahir</label>
            <input type="date" name="tanggalLahir" defaultValue={selectedStudent?.['Tanggal Lahir (YYYY-MM-DD)']} className="w-full border rounded-lg px-4 py-2 dark:bg-slate-700 dark:border-slate-600" />
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-100 dark:border-yellow-800/30">
          <h4 className="font-bold text-yellow-800 dark:text-yellow-300 mb-2 flex items-center gap-2">
            <Key className="w-4 h-4" /> Akun Siswa
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Username</label>
              <input type="text" value={selectedStudent?.NIS || 'Auto-generated from NIS'} className="w-full border rounded px-3 py-2 text-sm bg-slate-100 dark:bg-slate-600 text-slate-500" readOnly />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Password</label>
              <input type="text" name="password" defaultValue={selectedStudent?.['Password (Default: baujeng(kelas))']} placeholder={viewState === 'edit' ? 'Kosongkan jika tidak ingin mengubah' : 'Masukkan password baru'} className="w-full border rounded px-3 py-2 text-sm dark:bg-slate-700 dark:border-slate-600" />
              <p className="text-[10px] text-slate-500 mt-1">Default: baujeng(kelas) (contoh: baujeng1)</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" className="bg-sky-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
            <Save className="w-4 h-4" /> Simpan Data
          </button>
        </div>
      </form>
    );
  };

  const renderMutasi = () => {
    if (viewState === 'list') {
      return (
        <div className="space-y-4">
          <div className="flex gap-2 mb-4">
            <button onClick={() => setViewState('mutasi_masuk')} className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> Input Mutasi Masuk
            </button>
            <button onClick={() => setViewState('mutasi_keluar')} className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
              <LogOut className="w-4 h-4" /> Input Mutasi Keluar
            </button>
          </div>
          
          <div className="text-center text-slate-500 py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <ArrowRightLeft className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>Belum ada data mutasi tercatat</p>
          </div>
        </div>
      );
    }

    const isMasuk = viewState === 'mutasi_masuk';
    
    return (
      <form onSubmit={handleSave} className="space-y-4">
        <div className="flex items-center gap-2 mb-4 text-slate-500 cursor-pointer hover:text-slate-800" onClick={() => setViewState('list')}>
          <ArrowRightLeft className="w-4 h-4 rotate-180" /> Kembali
        </div>
        <h3 className={`font-bold text-lg mb-4 ${isMasuk ? 'text-green-600' : 'text-red-600'}`}>
          {isMasuk ? 'Formulir Mutasi Masuk' : 'Formulir Mutasi Keluar'}
        </h3>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nama Siswa</label>
            <input type="text" className="w-full border rounded-lg px-4 py-2 dark:bg-slate-700 dark:border-slate-600" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">NISN</label>
              <input type="text" className="w-full border rounded-lg px-4 py-2 dark:bg-slate-700 dark:border-slate-600" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tanggal Mutasi</label>
              <input type="date" className="w-full border rounded-lg px-4 py-2 dark:bg-slate-700 dark:border-slate-600" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{isMasuk ? 'Sekolah Asal' : 'Sekolah Tujuan'}</label>
            <input type="text" className="w-full border rounded-lg px-4 py-2 dark:bg-slate-700 dark:border-slate-600" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Alasan Mutasi</label>
            <textarea className="w-full border rounded-lg px-4 py-2 dark:bg-slate-700 dark:border-slate-600 h-24 resize-none" required></textarea>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" className={`${isMasuk ? 'bg-green-600' : 'bg-red-600'} text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2`}>
            <Save className="w-4 h-4" /> Simpan Data Mutasi
          </button>
        </div>
      </form>
    );
  };

  return (
    <>
      <ModalHeader title="Data Murid" onClose={onClose} />
      <div className="p-6 overflow-y-auto">
        <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
          <button 
            onClick={() => { setTab('data'); setViewState('list'); }}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${tab === 'data' ? 'border-sky-500 text-sky-600 dark:text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Data Siswa
          </button>
          <button 
            onClick={() => { setTab('mutasi'); setViewState('list'); }}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${tab === 'mutasi' ? 'border-sky-500 text-sky-600 dark:text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Mutasi Siswa
          </button>
        </div>

        {tab === 'data' ? renderDataSiswa() : renderMutasi()}
      </div>
    </>
  );
}

function PengumumanModal({ onClose, showToast }: { onClose: () => void, showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [appName, setAppName] = useState("BISMA");
  const [landingDesc, setLandingDesc] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementDate, setAnnouncementDate] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/pengumuman');
      const result = await res.json();
      if (result.success && result.data) {
        setAnnouncements(result.data);
        // If we have data, populate form with the latest one (first one)
        if (result.data.length > 0) {
          const latest = result.data[0];
          setAnnouncementTitle(latest.judul || "");
          setAnnouncementDate(latest.tanggal || "");
          setAnnouncementContent(latest.isi || "");
        }
      }
    } catch (e) {
      console.error("Failed to fetch announcements", e);
    }
  };

  useEffect(() => {
    fetchAnnouncements();

    const stored = localStorage.getItem('public_dashboard_data');
    if (stored) {
      const data = JSON.parse(stored);
      setAppName(data.appName || "BISMA");
      setLandingDesc(data.landingDesc || "");
    }
  }, []);

  const handleNewAnnouncement = () => {
    setAnnouncementTitle("");
    setAnnouncementDate(new Date().toISOString().split('T')[0]);
    setAnnouncementContent("");
    showToast("Form dikosongkan untuk pengumuman baru", "success");
  };

  const handleSave = async () => {
    // Save App Settings locally
    const stored = localStorage.getItem('public_dashboard_data');
    let data = stored ? JSON.parse(stored) : { kelas1: 0, kelas2: 0, kelas3: 0, kelas4: 0, kelas5: 0, kelas6: 0 };
    
    data.appName = appName;
    data.landingDesc = landingDesc;

    localStorage.setItem('public_dashboard_data', JSON.stringify(data));
    // window.dispatchEvent(new Event('public-data-update')); // Move this to after API call

    // Save Announcement to Server
    try {
      const res = await fetch('/api/pengumuman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judul: announcementTitle,
          tanggal: announcementDate,
          isi: announcementContent
        })
      });
      
      const result = await res.json();
      if (result.success) {
        showToast("Pengumuman berhasil dipublikasikan!", "success");
        window.dispatchEvent(new Event('public-data-update')); // Dispatch here
        fetchAnnouncements(); // Refresh list
      } else {
        showToast("Gagal mempublikasikan pengumuman: " + result.message, "error");
      }
    } catch (error) {
      showToast("Terjadi kesalahan jaringan", "error");
    }
  };

  return (
    <>
      <ModalHeader title="Landing Page & Pengumuman" onClose={onClose} />
      <div className="p-8 overflow-y-auto bg-white dark:bg-slate-900">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Nama Aplikasi</label>
              <input 
                type="text" 
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="BISMA"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Deskripsi Landing Page</label>
              <textarea 
                value={landingDesc}
                onChange={(e) => setLandingDesc(e.target.value)}
                className="w-full h-24 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-700 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                placeholder="Deskripsi singkat aplikasi..."
              ></textarea>
            </div>
          </div>

          {/* Announcement Widget Section */}
          <div className="bg-purple-50/50 dark:bg-purple-900/10 p-6 rounded-2xl border border-purple-100 dark:border-purple-800/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase">Widget Pengumuman</h3>
              </div>
              <button 
                onClick={handleNewAnnouncement}
                className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Tambah Baru
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <input 
                  type="text" 
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-700 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none shadow-sm"
                  placeholder="Judul"
                />
              </div>
              <div>
                <input 
                  type="date" 
                  value={announcementDate}
                  onChange={(e) => setAnnouncementDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-700 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none shadow-sm"
                />
              </div>
            </div>

            <div>
              <textarea 
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                className="w-full h-24 bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-700 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none shadow-sm"
                placeholder="Isi pengumuman..."
              ></textarea>
            </div>
          </div>

          <div className="pt-4">
            <button onClick={handleSave} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-xl font-bold text-sm uppercase transition-colors">
              Simpan & Publikasikan
            </button>
          </div>

          {/* List of Previous Announcements */}
          {announcements.length > 0 && (
            <div className="mt-8">
              <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-4">Riwayat Pengumuman</h4>
              <div className="space-y-3">
                {announcements.map((ann, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <div>
                      <h5 className="font-bold text-slate-700 dark:text-white">{ann.judul}</h5>
                      <p className="text-xs text-slate-500">{new Date(ann.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="text-xs text-slate-400 max-w-[200px] truncate hidden md:block">
                      {ann.isi}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

function PengaturanModal({ onClose, showToast }: { onClose: () => void, showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [schoolName, setSchoolName] = useState("UPT Satuan Pendidikan SDN Baujeng 1");
  const [headmasterName, setHeadmasterName] = useState("Drs. H. Ahmad");
  const [headmasterNIP, setHeadmasterNIP] = useState("196001011980031001");
  const [logo1x1, setLogo1x1] = useState("");
  const [logo3x4, setLogo3x4] = useState("");
  const [logo4x3, setLogo4x3] = useState("");
  const [logoKop, setLogoKop] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/pengaturan');
        const result = await res.json();
        if (result.success && result.data) {
          const data = result.data;
          setSchoolName(data.schoolName || "UPT Satuan Pendidikan SDN Baujeng 1");
          setHeadmasterName(data.headmasterName || "Drs. H. Ahmad");
          setHeadmasterNIP(data.headmasterNIP || "196001011980031001");
          setLogo1x1(data.logo1x1 || "");
          setLogo3x4(data.logo3x4 || "");
          setLogo4x3(data.logo4x3 || "");
          setLogoKop(data.logoKop || "");
          
          // Also update localStorage for consistency
          localStorage.setItem('school_identity_data', JSON.stringify(data));
        } else {
          // Fallback to localStorage if API fails or returns empty
          const stored = localStorage.getItem('school_identity_data');
          if (stored) {
            const data = JSON.parse(stored);
            setSchoolName(data.schoolName || "UPT Satuan Pendidikan SDN Baujeng 1");
            setHeadmasterName(data.headmasterName || "Drs. H. Ahmad");
            setHeadmasterNIP(data.headmasterNIP || "196001011980031001");
            setLogo1x1(data.logo1x1 || "");
            setLogo3x4(data.logo3x4 || "");
            setLogo4x3(data.logo4x3 || "");
            setLogoKop(data.logoKop || "");
          }
        }
      } catch (error) {
        console.error("Failed to fetch settings", error);
        // Fallback to localStorage on error
        const stored = localStorage.getItem('school_identity_data');
        if (stored) {
          const data = JSON.parse(stored);
          setSchoolName(data.schoolName || "UPT Satuan Pendidikan SDN Baujeng 1");
          setHeadmasterName(data.headmasterName || "Drs. H. Ahmad");
          setHeadmasterNIP(data.headmasterNIP || "196001011980031001");
          setLogo1x1(data.logo1x1 || "");
          setLogo3x4(data.logo3x4 || "");
          setLogo4x3(data.logo4x3 || "");
          setLogoKop(data.logoKop || "");
        }
      }
    };
    
    fetchSettings();
  }, []);

  const handleSave = async () => {
    const data = {
      schoolName,
      headmasterName,
      headmasterNIP,
      logo1x1,
      logo3x4,
      logo4x3,
      logoKop
    };
    
    try {
      // Save to API
      const res = await fetch('/api/pengaturan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      const result = await res.json();
      if (result.success) {
        // Update localStorage and dispatch event
        localStorage.setItem('school_identity_data', JSON.stringify(data));
        window.dispatchEvent(new Event('school-identity-update'));
        showToast("Pengaturan sekolah berhasil disimpan!");
        onClose();
      } else {
        showToast("Gagal menyimpan pengaturan: " + result.message, "error");
      }
    } catch (error) {
      showToast("Terjadi kesalahan jaringan", "error");
    }
  };

  return (
    <>
      <ModalHeader title="Pengaturan Umum" onClose={onClose} />
      <div className="p-8 overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* School Identity Section */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded-lg">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Identitas Sekolah</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Sekolah Resmi</label>
                <input 
                  type="text" 
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-slate-500 outline-none"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Kepala Sekolah</label>
                  <input 
                    type="text" 
                    value={headmasterName}
                    onChange={(e) => setHeadmasterName(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-slate-500 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">NIP Kepala Sekolah</label>
                  <input 
                    type="text" 
                    value={headmasterNIP}
                    onChange={(e) => setHeadmasterNIP(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-slate-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Logo Assets Section */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase">Asset URL Logo (JOS JIS)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">1x1</label>
                <div className="flex gap-2">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-600">
                    {logo1x1 ? <img src={logo1x1} alt="1x1" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Upload className="w-4 h-4" /></div>}
                  </div>
                  <input 
                    type="text" 
                    value={logo1x1}
                    onChange={(e) => setLogo1x1(e.target.value)}
                    className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-slate-500 outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">3x4</label>
                <div className="flex gap-2">
                  <div className="w-9 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-600">
                    {logo3x4 ? <img src={logo3x4} alt="3x4" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Upload className="w-4 h-4" /></div>}
                  </div>
                  <input 
                    type="text" 
                    value={logo3x4}
                    onChange={(e) => setLogo3x4(e.target.value)}
                    className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-slate-500 outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">4x3</label>
                <div className="flex gap-2">
                  <div className="w-12 h-9 bg-slate-100 dark:bg-slate-700 rounded-lg flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-600">
                    {logo4x3 ? <img src={logo4x3} alt="4x3" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Upload className="w-4 h-4" /></div>}
                  </div>
                  <input 
                    type="text" 
                    value={logo4x3}
                    onChange={(e) => setLogo4x3(e.target.value)}
                    className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-slate-500 outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Kop Surat</label>
                <div className="flex gap-2">
                  <div className="w-20 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-600">
                    {logoKop ? <img src={logoKop} alt="Kop" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Upload className="w-4 h-4" /></div>}
                  </div>
                  <input 
                    type="text" 
                    value={logoKop}
                    onChange={(e) => setLogoKop(e.target.value)}
                    className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-slate-500 outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button onClick={handleSave} className="w-full bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-slate-200 dark:shadow-none transition-all flex items-center justify-center gap-2">
              <Save className="w-5 h-5" /> SIMPAN PENGATURAN
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
