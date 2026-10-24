import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Calendar, Search, X, Printer, UserX, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { useSchoolIdentity } from '../hooks/useSchoolIdentity';
import { parseKetidakhadiran } from '../lib/ketidakhadiran';

export default function Kedisiplinan({ user, onNavigate }: { user: any, onNavigate: (page: string) => void }) {
  const [kelas, setKelas] = useState('');
  const [tab, setTab] = useState('absensi');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterAbsenOnly, setFilterAbsenOnly] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [selectedCatatan, setSelectedCatatan] = useState<any>(null);
  const [penangananModal, setPenangananModal] = useState(false);
  const [savingPenanganan, setSavingPenanganan] = useState(false);

  const schoolIdentity = useSchoolIdentity();

  const penangananOptions = [
    { id: 'Segitiga Restitusi', desc: 'Memperbaiki kesalahan melalui validasi tindakan dan penguatan keyakinan diri siswa.' },
    { id: 'Konsekuensi Logis', desc: 'Tanggung jawab yang relevan, masuk akal, dan berhubungan dengan pelanggaran.' },
    { id: 'Jeda Sejenak', desc: 'Ruang tenang untuk menenangkan emosi sebelum mendiskusikan solusi perilaku anak.' },
    { id: 'Kontrak Perilaku', desc: 'Perjanjian tertulis berisi target perilaku dan komitmen bersama siswa-guru.' },
    { id: 'Kolaboratif dengan Orang Tua', desc: 'Penyelarasan aturan sekolah dan rumah untuk mendukung perubahan perilaku siswa.' }
  ];

  const handleSavePenanganan = async (penanganan: string) => {
    if (!selectedCatatan || !selectedStudent) return;
    setSavingPenanganan(true);
    try {
      // Fetch the current journal entry
      const { data: journal, error: fetchError } = await supabase
        .from('jurnal')
        .select('catatan_mengajar')
        .eq('id', selectedCatatan.id)
        .single();
        
      if (fetchError) throw fetchError;

      const disiplin = typeof journal.catatan_mengajar === 'string' ? JSON.parse(journal.catatan_mengajar) : journal.catatan_mengajar;
      
      // Update the specific student's discipline record
      const updatedDisiplin = disiplin.map((d: any) => {
        if (d.student === selectedStudent.nama && d.type === selectedCatatan.type) {
          return { ...d, penanganan };
        }
        return d;
      });

      // Save back to supabase
      const { error: updateError } = await supabase
        .from('jurnal')
        .update({ catatan_mengajar: JSON.stringify(updatedDisiplin) })
        .eq('id', selectedCatatan.id);

      if (updateError) throw updateError;

      // Update local state
      const updatedData = data.map(s => {
        if (s.nisn === selectedStudent.nisn) {
          const updatedCatatan = s.catatan.map((c: any) => {
            if (c.id === selectedCatatan.id && c.type === selectedCatatan.type) {
              return { ...c, penanganan };
            }
            return c;
          });
          return { ...s, catatan: updatedCatatan };
        }
        return s;
      });
      
      setData(updatedData);
      setSelectedStudent(updatedData.find(s => s.nisn === selectedStudent.nisn));
      setPenangananModal(false);
      setSelectedCatatan(null);
    } catch (e) {
      console.error("Error saving penanganan", e);
      alert("Gagal menyimpan penanganan");
    } finally {
      setSavingPenanganan(false);
    }
  };

  useEffect(() => {
    const fetchClasses = async () => {
      if (!user?.['Nama Guru']) return;
      try {
        const { data: jadwalData, error } = await supabase
          .from('jadwal_real')
          .select('kelas')
          .eq('guru', user['Nama Guru']);
        
        if (error) throw error;
        
        if (jadwalData) {
          const uniqueClasses = Array.from(new Set(jadwalData.map(j => j.kelas))).sort();
          setAvailableClasses(uniqueClasses);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };
    fetchClasses();
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!kelas) return;
      setLoading(true);
      try {
        // Fetch students for the selected class
        const { data: studentsData, error: studentsError } = await supabase
          .from('murid')
          .select('"NISN", "Nama Lengkap", "Kelas"')
          .eq('"Kelas"', kelas);

        if (studentsError) throw studentsError;

        // Fetch journal data for attendance and discipline
        let query = supabase
          .from('jurnal')
          .select('id, timestamp, kelas, mata_pelajaran, nama_guru, ketidakhadiran, catatan_mengajar, jam_pembelajaran')
          .eq('kelas', kelas);

        if (startDate) {
          query = query.gte('timestamp', new Date(startDate).toISOString());
        }
        if (endDate) {
          // Add 1 day to include the end date fully
          const end = new Date(endDate);
          end.setDate(end.getDate() + 1);
          query = query.lt('timestamp', end.toISOString());
        }

        const { data: journalData, error: journalError } = await query;

        if (journalError) throw journalError;

        const processedData = studentsData.map(student => {
          let h = 0, s = 0, i = 0, a = 0, d = 0;
          const catatan: any[] = [];
          const studentName = student['Nama Lengkap'];
          
          // Group attendance by date
          const attendanceByDate: Record<string, { totalJp: number, absentJp: number, statuses: Set<string> }> = {};

          journalData?.forEach(journal => {
            const dateStr = new Date(journal.timestamp).toLocaleDateString();
            
            // Parse jam_pembelajaran (e.g., "1, 2, 3" -> 3 JP)
            let jpCount = 1;
            if (journal.jam_pembelajaran) {
               const parts = String(journal.jam_pembelajaran).split(',');
               jpCount = parts.length;
            }

            if (!attendanceByDate[dateStr]) {
              attendanceByDate[dateStr] = { totalJp: 0, absentJp: 0, statuses: new Set() };
            }
            attendanceByDate[dateStr].totalJp += jpCount;

            // Process Ketidakhadiran using universal parseKetidakhadiran
            if (journal.ketidakhadiran && journal.ketidakhadiran !== '[]' && journal.ketidakhadiran !== 'Nihil') {
              try {
                const parsedAbsents = parseKetidakhadiran(journal.ketidakhadiran);
                const matched = parsedAbsents.find(a => (a.nama || '').trim().toLowerCase() === (studentName || '').trim().toLowerCase());
                if (matched) {
                  attendanceByDate[dateStr].absentJp += jpCount;
                  const norm = (matched.keterangan || '').toLowerCase();
                  if (norm.includes('sakit')) attendanceByDate[dateStr].statuses.add('S');
                  else if (norm.includes('izin') || norm.includes('ijin')) attendanceByDate[dateStr].statuses.add('I');
                  else if (norm.includes('dispen')) attendanceByDate[dateStr].statuses.add('D');
                  else attendanceByDate[dateStr].statuses.add('A');
                }
              } catch (e) {
                console.error("Error parsing Ketidakhadiran", e);
              }
            }

            // Process Catatan Kedisiplinan (catatan_mengajar)
            // Format: [{ type: 'Type', student: 'Name' }, ...]
            if (journal.catatan_mengajar && journal.catatan_mengajar !== '[]') {
              try {
                const disiplin = typeof journal.catatan_mengajar === 'string' ? JSON.parse(journal.catatan_mengajar) : journal.catatan_mengajar;
                
                if (Array.isArray(disiplin)) {
                    const studentDisiplin = disiplin.filter((d: any) => d.student === studentName);
                    studentDisiplin.forEach((d: any) => {
                        catatan.push({
                            id: journal.id,
                            date: new Date(journal.timestamp).toLocaleDateString('id-ID'),
                            type: d.type,
                            mapel: journal.mata_pelajaran,
                            guru: journal.nama_guru,
                            penanganan: d.penanganan || null
                        });
                    });
                }
              } catch (e) {
                console.error("Error parsing Catatan_Kedisiplinan", e);
              }
            }
          });

          // Apply priority rule for daily attendance: S > I > D > A > H
          Object.values(attendanceByDate).forEach(day => {
             if (day.totalJp > 0) {
                if (day.absentJp < day.totalJp) {
                   day.statuses.add('H');
                }
                
                if (day.statuses.has('S')) {
                  s++;
                } else if (day.statuses.has('I')) {
                  i++;
                } else if (day.statuses.has('D')) {
                  d++;
                } else if (day.statuses.has('A')) {
                  a++;
                } else {
                  h++;
                }
             }
          });

          return {
            nisn: student.NISN,
            nama: studentName,
            h, s, i, a, d,
            total: s + i + a + d, // Total ketidakhadiran
            catatan
          };
        });

        setData(processedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [kelas, startDate, endDate]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
      <header className="sticky top-0 z-30 bg-green-600 px-4 pb-4 pt-6 shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button onClick={() => onNavigate('main')} className="p-2 rounded-full hover:bg-white/20 text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold text-white">Kedisiplinan & Kehadiran</h2>
        </div>
      </header>
      
      <main className="flex-grow p-4 md:p-6 mt-4">
        <div className="max-w-7xl mx-auto bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Pilih Kelas</label>
              <select 
                value={kelas} 
                onChange={e => setKelas(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-700 dark:text-white"
              >
                <option value="">-- Pilih Kelas --</option>
                {availableClasses.map(c => (
                  <option key={c} value={c}>{/^kelas\b/i.test(String(c || '').trim()) ? String(c).trim().replace(/^kelas\s*/i, 'Kelas ') : `Kelas ${c}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Dari Tanggal</label>
              <input 
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Sampai Tanggal</label>
              <input 
                type="date" 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>

          <div className="border-b border-slate-200 dark:border-slate-700 mb-6 flex flex-wrap items-center justify-between gap-4">
            <nav className="-mb-px flex space-x-8">
              <button 
                onClick={() => setTab('absensi')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${tab === 'absensi' ? 'border-green-600 text-green-600 dark:border-green-400 dark:text-green-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'}`}
              >
                Ketidakhadiran
              </button>
              <button 
                onClick={() => setTab('catatan')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${tab === 'catatan' ? 'border-green-600 text-green-600 dark:border-green-400 dark:text-green-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'}`}
              >
                Kedisiplinan
              </button>
            </nav>

            {tab === 'absensi' && kelas && (
              <div className="flex items-center gap-3 print:hidden pb-2">
                <button
                  type="button"
                  onClick={() => setFilterAbsenOnly(!filterAbsenOnly)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${filterAbsenOnly ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700' : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-700 dark:text-slate-300'}`}
                >
                  {filterAbsenOnly ? '✓ Hanya Siswa Tidak Hadir' : 'Tampilkan Semua Siswa'}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak Rekap
                </button>
              </div>
            )}
          </div>

          {kelas && (
            <div className="mt-6 animate-in fade-in duration-300">
              {tab === 'absensi' && (
                <div className="print:text-black">
                  {/* Print-only Kop & Info */}
                  <div className="hidden print:block mb-6 border-b-2 border-black pb-3 text-black">
                    <div className="flex items-center gap-4">
                      {schoolIdentity.schoolLogo && (
                        <img src={schoolIdentity.schoolLogo} className="h-16 w-16 object-contain" alt="Logo" />
                      )}
                      <div>
                        <h2 className="text-xl font-black uppercase tracking-wide">{schoolIdentity.schoolName}</h2>
                        <h3 className="text-sm font-bold uppercase mt-0.5">REKAPITULASI KETIDAKHADIRAN SISWA</h3>
                        <p className="text-xs text-slate-700 mt-1">
                          <strong>Kelas:</strong> {kelas} | <strong>Periode:</strong> {startDate ? `${startDate} s.d. ${endDate || 'Sekarang'}` : 'Seluruh Riwayat'}
                          {filterAbsenOnly && ' | (Hanya Siswa dengan Ketidakhadiran)'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 print:border-black print:overflow-visible">
                    <table className="w-full text-sm print:text-xs border-collapse print:border-black">
                      <thead className="bg-slate-100 dark:bg-slate-700 print:bg-slate-100 text-slate-600 dark:text-slate-300 print:text-black">
                        <tr>
                          <th className="p-3 print:p-1.5 border-b dark:border-slate-600 print:border-black text-center w-12 font-bold">No</th>
                          <th className="p-3 print:p-1.5 border-b dark:border-slate-600 print:border-black text-left font-bold">Nama Lengkap</th>
                          <th className="p-3 print:p-1.5 border-b dark:border-slate-600 print:border-black text-center w-16 bg-green-50 dark:bg-green-900/20 print:bg-slate-100 text-green-700 dark:text-green-400 print:text-black font-bold">S</th>
                          <th className="p-3 print:p-1.5 border-b dark:border-slate-600 print:border-black text-center w-16 bg-yellow-50 dark:bg-yellow-900/20 print:bg-slate-100 text-yellow-700 dark:text-yellow-400 print:text-black font-bold">I</th>
                          <th className="p-3 print:p-1.5 border-b dark:border-slate-600 print:border-black text-center w-16 bg-red-50 dark:bg-red-900/20 print:bg-slate-100 text-red-700 dark:text-red-400 print:text-black font-bold">A</th>
                          <th className="p-3 print:p-1.5 border-b dark:border-slate-600 print:border-black text-center w-16 bg-blue-50 dark:bg-blue-900/20 print:bg-slate-100 text-blue-700 dark:text-blue-400 print:text-black font-bold">D</th>
                          <th className="p-3 print:p-1.5 border-b dark:border-slate-600 print:border-black text-center w-20 bg-slate-200 dark:bg-slate-600 print:bg-slate-200 font-bold">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700 print:divide-black">
                        {loading ? (
                          <tr><td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400 italic">Memuat data ketidakhadiran...</td></tr>
                        ) : data.length === 0 ? (
                          <tr><td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400 italic">Tidak ada data siswa.</td></tr>
                        ) : (
                          data
                            .filter(m => (filterAbsenOnly ? m.total > 0 : true))
                            .map((m, i) => {
                              const hasAbsence = m.total > 0;
                              return (
                                <tr key={i} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors print:hover:bg-transparent ${hasAbsence ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''}`}>
                                  <td className="p-3 print:p-1.5 text-center text-slate-500 dark:text-slate-400 print:text-black">{i + 1}</td>
                                  <td className="p-3 print:p-1.5 font-medium text-slate-800 dark:text-slate-200 print:text-black">{m.nama}</td>
                                  <td className="p-3 print:p-1.5 text-center font-mono dark:text-slate-300 print:text-black font-semibold text-emerald-600">{m.s}</td>
                                  <td className="p-3 print:p-1.5 text-center font-mono dark:text-slate-300 print:text-black font-semibold text-amber-600">{m.i}</td>
                                  <td className="p-3 print:p-1.5 text-center font-mono dark:text-slate-300 print:text-black font-semibold text-rose-600">{m.a}</td>
                                  <td className="p-3 print:p-1.5 text-center font-mono dark:text-slate-300 print:text-black font-semibold text-purple-600">{m.d}</td>
                                  <td className="p-3 print:p-1.5 text-center font-bold text-slate-800 dark:text-slate-100 print:text-black">
                                    {m.total > 0 ? (
                                      <span className="inline-block px-2 py-0.5 rounded font-black text-rose-600 dark:text-rose-400 print:text-black">
                                        {m.total}
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 print:text-black">0</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Print Signatures */}
                  <div className="hidden print:flex justify-between items-start mt-12 text-sm text-black break-inside-avoid px-8">
                    <div className="text-center">
                      <p>Mengetahui,</p>
                      <p>Kepala Sekolah</p>
                      <div className="h-20"></div>
                      <p className="font-bold underline">{schoolIdentity.headmasterName}</p>
                      <p>NIP. {schoolIdentity.headmasterNIP}</p>
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

              {tab === 'catatan' && (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="p-3 border-b dark:border-slate-600 text-center w-12">No</th>
                        <th className="p-3 border-b dark:border-slate-600 text-left w-64">Nama</th>
                        <th className="p-3 border-b dark:border-slate-600 text-center w-32">Jumlah Catatan</th>
                        <th className="p-3 border-b dark:border-slate-600 text-left">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {loading ? (
                        <tr><td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400 italic">Memuat data...</td></tr>
                      ) : data.length === 0 ? (
                        <tr><td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400 italic">Tidak ada data siswa.</td></tr>
                      ) : data.map((m, i) => (
                        <tr 
                          key={i} 
                          className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                          onDoubleClick={() => setSelectedStudent(m)}
                        >
                          <td className="p-3 text-center text-slate-500 dark:text-slate-400 align-middle">{i + 1}</td>
                          <td className="p-3 font-medium text-slate-800 dark:text-slate-200 align-middle">{m.nama}</td>
                          <td className="p-3 text-center align-middle">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${m.catatan.length > 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                              {m.catatan.length} Catatan
                            </span>
                          </td>
                          <td className="p-3 align-middle text-slate-500 dark:text-slate-400 text-xs italic">
                            Klik ganda untuk melihat detail
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Detail Kedisiplinan</h3>
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <div className="mb-6">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Nama Siswa</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-white">{selectedStudent.nama}</p>
                </div>

                <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Riwayat Pelanggaran
                </h4>

                {selectedStudent.catatan.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
                    <p className="text-slate-500 dark:text-slate-400 italic">Tidak ada catatan pelanggaran.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedStudent.catatan.map((c: any, idx: number) => (
                      <div 
                        key={idx} 
                        className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-4 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                        onDoubleClick={() => {
                          setSelectedCatatan(c);
                          setPenangananModal(true);
                        }}
                        title="Klik dua kali untuk menambahkan penanganan"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                            {c.date}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {c.mapel}
                          </span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">{c.type}</p>
                        {c.penanganan && (
                          <div className="mt-2 bg-white dark:bg-slate-800 p-2 rounded border border-red-100 dark:border-red-900/30">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Penanganan:</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{c.penanganan}</p>
                          </div>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 border-t border-red-100 dark:border-red-900/30 pt-2">
                          Dilaporkan oleh: {c.guru}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Penanganan Modal */}
      <AnimatePresence>
        {penangananModal && selectedCatatan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 dark:text-white">Penanganan Pelanggaran</h3>
                <button 
                  onClick={() => {
                    setPenangananModal(false);
                    setSelectedCatatan(null);
                  }}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-4">
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{selectedCatatan.type}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{selectedStudent.nama} • {selectedCatatan.date}</p>
                </div>
                
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Pilih Tindakan Penanganan:</p>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {penangananOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleSavePenanganan(opt.id)}
                      disabled={savingPenanganan}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                    >
                      <p className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">{opt.id}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
