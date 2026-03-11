import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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

export default function App() {
  const [currentPage, setCurrentPage] = useState('public');
  const [user, setUser] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

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
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  useEffect(() => {
    const storedUser = localStorage.getItem('bisma_user');
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
        console.error("Failed to parse user data from localStorage", e);
        localStorage.removeItem('bisma_user');
      }
    }
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('bisma_user', JSON.stringify(userData));
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
    localStorage.removeItem('bisma_user');
    setCurrentPage('public');
  };

  const navigate = (page: string) => {
    setCurrentPage(page);
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

      {currentPage === 'public' && <PublicDashboard onNavigate={navigate} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
      {currentPage === 'login' && <Login onLogin={handleLogin} onNavigate={navigate} />}
      {currentPage === 'main' && <MainDashboard user={user} onLogout={handleLogout} onNavigate={navigate} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
      {currentPage === 'admin' && <AdminDashboard user={user} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
      {currentPage === 'monitoring' && <MonitoringDashboard onLogout={handleLogout} />}
      {currentPage === 'siswa' && <StudentDashboard user={user} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onNavigate={navigate} />}
      {currentPage === 'jurnal' && <Jurnal user={user} onNavigate={navigate} />}
      {currentPage === 'tugas_guru' && <TugasGuru user={user} onNavigate={navigate} />}
      {currentPage === 'jadwal_mengajar' && <JadwalMengajar user={user} onNavigate={navigate} />}
      {currentPage === 'laporan' && <Laporan user={user} onNavigate={navigate} />}
      {currentPage === 'rekap_absensi' && <RekapAbsensi user={user} onNavigate={navigate} />}
      {currentPage === 'keterlaksanaan_kbm' && <Keterlaksanaan onNavigate={navigate} />}
      {currentPage === 'kedisiplinan' && <Kedisiplinan user={user} onNavigate={navigate} />}
      {currentPage === 'presensi_qr' && <PresensiQR user={user} onNavigate={navigate} />}
      {currentPage === 'bank_sampah_guru' && <BankSampahGuru user={user} onNavigate={navigate} />}
      {currentPage === 'kasih_ibu_guru' && <KasihIbuGuru user={user} onNavigate={navigate} />}
      {currentPage === 'nilai_guru' && <NilaiGuru user={user} onNavigate={navigate} />}
      {currentPage === 'chatbot' && <ChatbotPage onNavigate={navigate} />}
      {currentPage === 'rpp_generator' && <IframePage title="RPP Generator AI" src="https://sigmabai.netlify.app/" onNavigate={navigate} backTo="main" />}
      {currentPage === 'kasih_ibu' && <IframePage title="Kasih Ibu" src="https://script.google.com/macros/s/AKfycbwcbvTOoHrgsoWsLgu9db49Po6R7NkqE5BfjCbInPUw2mz9uiDbRCOxesqbh4xT1k7M/exec" onNavigate={navigate} backTo="siswa" />}
      {currentPage === 'galeri_kegiatan' && <IframePage title="Galeri Kegiatan" src="https://www.sdnbaujeng1.sch.id/" onNavigate={navigate} backTo="main" />}
      {currentPage === 'rumah_pendidikan' && <IframePage title="Rumah Pendidikan" src="https://rumah.pendidikan.go.id/ruang/murid" onNavigate={navigate} backTo="siswa" />}
      {currentPage === 'bangkomar' && <IframePage title="Bangkomar" src="https://bangkomar.pasuruankab.go.id/" onNavigate={navigate} backTo="main" />}
      {currentPage === 'game_generator' && <IframePage title="Game Generator" src="https://sdnbaujeng1.github.io/gamegenerator/" onNavigate={navigate} backTo="main" />}
      {currentPage === 'edugame' && <IframePage title="Edugame" src="https://edugamev2.netlify.app/" onNavigate={navigate} backTo={user?.role === 'siswa' ? 'siswa' : 'main'} />}
    </div>
  );
}
