import { useState, useEffect } from 'react';
import { Megaphone, AlertTriangle, Calendar, ChevronDown, ChevronUp, Minimize2, Maximize2, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UnifiedAnnouncementCardProps {
  type?: 'public' | 'student' | 'guru' | 'tendik' | 'admin';
  guruName?: string; // For Guru dashboard to fetch specific journal
}

export default function UnifiedAnnouncementCard({ type = 'public', guruName }: UnifiedAnnouncementCardProps) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [latestAnnouncement, setLatestAnnouncement] = useState<any>(null);
  const [latestJournal, setLatestJournal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Announcements
        const annRes = await fetch('/api/pengumuman');
        const annData = await annRes.json();
        
        if (annData.success && annData.data) {
          setAnnouncements(annData.data);
          if (annData.data.length > 0) {
            setLatestAnnouncement(annData.data[0]);
          }
        }

        // If Guru, fetch latest journal
        if (type === 'guru' && guruName) {
          const journalRes = await fetch(`/api/guru/latest-jurnal?namaGuru=${encodeURIComponent(guruName)}`);
          const journalData = await journalRes.json();
          if (journalData.success && journalData.data) {
            setLatestJournal(journalData.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, guruName]);

  const getAnnouncementStyle = (annType: string) => {
    switch (annType) {
      case 'important':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-800',
          text: 'text-orange-800 dark:text-orange-200',
          title: 'text-orange-900 dark:text-orange-100',
          icon: AlertTriangle,
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-800 dark:text-blue-200',
          title: 'text-blue-900 dark:text-blue-100',
          icon: Calendar,
        };
    }
  };

  // Determine what to show as "Latest"
  const isGuruMode = type === 'guru' && latestJournal;
  
  const displayTitle = isGuruMode ? 'Materi Terakhir Diajarkan' : 'Informasi Terkini';
  const displayDate = isGuruMode 
    ? new Date(latestJournal.timestamp).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  const displayContent = isGuruMode 
    ? (
        <div>
          <div className="font-bold text-lg mb-1">{latestJournal.mata_pelajaran} - Kelas {latestJournal.kelas}</div>
          <div className="text-blue-100 text-sm opacity-90 line-clamp-2">
            {(() => {
              try {
                const materiData = typeof latestJournal.materi === 'string' 
                  ? JSON.parse(latestJournal.materi) 
                  : latestJournal.materi;
                
                if (Array.isArray(materiData)) {
                  return materiData.map((m: any) => m.materi || m.topik || m.sub_materi).join(', ');
                }
                return '-';
              } catch (e) {
                return latestJournal.materi || '-';
              }
            })()}
          </div>
        </div>
      )
    : (latestAnnouncement ? (
        <>
          <div className="flex items-center gap-2 text-xs font-bold bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm shadow-inner border border-white/10 mb-2">
            <div className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)] ${latestAnnouncement?.type === 'important' ? 'bg-orange-400' : 'bg-green-400'}`}></div>
            {latestAnnouncement.judul}
          </div>
          <p className="text-xs text-blue-50 line-clamp-2 opacity-90">
            {latestAnnouncement.isi}
          </p>
        </>
      ) : (
        <p className="text-sm text-blue-100 italic">Tidak ada informasi terkini.</p>
      ));

  const DisplayIcon = isGuruMode ? BookOpen : Megaphone;

  if (loading) return <div className="p-4 text-center text-slate-400 text-sm animate-pulse">Memuat informasi...</div>;

  return (
    <div className="space-y-4">
      {/* Hero Card */}
      <div className={`bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-lg shadow-blue-200 dark:shadow-none text-white relative overflow-hidden group transition-all duration-300 ${isMinimized ? 'p-3 sm:p-4' : 'p-4 sm:p-6'} h-full flex flex-col`}>
        <div className="relative z-10 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className={`font-bold drop-shadow-md ${isMinimized ? 'text-xs sm:text-base' : 'text-sm sm:text-lg mb-1'}`}>{displayTitle}</h3>
              {!isMinimized && isGuruMode && <p className="text-blue-100 text-[10px] sm:text-sm mb-2 sm:mb-4 font-medium">{displayDate}</p>}
            </div>
            <button 
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
              title={isMinimized ? "Tampilkan Detail" : "Kecilkan Tampilan"}
            >
              {isMinimized ? <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" /> : <Minimize2 className="w-3 h-3 sm:w-4 sm:h-4" />}
            </button>
          </div>
          
          <AnimatePresence>
            {!isMinimized && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-auto"
              >
                {isGuruMode ? (
                  <div>
                    <div className="font-bold text-sm sm:text-lg mb-1 leading-tight">{latestJournal.mata_pelajaran} - Kelas {latestJournal.kelas}</div>
                    <div className="text-blue-100 text-xs sm:text-sm opacity-90 line-clamp-2 sm:line-clamp-3">
                      {(() => {
                        try {
                          const materiData = typeof latestJournal.materi === 'string' 
                            ? JSON.parse(latestJournal.materi) 
                            : latestJournal.materi;
                          
                          if (Array.isArray(materiData)) {
                            return materiData.map((m: any) => m.materi || m.topik || m.sub_materi).join(', ');
                          }
                          return '-';
                        } catch (e) {
                          return latestJournal.materi || '-';
                        }
                      })()}
                    </div>
                  </div>
                ) : (latestAnnouncement ? (
                  <>
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold bg-white/20 w-fit px-2 py-0.5 sm:px-3 sm:py-1 rounded-full backdrop-blur-sm shadow-inner border border-white/10 mb-2">
                      <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)] ${latestAnnouncement?.type === 'important' ? 'bg-orange-400' : 'bg-green-400'}`}></div>
                      <span className="truncate max-w-[120px] sm:max-w-none">{latestAnnouncement.judul}</span>
                    </div>
                    <p className="text-xs text-blue-50 line-clamp-2 opacity-90">
                      {latestAnnouncement.isi}
                    </p>
                  </>
                ) : (
                  <p className="text-xs sm:text-sm text-blue-100 italic">Tidak ada informasi terkini.</p>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Background Decoration */}
        <div className={`absolute transition-all duration-500 ${isMinimized ? '-bottom-8 -right-8 scale-50' : '-bottom-4 -right-4 rotate-12 group-hover:rotate-6 group-hover:scale-110'}`}>
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-50 rounded-full"></div>
            <DisplayIcon className="w-20 h-20 sm:w-32 sm:h-32 text-white/20 drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)]" />
          </div>
        </div>
      </div>

      {/* Announcement List (Collapsible) */}
      {!isGuruMode && announcements.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
          <button 
            onClick={() => setShowAll(!showAll)}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" /> 
              Pengumuman Lainnya
            </h3>
            {showAll ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          
          <AnimatePresence>
            {showAll && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-slate-100 dark:border-slate-700"
              >
                <div className="p-4 space-y-3">
                  {announcements.slice(isMinimized ? 0 : 1).map((item) => { // If minimized, show all. If not, skip first (shown in hero).
                    const style = getAnnouncementStyle(item.type || 'info');
                    return (
                      <div key={item.id} className={`${style.bg} border ${style.border} rounded-xl p-4 transition-all hover:shadow-md`}>
                        <h4 className={`font-bold ${style.title} mb-1 flex items-center gap-2`}>
                          {item.judul}
                        </h4>
                        <p className={`text-sm ${style.text} mb-2 leading-relaxed`}>
                          {item.isi}
                        </p>
                        <div className="flex items-center gap-2 text-xs opacity-70">
                          <span className={style.text}>Diposting: {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
