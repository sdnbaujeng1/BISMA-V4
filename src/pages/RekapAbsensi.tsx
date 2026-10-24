import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Printer, Users, UserX, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { safeStorage } from '../lib/storage';
import { parseKetidakhadiran } from '../lib/ketidakhadiran';

export default function RekapAbsensi({ user, onNavigate }: { user: any, onNavigate: (page: string) => void }) {
  const [kelas, setKelas] = useState('');
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [filterTanggal, setFilterTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [filterTampilan, setFilterTampilan] = useState<'semua' | 'tidak_hadir'>('semua');
  const [rekapData, setRekapData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ hadirPercent: 0, totalSiswa: 0, hadir: 0, izin: 0, sakit: 0, alpha: 0, dispensasi: 0 });
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
          const stored = safeStorage.getItem('school_identity_data');
          if (stored) {
            const data = JSON.parse(stored);
            if (data.schoolName) setSchoolName(data.schoolName);
            if (data.headmasterName) setHeadmasterName(data.headmasterName);
            if (data.headmasterNIP) setHeadmasterNIP(data.headmasterNIP);
          }
        }
      } catch (e) {
        const stored = safeStorage.getItem('school_identity_data');
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
        const nameLookup = new Map<string, string>();

        students.forEach(s => {
          const realName = (s['Nama Lengkap'] || '').trim();
          studentMap[realName] = {
            nisn: s.NISN || '-',
            nama: realName,
            s: 0, i: 0, a: 0, d: 0, h: 0,
            finalStatus: 'H',
            detailKet: ''
          };
          nameLookup.set(realName.toLowerCase(), realName);
        });

        // 2. Fetch jurnal for attendance
        const { data: jurnalData, error: jurnalError } = await supabase
          .from('jurnal')
          .select('timestamp, ketidakhadiran, jam_pembelajaran, mata_pelajaran')
          .eq('kelas', kelas);

        if (jurnalError) throw jurnalError;

        // Filter by selected date
        const filteredJurnalData = (jurnalData || []).filter(record => {
          const recordDate = new Date(record.timestamp).toLocaleDateString('en-CA');
          const altDate = String(record.timestamp).split('T')[0];
          return recordDate === filterTanggal || altDate === filterTanggal;
        });

        const studentStatuses: Record<string, Set<string>> = {};
        const studentKeterangan: Record<string, string[]> = {};

        Object.keys(studentMap).forEach(name => {
          studentStatuses[name] = new Set();
          studentKeterangan[name] = [];
        });

        // Parse attendance using universal parseKetidakhadiran
        filteredJurnalData.forEach(record => {
          const parsedAbsents = parseKetidakhadiran(record.ketidakhadiran);
          
          parsedAbsents.forEach(ab => {
            const cleanName = (ab.nama || '').trim().toLowerCase();
            const matchedKey = nameLookup.get(cleanName);
            
            if (matchedKey) {
              const norm = (ab.keterangan || '').toLowerCase();
              let statusCode = 'A';
              let label = 'Alpa';

              if (norm.includes('sakit')) {
                statusCode = 'S';
                label = 'Sakit';
              } else if (norm.includes('izin') || norm.includes('ijin')) {
                statusCode = 'I';
                label = 'Izin';
              } else if (norm.includes('dispen')) {
                statusCode = 'D';
                label = 'Dispensasi';
              }

              studentStatuses[matchedKey].add(statusCode);
              if (!studentKeterangan[matchedKey].includes(label)) {
                studentKeterangan[matchedKey].push(label);
              }
            }
          });
        });

        // Final status decision: prioritized S > I > D > A > H
        Object.keys(studentMap).forEach(studentName => {
          const statuses = studentStatuses[studentName];
          if (statuses.has('S')) {
            studentMap[studentName].finalStatus = 'S';
            studentMap[studentName].detailKet = 'Sakit';
          } else if (statuses.has('I')) {
            studentMap[studentName].finalStatus = 'I';
            studentMap[studentName].detailKet = 'Izin';
          } else if (statuses.has('D')) {
            studentMap[studentName].finalStatus = 'D';
            studentMap[studentName].detailKet = 'Dispensasi';
          } else if (statuses.has('A')) {
            studentMap[studentName].finalStatus = 'A';
            studentMap[studentName].detailKet = 'Alpa';
          } else {
            studentMap[studentName].finalStatus = 'H';
            studentMap[studentName].detailKet = 'Hadir';
          }
        });

        const resultData = Object.values(studentMap).map(student => {
          return {
            ...student,
            s_display: student.finalStatus === 'S' ? '✓' : '',
            i_display: student.finalStatus === 'I' ? '✓' : '',
            a_display: student.finalStatus === 'A' ? '✓' : '',
            d_display: student.finalStatus === 'D' ? '✓' : '',
            ket: student.detailKet
          };
        });

        // Sort alphabetically
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
          totalSiswa: totalStudents,
          hadir: totalHadir,
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

  // Displayed students based on filter (All vs Only Absent)
  const displayedStudents = useMemo(() => {
    if (filterTampilan === 'tidak_hadir') {
      return rekapData.filter(m => m.finalStatus !== 'H');
    }
    return rekapData;
  }, [rekapData, filterTampilan]);

  const totalTidakHadir = summary.sakit + summary.izin + summary.alpha + summary.dispensasi;

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
      <header className="sticky top-0 z-30 bg-green-600 px-4 pb-4 pt-6 shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button onClick={() => onNavigate('main')} className="p-2 rounded-full hover:bg-white/20 text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">Kehadiran & Ketidakhadiran Murid</h2>
            <p className="text-xs text-green-100">Rekap Presensi Harian Kelas</p>
          </div>
        </div>
      </header>
      
      <main className="flex-grow p-4 md:p-6 mt-4">
        <div className="max-w-7xl mx-auto">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 print:hidden mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Kelas</label>
                <select 
                  value={kelas} 
                  onChange={e => setKelas(e.target.value)}
                  className="text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-700 dark:text-white font-medium"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {availableClasses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Tanggal</label>
                <input 
                  type="date"
                  value={filterTanggal}
                  onChange={e => setFilterTanggal(e.target.value)}
                  className="text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-700 dark:text-white"
                >
                </input>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Tampilan Tabel</label>
                <select 
                  value={filterTampilan}
                  onChange={e => setFilterTampilan(e.target.value as any)}
                  className="text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-700 dark:text-white font-medium"
                >
                  <option value="semua">Semua Siswa ({rekapData.length})</option>
                  <option value="tidak_hadir">Hanya Siswa Tidak Hadir ({totalTidakHadir})</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={handlePrint}
                disabled={!kelas}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer"
                title="Cetak Tabel Presensi / Ketidakhadiran"
              >
                <Printer className="w-5 h-5" /> Cetak Presensi
              </button>
            </div>
          </div>

          {kelas && (
            <div className="bg-white dark:bg-slate-800 text-black dark:text-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-700 print:shadow-none print:border-none print:p-0 print:bg-white print:text-black">
              {/* Summary Header Cards (Screen View) */}
              {!loading && rekapData.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6 print:hidden">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3.5 rounded-xl border border-blue-100 dark:border-blue-800/40">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">Tingkat Hadir</p>
                    <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{summary.hadirPercent}%</p>
                    <p className="text-[11px] text-blue-600/70 mt-0.5">{summary.hadir} dari {summary.totalSiswa} siswa</p>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-900/20 p-3.5 rounded-xl border border-rose-100 dark:border-rose-800/40">
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mb-1">Total Tidak Hadir</p>
                    <p className="text-2xl font-black text-rose-700 dark:text-rose-300">{totalTidakHadir}</p>
                    <p className="text-[11px] text-rose-600/70 mt-0.5">Siswa absen</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-800/40">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">Sakit (S)</p>
                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{summary.sakit}</p>
                    <p className="text-[11px] text-emerald-600/70 mt-0.5">Siswa</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-3.5 rounded-xl border border-amber-100 dark:border-amber-800/40">
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mb-1">Izin (I)</p>
                    <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{summary.izin}</p>
                    <p className="text-[11px] text-amber-600/70 mt-0.5">Siswa</p>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-900/20 p-3.5 rounded-xl border border-rose-100 dark:border-rose-800/40">
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mb-1">Alpa (A)</p>
                    <p className="text-2xl font-black text-rose-700 dark:text-rose-300">{summary.alpha}</p>
                    <p className="text-[11px] text-rose-600/70 mt-0.5">Tanpa keterangan</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3.5 rounded-xl border border-purple-100 dark:border-purple-800/40">
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mb-1">Dispensasi (D)</p>
                    <p className="text-2xl font-black text-purple-700 dark:text-purple-300">{summary.dispensasi}</p>
                    <p className="text-[11px] text-purple-600/70 mt-0.5">Siswa</p>
                  </div>
                </div>
              )}

              {/* Header Sekolah untuk Print */}
              <div className="hidden print:block text-center mb-6 border-b-2 border-black pb-4 text-black">
                <h1 className="text-xl font-black uppercase tracking-wide">{schoolName}</h1>
                <h2 className="text-sm font-bold mt-0.5 uppercase">
                  {filterTampilan === 'tidak_hadir' ? 'REKAPITULASI KETIDAKHADIRAN SISWA' : 'LAPORAN KEHADIRAN & KETIDAKHADIRAN MURID HARIAN'}
                </h2>
                <div className="flex justify-between text-xs text-slate-800 mt-2 px-2">
                  <span><strong>Kelas:</strong> {kelas}</span>
                  <span><strong>Tanggal:</strong> {new Date(filterTanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <span><strong>Total Siswa:</strong> {summary.totalSiswa} | <strong>Tidak Hadir:</strong> {totalTidakHadir} (S: {summary.sakit}, I: {summary.izin}, A: {summary.alpha}, D: {summary.dispensasi})</span>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400 font-medium">Memuat rekap absensi...</div>
              ) : displayedStudents.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-slate-700 dark:text-slate-300 font-bold">
                    {filterTampilan === 'tidak_hadir' ? 'Seluruh Siswa Hadir' : 'Tidak Ada Data Siswa'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {filterTampilan === 'tidak_hadir' ? 'Nihil ketidakhadiran pada tanggal yang dipilih.' : 'Silakan pilih kelas lain.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-300 dark:border-slate-600 print:border-black print:overflow-visible max-h-[600px] overflow-y-auto">
                  <table className="w-full text-sm print:text-xs border-collapse print:border-black relative">
                    <thead className="bg-slate-100 dark:bg-slate-700 print:bg-slate-100 sticky top-0 z-10 shadow-sm text-slate-800 dark:text-slate-100 print:text-black">
                      <tr>
                        <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2.5 print:p-1 text-center w-12 font-bold">No</th>
                        <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2.5 print:p-1 text-center w-28 font-bold">NISN</th>
                        <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2.5 print:p-1 text-left font-bold">Nama Lengkap</th>
                        <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2.5 print:p-1 text-center w-12 font-bold bg-emerald-50 dark:bg-emerald-950/40 print:bg-slate-100">S</th>
                        <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2.5 print:p-1 text-center w-12 font-bold bg-amber-50 dark:bg-amber-950/40 print:bg-slate-100">I</th>
                        <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2.5 print:p-1 text-center w-12 font-bold bg-rose-50 dark:bg-rose-950/40 print:bg-slate-100">A</th>
                        <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2.5 print:p-1 text-center w-12 font-bold bg-purple-50 dark:bg-purple-950/40 print:bg-slate-100">D</th>
                        <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2.5 print:p-1 text-center w-28 font-bold">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedStudents.map((m, i) => {
                        const isAbsent = m.finalStatus !== 'H';
                        return (
                          <tr 
                            key={i} 
                            className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 print:hover:bg-transparent ${isAbsent ? 'bg-amber-50/40 dark:bg-amber-950/10 font-medium' : ''}`}
                          >
                            <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2.5 print:p-1 text-center text-slate-500 dark:text-slate-400 print:text-black">
                              {i + 1}
                            </td>
                            <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2.5 print:p-1 text-center font-mono text-xs">
                              {m.nisn}
                            </td>
                            <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2.5 print:p-1 font-semibold text-slate-800 dark:text-slate-200 print:text-black">
                              {m.nama}
                            </td>
                            <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2.5 print:p-1 text-center font-bold text-emerald-600 print:text-black">
                              {m.s_display}
                            </td>
                            <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2.5 print:p-1 text-center font-bold text-amber-600 print:text-black">
                              {m.i_display}
                            </td>
                            <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2.5 print:p-1 text-center font-bold text-rose-600 print:text-black">
                              {m.a_display}
                            </td>
                            <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2.5 print:p-1 text-center font-bold text-purple-600 print:text-black">
                              {m.d_display}
                            </td>
                            <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2.5 print:p-1 text-center">
                              {isAbsent ? (
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border print:border-none print:px-0 print:text-black ${
                                  m.finalStatus === 'S' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300' 
                                    : m.finalStatus === 'I' 
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300' 
                                    : m.finalStatus === 'D' 
                                    ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300' 
                                    : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                                }`}>
                                  {m.ket}
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500 text-xs print:text-black">
                                  Hadir
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tanda Tangan untuk Print */}
              <div className="hidden print:flex justify-between items-start mt-12 text-sm text-black break-inside-avoid px-8">
                <div className="text-center">
                  <p>Mengetahui,</p>
                  <p>Kepala Sekolah</p>
                  <div className="h-20"></div>
                  <p className="font-bold underline">{headmasterName}</p>
                  <p>NIP. {headmasterNIP}</p>
                </div>
                <div className="text-center">
                  <p>Beji, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p>Guru Kelas / Mata Pelajaran,</p>
                  <div className="h-20"></div>
                  <p className="font-bold underline">{user?.['Nama Guru'] || '-'}</p>
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

