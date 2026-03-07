import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Trash2, 
  Heart, 
  UserCheck, 
  AlertTriangle, 
  BookOpen, 
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StudentDashboardProps {
  user: any;
  onLogout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onNavigate: (page: string) => void;
}

export default function StudentDashboard({ user, onLogout, darkMode, toggleDarkMode, onNavigate }: StudentDashboardProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-blue-500' },
    { id: 'jadwal', icon: Calendar, label: 'Jadwal Hari Ini', color: 'text-purple-500' },
    { id: 'bank_sampah', icon: Trash2, label: 'Bank Sampah', color: 'text-green-500' },
    { id: 'kasih_ibu', icon: Heart, label: 'Kasih Ibu', color: 'text-pink-500' },
    { id: 'kehadiran', icon: UserCheck, label: 'Kehadiran', color: 'text-indigo-500' },
    { id: 'pelanggaran', icon: AlertTriangle, label: 'Pelanggaran', color: 'text-red-500' },
    { id: 'literasi', icon: BookOpen, label: 'Literasi', color: 'text-orange-500' },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardHome user={user} onNavigate={setActiveView} />;
      case 'jadwal':
        return <JadwalHariIni user={user} />;
      case 'bank_sampah':
        return <BankSampah user={user} />;
      case 'kasih_ibu':
        return <KasihIbu />;
      case 'kehadiran':
        return <Kehadiran />;
      case 'pelanggaran':
        return <Pelanggaran />;
      case 'literasi':
        return <Literasi />;
      default:
        return <DashboardHome user={user} onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors font-sans">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white dark:bg-slate-800 p-4 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_Tut_Wuri_Handayani.png/1200px-Logo_Tut_Wuri_Handayani.png" alt="Logo" className="w-8 h-8" />
          <span className="font-bold text-slate-800 dark:text-white">Siswa</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600 dark:text-slate-300">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-auto
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="h-full flex flex-col">
            <div className="p-6 flex items-center justify-between lg:justify-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="font-bold text-slate-800 dark:text-white leading-tight">Portal Siswa</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">SDN BAUJENG I</p>
                </div>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveView(item.id); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeView === item.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${activeView === item.id ? 'text-blue-600 dark:text-blue-400' : item.color}`} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
              <button
                onClick={toggleDarkMode}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-5xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

function DashboardHome({ user, onNavigate }: { user: any, onNavigate: (page: string) => void }) {
  return (
    <div className="space-y-6">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-lg shadow-blue-200 dark:shadow-none relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Halo, {user?.Nama_Murid || user?.name || 'Siswa'}! 👋</h1>
            <p className="text-blue-100 text-lg">Selamat datang di Portal Siswa SDN Baujeng I. Semangat belajar hari ini!</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 text-center md:text-right">
            <p className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-1">Hari Ini</p>
            <p className="font-bold text-white text-lg leading-none">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>
      </header>

      {/* Announcements */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Pengumuman Terbaru
        </h2>
        <div className="space-y-4">
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800/30">
            <h3 className="font-bold text-orange-800 dark:text-orange-300 mb-1">Libur Nasional</h3>
            <p className="text-sm text-orange-700 dark:text-orange-400">Sekolah diliburkan pada tanggal 17 Agustus 2024 dalam rangka HUT RI ke-79.</p>
            <span className="text-xs text-orange-600 dark:text-orange-500 mt-2 block">Diposting: 10 Agustus 2024</span>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
            <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-1">Jadwal Ujian Tengah Semester</h3>
            <p className="text-sm text-blue-700 dark:text-blue-400">UTS akan dilaksanakan mulai tanggal 20 September 2024. Harap persiapkan diri.</p>
            <span className="text-xs text-blue-600 dark:text-blue-500 mt-2 block">Diposting: 1 September 2024</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { id: 'jadwal', label: 'Jadwal', icon: Calendar, color: 'bg-purple-500' },
          { id: 'bank_sampah', label: 'Tabungan', icon: Trash2, color: 'bg-green-500' },
          { id: 'kehadiran', label: 'Absensi', icon: UserCheck, color: 'bg-indigo-500' },
          { id: 'kasih_ibu', label: 'Kasih Ibu', icon: Heart, color: 'bg-pink-500' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all flex flex-col items-center gap-3 group"
          >
            <div className={`${item.color} w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
              <item.icon className="w-6 h-6" />
            </div>
            <span className="font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function JadwalHariIni({ user }: { user: any }) {
  const [jadwal, setJadwal] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJadwal = async () => {
      try {
        const kelas = user?.Kelas || 'Kelas 1';
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const dayName = days[new Date().getDay()];
        
        const res = await fetch(`/api/jadwal?kelas=${kelas}&hari=${dayName}`);
        const data = await res.json();
        if (data.success) {
           setJadwal(data.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchJadwal();
  }, [user]);

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Jadwal Hari Ini</h2>
        <p className="text-slate-500 dark:text-slate-400">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </header>

      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-slate-500">Memuat jadwal...</p>
        ) : jadwal.length > 0 ? (
          jadwal.map((item, index) => (
            <div 
              key={index}
              className="flex items-center p-4 rounded-xl border bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700"
            >
              <div className="w-16 text-center mr-4">
                <span className="block text-xs font-bold text-slate-400 uppercase">Jam Ke</span>
                <span className="text-xl font-bold text-slate-800 dark:text-white">{item.jam}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 dark:text-white">
                  {item.mapel}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{item.waktu || '-'}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Pengajar</span>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.guru}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-slate-500">Tidak ada jadwal pelajaran hari ini.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BankSampah({ user }: { user: any }) {
  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Bank Sampah</h2>
        <p className="text-slate-500 dark:text-slate-400">Tabungan sampahmu untuk lingkungan yang lebih bersih</p>
      </header>

      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-8 text-white shadow-lg shadow-green-200 dark:shadow-none mb-8">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-green-100 mb-1">Total Saldo Tabungan</p>
            <h3 className="text-4xl font-bold">Rp 0</h3>
          </div>
          <div className="bg-white/20 p-3 rounded-xl">
            <Trash2 className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="mt-8 flex gap-4">
          <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
            <span className="block text-xs text-green-100">Total Berat</span>
            <span className="font-bold">0 kg</span>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
            <span className="block text-xs text-green-100">Transaksi</span>
            <span className="font-bold">0 Kali</span>
          </div>
        </div>
      </div>

      <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Riwayat Setoran</h3>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 uppercase font-bold text-xs">
            <tr>
              <th className="px-6 py-4">Tanggal</th>
              <th className="px-6 py-4">Jenis Sampah</th>
              <th className="px-6 py-4">Berat</th>
              <th className="px-6 py-4 text-right">Nilai</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {/* Empty state for now */}
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Belum ada riwayat transaksi</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KasihIbu() {
  const habits = [
    { id: 'bangun_pagi', label: 'Bangun Pagi', desc: 'Menanamkan disiplin' },
    { id: 'beribadah', label: 'Beribadah', desc: 'Memperkuat nilai spiritual' },
    { id: 'berolahraga', label: 'Berolahraga', desc: 'Menjaga kesehatan fisik dan mental' },
    { id: 'makan_sehat', label: 'Makan Sehat & Bergizi', desc: 'Mendukung pertumbuhan dan konsentrasi' },
    { id: 'gemar_belajar', label: 'Gemar Belajar', desc: 'Menumbuhkan rasa ingin tahu' },
    { id: 'bermasyarakat', label: 'Bermasyarakat', desc: 'Melatih empati dan gotong royong' },
    { id: 'tidur_cepat', label: 'Tidur Cepat', desc: 'Mengatur waktu istirahat yang cukup' },
  ];

  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const [formData, setFormData] = useState({ date: '', description: '', status: 'belum' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Data kebiasaan berhasil disimpan!');
    setSelectedHabit(null);
  };

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Program Kasih Ibu</h2>
        <p className="text-slate-500 dark:text-slate-400">Pembiasaan karakter baik sehari-hari</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {habits.map((habit) => (
          <button
            key={habit.id}
            onClick={() => setSelectedHabit(habit.id)}
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">{habit.label}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{habit.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {selectedHabit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                  {habits.find(h => h.id === selectedHabit)?.label}
                </h3>
                <button onClick={() => setSelectedHabit(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Tanggal</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 dark:bg-slate-700 dark:text-white"
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Deskripsi Kegiatan</label>
                  <textarea 
                    required 
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 dark:bg-slate-700 dark:text-white h-24 resize-none"
                    placeholder="Ceritakan pengalamanmu..."
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Status</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="status" 
                        value="sudah" 
                        className="w-4 h-4 text-pink-600"
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                      />
                      <span className="text-slate-700 dark:text-slate-300">Sudah Terbiasa</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="status" 
                        value="belum" 
                        className="w-4 h-4 text-pink-600"
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                      />
                      <span className="text-slate-700 dark:text-slate-300">Belum Terbiasa</span>
                    </label>
                  </div>
                </div>
                <button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-pink-200 dark:shadow-none transition-all mt-4">
                  Simpan Laporan
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Kehadiran() {
  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Rekap Kehadiran</h2>
        <p className="text-slate-500 dark:text-slate-400">Semester Ganjil 2024/2025</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-xl border border-green-200 dark:border-green-800/30 text-center">
          <h3 className="text-2xl font-bold text-green-700 dark:text-green-400">95%</h3>
          <p className="text-xs text-green-600 dark:text-green-500 uppercase font-bold mt-1">Hadir</p>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-xl border border-blue-200 dark:border-blue-800/30 text-center">
          <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-400">2</h3>
          <p className="text-xs text-blue-600 dark:text-blue-500 uppercase font-bold mt-1">Izin</p>
        </div>
        <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-xl border border-orange-200 dark:border-orange-800/30 text-center">
          <h3 className="text-2xl font-bold text-orange-700 dark:text-orange-400">1</h3>
          <p className="text-xs text-orange-600 dark:text-orange-500 uppercase font-bold mt-1">Sakit</p>
        </div>
        <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-xl border border-red-200 dark:border-red-800/30 text-center">
          <h3 className="text-2xl font-bold text-red-700 dark:text-red-400">0</h3>
          <p className="text-xs text-red-600 dark:text-red-500 uppercase font-bold mt-1">Alpha</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 uppercase font-bold text-xs">
            <tr>
              <th className="px-6 py-4">Tanggal</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {/* Empty state */}
            <tr>
              <td colSpan={3} className="px-6 py-8 text-center text-slate-500">Belum ada data kehadiran</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Pelanggaran() {
  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Catatan Kedisiplinan</h2>
        <p className="text-slate-500 dark:text-slate-400">Rekap pelanggaran tata tertib sekolah</p>
      </header>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Tidak Ada Pelanggaran</h3>
        <p className="text-slate-500 dark:text-slate-400">Hebat! Pertahankan sikap disiplinmu di sekolah.</p>
      </div>
    </div>
  );
}

function Literasi() {
  return (
    <div className="h-[calc(100vh-8rem)] bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <iframe 
        src="https://perpusbaujeng1.netlify.app" 
        className="w-full h-full border-0"
        title="Perpustakaan Digital"
      ></iframe>
    </div>
  );
}


