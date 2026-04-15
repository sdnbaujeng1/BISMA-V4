import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Edit, Trash, Save, X, Trophy, Coins, Scale, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function TabunganSampahAdmin({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [stats, setStats] = useState({ totalSavings: 0, totalWeight: 0, championClass: '-' });
  const [wasteTypes, setWasteTypes] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  
  // Modal State
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [typeName, setTypeName] = useState('');
  const [typePrice, setTypePrice] = useState('');

  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [exchangeData, setExchangeData] = useState({
    siswa: '',
    kelas: 'Kelas 1',
    namaAtk: '',
    harga: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Stats
      const statsRes = await fetch('/api/bank-sampah/stats');
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.data);

      // Fetch Types
      const typesRes = await fetch('/api/bank-sampah/types');
      const typesData = await typesRes.json();
      if (typesData.success) setWasteTypes(typesData.data);

      // Fetch Transactions
      const transRes = await fetch('/api/bank-sampah/transactions');
      const transData = await transRes.json();
      if (transData.success) setTransactions(transData.data);

      // Fetch Students
      const studentsRes = await fetch('/api/murid');
      const studentsData = await studentsRes.json();
      if (studentsData.success) {
        setStudents(studentsData.data);
      }

    } catch (error) {
      console.error("Error fetching data", error);
      showToast("Gagal memuat data", "error");
    } finally {
      setLoading(false);
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

  const getStudentBalance = (studentName: string) => {
    if (!studentName) return 0;
    const studentTransactions = transactions.filter(t => t.siswa === studentName);
    return studentTransactions.reduce((sum, t) => sum + Number(t.nilai), 0);
  };

  const handleExchangeClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClass = e.target.value;
    setExchangeData({ ...exchangeData, kelas: newClass, siswa: '' });
    filterStudentsByClass(students, newClass);
  };

  const handleExchangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    }
  };

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingType 
        ? `/api/bank-sampah/types/${editingType.id}` 
        : '/api/bank-sampah/types';
      
      const method = editingType ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: typeName, harga: Number(typePrice) })
      });

      const result = await res.json();
      if (result.success) {
        showToast(result.message, "success");
        setShowTypeModal(false);
        setEditingType(null);
        setTypeName('');
        setTypePrice('');
        fetchData(); // Refresh data
      } else {
        showToast(result.message, "error");
      }
    } catch (error) {
      showToast("Terjadi kesalahan jaringan", "error");
    }
  };

  const handleDeleteType = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus jenis sampah ini?")) return;
    try {
      const res = await fetch(`/api/bank-sampah/types/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        showToast(result.message, "success");
        fetchData();
      } else {
        showToast(result.message, "error");
      }
    } catch (error) {
      showToast("Terjadi kesalahan jaringan", "error");
    }
  };

  const openEditModal = (type: any) => {
    setEditingType(type);
    setTypeName(type.nama);
    setTypePrice(type.harga);
    setShowTypeModal(true);
  };

  const openAddModal = () => {
    setEditingType(null);
    setTypeName('');
    setTypePrice('');
    setShowTypeModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Tabungan Sampah</h1>
          <p className="text-slate-500 dark:text-slate-400">Konfigurasi Harga & Monitoring Tabungan</p>
        </div>
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
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Tabungan</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
              Rp {stats.totalSavings.toLocaleString('id-ID')}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Berat</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
              {stats.totalWeight.toFixed(1)} kg
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center text-yellow-600 dark:text-yellow-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Juara Kelas</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
              {stats.championClass}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-slate-400" /> Jenis & Harga Sampah
            </h3>
            <button 
              onClick={openAddModal}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" /> Tambah
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 uppercase font-bold text-xs">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Jenis Sampah</th>
                  <th className="px-4 py-3">Harga / kg</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {wasteTypes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-400">Belum ada data jenis sampah.</td>
                  </tr>
                ) : (
                  wasteTypes.map((type) => (
                    <tr key={type.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{type.nama}</td>
                      <td className="px-4 py-3">Rp {type.harga.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEditModal(type)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteType(type.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <Coins className="w-5 h-5 text-slate-400" /> Riwayat Transaksi Terakhir
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 uppercase font-bold text-xs">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Tanggal</th>
                  <th className="px-4 py-3">Siswa</th>
                  <th className="px-4 py-3">Berat</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">Belum ada transaksi.</td>
                  </tr>
                ) : (
                  transactions.slice(0, 5).map((t, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3">{new Date(t.tanggal).toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{t.siswa} ({t.kelas})</td>
                      <td className="px-4 py-3">{t.berat} kg</td>
                      <td className="px-4 py-3 text-right font-bold text-green-600 dark:text-green-400">
                        Rp {Number(t.nilai).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Add/Edit Type */}
      <AnimatePresence>
        {showTypeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                  {editingType ? 'Edit Jenis Sampah' : 'Tambah Jenis Sampah'}
                </h3>
                <button onClick={() => setShowTypeModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSaveType} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Nama Jenis Sampah</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Contoh: Botol Plastik"
                    value={typeName}
                    onChange={(e) => setTypeName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Harga per kg (Rp)</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Contoh: 2000"
                    value={typePrice}
                    onChange={(e) => setTypePrice(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end gap-2 mt-6">
                  <button type="button" onClick={() => setShowTypeModal(false)} className="px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">Batal</button>
                  <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-green-200 dark:shadow-none transition-all flex items-center gap-2">
                    <Save className="w-4 h-4" /> Simpan
                  </button>
                </div>
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
                  {exchangeData.siswa && (
                    <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800 flex items-center justify-between">
                      <span className="text-sm text-purple-700 dark:text-purple-300 font-medium">Saldo Tabungan:</span>
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        Rp {getStudentBalance(exchangeData.siswa).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
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
