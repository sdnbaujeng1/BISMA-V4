import re

with open('server.ts', 'r') as f:
    content = f.read()

replacement1 = r'''      const { start, end } = await getTahunAjaranFilter();
      
      let allData: any[] = [];
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

content = content.replace(
    '''      const { start, end } = await getTahunAjaranFilter();
      let query = supabase.from('kasih_ibu').select('jenis_kebiasaan, timestamp').gte('timestamp', start).lte('timestamp', end);
      
      const { data, error } = await query;''',
    replacement1
)

replacement2 = r'''      const { start, end } = await getTahunAjaranFilter();
      
      let allData: any[] = [];
      let hasMore = true;
      let page = 0;
      const pageSize = 1000;
      
      while (hasMore) {
        let query = supabase.from('kasih_ibu').select('*').gte('timestamp', start).lte('timestamp', end).order('timestamp', { ascending: false });
        
        if (kelas) query = query.eq('kelas', kelas);
        if (tanggal) query = query.eq('tanggal_kegiatan', tanggal);
        
        if (nis && nis !== '' && nama && nama !== '') {
          query = query.or(`nisn.eq."${nis}",nama_murid.eq."${nama}"`);
        } else if (nis && nis !== '') {
          query = query.eq('nisn', nis);
        } else if (nama && nama !== '') {
          query = query.eq('nama_murid', nama);
        }
        
        query = query.range(page * pageSize, (page + 1) * pageSize - 1);
        
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

content = content.replace(
    '''      const { start, end } = await getTahunAjaranFilter();
      let query = supabase.from('kasih_ibu').select('*').gte('timestamp', start).lte('timestamp', end).order('timestamp', { ascending: false });
      
      if (kelas) query = query.eq('kelas', kelas);
      if (tanggal) query = query.eq('tanggal_kegiatan', tanggal);
      
      if (nis && nis !== '' && nama && nama !== '') {
        query = query.or(`nisn.eq."${nis}",nama_murid.eq."${nama}"`);
      } else if (nis && nis !== '') {
        query = query.eq('nisn', nis);
      } else if (nama && nama !== '') {
        query = query.eq('nama_murid', nama);
      }
      
      const { data, error } = await query;''',
    replacement2
)

with open('server.ts', 'w') as f:
    f.write(content)
