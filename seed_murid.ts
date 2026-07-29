import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = 'https://qisjuugbxrcjvpdnzxhz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const muridData = [
    { NISN: "3160176227", "Nama Lengkap": "ABDUL AZIS", Kelas: "Kelas 3", "Password (Default: baujeng(kelas))": "3", "Tanggal Lahir (YYYY-MM-DD)": "2016-01-14", "Jenis Kelamin (L/P)": "L", NIS: "2972" },
    { NISN: "3154826452", "Nama Lengkap": "Achmad Al Arief Billah", Kelas: "Kelas 4", "Password (Default: baujeng(kelas))": "4", "Tanggal Lahir (YYYY-MM-DD)": "2015-11-23", "Jenis Kelamin (L/P)": "L", NIS: "2959" },
    { NISN: "1234567890", "Nama Lengkap": "Siswa Test 1", Kelas: "Kelas 1", "Password (Default: baujeng(kelas))": "1", "Tanggal Lahir (YYYY-MM-DD)": "2018-01-01", "Jenis Kelamin (L/P)": "L", NIS: "1001" },
    { NISN: "0987654321", "Nama Lengkap": "Siswa Test 2", Kelas: "Kelas 2", "Password (Default: baujeng(kelas))": "2", "Tanggal Lahir (YYYY-MM-DD)": "2017-01-01", "Jenis Kelamin (L/P)": "P", NIS: "1002" }
  ];
  
  await supabase.from('murid').insert(muridData);
  console.log('seeded murid');
}
run();
