import { useState } from 'react';
import { ArrowLeft, Heart, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function KasihIbuGuru({ user, onNavigate }: { user: any, onNavigate: (page: string) => void }) {
  const [selectedClass, setSelectedClass] = useState('Kelas 1');

  // Mock data
  const reports = [
    { id: 1, siswa: 'Ahmad', habit: 'Bangun Pagi', date: '2024-10-14', status: 'Sudah Terbiasa', desc: 'Bangun jam 04.30 sholat subuh', validated: false },
    { id: 2, siswa: 'Siti', habit: 'Makan Sehat', date: '2024-10-14', status: 'Sudah Terbiasa', desc: 'Makan sayur bayam', validated: true },
    { id: 3, siswa: 'Budi', habit: 'Berolahraga', date: '2024-10-14', status: 'Belum Terbiasa', desc: 'Lupa olahraga pagi', validated: false },
  ];

  const handleValidate = (id: number) => {
    alert(`Laporan ID ${id} divalidasi.`);
    // Update state in real app
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors p-6">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('main')} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-200" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Validasi Kasih Ibu</h1>
            <p className="text-slate-500 dark:text-slate-400">Monitoring Pembiasaan Karakter Siswa</p>
          </div>
        </div>
        <div className="bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
          <Heart className="w-5 h-5" /> Wali Kelas
        </div>
      </header>

      <div className="mb-6">
        <select 
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-700 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none"
        >
          <option>Kelas 1</option>
          <option>Kelas 2</option>
          <option>Kelas 3</option>
          <option>Kelas 4</option>
          <option>Kelas 5</option>
          <option>Kelas 6</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reports.map((report) => (
          <motion.div 
            key={report.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border ${report.validated ? 'border-green-200 dark:border-green-900/50' : 'border-slate-200 dark:border-slate-700'} flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${report.validated ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                {report.siswa.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">{report.siswa} <span className="text-sm font-normal text-slate-500">({report.date})</span></h3>
                <p className="text-pink-600 dark:text-pink-400 font-medium">{report.habit}</p>
                <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">"{report.desc}"</p>
                <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-bold ${report.status === 'Sudah Terbiasa' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                  {report.status}
                </span>
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              {report.validated ? (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg">
                  <CheckCircle className="w-5 h-5" /> Terverifikasi
                </div>
              ) : (
                <>
                  <button className="flex-1 md:flex-none bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
                    <XCircle className="w-5 h-5" /> Tolak
                  </button>
                  <button 
                    onClick={() => handleValidate(report.id)}
                    className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-200 dark:shadow-none"
                  >
                    <CheckCircle className="w-5 h-5" /> Validasi
                  </button>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
