import React, { useState, useEffect } from 'react';
import { ArrowLeft, Camera, CheckCircle2, QrCode, UserCheck } from 'lucide-react';
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
  
  const [jenisPresensiOptions, setJenisPresensiOptions] = useState<string[]>(['Pembiasaan Sholat', 'Ekstrakurikuler']);
  const [ekskulOptions, setEkskulOptions] = useState<string[]>(['Pramuka', 'PMR', 'Paskibra']);

  useEffect(() => {
    fetch('/api/pengaturan?keys=qr_jenis_presensi,qr_ekskul_options')
      .then(res => res.json())
      .then(res => {
         if (res.success && res.data) {
           try {
             if (res.data.qr_jenis_presensi) setJenisPresensiOptions(JSON.parse(res.data.qr_jenis_presensi));
             if (res.data.qr_ekskul_options) setEkskulOptions(JSON.parse(res.data.qr_ekskul_options));
           } catch(e) {}
         }
      })
      .catch(err => console.warn('Could not load QR categories:', err));
  }, []);

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
      let nisnToSearch = studentNisn;
      let timestampToSave = new Date();
      
      try {
        const parsed = JSON.parse(studentNisn);
        if (parsed.nisn || parsed.NISN) {
          nisnToSearch = parsed.nisn || parsed.NISN;
        }
        if (parsed.time || parsed.timestamp || parsed.tanggal) {
          const t = parsed.time || parsed.timestamp || parsed.tanggal;
          timestampToSave = new Date(t);
        }
      } catch (e) {
        if (studentNisn.includes('|')) {
           const parts = studentNisn.split('|');
           nisnToSearch = parts[0];
           timestampToSave = new Date(parts[1]);
        }
      }

      if (isNaN(timestampToSave.getTime())) {
         timestampToSave = new Date();
      }

      // 1. Get student details from DB
      const { data: studentData, error: studentError } = await supabase
        .from('murid')
        .select('"Nama Lengkap", "Kelas", "NISN", "NIS"')
        .or(`"NISN".eq."${nisnToSearch}","NIS".eq."${nisnToSearch}"`)
        .single();

      if (studentError || !studentData) {
        setErrorMsg(`Siswa dengan NISN/ID "${nisnToSearch}" tidak ditemukan.`);
        setTimeout(() => setErrorMsg(''), 3500);
        return;
      }

      const namaSiswa = studentData['Nama Lengkap'];
      const actualNisn = studentData['NISN'] || nisnToSearch;

      const options: Intl.DateTimeFormatOptions = { 
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      };
      const formattedTime = timestampToSave.toLocaleString('id-ID', options).replace(/\./g, ':');

      // 2. Save to database
      const { error: insertError } = await supabase.from('presensi_qr').insert([{
        nisn: actualNisn,
        nama: namaSiswa,
        kelas: studentData.Kelas,
        jenis: jenisPresensi,
        detail: jenisPresensi === 'Ekstrakurikuler' ? ekstra : '',
        timestamp: timestampToSave.toISOString()
      }]);

      if (insertError) {
        console.error('Error inserting presensi:', insertError);
        throw insertError;
      }

      setSuccessMsg(`Berhasil Dicatat!\n${namaSiswa} (${studentData.Kelas})\n${formattedTime}`);
      setRekap(prev => [{ waktu: formattedTime, nama: namaSiswa, kelas: studentData.Kelas, jenis: jenisPresensi }, ...prev]);
      
      setTimeout(() => setSuccessMsg(''), 4000);

    } catch (err: any) {
      console.error('Error processing presensi:', err);
      setErrorMsg('Gagal memproses presensi: ' + (err?.message || 'Kesalahan sistem.'));
      setTimeout(() => setErrorMsg(''), 3500);
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
    if (!nisn.trim()) return;
    
    await processPresensi(nisn.trim());
    setNisn('');
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Responsive Header */}
      <header className="sticky top-0 z-30 bg-emerald-600 dark:bg-emerald-700 px-4 py-3.5 shadow-md print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onNavigate('main')} 
              aria-label="Kembali ke Menu Utama"
              className="p-2 rounded-xl hover:bg-white/20 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 hidden sm:inline-block" />
                Presensi QR
              </h1>
              <p className="text-emerald-100 text-xs hidden sm:block">Pindai kode QR kartu siswa atau input manual</p>
            </div>
          </div>
          <span className="text-xs bg-emerald-500/80 text-white font-medium px-2.5 py-1 rounded-full border border-emerald-400/50">
            Mode Langsung
          </span>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow p-3 sm:p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Card Form & Scanner */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            
            {/* Options Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
                  Jenis Presensi <span className="text-red-500">*</span>
                </label>
                <select 
                  value={jenisPresensi} 
                  onChange={e => setJenisPresensi(e.target.value)}
                  className="w-full min-h-[46px] border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 dark:text-white transition-colors"
                >
                  <option value="">-- Pilih Jenis Presensi --</option>
                  {jenisPresensiOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {jenisPresensi === 'Ekstrakurikuler' && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="block text-sm font-semibold mb-1.5 text-slate-700 dark:text-slate-200">
                    Ekstrakurikuler <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={ekstra} 
                    onChange={e => setEkstra(e.target.value)}
                    className="w-full min-h-[46px] border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 dark:text-white transition-colors"
                  >
                    <option value="">-- Pilih Ekstrakurikuler --</option>
                    {ekskulOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </motion.div>
              )}
            </div>

            {/* Scanner Viewport */}
            {jenisPresensi ? (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                
                {/* Viewfinder Frame */}
                <div className="relative border-4 border-emerald-500 rounded-2xl overflow-hidden aspect-square sm:aspect-4/3 max-w-md mx-auto bg-slate-950 flex items-center justify-center shadow-inner">
                  {scanning ? (
                    <div className="w-full h-full object-cover">
                      <Scanner
                        onScan={handleScanResult}
                        onError={(error: any) => {
                          console.error("Camera error:", error);
                          if (error && error.name === 'NotAllowedError') {
                             setScanning(false);
                             alert("Akses kamera ditolak. Silakan klik ikon gembok 🔒 di address bar browser Anda, pilih 'Allow' atau 'Izinkan' pada Camera, lalu muat ulang halaman.");
                          } else {
                             setErrorMsg("Gagal mengakses kamera. " + (error?.message || ""));
                             setTimeout(() => setErrorMsg(''), 4000);
                          }
                        }}
                        components={{
                          onOff: false,
                          torch: true,
                          zoom: false,
                          finder: true,
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-slate-400 flex flex-col items-center gap-3 p-4 text-center">
                      <Camera className="w-14 h-14 opacity-60" />
                      <p className="text-sm font-medium">Kamera saat ini belum aktif</p>
                      <p className="text-xs text-slate-500 max-w-xs">Tekan tombol di bawah untuk mulai memindai QR kartu siswa</p>
                    </div>
                  )}
                  
                  {/* Feedback Overlays */}
                  <AnimatePresence>
                    {successMsg && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 bg-emerald-600/95 flex flex-col items-center justify-center text-white p-6 text-center z-20"
                      >
                        <CheckCircle2 className="w-16 h-16 mb-3 text-white" />
                        <p className="text-base sm:text-lg font-bold whitespace-pre-line leading-relaxed">{successMsg}</p>
                      </motion.div>
                    )}
                    {errorMsg && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 bg-rose-600/95 flex flex-col items-center justify-center text-white p-6 text-center z-20"
                      >
                        <p className="text-base sm:text-lg font-bold leading-relaxed">{errorMsg}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Control Action Button */}
                <div className="max-w-md mx-auto">
                  <button 
                    onClick={() => setScanning(!scanning)}
                    className={`w-full min-h-[48px] py-3.5 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] ${
                      scanning 
                        ? 'bg-rose-500 hover:bg-rose-600 text-white' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <Camera className="w-5 h-5" />
                    {scanning ? 'Hentikan Pemindaian' : 'Mulai Scan Kamera'}
                  </button>
                </div>

                {/* Manual Input Fallback */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <UserCheck className="w-5 h-5 text-slate-500" />
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
                      Input Manual NISN / ID Siswa
                    </h3>
                  </div>
                  <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-2.5">
                    <input 
                      type="text" 
                      placeholder="Ketik NISN atau nomor identitas siswa..." 
                      value={nisn}
                      onChange={e => setNisn(e.target.value)}
                      className="flex-grow min-h-[46px] border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-700 dark:text-white transition-colors"
                    />
                    <button 
                      type="submit"
                      className="min-h-[46px] bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm sm:text-base transition-colors shadow-sm flex items-center justify-center"
                    >
                      Simpan
                    </button>
                  </form>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                <QrCode className="w-12 h-12 mx-auto mb-2 opacity-50 text-emerald-500" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">Pilih Jenis Presensi di atas untuk mengaktifkan pemindai.</p>
                <p className="text-xs text-slate-400 mt-1">Misal: Pembiasaan Sholat atau Ekstrakurikuler</p>
              </div>
            )}
          </div>

          {/* Rekap Log */}
          {rekap.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold mb-3 flex items-center gap-2 text-slate-800 dark:text-white">
                <span className="w-2.5 h-5 bg-emerald-500 rounded-full"></span> 
                Rekap Pemindaian Sesi Ini ({rekap.length})
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-xs sm:text-sm text-left">
                  <thead className="bg-slate-100 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="p-2.5 sm:p-3 whitespace-nowrap">Waktu</th>
                      <th className="p-2.5 sm:p-3">Nama Siswa</th>
                      <th className="p-2.5 sm:p-3 text-center">Kelas</th>
                      <th className="p-2.5 sm:p-3">Kategori</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800">
                    {rekap.map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                        <td className="p-2.5 sm:p-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">{r.waktu}</td>
                        <td className="p-2.5 sm:p-3 font-medium text-slate-800 dark:text-slate-100">{r.nama}</td>
                        <td className="p-2.5 sm:p-3 text-center font-bold text-slate-600 dark:text-slate-300">{r.kelas}</td>
                        <td className="p-2.5 sm:p-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{r.jenis}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
}
