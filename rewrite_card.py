import re

with open('src/components/PointRewardCard.tsx', 'r') as f:
    content = f.read()

replacement = r'''        // First get all students in this class so we know who to rank
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
        
        const data = allData;'''

# Replace from `// Fetch all habits for the class` down to `eq('Kelas', user.Kelas);`
pattern = r'// Fetch all habits for the class.*?\.eq\(\'Kelas\', user\.Kelas\);'
content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('src/components/PointRewardCard.tsx', 'w') as f:
    f.write(content)
