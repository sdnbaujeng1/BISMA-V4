import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Share, X, Check, Smartphone, Monitor } from 'lucide-react';
import { useSchoolIdentity } from './hooks/useSchoolIdentity';
import { safeStorage } from './lib/storage';
import PublicDashboard from './pages/PublicDashboard';
import Login from './pages/Login';
import MainDashboard from './pages/MainDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Jurnal from './pages/Jurnal';
import Laporan from './pages/Laporan';
import RekapAbsensi from './pages/RekapAbsensi';
import Keterlaksanaan from './pages/Keterlaksanaan';
import Kedisiplinan from './pages/Kedisiplinan';
import PresensiQR from './pages/PresensiQR';
import IframePage from './pages/IframePage';
import ChatbotPage from './pages/ChatbotPage';

import StudentDashboard from './pages/StudentDashboard';
import JadwalMengajar from './pages/JadwalMengajar';
import TugasGuru from './pages/TugasGuru';
import BankSampahGuru from './pages/BankSampahGuru';
import KasihIbuGuru from './pages/KasihIbuGuru';
import NilaiGuru from './pages/NilaiGuru';

import MonitoringDashboard from './pages/MonitoringDashboard';

import { supabase } from './lib/supabase';

export default function App() {
  useSchoolIdentity(); // Initialize global school identity
  const [currentPage, setCurrentPage] = useState('public');
  const [user, setUser] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(() => {
    return safeStorage.getItem('theme') === 'dark';
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Global tracking of Visitors
    const globalRoom = supabase.channel('public_visitors', {
      config: {
        presence: {
          key: Math.random().toString(36).substring(7),
        },
      },
    });

    globalRoom.subscribe(async (status) => {
      try {
        if (status === 'SUBSCRIBED') {
          const storedUser = safeStorage.getItem('bisma_user') || safeStorage.getItem('userData');
          let role = 'visitor';
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser);
              role = parsed.role || 'visitor';
            } catch(e) {}
          }
          await globalRoom.track({ online_at: new Date().toISOString(), role });
        }
      } catch (e) {
        console.warn("Visitor tracking skipped:", e);
      }
    });

    return () => {
      globalRoom.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const checkStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIOSDevice);

    // If on iOS and not yet installed to home screen, offer install button
    if (isIOSDevice && !checkStandalone) {
      setShowInstallButton(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!checkStandalone) {
        setShowInstallButton(true);
      }
    };

    const handleInstalled = () => {
      setIsStandalone(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallButton(false);
      }
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      safeStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      safeStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  useEffect(() => {
    const storedUser = safeStorage.getItem('bisma_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (currentPage === 'public' || currentPage === 'login') {
          if (parsedUser.role === 'admin') {
            setCurrentPage('admin');
          } else if (parsedUser.role === 'siswa') {
            setCurrentPage('siswa');
          } else if (parsedUser.role === 'monitoring') {
            setCurrentPage('monitoring');
          } else {
            setCurrentPage('main');
          }
        }
      } catch (e) {
        console.error("Failed to parse user data from safeStorage", e);
        safeStorage.removeItem('bisma_user');
      }
    }
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    safeStorage.setItem('bisma_user', JSON.stringify(userData));
    if (userData.role === 'admin') {
      setCurrentPage('admin');
    } else if (userData.role === 'siswa') {
      setCurrentPage('siswa');
    } else if (userData.role === 'monitoring') {
      setCurrentPage('monitoring');
    } else {
      setCurrentPage('main');
    }
  };

  const handleLogout = () => {
    setUser(null);
    safeStorage.removeItem('bisma_user');
    setCurrentPage('public');
  };

  const navigate = (page: string) => {
    setCurrentPage(page);
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'public':
        return <PublicDashboard onNavigate={navigate} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />;
      case 'login':
        return <Login onLogin={handleLogin} onNavigate={navigate} />;
      case 'main':
        return <MainDashboard user={user} onLogout={handleLogout} onNavigate={navigate} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />;
      case 'admin':
        return <AdminDashboard user={user} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onNavigate={navigate} />;
      case 'monitoring':
        return <MonitoringDashboard onLogout={handleLogout} />;
      case 'siswa':
        return <StudentDashboard user={user} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onNavigate={navigate} />;
      case 'jurnal':
        return <Jurnal user={user} onNavigate={navigate} />;
      case 'tugas_guru':
      case 'tugas':
        if (user?.role === 'siswa') {
          return <StudentDashboard user={user} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onNavigate={navigate} />;
        }
        return <TugasGuru user={user} onNavigate={navigate} />;
      case 'jadwal_mengajar':
      case 'jadwal':
        if (user?.role === 'siswa') {
          return <StudentDashboard user={user} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onNavigate={navigate} />;
        }
        return <JadwalMengajar user={user} onNavigate={navigate} />;
      case 'laporan':
        return <Laporan user={user} onNavigate={navigate} />;
      case 'rekap_absensi':
      case 'kehadiran':
      case 'absensi':
        if (user?.role === 'siswa') {
          return <StudentDashboard user={user} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onNavigate={navigate} />;
        }
        return <RekapAbsensi user={user} onNavigate={navigate} />;
      case 'keterlaksanaan_kbm':
        return <Keterlaksanaan onNavigate={navigate} />;
      case 'kedisiplinan':
      case 'pelanggaran':
        if (user?.role === 'siswa') {
          return <StudentDashboard user={user} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onNavigate={navigate} />;
        }
        return <Kedisiplinan user={user} onNavigate={navigate} />;
      case 'presensi_qr':
        return <PresensiQR user={user} onNavigate={navigate} />;
      case 'bank_sampah_guru':
      case 'bank_sampah':
        if (user?.role === 'siswa') {
          return <StudentDashboard user={user} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onNavigate={navigate} />;
        }
        return <BankSampahGuru user={user} onNavigate={navigate} />;
      case 'kasih_ibu_guru':
        return <KasihIbuGuru user={user} onNavigate={navigate} />;
      case 'nilai_guru':
      case 'nilai':
      case 'nilai_siswa':
        if (user?.role === 'siswa') {
          return <StudentDashboard user={user} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onNavigate={navigate} />;
        }
        return <NilaiGuru user={user} onNavigate={navigate} />;
      case 'chatbot':
        return <ChatbotPage onNavigate={navigate} />;
      case 'rpp_generator':
        return <IframePage title="RPP Generator AI" src="https://sigmabai.netlify.app/" onNavigate={navigate} backTo={user?.role === 'siswa' ? 'siswa' : 'main'} />;
      case 'kasih_ibu':
        if (user?.role === 'guru' || user?.role === 'tendik' || user?.role === 'walikelas') {
          return <KasihIbuGuru user={user} onNavigate={navigate} />;
        }
        return <IframePage title="Kasih Ibu" src="https://script.google.com/macros/s/AKfycbwcbvTOoHrgsoWsLgu9db49Po6R7NkqE5BfjCbInPUw2mz9uiDbRCOxesqbh4xT1k7M/exec" onNavigate={navigate} backTo={user?.role === 'siswa' ? 'siswa' : 'main'} />;
      case 'galeri_kegiatan':
        return <IframePage title="Galeri Kegiatan" src="https://www.sdnbaujeng1.sch.id/" onNavigate={navigate} backTo={user?.role === 'siswa' ? 'siswa' : 'main'} />;
      case 'rumah_pendidikan':
        return <IframePage title="Rumah Pendidikan" src="https://rumah.pendidikan.go.id/ruang/murid" onNavigate={navigate} backTo={user?.role === 'siswa' ? 'siswa' : 'main'} />;
      case 'bangkomar':
        return <IframePage title="Bangkomar" src="https://bangkomar.pasuruankab.go.id/" onNavigate={navigate} backTo={user?.role === 'siswa' ? 'siswa' : 'main'} />;
      case 'game_generator':
        return <IframePage title="Game Generator" src="https://script.google.com/macros/s/AKfycbxg4OScIlFNDzkksUBfb5l6iYZqpRqPOoG94AazQESC0llZS5_nkHQIkJgNIUhNCzy21Q/exec" onNavigate={navigate} backTo={user?.role === 'siswa' ? 'siswa' : 'main'} />;
      case 'edugame':
        return <IframePage title="Edugame" src="https://edugamev2.netlify.app/" onNavigate={navigate} backTo={user?.role === 'siswa' ? 'siswa' : 'main'} />;
      default:
        // Absolute fallback to ensure the screen NEVER displays blank
        if (user?.role === 'admin') {
          return <AdminDashboard user={user} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onNavigate={navigate} />;
        }
        if (user?.role === 'siswa') {
          return <StudentDashboard user={user} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onNavigate={navigate} />;
        }
        if (user?.role === 'monitoring') {
          return <MonitoringDashboard onLogout={handleLogout} />;
        }
        if (user) {
          return <MainDashboard user={user} onLogout={handleLogout} onNavigate={navigate} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />;
        }
        return <PublicDashboard onNavigate={navigate} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 print:bg-white print:dark:bg-white print:min-h-0 font-sans text-slate-800 dark:text-slate-200 transition-colors relative">
      <AnimatePresence>
        {showInstallButton && (
          <motion.button
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            onClick={handleInstallClick}
            className="fixed bottom-6 right-6 z-[100] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-5 py-3 rounded-full shadow-[0_10px_25px_rgba(16,185,129,0.4)] flex items-center gap-3 font-bold transition-all transform hover:scale-105 print:hidden border border-emerald-400/40"
          >
            <div className="bg-white/20 p-1.5 rounded-full">
              <Download className="w-5 h-5 text-white" />
            </div>
            <span>Install Aplikasi</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* iOS Safari Guided Install Modal */}
      <AnimatePresence>
        {showIOSModal && (
          <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 relative"
            >
              <button
                onClick={() => setShowIOSModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Install di iPhone / iPad</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Tambahkan ke Layar Utama</p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 mb-6">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                  <p>Ketuk tombol <strong>Bagikan (Share)</strong> <Share className="w-4 h-4 inline-block text-blue-500 mx-1 align-text-bottom" /> pada bilah menu Safari di bagian bawah.</p>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                  <p>Gulir ke bawah dan pilih <strong>"Tambahkan ke Layar Utama"</strong> (Add to Home Screen).</p>
                </div>
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                  <p>Buka ikon <strong>BISMA</strong> dari Layar Utama untuk akses instan!</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-lg shadow-emerald-600/30"
              >
                Mengerti
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {renderContent()}
    </div>
  );
}
