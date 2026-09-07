import re

with open('server.ts', 'r') as f:
    content = f.read()

replacement1 = r'''      const { start, end } = await getTahunAjaranFilter();
      
      let allData: any[] = [];
      let hasMore = true;
      let page = 0;
      const pageSize = 1000;
      
      while (hasMore) {
        let query = supabase.from('tabungan_sampah').select('kelas, nilai, berat').gte('tanggal', start).lte('tanggal', end).range(page * pageSize, (page + 1) * pageSize - 1);
        
        if (month) {
          const startDate = `${month}-01T00:00:00Z`;
          const [year, m] = String(month).split('-');
          const lastDay = new Date(Number(year), Number(m), 0).getDate();
          const endDate = `${month}-${lastDay}T23:59:59Z`;
          query = supabase.from('tabungan_sampah').select('kelas, nilai, berat').gte('tanggal', startDate).lte('tanggal', endDate).range(page * pageSize, (page + 1) * pageSize - 1);
        }
        
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
      let query = supabase.from('tabungan_sampah').select('kelas, nilai, berat').gte('tanggal', start).lte('tanggal', end);
      
      if (month) {
        const startDate = `${month}-01T00:00:00Z`;
        const [year, m] = String(month).split('-');
        const lastDay = new Date(Number(year), Number(m), 0).getDate();
        const endDate = `${month}-${lastDay}T23:59:59Z`;
        query = supabase.from('tabungan_sampah').select('kelas, nilai, berat').gte('tanggal', startDate).lte('tanggal', endDate);
      }
      
      const { data, error } = await query;''',
    replacement1
)

replacement2 = r'''    const { start, end } = await getTahunAjaranFilter();
    
    let allData: any[] = [];
    let hasMore = true;
    let page = 0;
    const pageSize = 1000;
    
    while (hasMore) {
      let query = supabase.from('tabungan_sampah').select('*').gte('tanggal', start).lte('tanggal', end).order('tanggal', { ascending: false }).range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (month) {
        const startDate = `${month}-01T00:00:00Z`;
        const [year, m] = String(month).split('-');
        const lastDay = new Date(Number(year), Number(m), 0).getDate();
        const endDate = `${month}-${lastDay}T23:59:59Z`;
        query = supabase.from('tabungan_sampah').select('*').gte('tanggal', startDate).lte('tanggal', endDate).order('tanggal', { ascending: false }).range(page * pageSize, (page + 1) * pageSize - 1);
      }
      
      const { data, error } = await query;
      if (error) return res.status(500).json({ success: false, message: error.message });
      
      if (data && data.length > 0) {
        allData = [...allData, ...data];
        if (data.length < pageSize) hasMore = false;
        else page++;
      } else {
        hasMore = false;
      }
    }
    
    res.json({ success: true, data: allData });'''

content = content.replace(
    '''    const { start, end } = await getTahunAjaranFilter();
    let query = supabase.from('tabungan_sampah').select('*').gte('tanggal', start).lte('tanggal', end).order('tanggal', { ascending: false });
    
    if (month) {
      const startDate = `${month}-01T00:00:00Z`;
      const [year, m] = String(month).split('-');
      const lastDay = new Date(Number(year), Number(m), 0).getDate();
      const endDate = `${month}-${lastDay}T23:59:59Z`;
      query = supabase.from('tabungan_sampah').select('*').gte('tanggal', startDate).lte('tanggal', endDate).order('tanggal', { ascending: false });
    }
    
    const { data, error } = await query;
    if (error) return res.status(500).json({ success: false, message: error.message });
    
    res.json({ success: true, data });''',
    replacement2
)

with open('server.ts', 'w') as f:
    f.write(content)
