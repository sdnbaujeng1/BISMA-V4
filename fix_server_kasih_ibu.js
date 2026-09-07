const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// For line 2068 logic (get stats):
code = code.replace(
    '''      const { start, end } = await getTahunAjaranFilter();
      let query = supabase.from('kasih_ibu').select('jenis_kebiasaan, timestamp').gte('timestamp', start).lte('timestamp', end);
      
      const { data, error } = await query;''',
    '''      const { start, end } = await getTahunAjaranFilter();
      
      let allData = [];
      let hasMore = true;
      let page = 0;
      const pageSize = 1000;
      
      while (hasMore) {
        let query = supabase.from('kasih_ibu').select('jenis_kebiasaan, timestamp').gte('timestamp', start).lte('timestamp', end).range(page * pageSize, (page + 1) * pageSize - 1);
        const { data, error } = await query;
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
);

fs.writeFileSync('server.ts', code);
