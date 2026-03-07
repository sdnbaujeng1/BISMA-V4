import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Camera } from 'lucide-react';

export default function PresensiQR({ user, onNavigate }: { user: any, onNavigate: (page: string) => void }) {
  const [jenisPresensi, setJenisPresensi] = useState('');
  const [ekstra, setEkstra] = useState('');
  const [nisn, setNisn] = useState('');
  const [scanning, setScanning] = useState(false);
  const [rekap, setRekap] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Mock rekap data
    setRekap([
      { waktu: new Date().toLocaleTimeString(), nama: 'Andi', kelas: '1' }
    ]);
  }, []);

  const handleScan = () => {
    if (!jenisPresensi) {
      alert('Pilih jenis presensi terlebih dahulu');
      return;
    }
    setScanning(true);
    // In a real app, we'd use jsQR or similar to scan from video stream
    // For now, we'll just simulate a scan after 2 seconds
    setTimeout(() => {
      setScanning(false);
      alert('Scan berhasil (Simulasi)');
      setRekap([{ waktu: new Date().toLocaleTimeString(), nama: 'Budi', kelas: '1' }, ...rekap]);
    }, 2000);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jenisPresensi) {
      alert('Pilih jenis presensi terlebih dahulu');
      return;
    }
    if (!nisn) return;
    
    alert(`Presensi manual untuk NISN ${nisn} berhasil (Simulasi)`);
    setRekap([{ waktu: new Date().toLocaleTimeString(), nama: `Murid (${nisn})`, kelas: '?' }, ...rekap]);
    setNisn('');
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50">
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
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700">Jenis Presensi</label>
                <select 
                  value={jenisPresensi} 
                  onChange={e => setJenisPresensi(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50"
                >
                  <option value="">-- Pilih --</option>
                  <option value="Hadir">Hadir KBM</option>
                  <option value="Ekstrakurikuler">Ekstrakurikuler</option>
                </select>
              </div>
              {jenisPresensi === 'Ekstrakurikuler' && (
                <div className="animate-in fade-in duration-300">
                  <label className="block text-sm font-medium mb-2 text-slate-700">Ekstrakurikuler</label>
                  <select 
                    value={ekstra} 
                    onChange={e => setEkstra(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50"
                  >
                    <option value="">-- Pilih --</option>
                    <option value="Pramuka">Pramuka</option>
                    <option value="PMR">PMR</option>
                  </select>
                </div>
              )}
            </div>

            {jenisPresensi && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="mb-6 relative border-4 border-green-500 rounded-2xl overflow-hidden aspect-video bg-slate-900 flex items-center justify-center shadow-inner">
                  {scanning ? (
                    <div className="text-green-400 flex flex-col items-center gap-3">
                      <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="font-mono animate-pulse">Memindai QR Code...</p>
                    </div>
                  ) : (
                    <div className="text-slate-500 flex flex-col items-center gap-3">
                      <Camera className="w-16 h-16 opacity-50" />
                      <p>Kamera tidak aktif</p>
                    </div>
                  )}
                  <video ref={videoRef} playsInline className="absolute inset-0 w-full h-full object-cover opacity-0"></video>
                </div>

                <div className="text-center mb-8">
                  <button 
                    onClick={handleScan}
                    disabled={scanning}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-3 mx-auto shadow-lg shadow-green-200 transition-all disabled:opacity-50 hover:-translate-y-1"
                  >
                    <Camera className="w-6 h-6" /> {scanning ? 'Membatalkan...' : 'Mulai Scan QR'}
                  </button>
                </div>

                <div className="relative flex items-center py-5 mb-8">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium uppercase tracking-wider">ATAU MANUAL</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <form onSubmit={handleManualSubmit} className="flex gap-3 justify-center max-w-md mx-auto">
                  <input 
                    type="text" 
                    value={nisn}
                    onChange={e => setNisn(e.target.value)}
                    placeholder="Masukkan NISN Manual" 
                    className="flex-grow border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 font-mono"
                  />
                  <button 
                    type="submit"
                    disabled={!nisn}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
                  >
                    Kirim
                  </button>
                </form>
              </div>
            )}

            <div className="mt-12 border-t border-slate-100 pt-8">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
                <span className="w-2 h-6 bg-green-500 rounded-full"></span> Rekap Hari Ini
              </h3>
              <div className="bg-slate-50 p-1 rounded-xl border border-slate-200">
                <div className="max-h-64 overflow-y-auto rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-200 text-slate-600 sticky top-0">
                      <tr>
                        <th className="p-3 text-left w-32">Waktu</th>
                        <th className="p-3 text-left">Nama</th>
                        <th className="p-3 text-center w-24">Kelas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {rekap.length === 0 ? (
                        <tr><td colSpan={3} className="p-6 text-center text-slate-500 italic">Belum ada presensi hari ini.</td></tr>
                      ) : rekap.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono text-slate-500">{r.waktu}</td>
                          <td className="p-3 font-medium text-slate-800">{r.nama}</td>
                          <td className="p-3 text-center font-bold text-slate-600">{r.kelas}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
