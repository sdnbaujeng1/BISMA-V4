import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar as CalendarIcon, Save, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function KalenderAkademik({ onBack }: { onBack: () => void }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [statusToSet, setStatusToSet] = useState('efektif');

  const statusOptions = [
    { id: 'efektif', label: 'Hari Efektif', color: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { id: 'fakultatif', label: 'Efektif Fakultatif', color: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { id: 'tidak_efektif', label: 'Tidak Efektif', color: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
    { id: 'libur', label: 'Hari Libur', color: 'bg-red-500', text: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/pengaturan');
      const json = await res.json();
      if (json.success && json.data.kalender_akademik) {
        setCalendarData(JSON.parse(json.data.kalender_akademik));
      }
    } catch (e) {
      console.error("Failed to fetch calendar data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (selectedDates.length === 0) return;
    
    setSaving(true);
    const newData = { ...calendarData };
    selectedDates.forEach(date => {
      newData[date] = statusToSet;
    });

    try {
      const res = await fetch('/api/pengaturan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kalender_akademik: JSON.stringify(newData) })
      });
      const json = await res.json();
      if (json.success) {
        setCalendarData(newData);
        setSelectedDates([]);
        setShowModal(false);
      }
    } catch (e) {
      console.error("Failed to save calendar data", e);
    } finally {
      setSaving(false);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const toggleDateSelection = (dateStr: string) => {
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter(d => d !== dateStr));
    } else {
      setSelectedDates([...selectedDates, dateStr]);
    }
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    const weekDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 border border-transparent"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isSunday = date.getDay() === 0;
      
      // Default status: Sunday is libur, others are efektif unless specified
      let status = isSunday ? 'libur' : 'efektif';
      if (calendarData[dateStr]) {
        status = calendarData[dateStr];
      }

      const statusObj = statusOptions.find(s => s.id === status) || statusOptions[0];
      const isSelected = selectedDates.includes(dateStr);

      days.push(
        <div 
          key={i} 
          onClick={() => !isSunday && toggleDateSelection(dateStr)}
          className={`relative p-2 min-h-[80px] border rounded-xl transition-all ${
            isSunday ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 cursor-not-allowed opacity-70' : 
            isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-md transform scale-105 z-10 cursor-pointer' : 
            'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 cursor-pointer'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className={`font-bold ${isSunday ? 'text-red-500' : 'text-slate-700 dark:text-slate-200'}`}>{i}</span>
            {isSelected && (
              <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
          </div>
          <div className={`mt-2 text-[10px] font-bold uppercase px-2 py-1 rounded-md text-center ${statusObj.bg} ${statusObj.text}`}>
            {statusObj.label}
          </div>
        </div>
      );
    }

    return (
      <div className="w-full">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day, idx) => (
            <div key={day} className={`text-center font-bold text-xs uppercase py-2 ${idx === 0 ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Kalender Akademik</h1>
              <p className="text-slate-500 dark:text-slate-400">Atur hari efektif dan libur sekolah</p>
            </div>
          </div>
          {selectedDates.length > 0 && (
            <button 
              onClick={() => setShowModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2 animate-bounce"
            >
              <Save className="w-5 h-5" /> Atur {selectedDates.length} Hari
            </button>
          )}
        </header>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-indigo-500" />
              {currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 font-bold text-slate-700 dark:text-slate-200 transition-colors">
                Bulan Sebelumnya
              </button>
              <button onClick={nextMonth} className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 font-bold text-slate-700 dark:text-slate-200 transition-colors">
                Bulan Berikutnya
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            renderCalendar()
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 flex gap-4 items-start border border-blue-100 dark:border-blue-800/30">
          <Info className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-1">Informasi Pengaturan</h4>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Klik pada tanggal untuk memilih hari (bisa lebih dari satu). Hari Minggu secara otomatis diatur sebagai hari libur dan tidak dapat diubah. Pengaturan ini digunakan untuk menghitung persentase kehadiran guru dan murid.
            </p>
          </div>
        </div>
      </div>

      {/* Modal Setting Status */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Atur Status Hari</h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              
              <div className="p-6">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Anda akan mengatur status untuk <strong className="text-indigo-600 dark:text-indigo-400">{selectedDates.length} hari</strong> yang dipilih.
                </p>
                
                <div className="space-y-3 mb-8">
                  {statusOptions.map(opt => (
                    <label 
                      key={opt.id} 
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        statusToSet === opt.id 
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                          : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="status" 
                        value={opt.id} 
                        checked={statusToSet === opt.id}
                        onChange={() => setStatusToSet(opt.id)}
                        className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${opt.color}`}></div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{opt.label}</span>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    {saving ? (
                      <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Menyimpan...</>
                    ) : (
                      <><Save className="w-5 h-5" /> Simpan</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
