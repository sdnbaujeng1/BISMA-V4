import { useEffect, useState } from 'react';
import { LogOut, CalendarCheck, BarChart2, FilePenLine, Printer, UserCheck, ClipboardCheck, ShieldAlert, QrCode, NotebookPen, HeartHandshake, GalleryThumbnails, Check, X, LayoutDashboard, Settings, BookOpen, Sun, Moon, Trash2 } from 'lucide-react';

export default function MainDashboard({ user, onLogout, onNavigate, darkMode, toggleDarkMode }: { user: any, onLogout: () => void, onNavigate: (page: string) => void, darkMode: boolean, toggleDarkMode: () => void }) {
  const [stats, setStats] = useState<any>(null);
  const [time, setTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    if (user) {
      fetch(`/api/main-stats?namaGuru=${encodeURIComponent(user['Nama Guru'])}&targetJP=${user.TargetJP || 24}`)
        .then(res => res.json())
        .then(res => {
          if (res.success) setStats(res.data);
        })
        .catch(err => console.error("Failed to fetch main stats", err));
    }
    return () => clearInterval(timer);
  }, [user]);

  const menuItems = [
    { id: 'jurnal', icon: FilePenLine, label: 'Isi Jurnal', gradient: 'from-green-400 to-green-600', shadow: 'shadow-green-500/40', roles: ['guru'] },
    { id: 'jadwal_mengajar', icon: CalendarCheck, label: 'Jadwal', gradient: 'from-cyan-400 to-cyan-600', shadow: 'shadow-cyan-500/40', roles: ['guru'] },
    { id: 'laporan', icon: Printer, label: 'Cetak', gradient: 'from-teal-400 to-teal-600', shadow: 'shadow-teal-500/40', roles: ['guru', 'tendik'] },
    { id: 'rekap_absensi', icon: UserCheck, label: 'Kehadiran', gradient: 'from-orange-400 to-orange-600', shadow: 'shadow-orange-500/40', roles: ['guru', 'tendik'] },
    { id: 'keterlaksanaan_kbm', icon: ClipboardCheck, label: 'Keterlaksanaan', gradient: 'from-blue-400 to-blue-600', shadow: 'shadow-blue-500/40', roles: ['guru'] },
    { id: 'kedisiplinan', icon: ShieldAlert, label: 'Kedisiplinan', gradient: 'from-red-400 to-red-600', shadow: 'shadow-red-500/40', roles: ['guru', 'tendik'] },
    { id: 'presensi_qr', icon: QrCode, label: 'Scan QR', gradient: 'from-purple-400 to-purple-600', shadow: 'shadow-purple-500/40', roles: ['guru', 'tendik'] },
    { id: 'rpp_generator', icon: NotebookPen, label: 'RPP', gradient: 'from-indigo-400 to-indigo-600', shadow: 'shadow-indigo-500/40', roles: ['guru'] },
    { id: 'kasih_ibu_guru', icon: HeartHandshake, label: 'Kasih Ibu', gradient: 'from-pink-400 to-pink-600', shadow: 'shadow-pink-500/40', roles: ['walikelas'] },
    { id: 'bank_sampah_guru', icon: Trash2, label: 'Bank Sampah', gradient: 'from-emerald-400 to-emerald-600', shadow: 'shadow-emerald-500/40', roles: ['guru', 'tendik'] },
    { id: 'galeri_kegiatan', icon: GalleryThumbnails, label: 'Galeri', gradient: 'from-violet-400 to-violet-600', shadow: 'shadow-violet-500/40', roles: ['guru', 'tendik'] },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (user?.role === 'admin') return true;
    if (item.roles.includes('walikelas') && !user?.waliKelas) return false;
    if (item.roles.includes(user?.role)) return true;
    // Special check for bank_sampah_guru: Tendik or Walikelas
    if (item.id === 'bank_sampah_guru' && (user?.role === 'tendik' || user?.waliKelas)) return true;
    return false;
  });

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors pb-24">
      <header className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 pt-8 pb-12 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <img src="https://i.imghippo.com/files/xbYy2711Wk.png" className="h-10 w-10" alt="Logo" />
            </div>
            <div>
              <p className="text-xs text-green-100 opacity-90">Selamat Datang,</p>
              <h2 className="text-lg font-bold">{user?.['Nama Guru'] || user?.Nama || user?.Nama_Tendik || 'Memuat...'}</h2>
              <p className="text-xs text-green-100 capitalize">{user?.role}</p>
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
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="font-mono text-orange-500 font-semibold text-lg">
                {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
              {user?.role !== 'tendik' && (
                <>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5 border border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                      <CalendarCheck className="w-5 h-5 text-blue-500" /> Jadwal Hari Ini
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {!stats ? (
                        <div className="col-span-full text-center py-4 text-slate-400 italic text-sm">Memuat jadwal...</div>
                      ) : stats?.todaysScheduleBoxes?.length === 0 ? (
                        <div className="col-span-full py-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-600">
                          <p>Tidak ada jadwal mengajar hari ini.</p>
                        </div>
                      ) : (
                        stats?.todaysScheduleBoxes?.map((item: any, idx: number) => (
                          <div key={idx} className={`rounded-xl p-3 text-white flex flex-col items-center justify-center text-center relative shadow-sm ${item.status ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
                            <div className="absolute top-2 right-2 bg-white/30 rounded-full p-1">
                              {item.status ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            </div>
                            <span className="text-xs font-mono opacity-80 mb-1">Jam {item.jam}</span>
                            <span className="text-2xl font-bold mb-1">{item.kelas}</span>
                            <span className="text-xs truncate w-full px-1">{item.mapel}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5 border border-slate-100 dark:border-slate-700 flex flex-col justify-center">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-orange-500" /> Target JP Mingguan
                    </h3>
                    {stats && (
                      <div className="mt-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-500 dark:text-slate-400">Terlaksana</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200"><span>{stats.weeklyProgress.current}</span> / <span>{stats.weeklyProgress.target}</span> JP</span>
                        </div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${Number(stats.weeklyProgress.percent) >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                            style={{ width: `${Math.min(100, stats.weeklyProgress.percent)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-right mt-1 text-slate-400 font-mono">{stats.weeklyProgress.percent}%</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'kbm' && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-5 animate-in fade-in duration-300">
              {filteredMenuItems.map(item => (
                <button 
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="group relative bg-white dark:bg-slate-800 p-4 rounded-[2rem] flex flex-col items-center justify-center aspect-square transition-all duration-300 hover:-translate-y-2 shadow-[0_10px_20px_rgba(0,0,0,0.05),inset_0_2px_0_rgba(255,255,255,1)] dark:shadow-[0_10px_20px_rgba(0,0,0,0.2),inset_0_2px_0_rgba(255,255,255,0.05)] border border-slate-100 dark:border-slate-700"
                >
                  <div className={`p-4 rounded-2xl mb-3 transition-all duration-300 group-hover:scale-110 bg-gradient-to-br ${item.gradient} ${item.shadow} shadow-lg ring-1 ring-white/20 dark:ring-white/10 relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/60 opacity-50"></div>
                    <item.icon className="w-8 h-8 text-white relative z-10 transition-transform duration-300 group-hover:rotate-12 drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]" strokeWidth={2.5} />
                  </div>
                  <span className="text-xs font-bold text-center text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{item.label}</span>
                </button>
              ))}
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
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-8 z-50">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'dashboard' ? 'text-green-600 dark:text-green-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-bold">Dashboard</span>
        </button>
        <button 
          onClick={() => setActiveTab('kbm')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'kbm' ? 'text-green-600 dark:text-green-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <BookOpen className="w-6 h-6" />
          <span className="text-[10px] font-bold">Menu KBM</span>
        </button>
        <button 
          onClick={() => setActiveTab('profil')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profil' ? 'text-green-600 dark:text-green-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-bold">Profil</span>
        </button>
      </div>
    </div>
  );
}
