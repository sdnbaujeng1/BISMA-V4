import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Download, Clock, MapPin, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import { useSchoolIdentity } from '../hooks/useSchoolIdentity';

export default function JadwalMengajar({ user, onNavigate }: { user: any, onNavigate: (page: string) => void }) {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [groupedSchedule, setGroupedSchedule] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const schoolIdentity = useSchoolIdentity();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scheduleRes, settingsRes] = await Promise.all([
          fetch(`/api/jadwal-mengajar?namaGuru=${encodeURIComponent(user?.['Nama Guru'] || '')}`),
          fetch('/api/pengaturan')
        ]);

        const scheduleData = await scheduleRes.json();
        const settingsData = await settingsRes.json();

        if (scheduleData.success) {
          const rawSchedule = Array.isArray(scheduleData.data) ? scheduleData.data : [];
          setSchedule(rawSchedule);
          processSchedule(rawSchedule);
        }

        if (settingsData.success && settingsData.data) {
          setSettings(settingsData.data);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const processSchedule = (data: any[]) => {
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const grouped: any[] = [];

    days.forEach(day => {
      const daySchedule = data.filter(item => item.hari === day).sort((a, b) => a.jam - b.jam);
      
      if (daySchedule.length === 0) return;

      const dayGrouped: any[] = [];
      daySchedule.forEach(item => {
        const existing = dayGrouped.find(g => g.kelas === item.kelas && g.mapel === item.mapel);
        if (existing) {
          existing.jams.push(item.jam);
        } else {
          dayGrouped.push({ ...item, jams: [item.jam] });
        }
      });

      dayGrouped.forEach(g => {
        // Format jams array to string, e.g., [1, 2, 4] -> "1, 2, 4"
        g.jamDisplay = g.jams.join(', ');
        g.totalJP = g.jams.length;
        grouped.push(g);
      });
    });

    setGroupedSchedule(grouped);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    
    // Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(schoolIdentity.schoolName, doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Jadwal Mengajar Guru', doc.internal.pageSize.getWidth() / 2, 60, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Tahun Ajaran: ${settings.tahunAjaran || '2024/2025'} | Semester: ${settings.semester || 'Ganjil'}`, doc.internal.pageSize.getWidth() / 2, 75, { align: 'center' });
    
    doc.text(`Nama Guru: ${user?.['Nama Guru'] || ''}`, 40, 100);
    doc.text(`NIP: ${user?.NIP || '-'}`, 40, 115);

    // Table
    const tableColumn = ["Hari", "Jam Ke", "Kelas", "Mata Pelajaran"];
    const tableRows = groupedSchedule.map(item => [
      item.hari,
      item.jamDisplay,
      item.kelas,
      item.mapel
    ]);

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 130,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    });

    // Signature
    const finalY = (doc as any).lastAutoTable.finalY || 130;
    doc.text('Mengetahui,', doc.internal.pageSize.getWidth() - 150, finalY + 40);
    doc.text('Kepala Sekolah', doc.internal.pageSize.getWidth() - 150, finalY + 55);
    
    doc.setFont('helvetica', 'bold');
    doc.text(schoolIdentity.headmasterName, doc.internal.pageSize.getWidth() - 150, finalY + 110);
    doc.setFont('helvetica', 'normal');
    doc.text(`NIP. ${schoolIdentity.headmasterNIP}`, doc.internal.pageSize.getWidth() - 150, finalY + 125);

    doc.save(`Jadwal_Mengajar_${user?.['Nama Guru'] || 'Guru'}.pdf`);
  };

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors p-4 md:p-8 font-sans">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('main')} className="p-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all text-slate-700 dark:text-slate-200">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Jadwal Mengajar</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Semester {settings.semester || 'Ganjil'} {settings.tahunAjaran || '2024/2025'}</p>
          </div>
        </div>
        <button 
          onClick={handleDownloadPDF}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none transition-all transform hover:-translate-y-1 font-bold"
        >
          <Download className="w-5 h-5" /> Download PDF
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {days.map(day => {
            const dayItems = groupedSchedule.filter(item => item.hari === day);
            if (dayItems.length === 0) return null;

            return (
              <motion.div 
                key={day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col"
              >
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white flex justify-between items-center">
                  <h3 className="text-xl font-bold">{day}</h3>
                  <Calendar className="w-5 h-5 opacity-80" />
                </div>
                <div className="p-4 flex-1 flex flex-col gap-3">
                  {dayItems.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-700/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors border border-slate-100 dark:border-slate-700/50 group">
                      <div className="flex flex-col items-center justify-center w-14 h-14 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 group-hover:border-indigo-200 dark:group-hover:border-indigo-700 transition-colors">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Jam</span>
                        <span className={`font-black text-indigo-600 dark:text-indigo-400 leading-none text-center px-1 ${item.jamDisplay.length > 4 ? 'text-xs' : 'text-lg'}`}>
                          {item.jamDisplay}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-800 dark:text-white truncate" title={item.mapel}>{item.mapel}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md shadow-sm border border-slate-100 dark:border-slate-700">
                            <MapPin className="w-3 h-3 text-red-400" /> Kelas {item.kelas}
                          </span>
                          <span className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md shadow-sm border border-slate-100 dark:border-slate-700">
                            <Clock className="w-3 h-3 text-orange-400" /> {item.totalJP} JP
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
          
          {groupedSchedule.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Belum ada jadwal mengajar yang tersedia.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
