import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, CheckCircle, XCircle, Calendar, User, Clock } from 'lucide-react';
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
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {reports.map((report) => (
              <motion.div 
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border ${
                  report.status === 'Valid' ? 'border-green-200 dark:border-green-900/50 bg-green-50/30 dark:bg-green-900/10' : 
                  report.status === 'Ditolak' ? 'border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/10' :
                  'border-slate-200 dark:border-slate-700'
                } flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-colors`}
              >
                <div className="flex items-start gap-4 w-full">
                  <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-lg ${
                    report.status === 'Valid' ? 'bg-green-500' : 
                    report.status === 'Ditolak' ? 'bg-red-500' :
                    'bg-slate-300 dark:bg-slate-600'
                  }`}>
                    {report.nama.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">
                        {report.nama}
                        <span className="text-xs font-normal px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500">
                          {report.kelas}
                        </span>
                      </h3>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(report.tanggal).toLocaleString('id-ID')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-pink-600 dark:text-pink-400">{report.habit_label}</span>
                    </div>
                    
                    <p className="text-slate-600 dark:text-slate-300 text-sm bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl italic">
                      "{report.keterangan}"
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto flex-shrink-0">
                  {report.status === 'Valid' ? (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-xl w-full md:w-auto justify-center">
                      <CheckCircle className="w-5 h-5" /> Terverifikasi
                    </div>
                  ) : report.status === 'Ditolak' ? (
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold bg-red-100 dark:bg-red-900/30 px-4 py-2 rounded-xl w-full md:w-auto justify-center">
                      <XCircle className="w-5 h-5" /> Ditolak
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleValidate(report.id, 'Ditolak')}
                        className="flex-1 md:flex-none bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-5 h-5" /> Tolak
                      </button>
                      <button 
                        onClick={() => handleValidate(report.id, 'Valid')}
                        className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-200 dark:shadow-none"
                      >
                        <CheckCircle className="w-5 h-5" /> Validasi
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
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
