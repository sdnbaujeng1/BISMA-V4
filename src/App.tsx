import { useState, useEffect } from 'react';
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

import StudentDashboard from './pages/StudentDashboard';
import JadwalMengajar from './pages/JadwalMengajar';
import BankSampahGuru from './pages/BankSampahGuru';
import KasihIbuGuru from './pages/KasihIbuGuru';

import MonitoringDashboard from './pages/MonitoringDashboard';

export default function App() {
  const [currentPage, setCurrentPage] = useState('public');
  const [user, setUser] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200 transition-colors">
      {currentPage === 'public' && <PublicDashboard onNavigate={navigate} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
      {currentPage === 'login' && <Login onLogin={handleLogin} onNavigate={navigate} />}
      {currentPage === 'main' && <MainDashboard user={user} onLogout={handleLogout} onNavigate={navigate} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
      {currentPage === 'admin' && <AdminDashboard user={user} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
      {currentPage === 'monitoring' && <MonitoringDashboard onLogout={handleLogout} />}
      {currentPage === 'siswa' && <StudentDashboard user={user} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} onNavigate={navigate} />}
      {currentPage === 'jurnal' && <Jurnal user={user} onNavigate={navigate} />}
      {currentPage === 'jadwal_mengajar' && <JadwalMengajar user={user} onNavigate={navigate} />}
      {currentPage === 'laporan' && <Laporan user={user} onNavigate={navigate} />}
      {currentPage === 'rekap_absensi' && <RekapAbsensi user={user} onNavigate={navigate} />}
      {currentPage === 'keterlaksanaan_kbm' && <Keterlaksanaan onNavigate={navigate} />}
      {currentPage === 'kedisiplinan' && <Kedisiplinan user={user} onNavigate={navigate} />}
      {currentPage === 'presensi_qr' && <PresensiQR user={user} onNavigate={navigate} />}
      {currentPage === 'bank_sampah_guru' && <BankSampahGuru user={user} onNavigate={navigate} />}
      {currentPage === 'kasih_ibu_guru' && <KasihIbuGuru user={user} onNavigate={navigate} />}
      {currentPage === 'rpp_generator' && <IframePage title="RPP Generator AI" src="https://chatgpt.com/" onNavigate={navigate} />}
      {currentPage === 'kasih_ibu' && <IframePage title="Kasih Ibu" src="https://script.google.com/macros/s/AKfycbwcbvTOoHrgsoWsLgu9db49Po6R7NkqE5BfjCbInPUw2mz9uiDbRCOxesqbh4xT1k7M/exec" onNavigate={navigate} />}
      {currentPage === 'galeri_kegiatan' && <IframePage title="Galeri Kegiatan" src="https://www.instagram.com/sdnbaujeng1beji/" onNavigate={navigate} />}
    </div>
  );
}
