import { useState, useEffect } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';

export default function Laporan({ user, onNavigate }: { user: any, onNavigate: (page: string) => void }) {
  const [jurnalData, setJurnalData] = useState<any[]>([]);
  const [filterBulan, setFilterBulan] = useState('semua');
  const [loading, setLoading] = useState(true);

  const [headmasterName, setHeadmasterName] = useState("Drs. H. Ahmad");
  const [headmasterNIP, setHeadmasterNIP] = useState("196001011980031001");
  const [schoolName, setSchoolName] = useState("UPT Satuan Pendidikan SDN Baujeng 1");

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

  useEffect(() => {
    fetch(`/api/laporan?nip=${user?.NIP || ''}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setJurnalData(data.data);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [user]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
      <header className="sticky top-0 z-30 bg-green-600 px-4 pb-4 pt-6 shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button onClick={() => onNavigate('main')} className="p-2 rounded-full hover:bg-white/20 text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-white">Laporan Jurnal</h2>
        </div>
      </header>
      
      <main className="flex-grow p-4 md:p-6 mt-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 print:hidden mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tanggal</label>
                <input 
                  type="date" 
                  className="border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bulan</label>
                <select 
                  value={filterBulan} 
                  onChange={e => setFilterBulan(e.target.value)}
                  className="border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-700 dark:text-white"
                >
                  <option value="semua">Semua</option>
                  <option value="0-2024">Januari 2024</option>
                  <option value="1-2024">Februari 2024</option>
                  {/* Add more months */}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tahun</label>
                <select 
                  className="border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-700 dark:text-white"
                >
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                </select>
              </div>
            </div>
            <button 
              onClick={handlePrint}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-sm transition-colors mt-4 md:mt-0"
            >
              <Printer className="w-5 h-5" /> Cetak
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 text-black dark:text-white rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 print:shadow-none print:border-none print:p-0 print:bg-white print:text-black">
            <div className="flex items-center gap-6 mb-8 border-b-2 border-black dark:border-white print:border-black pb-6">
              <img src="https://i.imghippo.com/files/xbYy2711Wk.png" className="h-24 w-24 object-contain" alt="Logo" />
              <div className="text-left">
                <h3 className="text-2xl font-bold uppercase tracking-wide">{schoolName}</h3>
                <h4 className="text-xl font-semibold mt-1">Jurnal Guru: {user?.['Nama Guru']}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 print:text-slate-600 mt-1">Periode: {filterBulan === 'semua' ? 'Semua Waktu' : filterBulan}</p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">Memuat data laporan...</div>
            ) : (
              <table className="w-full text-sm border-collapse border border-slate-300 dark:border-slate-600 print:border-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-700 print:bg-slate-100">
                  <tr>
                    <th className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center w-12">No</th>
                    <th className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-left w-48">Hari, Tanggal</th>
                    <th className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center w-20">Kelas</th>
                    <th className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-left">Materi</th>
                    <th className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-left w-48">Ketidakhadiran</th>
                  </tr>
                </thead>
                <tbody>
                  {jurnalData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-6 text-center text-slate-500 dark:text-slate-400 italic">Tidak ada data jurnal.</td>
                    </tr>
                  ) : (
                    jurnalData.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 print:hover:bg-transparent">
                        <td className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center">{idx + 1}</td>
                        <td className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3">
                          {new Date(item.Timestamp).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </td>
                        <td className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center font-bold">{item.Kelas}</td>
                        <td className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3">
                          <span className="font-semibold">{item.Mata_Pelajaran}</span>: {item.Materi}
                        </td>
                        <td className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-slate-600 dark:text-slate-300 print:text-slate-600">
                          {item.Ketidakhadiran === '[]' ? 'Nihil' : item.Ketidakhadiran}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            <div className="mt-16 grid grid-cols-2 gap-8 text-sm text-black dark:text-white print:text-black">
              <div className="text-center">
                <p>Mengetahui Kepala Sekolah,</p>
                <br /><br /><br />
                <p className="font-bold underline">{headmasterName}</p>
                <p>NIP. {headmasterNIP}</p>
              </div>
              <div className="text-center">
                <p>Beji, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p>Guru Mata Pelajaran,</p>
                <br /><br /><br />
                <p className="font-bold underline">{user?.['Nama Guru']}</p>
                <p>NIP. {user?.NIP}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
