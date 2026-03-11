import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Search, Filter } from 'lucide-react';

export default function NilaiGuru({ user, onNavigate }: { user: any, onNavigate: (page: string) => void }) {
  const [mapel, setMapel] = useState('');
  const [kelas, setKelas] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [nilaiData, setNilaiData] = useState<any>({});
  const [jumlahUlangan, setJumlahUlangan] = useState(3);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const [mapelList, setMapelList] = useState<string[]>([]);
  const [kelasList, setKelasList] = useState<string[]>([]);

  useEffect(() => {
    // Fetch settings for jumlahUlangan
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/pengaturan');
        const result = await res.json();
        if (result.success && result.data && result.data.jumlahUlangan) {
          setJumlahUlangan(parseInt(result.data.jumlahUlangan));
        } else {
          const stored = localStorage.getItem('school_identity_data');
          if (stored) {
            const data = JSON.parse(stored);
            if (data.jumlahUlangan) setJumlahUlangan(parseInt(data.jumlahUlangan));
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchSettings();

    // Fetch mapping from jadwal_real
    const fetchMapping = async () => {
      try {
        const res = await fetch(`/api/jadwal?guru=${encodeURIComponent(user?.nama_guru || user?.name || '')}`);
        const result = await res.json();
        if (result.success && result.data) {
          const uniqueMapel = Array.from(new Set(result.data.map((item: any) => item.mapel))).filter(Boolean) as string[];
          const uniqueKelas = Array.from(new Set(result.data.map((item: any) => item.kelas))).filter(Boolean) as string[];
          
          // Sort them
          uniqueMapel.sort();
          uniqueKelas.sort();
          
          setMapelList(uniqueMapel.length > 0 ? uniqueMapel : (user?.mengajar ? user.mengajar.split(',').map((m: string) => m.trim()) : ['Matematika', 'Bahasa Indonesia', 'IPAS', 'Pendidikan Pancasila']));
          setKelasList(uniqueKelas.length > 0 ? uniqueKelas : ['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B']);
        }
      } catch (e) {
        console.error("Error fetching mapping:", e);
        setMapelList(user?.mengajar ? user.mengajar.split(',').map((m: string) => m.trim()) : ['Matematika', 'Bahasa Indonesia', 'IPAS', 'Pendidikan Pancasila']);
        setKelasList(['1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B']);
      }
    };
    
    if (user?.nama_guru || user?.name) {
      fetchMapping();
    }
  }, [user]);

  useEffect(() => {
    if (kelas && mapel) {
      fetchStudentsAndNilai();
    }
  }, [kelas, mapel]);

  const fetchStudentsAndNilai = async () => {
    setLoading(true);
    try {
      // Fetch students
      const resStudents = await fetch('/api/murid');
      const resultStudents = await resStudents.json();
      if (resultStudents.success) {
        const filteredStudents = resultStudents.data.filter((s: any) => s.Kelas === kelas);
        setStudents(filteredStudents);
      }

      // Fetch nilai data from API
      const resPengaturan = await fetch('/api/pengaturan');
      const resultPengaturan = await resPengaturan.json();
      
      let allNilai = {};
      if (resultPengaturan.success && resultPengaturan.data && resultPengaturan.data.all_student_nilai) {
        try {
          allNilai = JSON.parse(resultPengaturan.data.all_student_nilai);
        } catch (e) {}
      }

      // Extract current class/mapel data
      const currentNilaiData: any = {};
      if (resultStudents.success) {
        const filteredStudents = resultStudents.data.filter((s: any) => s.Kelas === kelas);
        filteredStudents.forEach((student: any) => {
          const nisn = student.NISN;
          if (allNilai[nisn] && allNilai[nisn][mapel]) {
            currentNilaiData[nisn] = allNilai[nisn][mapel];
          }
        });
      }
      setNilaiData(currentNilaiData);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleNilaiChange = (nisn: string, type: string, index: number | null, value: string) => {
    const numValue = value === '' ? '' : Number(value);
    setNilaiData((prev: any) => {
      const studentData = prev[nisn] || { harian1: [], sts: '', harian2: [], asas: '' };
      
      if (type === 'harian1') {
        const newHarian1 = [...(studentData.harian1 || [])];
        newHarian1[index!] = numValue;
        return { ...prev, [nisn]: { ...studentData, harian1: newHarian1 } };
      } else if (type === 'harian2') {
        const newHarian2 = [...(studentData.harian2 || [])];
        newHarian2[index!] = numValue;
        return { ...prev, [nisn]: { ...studentData, harian2: newHarian2 } };
      } else if (type === 'sts') {
        return { ...prev, [nisn]: { ...studentData, sts: numValue } };
      } else if (type === 'asas') {
        return { ...prev, [nisn]: { ...studentData, asas: numValue } };
      }
      return prev;
    });
  };

  const calculateNA = (nisn: string) => {
    const data = nilaiData[nisn];
    if (!data) return 0;

    const harian1 = data.harian1 || [];
    const harian2 = data.harian2 || [];
    const allHarian = [...harian1, ...harian2].filter(n => typeof n === 'number' && !isNaN(n));
    
    const rerata = allHarian.length > 0 ? allHarian.reduce((a, b) => a + b, 0) / allHarian.length : 0;
    const sts = typeof data.sts === 'number' ? data.sts : 0;
    const asas = typeof data.asas === 'number' ? data.asas : 0;

    const na = (rerata * 0.50) + (sts * 0.25) + (asas * 0.25);
    return Math.round(na);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Fetch current allNilai from API
      const resPengaturan = await fetch('/api/pengaturan');
      const resultPengaturan = await resPengaturan.json();
      let allNilai: any = {};
      if (resultPengaturan.success && resultPengaturan.data && resultPengaturan.data.all_student_nilai) {
        try {
          allNilai = JSON.parse(resultPengaturan.data.all_student_nilai);
        } catch (e) {}
      }

      // Update with new data
      students.forEach(student => {
        const nisn = student.NISN;
        if (!allNilai[nisn]) allNilai[nisn] = {};
        allNilai[nisn][mapel] = {
          ...nilaiData[nisn],
          na: calculateNA(nisn)
        };
      });
      
      // Save back to API
      const saveRes = await fetch('/api/pengaturan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all_student_nilai: JSON.stringify(allNilai) })
      });
      
      const saveResult = await saveRes.json();
      if (saveResult.success) {
        setToast({ message: 'Data nilai berhasil disimpan', type: 'success' });
      } else {
        throw new Error(saveResult.message || 'Failed to save');
      }
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setToast({ message: 'Gagal menyimpan data', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg text-sm font-medium text-white ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} flex items-center gap-2 animate-in slide-in-from-top-4`}>
          {toast.message}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('main')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-600 dark:text-slate-300">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white">Input Nilai Siswa</h1>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving || !kelas || !mapel}
            className="flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">{saving ? 'Menyimpan...' : 'Simpan Nilai'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mata Pelajaran</label>
              <select 
                value={mapel}
                onChange={(e) => setMapel(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-slate-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-fuchsia-500 outline-none"
              >
                <option value="">-- Pilih Mapel --</option>
                {mapelList.map((m: string) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kelas</label>
              <select 
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-slate-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-fuchsia-500 outline-none"
              >
                <option value="">-- Pilih Kelas --</option>
                {kelasList.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {kelas && mapel && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-center w-12">No</th>
                    <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 min-w-[200px]">Nama Siswa</th>
                    <th colSpan={jumlahUlangan} className="px-4 py-2 border-r border-slate-200 dark:border-slate-700 text-center border-b">Nilai Harian (Smt 1)</th>
                    <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-center bg-fuchsia-50 dark:bg-fuchsia-900/20 w-20">STS</th>
                    <th colSpan={jumlahUlangan} className="px-4 py-2 border-r border-slate-200 dark:border-slate-700 text-center border-b">Nilai Harian (Smt 2)</th>
                    <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-center bg-fuchsia-50 dark:bg-fuchsia-900/20 w-20">ASAS</th>
                    <th rowSpan={2} className="px-4 py-3 text-center bg-slate-100 dark:bg-slate-800 w-24 font-bold">Nilai Akhir</th>
                  </tr>
                  <tr>
                    {Array.from({ length: jumlahUlangan }).map((_, i) => (
                      <th key={`h1-${i}`} className="px-2 py-2 border-r border-slate-200 dark:border-slate-700 text-center w-16">{i + 1}</th>
                    ))}
                    {Array.from({ length: jumlahUlangan }).map((_, i) => (
                      <th key={`h2-${i}`} className="px-2 py-2 border-r border-slate-200 dark:border-slate-700 text-center w-16">{i + 1 + jumlahUlangan}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5 + (jumlahUlangan * 2)} className="px-4 py-8 text-center text-slate-500">Memuat data siswa...</td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={5 + (jumlahUlangan * 2)} className="px-4 py-8 text-center text-slate-500">Tidak ada data siswa untuk kelas ini.</td>
                    </tr>
                  ) : (
                    students.map((student, idx) => (
                      <tr key={student.NISN} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-2 border-r border-slate-100 dark:border-slate-700/50 text-center">{idx + 1}</td>
                        <td className="px-4 py-2 border-r border-slate-100 dark:border-slate-700/50 font-medium text-slate-800 dark:text-slate-200">{student['Nama Lengkap']}</td>
                        
                        {Array.from({ length: jumlahUlangan }).map((_, i) => (
                          <td key={`val-h1-${i}`} className="px-1 py-1 border-r border-slate-100 dark:border-slate-700/50">
                            <input 
                              type="number" 
                              min="0" max="100"
                              value={nilaiData[student.NISN]?.harian1?.[i] ?? ''}
                              onChange={(e) => handleNilaiChange(student.NISN, 'harian1', i, e.target.value)}
                              className="w-full px-2 py-1.5 text-center bg-transparent border-none focus:ring-2 focus:ring-fuchsia-500 rounded outline-none dark:text-white"
                            />
                          </td>
                        ))}
                        
                        <td className="px-1 py-1 border-r border-slate-100 dark:border-slate-700/50 bg-fuchsia-50/50 dark:bg-fuchsia-900/10">
                          <input 
                            type="number" 
                            min="0" max="100"
                            value={nilaiData[student.NISN]?.sts ?? ''}
                            onChange={(e) => handleNilaiChange(student.NISN, 'sts', null, e.target.value)}
                            className="w-full px-2 py-1.5 text-center bg-transparent border-none focus:ring-2 focus:ring-fuchsia-500 rounded outline-none font-medium text-fuchsia-700 dark:text-fuchsia-300"
                          />
                        </td>

                        {Array.from({ length: jumlahUlangan }).map((_, i) => (
                          <td key={`val-h2-${i}`} className="px-1 py-1 border-r border-slate-100 dark:border-slate-700/50">
                            <input 
                              type="number" 
                              min="0" max="100"
                              value={nilaiData[student.NISN]?.harian2?.[i] ?? ''}
                              onChange={(e) => handleNilaiChange(student.NISN, 'harian2', i, e.target.value)}
                              className="w-full px-2 py-1.5 text-center bg-transparent border-none focus:ring-2 focus:ring-fuchsia-500 rounded outline-none dark:text-white"
                            />
                          </td>
                        ))}

                        <td className="px-1 py-1 border-r border-slate-100 dark:border-slate-700/50 bg-fuchsia-50/50 dark:bg-fuchsia-900/10">
                          <input 
                            type="number" 
                            min="0" max="100"
                            value={nilaiData[student.NISN]?.asas ?? ''}
                            onChange={(e) => handleNilaiChange(student.NISN, 'asas', null, e.target.value)}
                            className="w-full px-2 py-1.5 text-center bg-transparent border-none focus:ring-2 focus:ring-fuchsia-500 rounded outline-none font-medium text-fuchsia-700 dark:text-fuchsia-300"
                          />
                        </td>

                        <td className="px-4 py-2 text-center bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-800 dark:text-white">
                          {calculateNA(student.NISN)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
