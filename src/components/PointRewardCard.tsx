import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Star, Medal, Award } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [studentPoints, setStudentPoints] = useState(0);
  const [studentRank, setStudentRank] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [breakdown, setBreakdown] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchPoints = async () => {
      if (!user?.Kelas || !user?.NIS) return;
      
      try {
        // Fetch all habits for the class
        const { data, error } = await supabase
          .from('kasih_ibu')
          .select('nisn, jenis_kebiasaan')
          .eq('kelas', user.Kelas);

        if (error) throw error;

        const pointsByUser: Record<string, number> = {};
        const currentStudentBreakdown: Record<string, number> = {};

        // Initialize breakdown for current student
        Object.keys(HABIT_POINTS).forEach(habit => {
          currentStudentBreakdown[habit] = 0;
        });

        data?.forEach(entry => {
          const habitInfo = HABIT_POINTS[entry.jenis_kebiasaan];
          if (habitInfo) {
            // Add to total points per user
            pointsByUser[entry.nisn] = (pointsByUser[entry.nisn] || 0) + habitInfo.points;

            // Add to breakdown if it's the current user
            if (entry.nisn === user.NIS) {
              currentStudentBreakdown[entry.jenis_kebiasaan] += habitInfo.points;
            }
          }
        });

        // Calculate rank
        const sortedScores = Object.entries(pointsByUser)
          .map(([nis, score]) => ({ nis, score }))
          .sort((a, b) => b.score - a.score);

        const rankIndex = sortedScores.findIndex(s => s.nis === user.NIS);
        
        setStudentPoints(pointsByUser[user.NIS] || 0);
        setStudentRank(rankIndex !== -1 ? rankIndex + 1 : sortedScores.length + 1);
        setTotalStudents(Math.max(sortedScores.length, 1)); // At least 1 (themselves) if no data
        setBreakdown(currentStudentBreakdown);
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
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 h-full flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-6 shadow-lg text-white h-full flex flex-col relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-300" />
            Point Reward Kasih Ibu
          </h3>
          <p className="text-pink-100 text-sm mt-1">Peringkat {studentRank} dari {totalStudents} di Kelas {user.Kelas}</p>
        </div>
        <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-center border border-white/30 shadow-inner">
          <p className="text-xs text-pink-100 font-medium uppercase tracking-wider mb-1">Total Poin</p>
          <p className="text-3xl font-black text-white drop-shadow-md">{studentPoints}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-auto relative z-10">
        {Object.entries(HABIT_POINTS).map(([habit, info]) => {
          const points = breakdown[habit] || 0;
          return (
            <div key={habit} className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 flex flex-col items-center justify-center text-center transition-transform hover:scale-105 hover:bg-white/20">
              <span className="text-2xl mb-1 drop-shadow-sm">{info.icon}</span>
              <span className="text-[10px] font-medium text-pink-50 leading-tight mb-1">{habit}</span>
              <span className="text-sm font-bold bg-white/20 px-2 py-0.5 rounded-full">{points} pt</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
