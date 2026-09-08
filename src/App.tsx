import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
    let timer: NodeJS.Timeout;
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
      
      // Auto hide after 15 seconds
      timer = setTimeout(() => {
        setShowInstallButton(false);
      }, 15000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
    setShowInstallButton(false);
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200 transition-colors relative">
      <AnimatePresence>
        {showInstallButton && (
          <motion.button
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            onClick={handleInstallClick}
            className="fixed bottom-6 right-6 z-[100] bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-bold transition-all transform hover:scale-105"
          >
            <div className="bg-white/20 p-1.5 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </div>
            Install Aplikasi
          </motion.button>
        )}
      </AnimatePresence>

      {renderContent()}
    </div>
  );
}
