import re

with open('src/components/BankSampahSummaryCard.tsx', 'r') as f:
    content = f.read()

replacement = r'''        let allData: any[] = [];
        let hasMore = true;
        let page = 0;
        const pageSize = 1000;

        while (hasMore) {
          const { data, error } = await supabase
            .from('tabungan_sampah')
            .select('nilai')
            .ilike('siswa', `%${nama.trim()}%`)
            .range(page * pageSize, (page + 1) * pageSize - 1);

          if (error) throw error;

          if (data && data.length > 0) {
            allData = [...allData, ...data];
            if (data.length < pageSize) hasMore = false;
            else page++;
          } else {
            hasMore = false;
          }
        }
        
        const data = allData;'''

content = content.replace(
    '''        const { data, error } = await supabase
          .from('tabungan_sampah')
          .select('nilai')
          .ilike('siswa', `%${nama.trim()}%`);

        if (error) throw error;''',
    replacement
)

with open('src/components/BankSampahSummaryCard.tsx', 'w') as f:
    f.write(content)
