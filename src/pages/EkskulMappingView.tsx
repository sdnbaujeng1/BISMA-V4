import React, { useState, useEffect } from 'react';
import { Users, Search, Save } from 'lucide-react';

export default function EkskulMappingView({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [students, setStudents] = useState<any[]>([]);
  const [ekskulMapping, setEkskulMapping] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKelas, setFilterKelas] = useState('Semua');
  
  const ekskulList = ["Pramuka", "PMR", "Pencak Silat", "Tari", "Banjari", "Bina Vokal", "Karawitan", "MIPA", "Bahasa Inggris", "Lainnya"];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [muridRes, mappingRes] = await Promise.all([
        fetch('/api/murid'),
        fetch('/api/ekskul-mapping')
      ]);
      const muridData = await muridRes.json();
      const mappingData = await mappingRes.json();
      
      if (muridData.success) {
        setStudents(muridData.data);
      }
      if (mappingData.success && mappingData.data) {
        setEkskulMapping(mappingData.data);
      }
    } catch (e) {
      console.error(e);
      showToast("Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ekskul-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapping: ekskulMapping })
      });
      const result = await res.json();
      if (result.success) {
        showToast("Mapping ekstrakurikuler berhasil disimpan!", "success");
      } else {
        showToast("Gagal menyimpan mapping", "error");
      }
    } catch (e) {
      showToast("Terjadi kesalahan jaringan", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s['Nama Lengkap']?.toLowerCase().includes(searchTerm.toLowerCase()) || s.NISN?.includes(searchTerm);
    const matchesKelas = filterKelas === 'Semua' || s.Kelas === filterKelas;
    return matchesSearch && matchesKelas;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-fuchsia-500" />
            Mapping Ekstrakurikuler
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Atur ekstrakurikuler yang diikuti oleh masing-masing siswa.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={loading}
          className="bg-fuchsia-600 hover:bg-fuchsia-700 disabled:bg-fuchsia-400 text-white px-6 py-2 rounded-xl font-bold transition-colors flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          Simpan Mapping
        </button>
      </header>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama atau NISN..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-fuchsia-500 outline-none"
            />
          </div>
          <select 
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="w-full md:w-64 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-slate-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-fuchsia-500 outline-none"
          >
            <option value="Semua">Semua Kelas</option>
            <option value="Kelas 1">Kelas 1</option>
            <option value="Kelas 2">Kelas 2</option>
            <option value="Kelas 3">Kelas 3</option>
            <option value="Kelas 4">Kelas 4</option>
            <option value="Kelas 5">Kelas 5</option>
            <option value="Kelas 6">Kelas 6</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="p-4 text-sm font-bold text-slate-600 dark:text-slate-400">NISN</th>
                <th className="p-4 text-sm font-bold text-slate-600 dark:text-slate-400">Nama Siswa</th>
                <th className="p-4 text-sm font-bold text-slate-600 dark:text-slate-400">Kelas</th>
                <th className="p-4 text-sm font-bold text-slate-600 dark:text-slate-400">Ekstrakurikuler</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((siswa, idx) => (
                <tr key={siswa.NISN || idx} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400 font-mono">{siswa.NISN}</td>
                  <td className="p-4 text-sm font-bold text-slate-800 dark:text-slate-200">{siswa['Nama Lengkap']}</td>
                  <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{siswa.Kelas}</td>
                  <td className="p-4">
                    <select 
                      value={ekskulMapping[siswa.NISN] || ""}
                      onChange={(e) => setEkskulMapping({...ekskulMapping, [siswa.NISN]: e.target.value})}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none"
                    >
                      <option value="">-- Pilih Ekskul --</option>
                      {ekskulList.map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">Tidak ada data siswa ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
