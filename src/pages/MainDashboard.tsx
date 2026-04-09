import { useEffect, useState } from 'react';
import { LogOut, CalendarCheck, BarChart2, FilePenLine, Printer, UserCheck, ClipboardCheck, ShieldAlert, QrCode, NotebookPen, HeartHandshake, GalleryThumbnails, Check, X, LayoutDashboard, Settings, BookOpen, Sun, Moon, Trash2, ArrowLeft, User, Info, MessageSquare, XCircle, Send, FileSpreadsheet, Gamepad, Gamepad2, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import UnifiedAnnouncementCard from '../components/UnifiedAnnouncementCard';

export default function MainDashboard({ user, onLogout, onNavigate, darkMode, toggleDarkMode }: { user: any, onLogout: () => void, onNavigate: (page: string) => void, darkMode: boolean, toggleDarkMode: () => void }) {
  const [stats, setStats] = useState<any>(null);
  const [time, setTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [themeColor, setThemeColor] = useState('blue');
  const [showAbout, setShowAbout] = useState(false);
  const [tendikStats, setTendikStats] = useState<any>(null);
  const [activity, setActivity] = useState('');
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [logoUrl, setLogoUrl] = useState("https://i.imghippo.com/files/xbYy2711Wk.png");

  const colors: Record<string, { gradient: string, text: string, bg: string, border: string, ring: string }> = {
    blue: { gradient: 'from-blue-600 to-indigo-600', text: 'text-blue-600', bg: 'bg-blue-600', border: 'border-blue-200', ring: 'ring-blue-500' },
    red: { gradient: 'from-red-600 to-rose-600', text: 'text-red-600', bg: 'bg-red-600', border: 'border-red-200', ring: 'ring-red-500' },
    green: { gradient: 'from-green-600 to-emerald-600', text: 'text-green-600', bg: 'bg-green-600', border: 'border-green-200', ring: 'ring-green-500' },
    purple: { gradient: 'from-purple-600 to-violet-600', text: 'text-purple-600', bg: 'bg-purple-600', border: 'border-purple-200', ring: 'ring-purple-500' },
    orange: { gradient: 'from-orange-600 to-amber-600', text: 'text-orange-600', bg: 'bg-orange-600', border: 'border-orange-200', ring: 'ring-orange-500' },
    teal: { gradient: 'from-teal-600 to-cyan-600', text: 'text-teal-600', bg: 'bg-teal-600', border: 'border-teal-200', ring: 'ring-teal-500' },
    cyan: { gradient: 'from-cyan-600 to-sky-600', text: 'text-cyan-600', bg: 'bg-cyan-600', border: 'border-cyan-200', ring: 'ring-cyan-500' },
    pink: { gradient: 'from-pink-600 to-fuchsia-600', text: 'text-pink-600', bg: 'bg-pink-600', border: 'border-pink-200', ring: 'ring-pink-500' },
  };

  const currentTheme = colors[themeColor] || colors.blue;

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    if (user) {
      if (user.role === 'tendik') {
        fetch(`/api/tendik/stats?nip=${user.NIP}`)
          .then(res => res.json())
          .then(res => {
            if (res.success) setTendikStats(res.data);
          })
          .catch(err => console.error("Failed to fetch tendik stats", err));
      } else {
        fetch(`/api/main-stats?namaGuru=${encodeURIComponent(user['Nama Guru'])}&targetJP=${user.TargetJP || 24}`)
          .then(res => res.json())
          .then(res => {
            if (res.success) setStats(res.data);
          })
          .catch(err => console.error("Failed to fetch main stats", err));
      }
    }

    // Load theme
    const storedColor = localStorage.getItem('app_theme_color');
    if (storedColor) setThemeColor(storedColor);

    const handleThemeChange = () => {
      const newColor = localStorage.getItem('app_theme_color');
      if (newColor) setThemeColor(newColor);
    };

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

    window.addEventListener('theme-color-change', handleThemeChange);
    window.addEventListener('school-identity-update', fetchSettings);
    return () => {
      clearInterval(timer);
      window.removeEventListener('theme-color-change', handleThemeChange);
      window.removeEventListener('school-identity-update', fetchSettings);
    };
  }, [user]);

  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity.trim()) return;
    
    setLoadingActivity(true);
    try {
      const res = await fetch('/api/jurnal-tendik', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nip: user.NIP,
          nama: user['Nama Guru'], // Tendik name stored here
          aktivitas: activity,
          tanggal: new Date().toISOString()
        })
      });
      
      const data = await res.json();
      if (data.success) {
        alert("Aktivitas berhasil disimpan!");
        setActivity('');
        // Refresh stats
        fetch(`/api/tendik/stats?nip=${user.NIP}`)
          .then(res => res.json())
          .then(res => {
            if (res.success) setTendikStats(res.data);
          });
      } else {
        alert("Gagal menyimpan aktivitas: " + data.message);
      }
    } catch (error) {
      console.error("Error submitting activity", error);
      alert("Terjadi kesalahan jaringan");
    } finally {
      setLoadingActivity(false);
    }
  };

  const [showAllMenu, setShowAllMenu] = useState(false);

  const menuItems = [
    { id: 'jurnal', icon: FilePenLine, label: 'Isi Jurnal', gradient: 'from-green-400 to-green-600', shadow: 'shadow-green-500/40', roles: ['guru'] },
    { id: 'tugas_guru', icon: ClipboardCheck, label: 'Tugas', gradient: 'from-blue-400 to-blue-600', shadow: 'shadow-blue-500/40', roles: ['guru'] },
    { id: 'nilai_guru', icon: FileSpreadsheet, label: 'Nilai', gradient: 'from-fuchsia-400 to-fuchsia-600', shadow: 'shadow-fuchsia-500/40', roles: ['guru'] },
    { id: 'jadwal_mengajar', icon: CalendarCheck, label: 'Jadwal', gradient: 'from-cyan-400 to-cyan-600', shadow: 'shadow-cyan-500/40', roles: ['guru'] },
    { id: 'rekap_absensi', icon: UserCheck, label: 'Kehadiran', gradient: 'from-orange-400 to-orange-600', shadow: 'shadow-orange-500/40', roles: ['guru', 'tendik'] },
    { id: 'kedisiplinan', icon: ShieldAlert, label: 'Kedisiplinan', gradient: 'from-red-400 to-red-600', shadow: 'shadow-red-500/40', roles: ['guru', 'tendik'] },
    { id: 'bank_sampah_guru', icon: Trash2, label: 'Bank Sampah', gradient: 'from-emerald-400 to-emerald-600', shadow: 'shadow-emerald-500/40', roles: ['guru', 'tendik'] },
    { id: 'edugame', url: 'https://edugamev2.netlify.app/', icon: Gamepad, label: 'Edugame', gradient: 'from-green-400 to-emerald-600', shadow: 'shadow-green-500/40', roles: ['guru', 'tendik'] },
    // Hidden by default
    { id: 'laporan', icon: Printer, label: 'Cetak', gradient: 'from-teal-400 to-teal-600', shadow: 'shadow-teal-500/40', roles: ['guru', 'tendik'] },
    { id: 'keterlaksanaan_kbm', icon: ClipboardCheck, label: 'Keterlaksanaan', gradient: 'from-blue-400 to-blue-600', shadow: 'shadow-blue-500/40', roles: ['guru'] },
    { id: 'presensi_qr', icon: QrCode, label: 'Scan QR', gradient: 'from-purple-400 to-purple-600', shadow: 'shadow-purple-500/40', roles: ['guru', 'tendik'] },
    { id: 'rpp_generator', icon: NotebookPen, label: 'RPP', gradient: 'from-indigo-400 to-indigo-600', shadow: 'shadow-indigo-500/40', roles: ['guru'] },
    { id: 'kasih_ibu_guru', icon: HeartHandshake, label: 'Kasih Ibu', gradient: 'from-pink-400 to-pink-600', shadow: 'shadow-pink-500/40', roles: ['walikelas'] },
    { id: 'galeri_kegiatan', icon: GalleryThumbnails, label: 'Galeri', gradient: 'from-violet-400 to-violet-600', shadow: 'shadow-violet-500/40', roles: ['guru', 'tendik'] },
    { id: 'kemendikdasmen', url: 'https://guru.kemendikdasmen.go.id/', img: 'https://lh3.googleusercontent.com/d/1s5VpgdLJFBL5tGDqKCZ3Wem1YnYbH9zt', label: 'PMM', gradient: 'from-slate-100 to-slate-200', shadow: 'shadow-slate-300/40', roles: ['guru', 'tendik'] },
    { id: 'bangkomar', url: 'https://bangkomar.pasuruankab.go.id/', icon: Globe, label: 'Bangkomar', gradient: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/40', roles: ['guru', 'tendik'] },
    { id: 'game_generator', url: 'https://sdnbaujeng1.github.io/gamegenerator/', icon: Gamepad2, label: 'Game Generator', gradient: 'from-yellow-400 to-orange-500', shadow: 'shadow-orange-500/40', roles: ['guru'] },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (user?.role === 'admin') return true;
    if (item.roles.includes('walikelas') && !user?.waliKelas) return false;
    if (item.roles.includes(user?.role)) return true;
    // Special check for bank_sampah_guru: Tendik or Walikelas
    if (item.id === 'bank_sampah_guru' && (user?.role === 'tendik' || user?.waliKelas)) return true;
    return false;
  });

  const visibleMenuItems = showAllMenu ? filteredMenuItems : filteredMenuItems.slice(0, 8);

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors pb-24">
      <header className={`bg-gradient-to-r ${currentTheme.gradient} px-4 pt-8 pb-12 shadow-lg transition-all duration-500`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <img src={logoUrl} className="h-10 w-10" alt="Logo" />
            </div>
            <div>
              <p className="text-xs text-white/80 opacity-90">Selamat Datang,</p>
              <h2 className="text-lg font-bold">{user?.['Nama Guru'] || user?.Nama || user?.Nama_Tendik || 'Memuat...'}</h2>
              <p className="text-xs text-white/80 capitalize">{user?.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleDarkMode} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={onLogout} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow px-4 -mt-8 z-10">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 flex justify-between items-center border border-slate-100 dark:border-slate-700">
            <span className="font-bold text-slate-700 dark:text-slate-200">BISMA APPS</span>
            <div className="flex flex-col items-end">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className={`font-mono ${currentTheme.text} font-semibold text-sm sm:text-lg`}>
                {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              {/* TENDIK DASHBOARD */}
              {user?.role === 'tendik' && (
                <>
                  <div className="grid grid-cols-2 gap-3 md:gap-6 mb-6">
                    {tendikStats && (
                      <div className={`bg-gradient-to-br ${currentTheme.gradient} rounded-2xl shadow-lg p-6 text-white relative overflow-hidden transition-all duration-500 h-full flex flex-col justify-center`}>
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-black/10 rounded-full blur-xl"></div>
                        
                        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <h3 className="text-white/90 font-medium mb-1 flex items-center gap-2">
                              <UserCheck className="w-5 h-5" /> Kinerja Bulanan
                            </h3>
                            <div className="flex items-baseline gap-2">
                              <span className="text-4xl font-bold">{tendikStats.percentage}%</span>
                              <span className="text-white/80 text-lg">Kehadiran</span>
                            </div>
                          </div>
                          
                          <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-4 py-3 flex items-center gap-3">
                            <div className="flex flex-col">
                              <span className="text-xs text-white/80 uppercase tracking-wider font-semibold">Status</span>
                              <span className="font-bold text-lg">
                                {tendikStats.category === 'Sesuai Ekspektasi' ? 'Sesuai Ekspektasi 🌟' : 'Perlu Ditingkatkan 📈'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Unified Announcement Card */}
                    <div className="h-full">
                      <UnifiedAnnouncementCard type="tendik" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5 border border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                      <FilePenLine className={`w-5 h-5 ${currentTheme.text}`} /> Aktivitas Harian
                    </h3>
                    <form onSubmit={handleActivitySubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                          Apa yang Anda kerjakan hari ini?
                        </label>
                        <textarea
                          required
                          className="w-full border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:text-white"
                          rows={4}
                          placeholder="Contoh: Menginput data siswa baru, merekap absensi..."
                          value={activity}
                          onChange={(e) => setActivity(e.target.value)}
                        />
                      </div>
                      <button 
                        type="submit" 
                        disabled={loadingActivity}
                        className={`w-full bg-gradient-to-r ${currentTheme.gradient} text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all flex items-center justify-center gap-2 disabled:opacity-70`}
                      >
                        {loadingActivity ? 'Menyimpan...' : <><Send className="w-4 h-4" /> Kirim Laporan</>}
                      </button>
                    </form>
                  </div>
                </>
              )}

              {/* GURU DASHBOARD */}
              {user?.role !== 'tendik' && (
                <>
                  <div className="grid grid-cols-2 gap-3 md:gap-6 mb-6">
                    {stats && (
                      <div className={`bg-gradient-to-br ${currentTheme.gradient} rounded-2xl shadow-lg p-4 text-white relative overflow-hidden transition-all duration-500 h-full flex flex-col justify-between`}>
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-16 h-16 bg-black/10 rounded-full blur-lg"></div>
                        
                        <div className="relative z-10 flex flex-col gap-2 h-full">
                          <div>
                            <h3 className="text-white/90 font-medium text-xs sm:text-sm mb-1 flex items-center gap-1">
                              <BarChart2 className="w-4 h-4" /> Target Mingguan
                            </h3>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl sm:text-4xl font-bold">{stats.weeklyProgress.current}</span>
                              <span className="text-white/80 text-xs sm:text-lg">/ {stats.weeklyProgress.target} JP</span>
                            </div>
                          </div>
                          
                          <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-2 py-2 sm:px-4 sm:py-3 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mt-auto">
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-[10px] text-white/80 uppercase tracking-wider font-semibold truncate w-full">Status</span>
                              <span className="font-bold text-xs sm:text-lg truncate w-full">
                                {Number(stats.weeklyProgress.percent) >= 80 ? 'Sesuai' : 'Tingkatkan'}
                              </span>
                            </div>
                            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 sm:border-4 border-white/30 flex items-center justify-center font-bold text-xs sm:text-base">
                              {Math.round(Number(stats.weeklyProgress.percent))}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Unified Announcement Card (Guru: Latest Journal) */}
                    <div className="h-full">
                      <UnifiedAnnouncementCard type="guru" guruName={user['Nama Guru']} nip={user.NIP} />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5 border border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                      <CalendarCheck className={`w-5 h-5 ${currentTheme.text}`} /> Jadwal Hari Ini
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {!stats ? (
                        <div className="col-span-full text-center py-4 text-slate-400 italic text-sm">Memuat jadwal...</div>
                      ) : stats?.todaysScheduleBoxes?.length === 0 ? (
                        <div className="col-span-full py-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-600">
                          <p>Tidak ada jadwal mengajar hari ini.</p>
                        </div>
                      ) : (
                        stats?.todaysScheduleBoxes?.map((item: any, idx: number) => (
                          <button 
                            key={idx} 
                            onClick={() => {
                              // Navigate to jurnal with pre-filled data
                              const params = new URLSearchParams({
                                kelas: item.kelas,
                                mapel: item.mapel,
                                jam: item.jam
                              });
                              window.location.hash = `jurnal?${params.toString()}`;
                              // We need to trigger the navigation in the parent component
                              // For now, we'll just call onNavigate and let the Jurnal component read the URL hash or we can pass state
                              onNavigate('jurnal');
                            }}
                            className={`rounded-xl p-4 text-white flex flex-col items-center justify-center text-center relative shadow-sm transition-transform hover:scale-105 active:scale-95 ${item.status ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-rose-400 to-rose-600'}`}
                          >
                            <div className="absolute top-2 right-2 bg-white/30 rounded-full p-1">
                              {item.status ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            </div>
                            <span className="text-xs font-mono opacity-90 mb-1 bg-black/20 px-2 py-0.5 rounded-full">Jam {item.jam}</span>
                            <span className="text-3xl font-bold mb-1 tracking-tight">{item.kelas}</span>
                            <span className="text-sm font-medium truncate w-full px-1">{item.mapel}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'kbm' && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-5 animate-in fade-in duration-300">
              {visibleMenuItems.map(item => (
                <button 
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'kemendikdasmen' && item.url) {
                      window.open(item.url, '_blank');
                    } else {
                      onNavigate(item.id);
                    }
                  }}
                  className="group relative bg-white dark:bg-slate-800 p-4 rounded-[2rem] flex flex-col items-center justify-center aspect-square transition-all duration-300 hover:-translate-y-2 shadow-[0_10px_20px_rgba(0,0,0,0.05),inset_0_2px_0_rgba(255,255,255,1)] dark:shadow-[0_10px_20px_rgba(0,0,0,0.2),inset_0_2px_0_rgba(255,255,255,0.05)] border border-slate-100 dark:border-slate-700"
                >
                  <div className={`p-4 rounded-2xl mb-3 transition-all duration-300 group-hover:scale-110 bg-gradient-to-br ${item.gradient} ${item.shadow} shadow-lg ring-1 ring-white/20 dark:ring-white/10 relative overflow-hidden flex items-center justify-center`}>
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/60 opacity-50"></div>
                    {item.img ? (
                      <img src={item.img} alt={item.label} className="w-8 h-8 relative z-10 transition-transform duration-300 group-hover:rotate-12 drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)] object-contain" referrerPolicy="no-referrer" />
                    ) : item.icon ? (
                      <item.icon className="w-8 h-8 text-white relative z-10 transition-transform duration-300 group-hover:rotate-12 drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]" strokeWidth={2.5} />
                    ) : null}
                  </div>
                  <span className="text-xs font-bold text-center text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{item.label}</span>
                </button>
              ))}
              
              {filteredMenuItems.length > 8 && (
                <button 
                  onClick={() => setShowAllMenu(!showAllMenu)}
                  className="group relative bg-white dark:bg-slate-800 p-4 rounded-[2rem] flex flex-col items-center justify-center aspect-square transition-all duration-300 hover:-translate-y-2 shadow-[0_10px_20px_rgba(0,0,0,0.05),inset_0_2px_0_rgba(255,255,255,1)] dark:shadow-[0_10px_20px_rgba(0,0,0,0.2),inset_0_2px_0_rgba(255,255,255,0.05)] border border-slate-100 dark:border-slate-700"
                >
                  <div className={`p-4 rounded-2xl mb-3 transition-all duration-300 group-hover:scale-110 bg-gradient-to-br from-slate-400 to-slate-600 shadow-slate-500/40 shadow-lg ring-1 ring-white/20 dark:ring-white/10 relative overflow-hidden flex items-center justify-center`}>
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/60 opacity-50"></div>
                    <LayoutDashboard className="w-8 h-8 text-white relative z-10 transition-transform duration-300 group-hover:rotate-12 drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]" strokeWidth={2.5} />
                  </div>
                  <span className="text-xs font-bold text-center text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    {showAllMenu ? 'Tutup Menu' : 'Menu Lainnya'}
                  </span>
                </button>
              )}
            </div>
          )}

          {activeTab === 'profil' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-6 border border-slate-100 dark:border-slate-700 animate-in fade-in duration-300">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-500" /> Pengaturan Profil
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Nama Lengkap</label>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{user?.['Nama Guru'] || user?.Nama || user?.Nama_Tendik}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">ID / NIP</label>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{user?.NIP || user?.Username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Peran</label>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{user?.role}</p>
                </div>
                <button className="mt-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                  Ubah Password
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Navigation */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 sm:gap-4 z-50">
        <button 
          onClick={() => onNavigate('chatbot')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all text-slate-400 hover:text-slate-600 dark:hover:text-slate-300`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[9px] font-bold">Chatbot</span>
        </button>
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'dashboard' ? `${currentTheme.text} bg-slate-100 dark:bg-slate-700` : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[9px] font-bold">Dashboard</span>
        </button>
        <button 
          onClick={() => setActiveTab('kbm')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'kbm' ? `${currentTheme.text} bg-slate-100 dark:bg-slate-700` : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[9px] font-bold">Menu</span>
        </button>
        <button 
          onClick={() => setActiveTab('profil')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${activeTab === 'profil' ? `${currentTheme.text} bg-slate-100 dark:bg-slate-700` : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
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
              
              <div className={`h-32 bg-gradient-to-br ${currentTheme.gradient} flex items-center justify-center`}>
                <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center transform rotate-12">
                   <img src={logoUrl} className="w-14 h-14 object-contain" alt="Logo" />
                </div>
              </div>
              
              <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">BISMA APPS</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Sistem Monitoring KBM & Sekolah</p>
                
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div className={`p-2 rounded-lg ${currentTheme.bg} text-white`}>
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-bold">Pengembang</p>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">akhmadnasor</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div className={`p-2 rounded-lg ${currentTheme.bg} text-white`}>
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-bold">Kontak WhatsApp</p>
                      <a href="https://wa.me/6285749662221" target="_blank" rel="noopener noreferrer" className={`font-semibold ${currentTheme.text} hover:underline`}>
                        085749662221
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                     <div className={`p-2 rounded-lg ${currentTheme.bg} text-white`}>
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
