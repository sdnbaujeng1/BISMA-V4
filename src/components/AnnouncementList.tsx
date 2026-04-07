import { useState, useEffect } from 'react';
import { Megaphone, AlertTriangle, Calendar } from 'lucide-react';

export default function AnnouncementList() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pengumuman?role=public')
      .then(res => res.json())
      .then(res => {
        if (res.success) setAnnouncements(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch announcements", err);
        setLoading(false);
      });
  }, []);

  const getAnnouncementStyle = (type: string) => {
    switch (type) {
      case 'important':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-800',
          text: 'text-orange-800 dark:text-orange-200',
          title: 'text-orange-900 dark:text-orange-100',
          icon: AlertTriangle,
          iconColor: 'text-orange-600 dark:text-orange-400'
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-800 dark:text-blue-200',
          title: 'text-blue-900 dark:text-blue-100',
          icon: Calendar, // Or Info
          iconColor: 'text-blue-600 dark:text-blue-400'
        };
    }
  };

  if (loading) return <div className="p-4 text-center text-slate-400 text-sm">Memuat pengumuman...</div>;

  if (announcements.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5 border border-slate-100 dark:border-slate-700">
        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" /> Pengumuman Terbaru
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm italic">Tidak ada pengumuman saat ini.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5 border border-slate-100 dark:border-slate-700">
      <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-orange-500" /> Pengumuman Terbaru
      </h3>
      <div className="space-y-3">
        {announcements.map((item) => {
          const style = getAnnouncementStyle(item.type || 'info');
          const Icon = style.icon;
          
          return (
            <div key={item.id} className={`${style.bg} border ${style.border} rounded-xl p-4 transition-all hover:shadow-md`}>
              <h4 className={`font-bold ${style.title} mb-1 flex items-center gap-2`}>
                {item.judul}
              </h4>
              <p className={`text-sm ${style.text} mb-2 leading-relaxed`}>
                {item.isi}
              </p>
              <div className="flex items-center gap-2 text-xs opacity-70">
                <span className={style.text}>Diposting: {new Date(item.tanggal_terbit || item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
