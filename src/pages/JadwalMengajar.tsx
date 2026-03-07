import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Download, Printer } from 'lucide-react';
import { motion } from 'motion/react';

export default function JadwalMengajar({ user, onNavigate }: { user: any, onNavigate: (page: string) => void }) {
  const [schedule, setSchedule] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/jadwal-mengajar?namaGuru=${encodeURIComponent(user?.['Nama Guru'] || '')}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSchedule(Array.isArray(data.data) ? data.data : []);
        }
      })
      .catch(err => console.error("Failed to fetch schedule", err));
  }, [user]);

  const handleDownloadPDF = () => {
    alert("Fitur download PDF sedang diproses...");
    // Implement PDF generation logic here (e.g., using jspdf)
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors p-6">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('main')} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-200" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Jadwal Mengajar</h1>
            <p className="text-slate-500 dark:text-slate-400">Semester Ganjil 2024/2025</p>
          </div>
        </div>
        <button 
          onClick={handleDownloadPDF}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none transition-all"
        >
          <Download className="w-4 h-4" /> Download PDF
        </button>
      </header>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 uppercase font-bold">
              <tr>
                <th className="px-6 py-4">Hari</th>
                <th className="px-6 py-4 text-center">Jam Ke</th>
                <th className="px-6 py-4">Kelas</th>
                <th className="px-6 py-4">Mata Pelajaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {schedule.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{item.hari}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-block w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
                      {item.jam}
                    </span>
                  </td>
                  <td className="px-6 py-4">{item.kelas}</td>
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{item.mapel}</td>
                </tr>
              ))}
              {schedule.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">
                    Belum ada jadwal yang diatur oleh admin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
