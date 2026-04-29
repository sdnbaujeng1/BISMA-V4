import { useEffect, useState } from 'react';
import { LogIn, Moon, Sun, BookOpen, AlertCircle, X, User, Backpack, Calculator, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSchoolIdentity } from '../hooks/useSchoolIdentity';
import HelpDeskFloat from '../components/HelpDeskFloat';

export default function PublicDashboard({ onNavigate, darkMode, toggleDarkMode }: { onNavigate: (page: string) => void, darkMode: boolean, toggleDarkMode: () => void }) {
  const [data, setData] = useState<any>(null);
  const schoolIdentity = useSchoolIdentity();
  const [time, setTime] = useState(new Date());
  const [showAbsentModal, setShowAbsentModal] = useState(false);
  const [fakeVisitor, setFakeVisitor] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // Visitor effect
    let visitorInterval: ReturnType<typeof setInterval>;
    
    const initVisitor = async () => {
      try {
        let baseCount = 324;
        let enableFake = true;
        
        const configRes = await fetch('/api/helpdesk-config');
        if (configRes.ok) {
           const configData = await configRes.json();
           if (configData.success && configData.data) {
              if (configData.data.base_visitor_count !== undefined) baseCount = parseInt(configData.data.base_visitor_count);
              if (configData.data.enable_fake_visitor !== undefined) enableFake = configData.data.enable_fake_visitor;
           }
        }
        
        const updateVisitor = () => {
           if (enableFake) {
             setFakeVisitor(prev => {
                if (prev === 0) return baseCount + Math.floor(Math.random() * 5);
                const change = Math.random() > 0.5 ? 1 : -1;
                return Math.max(baseCount, prev + change);
             });
           } else {
             setFakeVisitor(0);
           }
        }
        updateVisitor();
        visitorInterval = setInterval(updateVisitor, 3000);
      } catch (e) {}
    }
    
    initVisitor();
    
    // Load Public Dashboard Data
    const loadPublicData = () => {
      const storedData = localStorage.getItem('public_dashboard_data');
      if (storedData) {
        try {
          setData(JSON.parse(storedData));
        } catch (e) {
          console.error("Failed to parse public dashboard data", e);
          localStorage.removeItem('public_dashboard_data');
        }
      }
      
      if (!storedData) {
         setData({
           appName: "BISMA",
           pengumuman: "Selamat datang di Sistem Monitoring KBM. Silahkan login untuk akses fitur lainnya.",
           kelas1: 0, kelas2: 0, kelas3: 0, kelas4: 0, kelas5: 0, kelas6: 0,
           totalStudents: 0, totalJP: 0,
           completedKBM: 0, totalScheduled: 240, percentage: 0,
           absentStudents: []
         });
      }
    };

    loadPublicData();
    
    fetch('/api/public-dashboard')
      .then(res => res.json())
      .then(res => {
        if (res.success) setData(res.data);
      })
      .catch(() => {});

    return () => {
      clearInterval(timer);
      clearInterval(visitorInterval);
    };
  }, []);

  // Listen for storage changes to update in real-time
  useEffect(() => {
    const handleStorageChange = async () => {
      let localData = {};
      const storedData = localStorage.getItem('public_dashboard_data');
      if (storedData) {
        try {
          localData = JSON.parse(storedData);
        } catch (e) {}
      }
      
      try {
        const res = await fetch('/api/public-dashboard');
        const result = await res.json();
        if (result.success) {
          setData((prev: any) => ({ ...prev, ...localData, ...result.data }));
        } else {
          setData((prev: any) => ({ ...prev, ...localData }));
        }
      } catch (e) {
        setData((prev: any) => ({ ...prev, ...localData }));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('public-data-update', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('public-data-update', handleStorageChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 flex flex-col font-sans relative">
      <header className="w-full bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={schoolIdentity.schoolLogo} 
              alt="Logo" 
              className="h-12 w-12 object-contain drop-shadow-xl rounded-lg transform hover:scale-110 transition-transform duration-500" 
              style={{
                filter: 'drop-shadow(0 10px 8px rgb(0 0 0 / 0.2)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1))',
                transform: 'perspective(500px) rotateY(15deg)'
              }}
            />
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight leading-tight uppercase">
                {data?.appName || "BISMA"}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">
                {schoolIdentity.schoolName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {fakeVisitor > 0 && (
              <div className="flex flex-col items-end border-r border-slate-200 dark:border-slate-700 pr-4 md:pr-6">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">Live Visitors</span>
                <span className="font-mono text-lg font-light text-slate-800 dark:text-slate-200 leading-none flex items-center">
                  {fakeVisitor.toLocaleString('id-ID')}
                  <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full ml-2 animate-pulse"></span>
                </span>
              </div>
            )}
            
             <div className="hidden md:flex flex-col items-end mr-4">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <span className="text-xs font-mono text-green-600 dark:text-green-400 font-medium">
                  {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':')}
                </span>
             </div>

            <button 
              onClick={toggleDarkMode}
              className="hidden md:block p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => onNavigate('login')}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-sm text-sm"
            >
              <LogIn className="w-4 h-4" /> <span className="hidden sm:inline">Login</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 flex flex-col gap-8">
        {!data ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {/* Informasi Terkini Card */}
            <div className="mb-6">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl shadow-lg shadow-blue-200 dark:shadow-none text-white relative overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-1 drop-shadow-md">Informasi Terkini</h3>
                  <p className="text-blue-100 text-sm mb-4 font-medium">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <div className="flex items-center gap-2 text-xs font-bold bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm shadow-inner border border-white/10">
                    <div className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)] bg-green-400`}></div>
                    {data.announcementTitle || 'Sistem Online'}
                  </div>
                  {data.pengumuman && data.pengumuman !== 'Tidak ada pengumuman' && (
                    <p className="mt-3 text-xs md:text-sm text-blue-50 line-clamp-3 opacity-90">
                      {data.pengumuman}
                    </p>
                  )}
                </div>
                <div className="absolute -bottom-4 -right-4 transform rotate-12 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-50 rounded-full"></div>
                    <BookOpen className="w-32 h-32 text-white/20 drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {/* Total Siswa */}
              <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center h-40 md:h-48 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  <User className="w-6 h-6 md:w-8 md:h-8 text-blue-500 dark:text-blue-400" />
                </div>
                <div className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white mb-1">
                  {data.totalStudents || 0}
                </div>
                <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Siswa</p>
              </div>

              {/* Total JP */}
              <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center h-40 md:h-48 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Calculator className="w-6 h-6 md:w-8 md:h-8 text-emerald-500 dark:text-emerald-400" />
                </div>
                <div className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white mb-1">
                  {data.totalJP || 0}
                </div>
                <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total JP</p>
              </div>

              {/* KBM Terlaksana */}
              <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center h-40 md:h-48 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-purple-600"></div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-purple-500 dark:text-purple-400" />
                </div>
                <div className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white mb-1 flex items-baseline justify-center gap-1">
                  {data.completedKBM || 0} <span className="text-sm md:text-lg text-slate-400 font-medium">/ {data.totalScheduled || 0}</span>
                </div>
                <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">KBM Hari Ini</p>
              </div>

              {/* Ketidakhadiran */}
              <button 
                onClick={() => setShowAbsentModal(true)}
                className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center h-40 md:h-48 relative overflow-hidden group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600"></div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-2xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  <AlertCircle className="w-6 h-6 md:w-8 md:h-8 text-orange-500 dark:text-orange-400" />
                </div>
                <div className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white mb-1">
                  {data.absentStudents?.length || 0}
                </div>
                <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Absen Siswa</p>
              </button>
            </div>

            {/* Class Breakdown Section */}
            <div className="flex items-center gap-3 mt-2">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Rincian Siswa Per Kelas
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map(k => (
                <div key={k} className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group flex items-center gap-3 md:gap-4">
                  {/* 3D Icon Container */}
                  <div className={`w-14 h-14 md:w-20 md:h-20 rounded-2xl flex-shrink-0 flex flex-col items-center justify-center transform transition-transform duration-500 group-hover:scale-110 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.3)] bg-gradient-to-br ${
                    k === 1 ? 'from-red-400 to-red-600 shadow-red-500/40' : 
                    k === 2 ? 'from-orange-400 to-orange-600 shadow-orange-500/40' : 
                    k === 3 ? 'from-yellow-400 to-yellow-600 shadow-yellow-500/40' : 
                    k === 4 ? 'from-green-400 to-green-600 shadow-green-500/40' : 
                    k === 5 ? 'from-blue-400 to-blue-600 shadow-blue-500/40' : 
                    'from-purple-400 to-purple-600 shadow-purple-500/40'
                  }`}>
                    <Backpack className="w-7 h-7 md:w-10 md:h-10 text-white drop-shadow-md" />
                  </div>
                  
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mb-0.5 md:mb-1 truncate">Kelas {k}</span>
                    <span className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white leading-none truncate">
                      {data[`kelas${k}`] || 0}
                    </span>
                  </div>

                  {/* Decorative background blob */}
                  <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-5 blur-2xl ${
                    k === 1 ? 'bg-red-500' : k === 2 ? 'bg-orange-500' : k === 3 ? 'bg-yellow-500' : k === 4 ? 'bg-green-500' : k === 5 ? 'bg-blue-500' : 'bg-purple-500'
                  }`}></div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
      
      <footer className="py-6 text-center text-slate-400 dark:text-slate-600 text-sm">
        &copy; {new Date().getFullYear()} {schoolIdentity.schoolName}. All rights reserved.
      </footer>

      {/* Absent Modal */}
      <AnimatePresence>
        {showAbsentModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 bg-orange-50 dark:bg-orange-900/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Ketidakhadiran Murid</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Daftar siswa yang tidak hadir hari ini</p>
                  </div>
                </div>
                <button onClick={() => setShowAbsentModal(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              
              <div className="p-0 max-h-[60vh] overflow-y-auto">
                {data?.absentStudents && data.absentStudents.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {data.absentStudents.map((student: any, idx: number) => (
                      <div key={idx} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold">
                          {student.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800 dark:text-white">{student.name}</h4>
                          <p className="text-xs text-slate-500">Kelas {student.class}</p>
                        </div>
                        <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold rounded-full">
                          {student.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                    <p>Tidak ada data ketidakhadiran hari ini.</p>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                <button onClick={() => setShowAbsentModal(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <HelpDeskFloat />
    </div>
  );
}
