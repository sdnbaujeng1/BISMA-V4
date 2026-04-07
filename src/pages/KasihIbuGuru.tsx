import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, CheckCircle, XCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function KasihIbuGuru({ user, onNavigate }: { user: any, onNavigate: (page: string) => void }) {
  const [selectedClass, setSelectedClass] = useState(user?.waliKelas || 'Kelas 1');
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kasih-ibu?kelas=${selectedClass}`);
      const result = await res.json();
      if (result.success) {
        setReports(result.data);
      }
    } catch (e) {
      console.error("Failed to fetch reports", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedClass]);

  const handleValidate = async (id: number, status: 'Valid' | 'Ditolak') => {
    try {
      const res = await fetch('/api/kasih-ibu/validate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      const result = await res.json();
      if (result.success) {
        // Optimistic update
        setReports(reports.map(r => r.id === id ? { ...r, status: status } : r));
        alert(`Laporan berhasil divalidasi: ${status}`);
      } else {
        alert("Gagal memvalidasi: " + result.message);
      }
    } catch (e) {
      alert("Terjadi kesalahan jaringan");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors p-4 md:p-8 font-sans">
      <header className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('main')} className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-200" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Validasi Kasih Ibu</h1>
            <p className="text-slate-500 dark:text-slate-400">Monitoring Pembiasaan Karakter Siswa</p>
          </div>
        </div>
        <div className="bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm">
          <Heart className="w-5 h-5" /> Wali Kelas {user?.waliKelas || ''}
        </div>
      </header>

      <div className="mb-8 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
        <span className="font-bold text-slate-700 dark:text-slate-300">Pilih Kelas:</span>
        <select 
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-700 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none font-medium"
        >
          <option>Kelas 1</option>
          <option>Kelas 2</option>
          <option>Kelas 3</option>
          <option>Kelas 4</option>
          <option>Kelas 5</option>
          <option>Kelas 6</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-slate-500">Memuat laporan siswa...</p>
        </div>
      ) : reports.length > 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="border-b border-slate-200 dark:border-slate-700 p-4 text-center w-12 text-slate-600 dark:text-slate-300">No</th>
                  <th className="border-b border-slate-200 dark:border-slate-700 p-4 text-left text-slate-600 dark:text-slate-300">Nama Siswa</th>
                  <th className="border-b border-slate-200 dark:border-slate-700 p-4 text-left text-slate-600 dark:text-slate-300">Hari/Tanggal</th>
                  <th className="border-b border-slate-200 dark:border-slate-700 p-4 text-left text-slate-600 dark:text-slate-300">Aktivitas</th>
                  <th className="border-b border-slate-200 dark:border-slate-700 p-4 text-center text-slate-600 dark:text-slate-300">Perasaan</th>
                  <th className="border-b border-slate-200 dark:border-slate-700 p-4 text-left text-slate-600 dark:text-slate-300">Keterangan</th>
                  <th className="border-b border-slate-200 dark:border-slate-700 p-4 text-center text-slate-600 dark:text-slate-300">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {reports.map((report, idx) => {
                    const dateObj = new Date(report.tanggal);
                    let hariTanggal = report.tanggal;
                    if (!isNaN(dateObj.getTime())) {
                      hariTanggal = dateObj.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    } else if (report.tanggal && report.tanggal.includes('T')) {
                      const fallbackDate = new Date(report.tanggal.split('T')[0]);
                      if (!isNaN(fallbackDate.getTime())) {
                        hariTanggal = fallbackDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                      }
                    }
                    
                    return (
                      <motion.tr 
                        key={report.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
                          report.status === 'Valid' ? 'bg-green-50/30 dark:bg-green-900/10' : 
                          report.status === 'Ditolak' ? 'bg-red-50/30 dark:bg-red-900/10' : ''
                        }`}
                      >
                        <td className="p-4 text-center text-slate-500 dark:text-slate-400">{idx + 1}</td>
                        <td className="p-4 font-bold text-slate-800 dark:text-white">{report.nama}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">{hariTanggal}</td>
                        <td className="p-4 font-medium text-pink-600 dark:text-pink-400">{report.habit_label || report.jenis_kebiasaan}</td>
                        <td className="p-4 text-center text-2xl">{report.perasaan || '😊'}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-300 italic">"{report.keterangan}"</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            {report.status === 'Valid' ? (
                              <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-lg text-xs">
                                <CheckCircle className="w-4 h-4" /> Valid
                              </span>
                            ) : report.status === 'Ditolak' ? (
                              <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-bold bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-lg text-xs">
                                <XCircle className="w-4 h-4" /> Ditolak
                              </span>
                            ) : (
                              <>
                                <button 
                                  onClick={() => handleValidate(report.id, 'Ditolak')}
                                  className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                  title="Tolak"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => handleValidate(report.id, 'Valid')}
                                  className="p-2 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                  title="Validasi"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
          <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Belum Ada Laporan</h3>
          <p className="text-slate-500 dark:text-slate-400">Belum ada siswa yang melaporkan kegiatan pembiasaan.</p>
        </div>
      )}
    </div>
  );
}
