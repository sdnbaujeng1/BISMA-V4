import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Plus, Save, X, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function BankSampahGuru({ user, onNavigate }: { user: any, onNavigate: (page: string) => void }) {
  const [showModal, setShowModal] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [formData, setFormData] = useState({
    siswa: '',
    kelas: 'Kelas 1', // Default
    jenisSampah: '',
    berat: '',
    nilai: ''
  });
  const [exchangeData, setExchangeData] = useState({
    siswa: '',
    kelas: 'Kelas 1',
    namaAtk: '',
    harga: ''
  });
  
  const [wasteTypes, setWasteTypes] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalSavings: 0, totalWeight: 0 });
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      // Fetch Types
      const typesRes = await fetch('/api/bank-sampah/types');
      const typesData = await typesRes.json();
      if (typesData.success) setWasteTypes(typesData.data);

      // Fetch Stats & Transactions
      const statsRes = await fetch('/api/bank-sampah/stats');
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.data);
      
      const transRes = await fetch('/api/bank-sampah/transactions');
      const transData = await transRes.json();
      if (transData.success) setTransactions(transData.data);

      // Fetch Students
      const studentsRes = await fetch('/api/murid');
      const studentsData = await studentsRes.json();
      if (studentsData.success) {
        setStudents(studentsData.data);
        filterStudentsByClass(studentsData.data, formData.kelas);
      }

    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filterStudentsByClass = (allStudents: any[], kelas: string) => {
    const filtered = allStudents.filter(s => {
        const sClass = String(s.Kelas).toLowerCase().replace(/\s/g, '');
        const fClass = kelas.toLowerCase().replace(/\s/g, '');
        return sClass.includes(fClass.replace('kelas', ''));
    });
    setFilteredStudents(filtered);
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClass = e.target.value;
    setFormData({ ...formData, kelas: newClass, siswa: '' });
    filterStudentsByClass(students, newClass);
  };

  const handleExchangeClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClass = e.target.value;
    setExchangeData({ ...exchangeData, kelas: newClass, siswa: '' });
    filterStudentsByClass(students, newClass);
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const weight = e.target.value;
    const selectedType = wasteTypes.find(t => t.nama === formData.jenisSampah);
    const price = selectedType ? selectedType.harga : 0;
    const value = weight ? (parseFloat(weight) * price).toString() : '';
    
    setFormData({ ...formData, berat: weight, nilai: value });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    const selectedType = wasteTypes.find(t => t.nama === type);
    const price = selectedType ? selectedType.harga : 0;
    const value = formData.berat ? (parseFloat(formData.berat) * price).toString() : '';

    setFormData({ ...formData, jenisSampah: type, nilai: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/bank-sampah/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siswa: formData.siswa,
          kelas: formData.kelas,
          jenis_sampah: formData.jenisSampah,
          berat: Number(formData.berat),
          nilai: Number(formData.nilai),
          tanggal: new Date().toISOString()
        })
      });

      const result = await res.json();
      if (result.success) {
        showToast("Data Bank Sampah berhasil disimpan!", "success");
        setShowModal(false);
        setFormData({ siswa: '', kelas: 'Kelas 1', jenisSampah: '', berat: '', nilai: '' });
        fetchData(); // Refresh
      } else {
        showToast("Gagal menyimpan data: " + result.message, "error");
      }
    } catch (error) {
      showToast("Terjadi kesalahan jaringan", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExchangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/bank-sampah/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siswa: exchangeData.siswa,
          kelas: exchangeData.kelas,
          jenis_sampah: `Tukar ATK: ${exchangeData.namaAtk}`,
          berat: 0,
          nilai: -Math.abs(Number(exchangeData.harga)),
          tanggal: new Date().toISOString()
        })
      });

      const result = await res.json();
      if (result.success) {
        showToast("Transaksi Tukar ATK berhasil disimpan!", "success");
        setShowExchangeModal(false);
        setExchangeData({ siswa: '', kelas: 'Kelas 1', namaAtk: '', harga: '' });
        fetchData(); // Refresh
      } else {
        showToast("Gagal menyimpan data: " + result.message, "error");
      }
    } catch (error) {
      showToast("Terjadi kesalahan jaringan", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors p-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg font-bold text-white ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('main')} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-200" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Bank Sampah</h1>
            <p className="text-slate-500 dark:text-slate-400">Input Data Tabungan Siswa</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setExchangeData({ ...exchangeData, kelas: 'Kelas 1', siswa: '' });
              filterStudentsByClass(students, 'Kelas 1');
              setShowExchangeModal(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-purple-200 dark:shadow-none transition-all"
          >
            <ShoppingCart className="w-4 h-4" /> Tukar ATK
          </button>
          <button 
            onClick={() => {
              setFormData({ ...formData, kelas: 'Kelas 1', siswa: '' });
              filterStudentsByClass(students, 'Kelas 1');
              setShowModal(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-green-200 dark:shadow-none transition-all"
          >
            <Plus className="w-4 h-4" /> Input Setoran
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Sampah Terkumpul</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalWeight.toFixed(1)} kg</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Save className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Nilai Rupiah</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Rp {stats.totalSavings.toLocaleString('id-ID')}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">Riwayat Setoran Terakhir</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 uppercase font-bold">
              <tr>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Nama Siswa</th>
                <th className="px-6 py-4">Jenis Sampah</th>
                <th className="px-6 py-4">Berat (kg)</th>
                <th className="px-6 py-4 text-right">Nilai (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {transactions.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Belum ada data transaksi.</td></tr>
              ) : (
                transactions.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">{new Date(row.tanggal).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{row.siswa} ({row.kelas})</td>
                    <td className="px-6 py-4">{row.jenis_sampah}</td>
                    <td className="px-6 py-4">{row.berat}</td>
                    <td className="px-6 py-4 text-right font-bold text-green-600 dark:text-green-400">
                      {Number(row.nilai).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Input Setoran Sampah</h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Kelas</label>
                  <select 
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                    value={formData.kelas}
                    onChange={handleClassChange}
                  >
                    <option value="Kelas 1">Kelas 1</option>
                    <option value="Kelas 2">Kelas 2</option>
                    <option value="Kelas 3">Kelas 3</option>
                    <option value="Kelas 4">Kelas 4</option>
                    <option value="Kelas 5">Kelas 5</option>
                    <option value="Kelas 6">Kelas 6</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Nama Siswa</label>
                  <select 
                    required 
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                    value={formData.siswa}
                    onChange={(e) => setFormData({...formData, siswa: e.target.value})}
                  >
                    <option value="">-- Pilih Siswa --</option>
                    {filteredStudents.map((s, idx) => (
                        <option key={idx} value={s['Nama Lengkap']}>{s['Nama Lengkap']}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Jenis Sampah</label>
                  <select 
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                    value={formData.jenisSampah}
                    onChange={handleTypeChange}
                  >
                    <option value="">-- Pilih Jenis --</option>
                    {wasteTypes.map(type => (
                      <option key={type.id} value={type.nama}>{type.nama} (Rp {type.harga}/kg)</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Berat (kg)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      required 
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                      value={formData.berat}
                      onChange={handleWeightChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Nilai (Rp)</label>
                    <input 
                      type="number" 
                      readOnly
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-slate-100 dark:bg-slate-600 dark:text-slate-300 focus:ring-2 focus:ring-green-500 outline-none"
                      value={formData.nilai}
                    />
                  </div>
                </div>
                
                <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-200 dark:shadow-none transition-all mt-4 disabled:opacity-50">
                  {loading ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {showExchangeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Tukar Koin dengan ATK</h3>
                <button onClick={() => setShowExchangeModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleExchangeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Kelas</label>
                  <select 
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    value={exchangeData.kelas}
                    onChange={handleExchangeClassChange}
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={`Kelas ${num}`}>Kelas {num}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Nama Siswa</label>
                  <select 
                    required 
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    value={exchangeData.siswa}
                    onChange={(e) => setExchangeData({...exchangeData, siswa: e.target.value})}
                  >
                    <option value="">-- Pilih Siswa --</option>
                    {filteredStudents.map((s, idx) => (
                        <option key={idx} value={s['Nama Lengkap']}>{s['Nama Lengkap']}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Nama ATK</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Contoh: Buku Tulis, Pensil"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    value={exchangeData.namaAtk}
                    onChange={(e) => setExchangeData({...exchangeData, namaAtk: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Harga ATK (Koin/Rp)</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="Contoh: 5000"
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                    value={exchangeData.harga}
                    onChange={(e) => setExchangeData({...exchangeData, harga: e.target.value})}
                  />
                </div>
                
                <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-200 dark:shadow-none transition-all mt-4 disabled:opacity-50">
                  {loading ? 'Memproses...' : 'Tukar ATK'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
