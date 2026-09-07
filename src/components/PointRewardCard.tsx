import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { useSchoolIdentity } from '../hooks/useSchoolIdentity';

const HABIT_POINTS: Record<string, { points: number, icon: string }> = {
  'Bangun Pagi': { points: 2, icon: '🌅' },
  'Beribadah': { points: 5, icon: '🕌' },
  'Berolahraga': { points: 2, icon: '🏃' },
  'Makan Sehat': { points: 2, icon: '🥗' },
  'Gemar Belajar': { points: 2, icon: '📚' },
  'Bermasyarakat': { points: 2, icon: '🤝' },
  'Tidur Cepat': { points: 2, icon: '😴' },
};

export default function PointRewardCard({ user }: { user: any }) {
  const schoolIdentity = useSchoolIdentity();
  const [loading, setLoading] = useState(true);
  const [studentPoints, setStudentPoints] = useState(0);
  const [studentRank, setStudentRank] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [breakdown, setBreakdown] = useState<Record<string, number>>({});
  const [lastTransaction, setLastTransaction] = useState<{ activity: string, date: string } | null>(null);
  const [isMinimized, setIsMinimized] = useState(true);

  useEffect(() => {
    const fetchPoints = async () => {
      if (!user?.Kelas || (!user?.NIS && !user?.NISN && !user?.id)) return;
      
      try {
                // First get all students in this class so we know who to rank
        const { data: classStudents, count: totalClassStudents, error: muridError } = await supabase
          .from('murid')
          .select('NISN, "Nama Lengkap"', { count: 'exact' })
          .eq('Kelas', user.Kelas);

        if (muridError) throw muridError;
        
        const validNisns = (classStudents || []).map(s => s.NISN).filter(Boolean);

        // Fetch all habits for these students with pagination to handle > 1000 rows
        let allData: any[] = [];
        let hasMore = true;
        let page = 0;
        const pageSize = 1000;

        while (hasMore) {
          let query = supabase
            .from('kasih_ibu')
            .select('nisn, nama_murid, jenis_kebiasaan, timestamp')
            .order('timestamp', { ascending: false })
            .range(page * pageSize, (page + 1) * pageSize - 1);
            
          // If we have valid NISNs, filter by them. If not, just filter by current user's class (fallback)
          if (validNisns.length > 0) {
            query = query.in('nisn', validNisns);
          } else {
            query = query.eq('kelas', user.Kelas);
          }

          const { data, error } = await query;

          if (error) throw error;
          
          if (data && data.length > 0) {
            allData = [...allData, ...data];
            if (data.length < pageSize) {
              hasMore = false;
            } else {
              page++;
            }
          } else {
            hasMore = false;
          }
        }
        
        const data = allData;

        const pointsByUser: Record<string, number> = {};
        const currentStudentBreakdown: Record<string, number> = {};
        let latestActivity: { activity: string, date: string } | null = null;

        // Initialize breakdown for current student
        Object.keys(HABIT_POINTS).forEach(habit => {
          currentStudentBreakdown[habit] = 0;
        });
        currentStudentBreakdown['Tukar Poin'] = 0;

        const userNama = user?.Nama_Murid || user?.name || user?.['Nama Lengkap'];
        let actualUsedId = String(user.NISN || user.NIS || user.id || userNama);

        data?.forEach(entry => {
          let points = 0;
          const habitInfo = HABIT_POINTS[entry.jenis_kebiasaan];
          const entryNisnStr = entry.nisn ? String(entry.nisn).trim() : null;
          const userNisnStr = user.NISN ? String(user.NISN).trim() : null;
          const userNisStr = user.NIS ? String(user.NIS).trim() : null;
          const userIdStr = user.id ? String(user.id).trim() : null;
          
          const isCurrentUser = 
             (entryNisnStr && userNisnStr && entryNisnStr === userNisnStr) || 
             (entryNisnStr && userNisStr && entryNisnStr === userNisStr) || 
             (entryNisnStr && userIdStr && entryNisnStr === userIdStr) ||
             (entry.nama_murid && userNama && String(entry.nama_murid).trim().toLowerCase() === String(userNama).trim().toLowerCase());
          
          // Always group points strictly by entry.nisn if available, to match how the admin page groups them.
          // This ensures the student's rank calculation uses the same ID grouping as everyone else.
          const studentIdentifier = entry.nisn || entry.nama_murid || 'unknown';
          
          if (isCurrentUser) {
             actualUsedId = String(studentIdentifier);
          }
          
          if (isCurrentUser && !latestActivity) {
            latestActivity = {
              activity: entry.jenis_kebiasaan,
              date: new Date(entry.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
            };
          }

          if (habitInfo) {
            points = habitInfo.points;
            if (isCurrentUser) {
              currentStudentBreakdown[entry.jenis_kebiasaan] += points;
            }
          } else if (entry.jenis_kebiasaan.startsWith('Tukar Poin')) {
            // Extract points from string like "Tukar Poin: Buku Tulis (-50)"
            const match = entry.jenis_kebiasaan.match(/\(-(\d+)\)/);
            if (match) {
              points = -parseInt(match[1], 10);
              if (isCurrentUser) {
                currentStudentBreakdown['Tukar Poin'] += points;
              }
            }
          }

          if (points !== 0) {
            pointsByUser[String(studentIdentifier)] = (pointsByUser[String(studentIdentifier)] || 0) + points;
          }
        });

        // Calculate total points from breakdown to ensure accuracy even if NIS/NISN mismatch
        const totalMyPoints = Object.values(currentStudentBreakdown).reduce((sum, pts) => sum + pts, 0);

        // Calculate rank - use the actual ID that was matched during the loop
        const currentUserId = actualUsedId;
        // Force the current user into pointsByUser if they have points, even if they had no transactions (this shouldn't happen but just in case)
        if (totalMyPoints !== 0) {
            pointsByUser[currentUserId] = totalMyPoints;
        }
        const sortedScores = Object.entries(pointsByUser)
          .map(([nis, score]) => ({ nis, score }))
          .sort((a, b) => b.score - a.score);

        const rankIndex = sortedScores.findIndex(s => s.nis === currentUserId);
        
        const myRank = rankIndex !== -1 ? rankIndex + 1 : sortedScores.length + 1;
        const realTotal = totalClassStudents !== null ? Math.max(totalClassStudents, myRank) : Math.max(sortedScores.length + (rankIndex === -1 ? 1 : 0), 1);
        
        setStudentPoints(totalMyPoints);
        setStudentRank(myRank);
        setTotalStudents(realTotal);
        setBreakdown(currentStudentBreakdown);
        setLastTransaction(latestActivity);
      } catch (err) {
        console.error("Error fetching points:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPoints();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 h-full flex items-center justify-center min-h-[160px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl p-4 sm:p-6 shadow-lg text-white flex flex-col relative overflow-hidden transition-all duration-300 h-full">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
      
      <div className={`flex justify-between items-center relative z-10 ${isMinimized ? 'h-full' : ''}`}>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300" />
              Point Reward {schoolIdentity.kasihIbuLabel || 'Kasih Ibu'}
            </h3>
            <button 
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-pink-100 text-xs sm:text-sm mt-1">Peringkat {studentRank} dari {totalStudents} di {user.Kelas?.startsWith("Kelas") ? user.Kelas : `Kelas ${user.Kelas}`}</p>
          {lastTransaction && (
            <p className="text-pink-200 text-[10px] sm:text-xs mt-0.5 italic">
              Terakhir: {lastTransaction.activity} ({lastTransaction.date})
            </p>
          )}
        </div>
        <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-center border border-white/30 shadow-inner ml-2">
          <p className="text-[10px] sm:text-xs text-pink-100 font-medium uppercase tracking-wider mb-0.5">Total Poin</p>
          <p className="text-xl sm:text-3xl font-black text-white drop-shadow-md">{studentPoints}</p>
        </div>
      </div>

      {!isMinimized && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-6 relative z-10 animate-in fade-in slide-in-from-top-4 duration-300">
          {Object.entries(HABIT_POINTS).map(([habit, info]) => {
            const points = breakdown[habit] || 0;
            return (
              <div key={habit} className="bg-white/10 backdrop-blur-md rounded-xl p-2 sm:p-3 border border-white/20 flex flex-col items-center justify-center text-center transition-transform hover:scale-105 hover:bg-white/20">
                <span className="text-xl sm:text-2xl mb-1 drop-shadow-sm">{info.icon}</span>
                <span className="text-[9px] sm:text-[10px] font-medium text-pink-50 leading-tight mb-1">{habit}</span>
                <span className="text-xs sm:text-sm font-bold bg-white/20 px-2 py-0.5 rounded-full">{points} pt</span>
              </div>
            );
          })}
          {breakdown['Tukar Poin'] !== 0 && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 sm:p-3 border border-white/20 flex flex-col items-center justify-center text-center transition-transform hover:scale-105 hover:bg-white/20">
              <span className="text-xl sm:text-2xl mb-1 drop-shadow-sm">🎁</span>
              <span className="text-[9px] sm:text-[10px] font-medium text-pink-50 leading-tight mb-1">Tukar Poin</span>
              <span className="text-xs sm:text-sm font-bold bg-white/20 px-2 py-0.5 rounded-full text-red-200">{breakdown['Tukar Poin']} pt</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
