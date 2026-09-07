import re

with open('src/pages/KasihIbuGuru.tsx', 'r') as f:
    content = f.read()

replacement = r'''      let pointsData: any[] = [];
      let hasMore = true;
      let page = 0;
      const pageSize = 1000;

      while (hasMore) {
        const { data, error } = await supabase
          .from("kasih_ibu")
          .select("nisn, nama_murid, jenis_kebiasaan, kelas")
          .gte('timestamp', start)
          .lte('timestamp', end)
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
           console.error("Error fetching data", error);
           break;
        }

        if (data && data.length > 0) {
          pointsData = [...pointsData, ...data];
          if (data.length < pageSize) hasMore = false;
          else page++;
        } else {
          hasMore = false;
        }
      }'''

content = content.replace(
    '''      const { data: pointsData } = await supabase.from("kasih_ibu").select("nisn, jenis_kebiasaan, kelas").gte('timestamp', start).lte('timestamp', end);''',
    replacement
)

with open('src/pages/KasihIbuGuru.tsx', 'w') as f:
    f.write(content)
