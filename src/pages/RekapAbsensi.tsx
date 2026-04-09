import { useState, useEffect } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function RekapAbsensi({ user, onNavigate }: { user: any, onNavigate: (page: string) => void }) {
  const [kelas, setKelas] = useState('');
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [filterTanggal, setFilterTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [rekapData, setRekapData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ hadirPercent: 0, izin: 0, sakit: 0, alpha: 0, dispensasi: 0 });
  const [loading, setLoading] = useState(false);

  const [headmasterName, setHeadmasterName] = useState("Drs. H. Ahmad");
  const [headmasterNIP, setHeadmasterNIP] = useState("196001011980031001");
  const [schoolName, setSchoolName] = useState("UPT SDN Baujeng 1");

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const { data, error } = await supabase.from('murid').select('"Kelas"');
        if (!error && data) {
          const unique = [...new Set(data.map(item => item['Kelas'] || item.Kelas))].filter(Boolean).sort();
          setAvailableClasses(unique as string[]);
        }
      } catch (e) {
        console.error("Failed to fetch classes", e);
      }
    };
    fetchClasses();
  }, []);

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
          const stored = localStorage.getItem('school_identity_data');
          if (stored) {
            const data = JSON.parse(stored);
            if (data.schoolName) setSchoolName(data.schoolName);
            if (data.headmasterName) setHeadmasterName(data.headmasterName);
            if (data.headmasterNIP) setHeadmasterNIP(data.headmasterNIP);
          }
        }
      } catch (e) {
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
    const fetchData = async () => {
      if (!kelas) return;
      setLoading(true);

      try {
        // 1. Fetch all students in the class
        const { data: studentsData, error: studentsError } = await supabase
          .from('murid')
          .select('"NISN", "Nama Lengkap", "Kelas"')
          .eq('"Kelas"', kelas);

        if (studentsError) throw studentsError;

        const students = studentsData || [];
        const studentMap: Record<string, any> = {};
        students.forEach(s => {
          studentMap[s['Nama Lengkap']] = {
            nisn: s.NISN,
            nama: s['Nama Lengkap'],
            s: 0, i: 0, a: 0, d: 0, h: 0,
            finalStatus: 'H' // Default to Hadir
          };
        });

        // 2. Fetch jurnal for attendance
        let jurnalQuery = supabase.from('jurnal').select('timestamp, ketidakhadiran, jam_pembelajaran').eq('kelas', kelas);
        const { data: jurnalData, error: jurnalError } = await jurnalQuery;
        if (jurnalError) throw jurnalError;

        // Filter by date
        const filteredJurnalData = (jurnalData || []).filter(record => {
          const recordDate = new Date(record.timestamp).toLocaleDateString('en-CA'); // YYYY-MM-DD local
          // Also check split('T')[0] just in case
          const altDate = record.timestamp.split('T')[0];
          return recordDate === filterTanggal || altDate === filterTanggal;
        });

        let totalDayJP = 0;
        const studentAbsentJP: Record<string, number> = {};
        const studentStatuses: Record<string, Set<string>> = {};

        Object.keys(studentMap).forEach(name => {
          studentAbsentJP[name] = 0;
          studentStatuses[name] = new Set();
        });

        filteredJurnalData.forEach(record => {
          let jpCount = 1;
          if (record.jam_pembelajaran) {
            jpCount = String(record.jam_pembelajaran).split(',').filter(s => s.trim() !== '').length;
            if (jpCount === 0) jpCount = 1;
          }
          totalDayJP += jpCount;

          try {
            const absents = typeof record.ketidakhadiran === 'string' ? JSON.parse(record.ketidakhadiran) : record.ketidakhadiran;
            if (Array.isArray(absents)) {
              const countedStudents = new Set();
              absents.forEach((absentRecord: any) => {
                if (absentRecord.students && Array.isArray(absentRecord.students)) {
                  absentRecord.students.forEach((studentName: string) => {
                    if (studentMap[studentName] && !countedStudents.has(studentName)) {
                      countedStudents.add(studentName);
                      
                      studentAbsentJP[studentName] = (studentAbsentJP[studentName] || 0) + jpCount;

                      if (absentRecord.type === 'Sakit') {
                        studentStatuses[studentName].add('S');
                      } else if (absentRecord.type === 'Izin') {
                        studentStatuses[studentName].add('I');
                      } else if (absentRecord.type === 'Alpa' || absentRecord.type === 'Tidak Hadir') {
                        studentStatuses[studentName].add('A');
                      } else if (absentRecord.type === 'Dispensasi') {
                        studentStatuses[studentName].add('D');
                      }
                    }
                  });
                }
              });
            }
          } catch (e) {}
        });

        // Process daily statuses to calculate final status for the day
        Object.keys(studentMap).forEach(studentName => {
          const statuses = studentStatuses[studentName];
          const absentJP = studentAbsentJP[studentName];
          
          // If student was absent for fewer JPs than the total JPs for the day, they have an implicit 'H'
          if (totalDayJP > 0 && absentJP < totalDayJP) {
            statuses.add('H');
          }

          if (statuses.has('S')) {
            studentMap[studentName].finalStatus = 'S';
          } else if (statuses.has('I')) {
            studentMap[studentName].finalStatus = 'I';
          } else if (statuses.has('D')) {
            studentMap[studentName].finalStatus = 'D';
          } else if (statuses.has('A') && !statuses.has('H')) {
            studentMap[studentName].finalStatus = 'A';
          } else {
            studentMap[studentName].finalStatus = 'H';
          }
        });

        const resultData = Object.values(studentMap).map(student => {
          return {
            ...student,
            s_display: student.finalStatus === 'S' ? '✓' : '',
            i_display: student.finalStatus === 'I' ? '✓' : '',
            a_display: student.finalStatus === 'A' ? '✓' : '',
            d_display: student.finalStatus === 'D' ? '✓' : '',
            ket: student.finalStatus === 'H' ? 'Hadir' : ''
          };
        });

        // Sort by name
        resultData.sort((a, b) => a.nama.localeCompare(b.nama));

        let totalSakit = 0;
        let totalIzin = 0;
        let totalAlpha = 0;
        let totalDispensasi = 0;
        let totalHadir = 0;

        resultData.forEach(m => {
          if (m.finalStatus === 'S') totalSakit++;
          else if (m.finalStatus === 'I') totalIzin++;
          else if (m.finalStatus === 'A') totalAlpha++;
          else if (m.finalStatus === 'D') totalDispensasi++;
          else totalHadir++;
        });

        const totalStudents = resultData.length;
        const hadirPercent = totalStudents > 0 ? Math.round((totalHadir / totalStudents) * 100) : 100;

        setSummary({
          hadirPercent,
          sakit: totalSakit,
          izin: totalIzin,
          alpha: totalAlpha,
          dispensasi: totalDispensasi
        });

        setRekapData(resultData);
      } catch (error) {
        console.error('Error fetching rekap absensi:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [kelas, filterTanggal]);

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
                  {availableClasses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Tanggal</label>
                <input 
                  type="date"
                  value={filterTanggal}
                  onChange={e => setFilterTanggal(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-700 dark:text-white"
                />
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
              {/* Summary Header */}
              {!loading && rekapData.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 print:hidden">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Total Hadir</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{summary.hadirPercent}%</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">Total Sakit</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{summary.sakit}</p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-100 dark:border-yellow-800">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium mb-1">Total Izin</p>
                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{summary.izin}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-1">Total Alpha</p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-300">{summary.alpha}</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">Total Dispensasi</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{summary.dispensasi}</p>
                  </div>
                </div>
              )}

              {/* Header Sekolah untuk Print */}
              <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
                <h1 className="text-2xl font-bold uppercase">{schoolName}</h1>
                <p className="text-sm">Laporan Kehadiran Murid Harian</p>
                <p className="text-sm mt-2">Kelas: {kelas}</p>
                <p className="text-sm">Tanggal: {new Date(filterTanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>

              {loading ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">Memuat rekap absensi...</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-600 print:border-none print:overflow-visible max-h-[600px] overflow-y-auto">
                  <table className="w-full text-sm border-collapse print:border-slate-300 relative">
                    <thead className="bg-slate-100 dark:bg-slate-700 print:bg-slate-100 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center w-12 bg-slate-100 dark:bg-slate-700">No</th>
                        <th className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center w-32 bg-slate-100 dark:bg-slate-700">NISN</th>
                        <th className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-left bg-slate-100 dark:bg-slate-700 sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Nama</th>
                        <th className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center w-12 bg-green-50 dark:bg-green-900/80 print:bg-green-50">S</th>
                        <th className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center w-12 bg-yellow-50 dark:bg-yellow-900/80 print:bg-yellow-50">I</th>
                        <th className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center w-12 bg-red-50 dark:bg-red-900/80 print:bg-red-50">A</th>
                        <th className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center w-12 bg-purple-50 dark:bg-purple-900/80 print:bg-purple-50">D</th>
                        <th className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center w-24 font-bold bg-slate-100 dark:bg-slate-700">Ket</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rekapData.map((m, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 print:hover:bg-transparent">
                          <td className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center text-slate-500 dark:text-slate-400 print:text-slate-500">{i + 1}</td>
                          <td className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center font-mono">{m.nisn}</td>
                          <td className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 font-medium sticky left-0 bg-white dark:bg-slate-800 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] group-hover:bg-slate-50 dark:group-hover:bg-slate-700/50">{m.nama}</td>
                          <td className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center font-bold text-green-600">{m.s_display}</td>
                          <td className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center font-bold text-yellow-600">{m.i_display}</td>
                          <td className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center font-bold text-red-600">{m.a_display}</td>
                          <td className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center font-bold text-purple-600">{m.d_display}</td>
                          <td className="border border-slate-300 dark:border-slate-600 print:border-slate-300 p-3 text-center font-bold text-blue-700 dark:text-blue-400 print:text-blue-700">{m.ket}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
