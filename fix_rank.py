import re

with open('src/components/PointRewardCard.tsx', 'r') as f:
    content = f.read()

# Add the count query before calculating rank
query_replacement = r'''        // Fetch all habits for the class
        const { data, error } = await supabase
          .from('kasih_ibu')
          .select('nisn, nama_murid, jenis_kebiasaan, timestamp')
          .eq('kelas', user.Kelas)
          .order('timestamp', { ascending: false });

        if (error) throw error;
        
        // Fetch real total students count in this class
        const { count: totalClassStudents } = await supabase
          .from('murid')
          .select('*', { count: 'exact', head: true })
          .eq('Kelas', user.Kelas);'''

content = content.replace(
    '''        // Fetch all habits for the class
        const { data, error } = await supabase
          .from('kasih_ibu')
          .select('nisn, nama_murid, jenis_kebiasaan, timestamp')
          .eq('kelas', user.Kelas)
          .order('timestamp', { ascending: false });

        if (error) throw error;''',
    query_replacement
)

# Fix rank and total
rank_replacement = r'''        const totalMyPoints = Object.values(currentStudentBreakdown).reduce((sum, pts) => sum + pts, 0);
        
        const myRank = rankIndex !== -1 ? rankIndex + 1 : sortedScores.length + 1;
        const realTotal = totalClassStudents !== null ? Math.max(totalClassStudents, myRank) : Math.max(sortedScores.length + (rankIndex === -1 ? 1 : 0), 1);
        
        setStudentPoints(totalMyPoints);
        setStudentRank(myRank);
        setTotalStudents(realTotal);'''

content = content.replace(
    '''        const totalMyPoints = Object.values(currentStudentBreakdown).reduce((sum, pts) => sum + pts, 0);
        
        setStudentPoints(totalMyPoints);
        setStudentRank(rankIndex !== -1 ? rankIndex + 1 : sortedScores.length + 1);
        setTotalStudents(Math.max(sortedScores.length, 1)); // At least 1 (themselves) if no data''',
    rank_replacement
)

with open('src/components/PointRewardCard.tsx', 'w') as f:
    f.write(content)
