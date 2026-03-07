import { useState, useEffect } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';

export default function RekapAbsensi({ user, onNavigate }: { user: any, onNavigate: (page: string) => void }) {
  const [kelas, setKelas] = useState('');
  const [mapel, setMapel] = useState('');
  const [rekapData, setRekapData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [headmasterName, setHeadmasterName] = useState("Drs. H. Ahmad");
  const [headmasterNIP, setHeadmasterNIP] = useState("196001011980031001");
  const [schoolName, setSchoolName] = useState("UPT SDN Baujeng 1");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/pengaturan');
        const result = await res.json();
        if (result.success && result.data) {
          const data = result.data;
          if (data.schoolName) setSchoolName(data.schoolName);
          if (data.headmasterName) setHeadmasterName(data.headmasterName);
          if (data.headmasterNIP) setHeadmasterNIP(data.headmasterNIP);
        } else {
          // Fallback
          const stored = localStorage.getItem('school_identity_data');
          if (stored) {
            const data = JSON.parse(stored);
            if (data.schoolName) setSchoolName(data.schoolName);
            if (data.headmasterName) setHeadmasterName(data.headmasterName);
            if (data.headmasterNIP) setHeadmasterNIP(data.headmasterNIP);
          }
        }
      } catch (e) {
        // Fallback
        const stored = localStorage.getItem('school_identity_data');
        if (stored) {
          const data = JSON.parse(stored);
          if (data.schoolName) setSchoolName(data.schoolName);
          if (data.headmasterName) setHeadmasterName(data.headmasterName);
          if (data.headmasterNIP) setHeadmasterNIP(data.headmasterNIP);
        }
      }
    };
    fetchSettings();

    window.addEventListener('school-identity-update', fetchSettings);
    return () => window.removeEventListener('school-identity-update', fetchSettings);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    if (kelas && mapel) {
      setLoading(true);
      // Mocking data for now
      setTimeout(() => {
        setRekapData([
          { nisn: '001', nama: 'Andi', s: 0, i: 1, a: 0, d: 0, prosentase: '95%' },
          { nisn: '002', nama: 'Budi', s: 0, i: 0, a: 0, d: 0, prosentase: '100%' },
        ]);
        setLoading(false);
      }, 500);
    }
  }, [kelas, mapel]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
      <header className="sticky top-0 z-30 bg-green-600 px-4 pb-4 pt-6 shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button onClick={() => onNavigate('main')} className="p-2 rounded-full hover:bg-white/20 text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-white">Kehadiran Murid</h2>
        </div>
      </header>
      
      <main className="flex-grow p-4 md:p-6 mt-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 print:hidden mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Kelas</label>
                <select 
                  value={kelas} 
                  onChange={e => setKelas(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-700 dark:text-white"
                >
                  <option value="">-- Pilih Kelas --</option>
                  <option value="1">Kelas 1</option>
                  <option value="2">Kelas 2</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Mata Pelajaran</label>
                <select 
                  value={mapel} 
                  onChange={e => setMapel(e.target.value)}
                  disabled={!kelas}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-700 dark:text-white disabled:opacity-50"
                >
                  <option value="">-- Pilih Mata Pelajaran --</option>
                  <option value="Matematika">Matematika</option>
                  <option value="IPA">IPA</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Periode</label>
                <div className="flex gap-2">
                  <select className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-2 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-700 dark:text-white">
                    <option value="">Bulan</option>
                    <option value="1">Januari</option>
                    <option value="2">Februari</option>
                  </select>
                  <select className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-2 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-700 dark:text-white">
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={handlePrint}
                disabled={!kelas || !mapel}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
              >
                <Printer className="w-5 h-5" /> Cetak
              </button>
            </div>
          </div>

          {kelas && mapel && (
            <div className="bg-white dark:bg-slate-800 text-black dark:text-white rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 print:shadow-none print:border-none print:p-0 print:bg-white print:text-black">
              <div className="flex items-center gap-6 mb-8 border-b-2 border-black dark:border-white print:border-black pb-6">
                <img src="https://i.imghippo.com/files/xbYy2711Wk.png" className="h-24 w-24 object-contain" alt="Logo" />
                <div>
                  <h3 className="text-2xl font-bold uppercase tracking-wide">{schoolName}</h3>
                  <h4 className="text-xl font-semibold mt-1">Rekap Absensi: {mapel} (Kelas {kelas})</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 print:text-slate-600 mt-1">Tahun Ajaran 2023/2024</p>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">Memuat rekap absensi...</div>
              ) : (
                <table className="w-full text-sm border-collapse border border-slate-300 dark:border-slate-600 print:border-slate-300">
                  <thead className="bg-slate-100 dark:bg-slate-700 print:bg-slate-100">
                    <tr>
                      <th className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center w-12">No</th>
                      <th className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center w-32">NISN</th>
                      <th className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-left">Nama</th>
                      <th className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center w-12 bg-green-50 dark:bg-green-900/20 print:bg-green-50">S</th>
                      <th className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center w-12 bg-yellow-50 dark:bg-yellow-900/20 print:bg-yellow-50">I</th>
                      <th className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center w-12 bg-red-50 dark:bg-red-900/20 print:bg-red-50">A</th>
                      <th className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center w-12 bg-blue-50 dark:bg-blue-900/20 print:bg-blue-50">D</th>
                      <th className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center w-20 font-bold">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rekapData.map((m, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 print:hover:bg-transparent">
                        <td className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center text-slate-500 dark:text-slate-400 print:text-slate-500">{i + 1}</td>
                        <td className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center font-mono">{m.nisn}</td>
                        <td className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 font-medium">{m.nama}</td>
                        <td className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center">{m.s}</td>
                        <td className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center">{m.i}</td>
                        <td className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center">{m.a}</td>
                        <td className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center">{m.d}</td>
                        <td className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center font-bold text-green-700 dark:text-green-400 print:text-green-700">{m.prosentase}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="mt-16 grid grid-cols-2 gap-8 text-sm">
                <div className="text-center">
                  <p>Mengetahui Kepala Sekolah,</p>
                  <br /><br /><br />
                  <p className="font-bold underline">{headmasterName}</p>
                  <p>NIP. {headmasterNIP}</p>
                </div>
                <div className="text-center">
                  <p>Guru Mata Pelajaran,</p>
                  <br /><br /><br />
                  <p className="font-bold underline">{user?.['Nama Guru']}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
