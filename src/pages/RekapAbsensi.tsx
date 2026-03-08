import { useState, useEffect } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';

export default function RekapAbsensi({ user, onNavigate }: { user: any, onNavigate: (page: string) => void }) {
  const [kelas, setKelas] = useState('');
  const [filterBulan, setFilterBulan] = useState('semua');
  const [filterTahun, setFilterTahun] = useState('semua');
  const [rekapData, setRekapData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [headmasterName, setHeadmasterName] = useState("Drs. H. Ahmad");
  const [headmasterNIP, setHeadmasterNIP] = useState("196001011980031001");
  const [schoolName, setSchoolName] = useState("UPT SDN Baujeng 1");

  const months = [
    { value: '0', label: 'Januari' },
    { value: '1', label: 'Februari' },
    { value: '2', label: 'Maret' },
    { value: '3', label: 'April' },
    { value: '4', label: 'Mei' },
    { value: '5', label: 'Juni' },
    { value: '6', label: 'Juli' },
    { value: '7', label: 'Agustus' },
    { value: '8', label: 'September' },
    { value: '9', label: 'Oktober' },
    { value: '10', label: 'November' },
    { value: '11', label: 'Desember' }
  ];

  const years = ['2025', '2026', '2027'];

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
    if (kelas) {
      setLoading(true);
      // Fetch data from API based on kelas, filterBulan, filterTahun
      // For now, mocking data
      setTimeout(() => {
        setRekapData([
          { nisn: '001', nama: 'Andi', s: 0, i: 1, a: 0, d: 0, prosentase: '95%' },
          { nisn: '002', nama: 'Budi', s: 0, i: 0, a: 0, d: 0, prosentase: '100%' },
        ]);
        setLoading(false);
      }, 500);
    }
  }, [kelas, filterBulan, filterTahun]);

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
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 print:hidden mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-4">
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
                  <option value="3">Kelas 3</option>
                  <option value="4">Kelas 4</option>
                  <option value="5">Kelas 5</option>
                  <option value="6">Kelas 6</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Bulan</label>
                <select 
                  value={filterBulan}
                  onChange={e => setFilterBulan(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-700 dark:text-white"
                >
                  <option value="semua">Semua</option>
                  {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Tahun</label>
                <select 
                  value={filterTahun}
                  onChange={e => setFilterTahun(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-700 dark:text-white"
                >
                  <option value="semua">Semua</option>
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <button 
              onClick={handlePrint}
              disabled={!kelas}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50 mt-4 md:mt-0"
            >
              <Printer className="w-5 h-5" /> Cetak
            </button>
          </div>

          {kelas && (
            <div className="bg-white dark:bg-slate-800 text-black dark:text-white rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 print:shadow-none print:border-none print:p-0 print:bg-white print:text-black">
              {/* Header Sekolah untuk Print */}
              <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
                <h1 className="text-2xl font-bold uppercase">{schoolName}</h1>
                <p className="text-sm">Laporan Kehadiran Murid</p>
                <p className="text-sm mt-2">Kelas: {kelas}</p>
                <p className="text-sm">Periode: {filterBulan === 'semua' ? 'Semua Bulan' : months.find(m => m.value === filterBulan)?.label} {filterTahun === 'semua' ? 'Semua Tahun' : filterTahun}</p>
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

              {/* Tanda Tangan untuk Print */}
              <div className="hidden print:flex justify-end mt-16">
                <div className="text-center">
                  <p>Mengetahui,</p>
                  <p>Kepala Sekolah</p>
                  <div className="h-24"></div>
                  <p className="font-bold underline">{headmasterName}</p>
                  <p>NIP. {headmasterNIP}</p>
                </div>
                <div className="text-center ml-32">
                  <p>Wali Kelas,</p>
                  <br />
                  <div className="h-24"></div>
                  <p className="font-bold underline">{user?.['Nama Guru']}</p>
                  <p>NIP. {user?.NIP || '-'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
