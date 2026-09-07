import re

with open('src/components/PointRewardCard.tsx', 'r') as f:
    content = f.read()

query_replacement = r'''        // Fetch all habits for the class with pagination to handle > 1000 rows
        let allData: any[] = [];
        let hasMore = true;
        let page = 0;
        const pageSize = 1000;

        while (hasMore) {
          const { data, error } = await supabase
            .from('kasih_ibu')
            .select('nisn, nama_murid, jenis_kebiasaan, timestamp')
            .eq('kelas', user.Kelas)
            .order('timestamp', { ascending: false })
            .range(page * pageSize, (page + 1) * pageSize - 1);

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

content = content.replace(
    '''        const { data, error } = await supabase
          .from('kasih_ibu')
          .select('nisn, nama_murid, jenis_kebiasaan, timestamp')
          .eq('kelas', user.Kelas)
          .order('timestamp', { ascending: false });

        if (error) throw error;''',
    query_replacement
)

with open('src/components/PointRewardCard.tsx', 'w') as f:
    f.write(content)
