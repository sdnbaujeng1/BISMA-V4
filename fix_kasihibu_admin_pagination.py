import re

with open('src/pages/KasihIbuAdmin.tsx', 'r') as f:
    content = f.read()

replacement = r'''      // Build date filters
      let startDateStr = `${startYear}-07-01T00:00:00.000Z`;
      let endDateStr = `${endYear}-06-30T23:59:59.999Z`;

      if (selectedMonth) {
        startDateStr = `${selectedMonth}-01T00:00:00.000Z`;
        const [year, m] = String(selectedMonth).split('-');
        const lastDay = new Date(Number(year), Number(m), 0).getDate();
        endDateStr = `${selectedMonth}-${lastDay}T23:59:59.999Z`;
      }

      let pointsData: any[] = [];
      let hasMore = true;
      let page = 0;
      const pageSize = 1000;

      while (hasMore) {
        const { data, error } = await supabase
          .from("kasih_ibu")
          .select("nisn, nama_murid, jenis_kebiasaan, kelas")
          .gte('timestamp', startDateStr)
          .lte('timestamp', endDateStr)
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
    '''      let query = supabase.from("kasih_ibu").select("nisn, jenis_kebiasaan, kelas").gte('timestamp', `${startYear}-07-01T00:00:00.000Z`).lte('timestamp', `${endYear}-06-30T23:59:59.999Z`);
      
      if (selectedMonth) {
        const startDate = `${selectedMonth}-01T00:00:00Z`;
        const [year, m] = String(selectedMonth).split('-');
        const lastDay = new Date(Number(year), Number(m), 0).getDate();
        const endDate = `${selectedMonth}-${lastDay}T23:59:59Z`;
        query = query.gte('timestamp', startDate).lte('timestamp', endDate);
      }
      
      const { data: pointsData } = await query;''',
    replacement
)

with open('src/pages/KasihIbuAdmin.tsx', 'w') as f:
    f.write(content)
