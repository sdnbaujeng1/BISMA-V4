import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Camera, 
  CheckCircle2, 
  QrCode, 
  UserCheck, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  SwitchCamera, 
  AlertCircle, 
  Play, 
  Square,
  Sparkles,
  Check
} from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

export default function PresensiQR({ user, onNavigate }: { user: any, onNavigate: (page: string) => void }) {
  // Set default category and open camera immediately by default
  const [jenisPresensiOptions, setJenisPresensiOptions] = useState<string[]>([
    'Pembiasaan Sholat',
    'Ekstrakurikuler',
    'Presensi Harian',
    'Literasi & Numerasi'
  ]);
  const [jenisPresensi, setJenisPresensi] = useState<string>('Pembiasaan Sholat');
  const [ekskulOptions, setEkskulOptions] = useState<string[]>(['Pramuka', 'PMR', 'Paskibra', 'Seni Tari', 'Bulu Tangkis']);
  const [ekstra, setEkstra] = useState('Pramuka');
  
  // Camera active by default
  const [scanning, setScanning] = useState(true);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraKey, setCameraKey] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const [nisn, setNisn] = useState('');
  const [rekap, setRekap] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [lastScanned, setLastScanned] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Cooldown tracker to prevent duplicate multi-scans of identical QR
  const lastScannedRef = useRef<{ nisn: string; time: number }>({ nisn: '', time: 0 });

  useEffect(() => {
    fetch('/api/pengaturan?keys=qr_jenis_presensi,qr_ekskul_options')
      .then(res => res.json())
      .then(res => {
         if (res.success && res.data) {
           try {
             if (res.data.qr_jenis_presensi) {
               const parsed = JSON.parse(res.data.qr_jenis_presensi);
               if (Array.isArray(parsed) && parsed.length > 0) {
                 setJenisPresensiOptions(parsed);
                 setJenisPresensi(parsed[0]);
               }
             }
             if (res.data.qr_ekskul_options) {
               const parsedEkskul = JSON.parse(res.data.qr_ekskul_options);
               if (Array.isArray(parsedEkskul) && parsedEkskul.length > 0) {
                 setEkskulOptions(parsedEkskul);
                 setEkstra(parsedEkskul[0]);
               }
             }
           } catch(e) {}
         }
      })
      .catch(err => console.warn('Could not load QR categories:', err));
  }, []);

  // Web Audio synthesizer beep for instant audio feedback
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // 880 Hz (A5)
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch (e) {
      // Audio context may be restricted by browser autoplay policy
    }
  };

  const handleScanResult = async (detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0 && !isProcessing) {
      const scannedRaw = detectedCodes[0].rawValue;
      if (scannedRaw) {
        await processPresensi(scannedRaw);
      }
    }
  };

  const processPresensi = async (studentNisn: string) => {
    if (!studentNisn || !studentNisn.trim()) return;

    const rawVal = studentNisn.trim();
    let nisnToSearch = rawVal;
    let timestampToSave = new Date();

    // Parse JSON or pipe formats if present
    try {
      const parsed = JSON.parse(rawVal);
      if (parsed.nisn || parsed.NISN || parsed.nis || parsed.NIS || parsed.id) {
        nisnToSearch = String(parsed.nisn || parsed.NISN || parsed.nis || parsed.NIS || parsed.id);
      }
      if (parsed.time || parsed.timestamp || parsed.tanggal) {
        const t = parsed.time || parsed.timestamp || parsed.tanggal;
        const parsedDate = new Date(t);
        if (!isNaN(parsedDate.getTime())) {
          timestampToSave = parsedDate;
        }
      }
    } catch (e) {
      if (rawVal.includes('|')) {
        const parts = rawVal.split('|');
        nisnToSearch = parts[0].trim();
        if (parts[1]) {
          const parsedDate = new Date(parts[1].trim());
          if (!isNaN(parsedDate.getTime())) {
            timestampToSave = parsedDate;
          }
        }
      }
    }

    nisnToSearch = nisnToSearch.replace(/["'\r\n]/g, '').trim();

    // Cooldown check for duplicate scan of identical card
    const now = Date.now();
    if (lastScannedRef.current.nisn === nisnToSearch && (now - lastScannedRef.current.time) < 2500) {
      return; // Ignore repetitive scan of same card
    }
    lastScannedRef.current = { nisn: nisnToSearch, time: now };

    setIsProcessing(true);

    try {
      // 1. Get student details from DB (using limit(1) to prevent single() errors)
      const { data: studentRows, error: studentError } = await supabase
        .from('murid')
        .select('"Nama Lengkap", "Kelas", "NISN", "NIS"')
        .or(`"NISN".eq."${nisnToSearch}","NIS".eq."${nisnToSearch}"`)
        .limit(1);

      if (studentError || !studentRows || studentRows.length === 0) {
        setErrorMsg(`Siswa dengan NISN/NIS "${nisnToSearch}" tidak ditemukan.`);
        setTimeout(() => setErrorMsg(''), 3500);
        return;
      }

      const studentData = studentRows[0];
      const namaSiswa = studentData['Nama Lengkap'];
      const actualNisn = studentData['NISN'] || nisnToSearch;
      const kelasSiswa = studentData['Kelas'] || '-';

      const options: Intl.DateTimeFormatOptions = { 
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      };
      const formattedTime = timestampToSave.toLocaleString('id-ID', options).replace(/\./g, ':');

      const activeJenis = jenisPresensi || 'Pembiasaan Sholat';
      const detailText = activeJenis === 'Ekstrakurikuler' ? (ekstra || 'Ekskul') : activeJenis;

      // 2. Insert into official 'presensi' table
      const presensiPayload = {
        timestamp: timestampToSave.toISOString(),
        nip: user?.nip || user?.username || 'PETUGAS',
        nama_guru: user?.nama || user?.name || 'Petugas Scan QR',
        nisn: actualNisn,
        nama_murid: namaSiswa,
        kelas: kelasSiswa,
        presensi: 'H',
        ekstra: `QR - ${detailText}`
      };

      const { error: insertPresensiErr } = await supabase.from('presensi').insert([presensiPayload]);
      if (insertPresensiErr) {
        console.warn('Warning inserting into presensi table:', insertPresensiErr);
      }

      // 3. Also try presensi_qr table if available
      try {
        await supabase.from('presensi_qr').insert([{
          nisn: actualNisn,
          nama: namaSiswa,
          kelas: kelasSiswa,
          jenis: activeJenis,
          detail: activeJenis === 'Ekstrakurikuler' ? ekstra : '',
          timestamp: timestampToSave.toISOString()
        }]);
      } catch (e) {
        // Safe to ignore if presensi_qr does not exist
      }

      // Audio and visual notification
      playBeep();

      const successSummary = `${namaSiswa} • ${kelasSiswa}`;
      setSuccessMsg(successSummary);
      setLastScanned({
        nama: namaSiswa,
        kelas: kelasSiswa,
        nisn: actualNisn,
        waktu: formattedTime,
        jenis: detailText
      });

      setRekap(prev => [{ waktu: formattedTime, nama: namaSiswa, kelas: kelasSiswa, jenis: detailText }, ...prev]);
      
      setTimeout(() => setSuccessMsg(''), 3000);

    } catch (err: any) {
      console.error('Error processing presensi:', err);
      setErrorMsg('Gagal memproses presensi: ' + (err?.message || 'Kesalahan sistem.'));
      setTimeout(() => setErrorMsg(''), 3500);
    } finally {
      setIsProcessing(false);
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

  const toggleCameraFacing = () => {
    setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment');
    setCameraKey(k => k + 1);
  };

  const restartCamera = () => {
    setCameraError(null);
    setScanning(true);
    setCameraKey(k => k + 1);
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
              className="p-2 rounded-xl hover:bg-white/20 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Presensi Scan QR
              </h1>
              <p className="text-emerald-100 text-xs hidden sm:block">Pemindai kartu siswa cepat untuk Guru & Tendik</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Suara Beep Aktif" : "Suara Beep Dimatikan"}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-emerald-200" />}
            </button>
            <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/80 text-white font-medium px-3 py-1 rounded-full border border-emerald-400/50 shadow-xs">
              <span className={`w-2 h-2 rounded-full ${scanning ? 'bg-emerald-200 animate-pulse' : 'bg-slate-300'}`} />
              {scanning ? 'Kamera Aktif' : 'Kamera Jeda'}
            </span>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow p-3 sm:p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Card Form & Scanner */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            
            {/* Category Quick Selector */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Kategori Presensi Saat Ini
                </label>
                <span className="text-xs text-slate-500 dark:text-slate-400">Pilih untuk disesuaikan</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <select 
                    value={jenisPresensi} 
                    onChange={e => setJenisPresensi(e.target.value)}
                    className="w-full min-h-[46px] border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 dark:text-white transition-colors"
                  >
                    {jenisPresensiOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {jenisPresensi === 'Ekstrakurikuler' && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <select 
                      value={ekstra} 
                      onChange={e => setEkstra(e.target.value)}
                      className="w-full min-h-[46px] border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 dark:text-white transition-colors"
                    >
                      {ekskulOptions.map(opt => (
                        <option key={opt} value={opt}>Ekskul: {opt}</option>
                      ))}
                    </select>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Scanner Viewport (Active by Default) */}
            <div className="space-y-4">
              
              {/* Viewfinder Frame */}
              <div className="relative border-4 border-emerald-500 rounded-2xl overflow-hidden aspect-square sm:aspect-4/3 max-w-md mx-auto bg-slate-950 flex items-center justify-center shadow-md">
                {scanning ? (
                  <div className="w-full h-full object-cover relative">
                    <Scanner
                      key={`scanner-${cameraKey}-${cameraFacing}`}
                      onScan={handleScanResult}
                      constraints={{
                        facingMode: cameraFacing
                      }}
                      styles={{
                        container: { width: '100%', height: '100%' },
                        video: { objectFit: 'cover' }
                      }}
                      onError={(error: any) => {
                        console.error("Camera error:", error);
                        const msg = error?.name === 'NotAllowedError'
                          ? "Izin akses kamera diblokir. Harap izinkan kamera di ikon gembok 🔒 address bar browser."
                          : "Gagal mengakses perangkat kamera. " + (error?.message || "");
                        setCameraError(msg);
                      }}
                      components={{
                        onOff: false,
                        torch: true,
                        zoom: false,
                        finder: true,
                      }}
                    />
                    
                    {/* Floating Scanner Guide Box */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-4">
                      <div className="bg-slate-900/80 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20 shadow-xs flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        Arahkan QR Siswa ke Kotak Pemindai
                      </div>
                      
                      <div className="text-[11px] text-white/80 bg-black/60 px-3 py-1 rounded-md">
                        Kamera: {cameraFacing === 'environment' ? 'Belakang (Utama)' : 'Depan'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-400 flex flex-col items-center gap-3 p-6 text-center">
                    <Camera className="w-16 h-16 opacity-50" />
                    <div>
                      <p className="text-base font-bold text-slate-200">Kamera Dijeda</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">Tekan tombol di bawah untuk mengaktifkan pemindai kembali</p>
                    </div>
                  </div>
                )}

                {/* Error Banner Overlay */}
                {cameraError && (
                  <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center text-white p-5 text-center z-30">
                    <AlertCircle className="w-12 h-12 text-amber-400 mb-2" />
                    <p className="text-sm font-bold text-amber-200 mb-1">Akses Kamera Terkendala</p>
                    <p className="text-xs text-slate-300 max-w-xs mb-4 leading-relaxed">{cameraError}</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={restartCamera}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Coba Buka Lagi
                      </button>
                      <button 
                        onClick={toggleCameraFacing}
                        className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <SwitchCamera className="w-3.5 h-3.5" />
                        Ganti Kamera
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Real-time Non-blocking Success Banner */}
                <AnimatePresence>
                  {successMsg && (
                    <motion.div 
                      initial={{ opacity: 0, y: -20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.9 }}
                      className="absolute top-4 left-4 right-4 bg-emerald-600/95 backdrop-blur-sm border-2 border-emerald-300 text-white py-2.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2.5 z-25 text-center"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
                      <span className="text-sm font-bold truncate">{successMsg}</span>
                    </motion.div>
                  )}
                  {errorMsg && (
                    <motion.div 
                      initial={{ opacity: 0, y: -20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.9 }}
                      className="absolute top-4 left-4 right-4 bg-rose-600/95 backdrop-blur-sm border-2 border-rose-300 text-white py-2.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 z-25 text-center"
                    >
                      <AlertCircle className="w-5 h-5 text-rose-200 shrink-0" />
                      <span className="text-xs sm:text-sm font-bold">{errorMsg}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Camera Action Control Bar */}
              <div className="max-w-md mx-auto grid grid-cols-2 gap-2.5">
                <button 
                  onClick={() => setScanning(!scanning)}
                  className={`min-h-[48px] py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] cursor-pointer ${
                    scanning 
                      ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {scanning ? (
                    <>
                      <Square className="w-4 h-4 fill-current" />
                      Jeda Kamera
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Buka Kamera
                    </>
                  )}
                </button>

                <button 
                  onClick={toggleCameraFacing}
                  className="min-h-[48px] py-3 px-4 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-200 dark:border-slate-600"
                >
                  <SwitchCamera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Ganti Kamera
                </button>
              </div>

              {/* Latest Scanned Student Quick Card */}
              {lastScanned && (
                <div className="max-w-md mx-auto bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-emerald-950 dark:text-emerald-200 truncate">
                        {lastScanned.nama}
                      </div>
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-400 truncate">
                        {lastScanned.kelas} • NISN: {lastScanned.nisn}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-[11px] font-mono text-emerald-800 dark:text-emerald-300 shrink-0 ml-2">
                    {lastScanned.waktu.split(' ')[1] || lastScanned.waktu}
                  </div>
                </div>
              )}

              {/* Manual Input Fallback */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-5 mt-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                    Input Cadangan Manual (Jika Kartu Rusak/Sulit Dibaca)
                  </h3>
                </div>
                <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-2">
                  <input 
                    type="text" 
                    placeholder="Masukkan NISN atau NIS siswa..." 
                    value={nisn}
                    onChange={e => setNisn(e.target.value)}
                    className="flex-grow min-h-[44px] border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 dark:bg-slate-700 dark:text-white transition-colors"
                  />
                  <button 
                    type="submit"
                    className="min-h-[44px] bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-colors shadow-xs flex items-center justify-center cursor-pointer"
                  >
                    Simpan Presensi
                  </button>
                </form>
              </div>

            </div>
          </div>

          {/* Rekap Log Pemindaian Sesi Ini */}
          {rekap.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm sm:text-base font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                  <span className="w-2 h-4 bg-emerald-500 rounded-full"></span> 
                  Rekap Pemindaian Sesi Ini ({rekap.length} Siswa)
                </h3>
                <button
                  onClick={() => setRekap([])}
                  className="text-xs text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  Bersihkan Rekap
                </button>
              </div>
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
                        <td className="p-2.5 sm:p-3 font-semibold text-slate-800 dark:text-slate-100">{r.nama}</td>
                        <td className="p-2.5 sm:p-3 text-center font-bold text-emerald-600 dark:text-emerald-400">{r.kelas}</td>
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

