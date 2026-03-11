import { useState, useEffect } from 'react';
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
  CheckCircle,
  XCircle,
  MessageSquare,
  User,
  Info,
  ClipboardList,
  BookHeart,
  Clock,
  Save,
  FileSpreadsheet,
  Gamepad,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import UnifiedAnnouncementCard from '../components/UnifiedAnnouncementCard';
import PointRewardCard from '../components/PointRewardCard';
import NilaiSiswa from './NilaiSiswa';

export default function StudentDashboard({ user, onLogout, darkMode, toggleDarkMode, onNavigate }: { user: any, onLogout: () => void, darkMode: boolean, toggleDarkMode: () => void, onNavigate: (page: string) => void }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAbout, setShowAbout] = useState(false);
  const [time, setTime] = useState(new Date());
  const [logoUrl, setLogoUrl] = useState("https://i.imghippo.com/files/xbYy2711Wk.png");

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/pengaturan');
        const result = await res.json();
        if (result.success && result.data && result.data.logo1x1) {
          setLogoUrl(result.data.logo1x1);
        } else {
          const stored = localStorage.getItem('school_identity_data');
          if (stored) {
            const data = JSON.parse(stored);
            if (data.logo1x1) setLogoUrl(data.logo1x1);
          }
        }
      } catch (e) {
        const stored = localStorage.getItem('school_identity_data');
        if (stored) {
          const data = JSON.parse(stored);
          if (data.logo1x1) setLogoUrl(data.logo1x1);
        }
      }
    };
    fetchSettings();

    window.addEventListener('school-identity-update', fetchSettings);
    return () => {
      clearInterval(timer);
      window.removeEventListener('school-identity-update', fetchSettings);
    };
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardHome user={user} onNavigate={setActiveTab} onExternalNavigate={onNavigate} />;
      case 'kbm':
        return <MenuKBM user={user} onNavigate={setActiveTab} onExternalNavigate={onNavigate} />;
      case 'profil':
        return <Profil user={user} onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />;
      case 'chatbot':
        return <ChatbotView />;
      case 'jadwal':
        return <JadwalHariIni user={user} onBack={() => setActiveTab('kbm')} />;
      case 'bank_sampah':
        return <BankSampah user={user} onBack={() => setActiveTab('kbm')} />;
      case 'kasih_ibu':
        return <KasihIbu onBack={() => setActiveTab('kbm')} />;
      case 'jurnal_kasih_ibu':
        return <JurnalKasihIbu user={user} onBack={() => setActiveTab('kbm')} />;
      case 'kehadiran':
        return <Kehadiran user={user} onBack={() => setActiveTab('kbm')} />;
      case 'pelanggaran':
        return <Pelanggaran onBack={() => setActiveTab('kbm')} />;
      case 'literasi':
        return <Literasi onBack={() => setActiveTab('kbm')} />;
      case 'tugas':
        return <Tugas user={user} onBack={() => setActiveTab('kbm')} />;
      case 'tahfidz':
        return <Tahfidz onBack={() => setActiveTab('kbm')} />;
      case 'nilai_siswa':
        return <NilaiSiswa user={user} onBack={() => setActiveTab('kbm')} />;
      default:
        return <DashboardHome user={user} onNavigate={setActiveTab} onExternalNavigate={onNavigate} />;
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors pb-24 font-sans">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 pt-8 pb-12 shadow-lg transition-all duration-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <img src={logoUrl} className="h-10 w-10" alt="Logo" />
            </div>
            <div>
              <p className="text-xs text-white/80 opacity-90">Halo, Siswa!</p>
              <h2 className="text-lg font-bold">{user?.Nama_Murid || user?.name || 'Siswa'}</h2>
              <p className="text-xs text-white/80">{user?.Kelas || 'Kelas ?'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={toggleDarkMode} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={onLogout} className="bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold">
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow px-4 -mt-8 z-10">
        <div className="max-w-7xl mx-auto space-y-6">
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 flex justify-between items-center border border-slate-100 dark:border-slate-700">
            <span className="font-bold text-slate-700 dark:text-slate-200">PORTAL SISWA</span>
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold text-lg">
                {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Navigation */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 sm:gap-4 z-50">
        <button 
          onClick={() => setActiveTab('chatbot')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'chatbot' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[9px] font-bold">Chatbot</span>
        </button>
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'dashboard' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[9px] font-bold">Dashboard</span>
        </button>
        <button 
          onClick={() => setActiveTab('kbm')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'kbm' || ['jadwal', 'tugas', 'literasi', 'tahfidz'].includes(activeTab) ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[9px] font-bold">Menu</span>
        </button>
        <button 
          onClick={() => setActiveTab('profil')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'profil' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <User className="w-5 h-5" />
          <span className="text-[9px] font-bold">Profil</span>
        </button>
        <button 
          onClick={() => setShowAbout(true)}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all text-slate-400 hover:text-slate-600 dark:hover:text-slate-300`}
        >
          <Info className="w-5 h-5" />
          <span className="text-[9px] font-bold">Tentang</span>
        </button>
      </div>

      {/* About Modal */}
      <AnimatePresence>
        {showAbout && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative"
            >
              <button 
                onClick={() => setShowAbout(false)}
                className="absolute top-4 right-4 p-2 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
              
              <div className="h-32 bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center transform rotate-12">
                   <img src={logoUrl} className="w-14 h-14 object-contain" alt="Logo" />
                </div>
              </div>
              
              <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">BISMA APPS</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Portal Siswa & Monitoring</p>
                
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="p-2 rounded-lg bg-blue-600 text-white">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-bold">Pengembang</p>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">akhmadnasor</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="p-2 rounded-lg bg-blue-600 text-white">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-bold">Kontak WhatsApp</p>
                      <a href="https://wa.me/6285749662221" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                        085749662221
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                     <div className="p-2 rounded-lg bg-blue-600 text-white">
                      <Info className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-bold">Versi Aplikasi</p>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">V.4.0.0 (Beta)</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8">
                  <p className="text-xs text-slate-400">
                    &copy; {new Date().getFullYear()} UPT Satuan Pendidikan SDN Baujeng 1
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DashboardHome({ user, onNavigate, onExternalNavigate }: { user: any, onNavigate: (page: string) => void, onExternalNavigate: (page: string) => void }) {
  return (
    <div className="space-y-6">
      {/* Unified Announcement Card & Point Reward Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UnifiedAnnouncementCard type="student" />
        <PointRewardCard user={user} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { id: 'jadwal', label: 'Jadwal', icon: Calendar, color: 'bg-purple-500', shadow: 'shadow-purple-200' },
          { id: 'tugas', label: 'Tugas', icon: ClipboardList, color: 'bg-blue-500', shadow: 'shadow-blue-200' },
          { id: 'nilai_siswa', label: 'Nilai', icon: FileSpreadsheet, color: 'bg-fuchsia-500', shadow: 'shadow-fuchsia-200' },
          { id: 'kehadiran', label: 'Absensi', icon: UserCheck, color: 'bg-indigo-500', shadow: 'shadow-indigo-200' },
          { id: 'pelanggaran', label: 'Disiplin', icon: AlertTriangle, color: 'bg-red-500', shadow: 'shadow-red-200' },
          { id: 'jurnal_kasih_ibu', label: 'Jurnal Kasih Ibu', icon: FileText, color: 'bg-rose-500', shadow: 'shadow-rose-200' },
          { id: 'rumah_pendidikan', label: 'Rumah Pendidikan', img: 'https://lh3.googleusercontent.com/d/1DgxC8VjC0SS_xWtmTqnIReQmGpCqzGDO', color: 'bg-white', shadow: 'shadow-slate-200' },
          { id: 'edugame', label: 'Edugame', icon: Gamepad, color: 'bg-green-500', shadow: 'shadow-green-200' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'edugame' || item.id === 'rumah_pendidikan') {
                onExternalNavigate(item.id);
              } else {
                onNavigate(item.id);
              }
            }}
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all flex flex-col items-center gap-3 group hover:-translate-y-1"
          >
            <div className={`${item.color} w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg ${item.shadow} dark:shadow-none group-hover:scale-110 transition-transform overflow-hidden`}>
              {item.img ? (
                <img src={item.img} alt={item.label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : item.icon ? (
                <item.icon className="w-6 h-6" />
              ) : null}
            </div>
            <span className="font-medium text-slate-700 dark:text-slate-300 text-sm text-center">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MenuKBM({ user, onNavigate, onExternalNavigate }: { user: any, onNavigate: (page: string) => void, onExternalNavigate: (page: string) => void }) {
  const menuItems = [
    { id: 'jadwal', icon: Calendar, label: 'Jadwal Pelajaran', color: 'bg-purple-500', shadow: 'shadow-purple-200' },
    { id: 'tugas', icon: ClipboardList, label: 'Tugas Sekolah', color: 'bg-blue-500', shadow: 'shadow-blue-200' },
    { id: 'nilai_siswa', icon: FileSpreadsheet, label: 'Nilai', color: 'bg-fuchsia-500', shadow: 'shadow-fuchsia-200' },
    { id: 'literasi', icon: BookOpen, label: 'Literasi Digital', color: 'bg-orange-500', shadow: 'shadow-orange-200' },
    { id: 'tahfidz', icon: BookHeart, label: 'Tahfidz Quran', color: 'bg-emerald-500', shadow: 'shadow-emerald-200' },
    { id: 'bank_sampah', icon: Trash2, label: 'Bank Sampah', color: 'bg-green-500', shadow: 'shadow-green-200' },
    { id: 'kasih_ibu', icon: Heart, label: 'Kasih Ibu', color: 'bg-pink-500', shadow: 'shadow-pink-200' },
    { id: 'jurnal_kasih_ibu', icon: FileText, label: 'Jurnal Kasih Ibu', color: 'bg-rose-500', shadow: 'shadow-rose-200' },
    { id: 'kehadiran', icon: UserCheck, label: 'Rekap Absensi', color: 'bg-indigo-500', shadow: 'shadow-indigo-200' },
    { id: 'pelanggaran', icon: AlertTriangle, label: 'Catatan Disiplin', color: 'bg-red-500', shadow: 'shadow-red-200' },
    { id: 'rumah_pendidikan', label: 'Rumah Pendidikan', img: 'https://lh3.googleusercontent.com/d/1DgxC8VjC0SS_xWtmTqnIReQmGpCqzGDO', color: 'bg-white', shadow: 'shadow-slate-200' },
    { id: 'edugame', label: 'Edugame', icon: Gamepad, color: 'bg-green-500', shadow: 'shadow-green-200' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-in fade-in duration-300">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            if (item.id === 'edugame' || item.id === 'rumah_pendidikan') {
              onExternalNavigate(item.id);
            } else {
              onNavigate(item.id);
            }
          }}
          className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all flex flex-col items-center gap-3 group hover:-translate-y-1"
        >
          <div className={`${item.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${item.shadow} dark:shadow-none group-hover:scale-110 transition-transform overflow-hidden`}>
            {item.img ? (
              <img src={item.img} alt={item.label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : item.icon ? (
              <item.icon className="w-7 h-7" />
            ) : null}
          </div>
          <span className="font-bold text-slate-700 dark:text-slate-300 text-sm text-center">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function Profil({ user, onLogout, darkMode, toggleDarkMode }: { user: any, onLogout: () => void, darkMode: boolean, toggleDarkMode: () => void }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 border border-slate-100 dark:border-slate-700 animate-in fade-in duration-300">
      <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-6 flex items-center gap-2 text-lg">
        <User className="w-6 h-6 text-blue-500" /> Profil Saya
      </h3>
      <div className="space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-700">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-2xl">
            {user?.Nama_Murid?.charAt(0) || 'S'}
          </div>
          <div>
            <h4 className="font-bold text-lg text-slate-800 dark:text-white">{user?.Nama_Murid || user?.name}</h4>
            <p className="text-slate-500 dark:text-slate-400">{user?.Kelas || 'Kelas ?'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">NIS / NISN</label>
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-lg">{user?.NIS || user?.NISN || '-'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Tempat, Tanggal Lahir</label>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{user?.Tempat_Lahir}, {user?.Tanggal_Lahir}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Alamat</label>
            <p className="font-semibold text-slate-800 dark:text-slate-200">{user?.Alamat || '-'}</p>
          </div>
        </div>

        <div className="pt-6 space-y-3">
           <button 
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {darkMode ? 'Mode Terang' : 'Mode Gelap'}
            </span>
          </button>
          
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <LogOut className="w-5 h-5" /> Keluar Aplikasi
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatbotView() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
      <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce">
        <MessageSquare className="w-10 h-10 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Asisten Virtual</h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-md">
        Fitur Chatbot sedang dalam pengembangan. Segera hadir untuk membantumu!
      </p>
    </div>
  );
}

function JadwalHariIni({ user, onBack }: { user: any, onBack: () => void }) {
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
          const groupedJadwal: any[] = [];
          if (data.data) {
            data.data.sort((a: any, b: any) => a.jam - b.jam).forEach((j: any) => {
              const last = groupedJadwal[groupedJadwal.length - 1];
              if (last && last.mapel === j.mapel && last.guru === j.guru) {
                last.jamArray.push(j.jam);
              } else {
                groupedJadwal.push({ ...j, jamArray: [j.jam] });
              }
            });
            groupedJadwal.forEach(g => {
              if (g.jamArray.length > 1) {
                g.jam = `${g.jamArray[0]}-${g.jamArray[g.jamArray.length - 1]}`;
              } else {
                g.jam = String(g.jamArray[0]);
              }
            });
          }
          setJadwal(groupedJadwal);
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
      <header className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <X className="w-6 h-6 text-slate-500" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Jadwal Hari Ini</h2>
          <p className="text-slate-500 dark:text-slate-400">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </header>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-500"></div>
          </div>
        ) : jadwal.length > 0 ? (
          <div className="relative border-l-2 border-fuchsia-100 dark:border-fuchsia-900/30 ml-4 pl-6 space-y-6">
            {jadwal.map((item, index) => (
              <div 
                key={index}
                className="relative bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 hover:shadow-md transition-all group"
              >
                <div className="absolute -left-[35px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-fuchsia-500 border-4 border-white dark:border-slate-900 shadow-sm group-hover:scale-125 transition-transform"></div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-400 px-4 py-2 rounded-xl font-bold text-center min-w-[80px]">
                      <span className="block text-[10px] uppercase tracking-wider opacity-80 mb-0.5">Jam Ke</span>
                      <span className="text-lg leading-none">{item.jam}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                        {item.mapel}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <UserCheck className="w-4 h-4" />
                        <span>{item.guru}</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden sm:block text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5" />
                      {item.jamArray.length * 35} Menit
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 border-dashed">
            <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Tidak ada jadwal pelajaran hari ini.</p>
            <p className="text-sm text-slate-400 mt-1">Selamat beristirahat!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BankSampah({ user, onBack }: { user: any, onBack: () => void }) {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <X className="w-6 h-6 text-slate-500" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Bank Sampah</h2>
          <p className="text-slate-500 dark:text-slate-400">Tabungan sampahmu</p>
        </div>
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
    </div>
  );
}

function JurnalKasihIbu({ user, onBack }: { user: any, onBack: () => void }) {
  const [jurnalData, setJurnalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJurnal = async () => {
      if (!user?.NIS) return;
      try {
        const response = await fetch(`/api/kasih-ibu?nis=${user.NIS}`);
        const data = await response.json();
        if (data.success) {
          setJurnalData(data.data);
        }
      } catch (e) {
        console.error("Error fetching jurnal kasih ibu:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchJurnal();
  }, [user]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4 mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Jurnal Kasih Ibu</h2>
            <p className="text-slate-500 dark:text-slate-400">Riwayat pembiasaan karakter baik</p>
          </div>
        </div>
        <button 
          onClick={handlePrint}
          className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-sm transition-colors"
        >
          <FileText className="w-5 h-5" /> Cetak
        </button>
      </header>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6 print:shadow-none print:border-none print:p-0 print:w-full print:max-w-[210mm] print:mx-auto">
        <div className="hidden print:block mb-6 text-center border-b-2 border-black pb-4">
          <h2 className="text-2xl font-bold uppercase">Jurnal Kasih Ibu</h2>
          <p className="text-lg mt-1">Nama: {user?.Nama_Murid || user?.name}</p>
          <p className="text-md">Kelas: {user?.Kelas}</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400 print:hidden">Memuat data...</div>
        ) : jurnalData.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400 italic">Belum ada data jurnal.</div>
        ) : (
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-sm print:text-xs border-collapse border border-slate-200 dark:border-slate-700 print:border-slate-300 table-fixed">
              <thead className="bg-slate-50 dark:bg-slate-900/50 print:bg-slate-100">
                <tr>
                  <th className="border-b border-slate-200 dark:border-slate-700 print:border-slate-300 p-3 print:p-2 text-left w-28 print:w-24">Tanggal</th>
                  <th className="border-b border-slate-200 dark:border-slate-700 print:border-slate-300 p-3 print:p-2 text-left w-20 print:w-16">Waktu</th>
                  <th className="border-b border-slate-200 dark:border-slate-700 print:border-slate-300 p-3 print:p-2 text-left w-36 print:w-32">Pembiasaan</th>
                  <th className="border-b border-slate-200 dark:border-slate-700 print:border-slate-300 p-3 print:p-2 text-left">Keterangan</th>
                  <th className="border-b border-slate-200 dark:border-slate-700 print:border-slate-300 p-3 print:p-2 text-center w-24 print:w-20">Status</th>
                </tr>
              </thead>
              <tbody>
                {jurnalData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 print:hover:bg-transparent break-inside-avoid">
                    <td className="border-b border-slate-100 dark:border-slate-800 print:border-slate-300 p-3 print:p-2 align-top">
                      {item.tanggal_kegiatan ? new Date(item.tanggal_kegiatan).toLocaleDateString('id-ID') : new Date(item.timestamp).toLocaleDateString('id-ID')}
                    </td>
                    <td className="border-b border-slate-100 dark:border-slate-800 print:border-slate-300 p-3 print:p-2 align-top">
                      {item.waktu_kegiatan || '-'}
                    </td>
                    <td className="border-b border-slate-100 dark:border-slate-800 print:border-slate-300 p-3 print:p-2 align-top font-medium text-slate-800 dark:text-slate-200 print:text-black">
                      {item.jenis_kebiasaan}
                    </td>
                    <td className="border-b border-slate-100 dark:border-slate-800 print:border-slate-300 p-3 print:p-2 align-top text-slate-600 dark:text-slate-400 print:text-black break-words">
                      {item.keterangan || '-'}
                    </td>
                    <td className="border-b border-slate-100 dark:border-slate-800 print:border-slate-300 p-3 print:p-2 align-top text-center">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase print:border print:border-slate-300 print:bg-transparent print:text-black ${
                        item.validasi_walikelas === 'Valid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        item.validasi_walikelas === 'Ditolak' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {item.validasi_walikelas || 'Menunggu'}
                      </span>
                    </td>
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

function KasihIbu({ onBack }: { onBack: () => void }) {
  const habits = [
    { id: 'bangun_pagi', label: 'Bangun Pagi', desc: 'Menanamkan disiplin', icon: '🌅' },
    { id: 'beribadah', label: 'Beribadah', desc: 'Memperkuat nilai spiritual', icon: '🕌' },
    { id: 'berolahraga', label: 'Berolahraga', desc: 'Menjaga kesehatan fisik', icon: '🏃' },
    { id: 'makan_sehat', label: 'Makan Sehat', desc: 'Gizi seimbang', icon: '🥗' },
    { id: 'gemar_belajar', label: 'Gemar Belajar', desc: 'Rasa ingin tahu', icon: '📚' },
    { id: 'bermasyarakat', label: 'Bermasyarakat', desc: 'Gotong royong', icon: '🤝' },
    { id: 'tidur_cepat', label: 'Tidur Cepat', desc: 'Istirahat cukup', icon: '😴' },
  ];

  const [selectedHabit, setSelectedHabit] = useState<any>(null);
  const [keterangan, setKeterangan] = useState('');
  const [statusPembiasaan, setStatusPembiasaan] = useState<string>('');
  const [sholatChecklist, setSholatChecklist] = useState<Record<string, string>>({
    Subuh: '', Dhuhur: '', Ashar: '', Maghrib: '', Isya: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (selectedHabit) {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [selectedHabit]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusPembiasaan && selectedHabit?.id !== 'beribadah') {
      alert("Silakan pilih status pembiasaan");
      return;
    }
    
    if (selectedHabit?.id === 'beribadah') {
      const allFilled = Object.values(sholatChecklist).every(val => val !== '');
      if (!allFilled) {
        alert("Silakan lengkapi checklist sholat");
        return;
      }
    }

    setSubmitting(true);
    try {
      const userStr = localStorage.getItem('bisma_user');
      const user = userStr ? JSON.parse(userStr) : {};

      let finalKeterangan = keterangan;
      if (selectedHabit?.id === 'beribadah') {
        const sholatDetails = Object.entries(sholatChecklist)
          .map(([sholat, status]) => `${sholat}: ${status}`)
          .join(', ');
        finalKeterangan = `${keterangan}\n\nChecklist Sholat:\n${sholatDetails}`;
      } else {
        finalKeterangan = `${keterangan}\n\nStatus: ${statusPembiasaan}`;
      }

      const res = await fetch('/api/kasih-ibu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nis: user.NIS || user.id,
          nama: user.Nama_Murid || user.name,
          kelas: user.Kelas,
          habit_id: selectedHabit.id,
          habit_label: selectedHabit.label,
          tanggal: currentTime.toISOString().split('T')[0],
          waktu: currentTime.toTimeString().split(' ')[0],
          perasaan: 'Senang', // Default feeling, could be added to UI later
          keterangan: finalKeterangan
        })
      });
      
      const result = await res.json();
      if (result.success) {
        alert("Kegiatan berhasil dicatat! Menunggu validasi wali kelas.");
        setSelectedHabit(null);
        setKeterangan('');
        setStatusPembiasaan('');
        setSholatChecklist({ Subuh: '', Dhuhur: '', Ashar: '', Maghrib: '', Isya: '' });
      } else {
        alert("Gagal menyimpan: " + result.message);
      }
    } catch (e) {
      alert("Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <header className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <X className="w-6 h-6 text-slate-500" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Program Kasih Ibu</h2>
          <p className="text-slate-500 dark:text-slate-400">Pembiasaan karakter baik</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {habits.map((habit) => (
          <button
            key={habit.id}
            onClick={() => setSelectedHabit(habit)}
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all text-left group relative overflow-hidden"
          >
            <div className="flex items-start gap-4 relative z-10">
              <div className="text-4xl group-hover:scale-125 transition-transform duration-300 drop-shadow-md">
                {habit.icon}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">{habit.label}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{habit.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Modal Input */}
      <AnimatePresence>
        {selectedHabit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative max-h-[90vh] flex flex-col"
            >
              <button 
                onClick={() => setSelectedHabit(null)}
                className="absolute top-4 right-4 p-2 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
              
              <div className="p-8 overflow-y-auto flex-1">
                <div className="text-center mb-6">
                  <span className="text-6xl mb-4 block">{selectedHabit.icon}</span>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{selectedHabit.label}</h2>
                  <p className="text-slate-500 dark:text-slate-400">{selectedHabit.desc}</p>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Waktu Saat Ini</p>
                    <p className="text-xl font-mono font-bold text-slate-800 dark:text-white">
                      {currentTime.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
                      {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Keterangan Kegiatan</label>
                    <textarea 
                      required
                      value={keterangan}
                      onChange={(e) => setKeterangan(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all h-24 resize-none"
                      placeholder="Ceritakan sedikit tentang kegiatanmu..."
                    ></textarea>
                  </div>

                  {selectedHabit.id === 'beribadah' ? (
                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Checklist Sholat Wajib</label>
                      {['Subuh', 'Dhuhur', 'Ashar', 'Maghrib', 'Isya'].map((sholat) => (
                        <div key={sholat} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{sholat}</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setSholatChecklist(prev => ({ ...prev, [sholat]: 'Belum Terbiasa' }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${sholatChecklist[sholat] === 'Belum Terbiasa' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800' : 'bg-white dark:bg-slate-600 text-slate-500 border border-slate-200 dark:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-500'}`}
                            >
                              <XCircle className="w-3 h-3" /> Belum
                            </button>
                            <button
                              type="button"
                              onClick={() => setSholatChecklist(prev => ({ ...prev, [sholat]: 'Sudah Terbiasa' }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${sholatChecklist[sholat] === 'Sudah Terbiasa' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800' : 'bg-white dark:bg-slate-600 text-slate-500 border border-slate-200 dark:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-500'}`}
                            >
                              <CheckCircle className="w-3 h-3" /> Sudah
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Status Pembiasaan</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setStatusPembiasaan('Belum Terbiasa')}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${statusPembiasaan === 'Belum Terbiasa' ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 ring-2 ring-red-500/20' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                        >
                          <XCircle className="w-6 h-6" />
                          <span className="text-sm font-bold">Belum Terbiasa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatusPembiasaan('Sudah Terbiasa')}
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${statusPembiasaan === 'Sudah Terbiasa' ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 ring-2 ring-green-500/20' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                        >
                          <CheckCircle className="w-6 h-6" />
                          <span className="text-sm font-bold">Sudah Terbiasa</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                  >
                    <Save className="w-5 h-5" /> {submitting ? 'Menyimpan...' : 'Simpan Kegiatan'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Kehadiran({ user, onBack }: { user: any, onBack: () => void }) {
  const [semester, setSemester] = useState('Ganjil');
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ hadir: 0, izin: 0, sakit: 0, alpha: 0 });

  useEffect(() => {
    const fetchKehadiran = async () => {
      try {
        const res = await fetch(`/api/siswa/kehadiran?nis=${user.NIS}&semester=${semester}`);
        const result = await res.json();
        if (result.success) {
          setData(result.data);
          
          // Calculate summary
          let h = 0, i = 0, s = 0, a = 0;
          result.data.forEach((d: any) => {
            if (d.status === 'Hadir') h++;
            else if (d.status === 'Izin') i++;
            else if (d.status === 'Sakit') s++;
            else if (d.status === 'Alpa') a++;
          });
          
          // If no data, assume 100% attendance or 0? 
          // Usually we count total school days. 
          // Here we only have recorded days.
          // Let's just use the counts we have.
          
          const total = h + i + s + a;
          const hPercent = total > 0 ? Math.round((h / total) * 100) : 0;
          
          setSummary({ hadir: hPercent, izin: i, sakit: s, alpha: a });
        }
      } catch (e) {
        console.error("Failed to fetch kehadiran", e);
      }
    };

    if (user?.NIS) {
      fetchKehadiran();
    }
  }, [semester, user]);

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <X className="w-6 h-6 text-slate-500" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Rekap Kehadiran</h2>
          <p className="text-slate-500 dark:text-slate-400">Semester {semester}</p>
        </div>
        <select 
          value={semester} 
          onChange={(e) => setSemester(e.target.value)}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
        >
          <option value="Ganjil">Ganjil</option>
          <option value="Genap">Genap</option>
        </select>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-xl border border-green-200 dark:border-green-800/30 text-center">
          <h3 className="text-2xl font-bold text-green-700 dark:text-green-400">{summary.hadir}%</h3>
          <p className="text-xs text-green-600 dark:text-green-500 uppercase font-bold mt-1">Hadir</p>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-xl border border-blue-200 dark:border-blue-800/30 text-center">
          <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-400">{summary.izin}</h3>
          <p className="text-xs text-blue-600 dark:text-blue-500 uppercase font-bold mt-1">Izin</p>
        </div>
        <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-xl border border-orange-200 dark:border-orange-800/30 text-center">
          <h3 className="text-2xl font-bold text-orange-700 dark:text-orange-400">{summary.sakit}</h3>
          <p className="text-xs text-orange-600 dark:text-orange-500 uppercase font-bold mt-1">Sakit</p>
        </div>
        <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-xl border border-red-200 dark:border-red-800/30 text-center">
          <h3 className="text-2xl font-bold text-red-700 dark:text-red-400">{summary.alpha}</h3>
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
            {data.map((row, idx) => (
              <tr key={idx}>
                <td className="px-6 py-4">{row.tanggal}</td>
                <td className="px-6 py-4 font-bold">{row.status}</td>
                <td className="px-6 py-4">{row.keterangan}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Pelanggaran({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <X className="w-6 h-6 text-slate-500" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Catatan Kedisiplinan</h2>
          <p className="text-slate-500 dark:text-slate-400">Rekap pelanggaran tata tertib</p>
        </div>
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

function Literasi({ onBack }: { onBack: () => void }) {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <header className="flex items-center gap-4 mb-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <X className="w-6 h-6 text-slate-500" />
        </button>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Literasi Digital</h2>
      </header>
      <div className="flex-grow bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <iframe 
          src="https://perpusbaujeng1.netlify.app" 
          className="w-full h-full border-0"
          title="Perpustakaan Digital"
        ></iframe>
      </div>
    </div>
  );
}

function Tahfidz({ onBack }: { onBack: () => void }) {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <header className="flex items-center gap-4 mb-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <X className="w-6 h-6 text-slate-500" />
        </button>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Tahfidz Quran</h2>
      </header>
      <div className="flex-grow bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <iframe 
          src="https://litequran.net/" 
          className="w-full h-full border-0"
          title="Lite Quran"
        ></iframe>
      </div>
    </div>
  );
}

function Tugas({ user, onBack }: { user: any, onBack: () => void }) {
  const [tugas, setTugas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTugas, setSelectedTugas] = useState<any>(null);
  const [submissionFile, setSubmissionFile] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTugas = async () => {
      try {
        const res = await fetch(`/api/tugas?kelas=${user.Kelas}`);
        const result = await res.json();
        if (result.success) {
          setTugas(result.data);
        }
      } catch (e) {
        console.error("Failed to fetch tugas", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTugas();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTugas) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/tugas/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tugas_id: selectedTugas.id,
          siswa_id: user.id || user.NIS, // Fallback
          siswa_nama: user.Nama_Murid || user.name,
          file_url: submissionFile
        })
      });
      const result = await res.json();
      if (result.success) {
        alert("Tugas berhasil dikumpulkan!");
        setSelectedTugas(null);
        setSubmissionFile('');
        // Refresh list
        const resList = await fetch(`/api/tugas?kelas=${user.Kelas}`);
        const resultList = await resList.json();
        if (resultList.success) setTugas(resultList.data);
      } else {
        alert("Gagal mengumpulkan tugas: " + result.message);
      }
    } catch (e) {
      alert("Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <header className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <X className="w-6 h-6 text-slate-500" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Tugas Sekolah</h2>
          <p className="text-slate-500 dark:text-slate-400">Klik 2x untuk melihat detail & mengumpulkan</p>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Memuat daftar tugas...</p>
        </div>
      ) : tugas.length > 0 ? (
        <div className="space-y-4">
          {tugas.map((item) => (
            <div 
              key={item.id} 
              onDoubleClick={() => setSelectedTugas(item)}
              className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors select-none"
            >
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">{item.mapel}</span>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">{item.judul}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Tenggat: {item.deadline}</p>
              </div>
              <div>
                {item.status === 'Selesai' ? (
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Selesai
                  </span>
                ) : item.status === 'Menunggu Validasi' ? (
                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Diproses
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Belum
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-slate-500">Tidak ada tugas aktif saat ini.</p>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedTugas && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative max-h-[90vh] flex flex-col"
            >
              <button 
                onClick={() => setSelectedTugas(null)}
                className="absolute top-4 right-4 p-2 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
              
              <div className="p-8 overflow-y-auto flex-1">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-bold uppercase mb-4 inline-block">
                  {selectedTugas.mapel}
                </span>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{selectedTugas.judul}</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6 whitespace-pre-wrap">{selectedTugas.deskripsi}</p>
                
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500 dark:text-slate-400">Guru Pengampu</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{selectedTugas.guru_nama}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Tenggat Waktu</span>
                    <span className="font-bold text-red-600 dark:text-red-400">{selectedTugas.deadline}</span>
                  </div>
                </div>

                {selectedTugas.status === 'Selesai' ? (
                  <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-xl text-center">
                    <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-2" />
                    <h3 className="font-bold text-green-800 dark:text-green-300">Tugas Selesai!</h3>
                    <p className="text-sm text-green-700 dark:text-green-400">Guru telah memvalidasi tugasmu.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Link Tugas / Jawaban</label>
                      <input 
                        type="text" 
                        required
                        value={submissionFile}
                        onChange={(e) => setSubmissionFile(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="Tempel link Google Drive / Dokumen di sini..."
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {submitting ? 'Mengirim...' : 'Kumpulkan Tugas'}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
