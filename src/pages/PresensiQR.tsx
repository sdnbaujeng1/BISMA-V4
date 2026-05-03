import React, { useState, useEffect } from 'react';
import { ArrowLeft, Camera, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

export default function PresensiQR({ user, onNavigate }: { user: any, onNavigate: (page: string) => void }) {
  const [jenisPresensi, setJenisPresensi] = useState('');
  const [ekstra, setEkstra] = useState('');
  const [nisn, setNisn] = useState('');
  const [scanning, setScanning] = useState(false);
  const [rekap, setRekap] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Geofencing states
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocationChecking, setIsLocationChecking] = useState(true);
  const [isGeofenceValid, setIsGeofenceValid] = useState(false);

  useEffect(() => {
    const checkGeofencing = async () => {
      try {
        const res = await fetch('/api/pengaturan?keys=geofence_lat,geofence_lng,geofence_radius,geofence_roles');
        const data = await res.json();
        
        if (data.success && data.data) {
          let roles: string[] = [];
          try {
             roles = data.data.geofence_roles ? JSON.parse(data.data.geofence_roles) : [];
          } catch (e) {}

          const userRole = (user?.role || '').toLowerCase();
          const targetRoles = roles.map(r => r.toLowerCase());

          if (targetRoles.includes(userRole)) {
            // Geofencing applies to this user
            const lat = parseFloat(data.data.geofence_lat);
            const lng = parseFloat(data.data.geofence_lng);
            const radius = parseInt(data.data.geofence_radius);

            if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
              // Invalid config, allow bypass
              setIsGeofenceValid(true);
              setIsLocationChecking(false);
              return;
            }

            if (!navigator.geolocation) {
              setLocationError("Browser Anda tidak mendukung geolokasi.");
              setIsLocationChecking(false);
              return;
            }

            navigator.geolocation.getCurrentPosition(
              (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                
                // Haversine formula
                const R = 6371e3; // metres
                const p1 = lat * Math.PI/180;
                const p2 = userLat * Math.PI/180;
                const dp = (userLat-lat) * Math.PI/180;
                const dl = (userLng-lng) * Math.PI/180;

                const a = Math.sin(dp/2) * Math.sin(dp/2) +
                          Math.cos(p1) * Math.cos(p2) *
                          Math.sin(dl/2) * Math.sin(dl/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                const d = R * c;

                if (d <= radius) {
                  setIsGeofenceValid(true);
                } else {
                  setLocationError(`Anda berada di luar jangkauan area absensi. Jarak Anda: ${Math.round(d)} meter (Maksimal: ${radius}m).`);
                }
                setIsLocationChecking(false);
              },
              (error) => {
                console.error("Geolocation error:", error);
                if (error.code === error.PERMISSION_DENIED) {
                  setLocationError("Izin lokasi ditolak. Tolong izinkan akses lokasi untuk melakukan absensi.");
                } else {
                  setLocationError("Tidak dapat mengambil lokasi Anda saat ini. Pastikan GPS aktif.");
                }
                setIsLocationChecking(false);
              },
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );

          } else {
            // Role not targeted by geofencing, bypass
            setIsGeofenceValid(true);
            setIsLocationChecking(false);
          }
        } else {
           // No settings found, bypass
           setIsGeofenceValid(true);
           setIsLocationChecking(false);
        }
      } catch (err) {
        console.error("Error fetching geofencing settings:", err);
        // On error, let them proceed but warn
        setIsGeofenceValid(true);
        setIsLocationChecking(false);
      }
    };

    checkGeofencing();
  }, [user]);

  const handleScanResult = async (detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      setScanning(false);
      const scannedNisn = detectedCodes[0].rawValue;
      if (scannedNisn) {
        await processPresensi(scannedNisn);
      }
    }
  };

  const processPresensi = async (studentNisn: string) => {
    try {
      // 1. Get student details
      const { data: studentData, error: studentError } = await supabase
        .from('murid')
        .select('"Nama Lengkap", "Kelas", "NISN", "NIS"')
        .or(`"NISN".eq."${studentNisn}","NIS".eq."${studentNisn}"`)
        .single();

      if (studentError || !studentData) {
        setErrorMsg(`Siswa dengan ID ${studentNisn} tidak ditemukan.`);
        setTimeout(() => setErrorMsg(''), 3000);
        return;
      }

      const namaSiswa = studentData['Nama Lengkap'];
      const actualNisn = studentData['NISN'] || studentNisn;

      // 2. Save to database
      const { error: insertError } = await supabase.from('presensi_qr').insert([{
        nisn: actualNisn,
        nama: namaSiswa,
        kelas: studentData.Kelas,
        jenis: jenisPresensi,
        detail: jenisPresensi === 'Ekstrakurikuler' ? ekstra : '',
        timestamp: new Date().toISOString()
      }]);

      if (insertError) {
        console.error('Error inserting presensi:', insertError);
        throw insertError;
      }

      setSuccessMsg(`Berhasil: ${namaSiswa} (${studentData.Kelas})`);
      setRekap([{ waktu: new Date().toLocaleTimeString('id-ID'), nama: namaSiswa, kelas: studentData.Kelas }, ...rekap]);
      
      setTimeout(() => setSuccessMsg(''), 3000);

    } catch (err) {
      console.error('Error processing presensi:', err);
      setErrorMsg('Terjadi kesalahan sistem.');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jenisPresensi) {
      alert('Pilih jenis presensi terlebih dahulu');
      return;
    }
    if (jenisPresensi === 'Ekstrakurikuler' && !ekstra) {
      alert('Pilih ekstrakurikuler terlebih dahulu');
      return;
    }
    if (!nisn) return;
    
    await processPresensi(nisn);
    setNisn('');
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
      <header className="sticky top-0 z-30 bg-green-600 px-4 pb-4 pt-6 shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button onClick={() => onNavigate('main')} className="p-2 rounded-full hover:bg-white/20 text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-white">Presensi QR</h2>
        </div>
      </header>
      
      <main className="flex-grow p-4 md:p-6 mt-4">
        <div className="max-w-4xl mx-auto">
          {isLocationChecking ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Memeriksa Lokasi...</h3>
              <p className="text-slate-500 mt-2">Mohon tunggu, memastikan Anda berada di dalam area presensi.</p>
            </div>
          ) : locationError ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Terkendala Lokasi</h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">{locationError}</p>
              <button onClick={() => window.location.reload()} className="mt-6 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-2 px-6 rounded-xl transition-colors">
                Coba Lagi
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Jenis Presensi</label>
                <select 
                  value={jenisPresensi} 
                  onChange={e => setJenisPresensi(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-700 dark:text-white"
                >
                  <option value="">-- Pilih --</option>
                  <option value="Pembiasaan Sholat">Pembiasaan Sholat</option>
                  <option value="Ekstrakurikuler">Ekstrakurikuler</option>
                </select>
              </div>
              {jenisPresensi === 'Ekstrakurikuler' && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Ekstrakurikuler</label>
                  <select 
                    value={ekstra} 
                    onChange={e => setEkstra(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="">-- Pilih --</option>
                    <option value="Pramuka">Pramuka</option>
                    <option value="PMR">PMR</option>
                    <option value="Paskibra">Paskibra</option>
                  </select>
                </motion.div>
              )}
            </div>

            {jenisPresensi && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="mb-6 relative border-4 border-green-500 rounded-2xl overflow-hidden aspect-square md:aspect-video bg-slate-900 flex items-center justify-center shadow-inner w-full max-w-md mx-auto md:max-w-none">
                  {scanning ? (
                    <div className="w-full h-full object-cover">
                      <Scanner
                        onScan={handleScanResult}
                        onError={(error) => console.error(error)}
                        components={{
                          onOff: false,
                          torch: true,
                          zoom: false,
                          finder: true,
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-slate-500 flex flex-col items-center gap-3">
                      <Camera className="w-16 h-16 opacity-50" />
                      <p className="font-medium">Kamera tidak aktif</p>
                    </div>
                  )}
                  
                  <AnimatePresence>
                    {successMsg && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 bg-green-500/90 flex flex-col items-center justify-center text-white z-10"
                      >
                        <CheckCircle2 className="w-20 h-20 mb-4" />
                        <p className="text-xl font-bold text-center px-4">{successMsg}</p>
                      </motion.div>
                    )}
                    {errorMsg && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 bg-red-500/90 flex flex-col items-center justify-center text-white z-10"
                      >
                        <p className="text-xl font-bold text-center px-4">{errorMsg}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-8">
                  <button 
                    onClick={() => setScanning(!scanning)}
                    className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-md ${
                      scanning 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    <Camera className="w-6 h-6" />
                    {scanning ? 'Hentikan Kamera' : 'Mulai Scan QR'}
                  </button>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-8">
                  <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Input Manual</h3>
                  <form onSubmit={handleManualSubmit} className="flex gap-4">
                    <input 
                      type="text" 
                      placeholder="Masukkan NISN..." 
                      value={nisn}
                      onChange={e => setNisn(e.target.value)}
                      className="flex-grow border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-700 dark:text-white"
                    />
                    <button 
                      type="submit"
                      className="bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-sm"
                    >
                      Simpan
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </div>

          {rekap.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
                <span className="w-2 h-6 bg-green-500 rounded-full"></span> Rekap Hari Ini
              </h3>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="max-h-64 overflow-y-auto rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 sticky top-0">
                      <tr>
                        <th className="p-3 text-left w-32">Waktu</th>
                        <th className="p-3 text-left">Nama</th>
                        <th className="p-3 text-center w-24">Kelas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                      {rekap.length === 0 ? (
                        <tr><td colSpan={3} className="p-6 text-center text-slate-500 dark:text-slate-400 italic">Belum ada presensi hari ini.</td></tr>
                      ) : rekap.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <td className="p-3 font-mono text-slate-500 dark:text-slate-400">{r.waktu}</td>
                          <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{r.nama}</td>
                          <td className="p-3 text-center font-bold text-slate-600 dark:text-slate-400">{r.kelas}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
          </>
          )}
        </div>
      </main>
    </div>
  );
}
