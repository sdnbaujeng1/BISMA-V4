import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Plus, Edit, Trash, Save, X, Trophy, Coins, Scale, ShoppingCart, Award, Settings, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSchoolIdentity } from '../hooks/useSchoolIdentity';
import { supabase } from '../lib/supabase';
import CertificateAppreciationView from '../components/CertificateAppreciationView';

export default function TabunganSampahAdmin({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const schoolIdentity = useSchoolIdentity();
  const [activeTab, setActiveTab] = useState<'konfigurasi' | 'peringkat' | 'sertifikat'>('konfigurasi');
  const [stats, setStats] = useState({ totalSavings: 0, totalWeight: 0, championClass: '-' });
  const [wasteTypes, setWasteTypes] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [nomorSertifikat, setNomorSertifikat] = useState<string>('421.2/ 016 /424.071.505/2026');
  const [selectedTopClass, setSelectedTopClass] = useState<string>('Semua Kelas');
  
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

  const [selectedMonth, setSelectedMonth] = useState('');

  const fetchCertConfig = async () => {
    try {
      const { data } = await supabase
        .from('pengaturan')
        .select('key, value')
        .eq('key', 'tabungan_sampah_nomor_sertifikat')
        .maybeSingle();
      if (data && data.value) {
        setNomorSertifikat(data.value);
      }
    } catch (e) {
      console.error('Error fetching tabungan sampah cert config', e);
    }
  };

  const handleSaveCertConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await supabase
        .from('pengaturan')
        .upsert(
          [{ key: 'tabungan_sampah_nomor_sertifikat', value: nomorSertifikat || '421.2/ 016 /424.071.505/2026' }],
          { onConflict: 'key' }
        );
      showToast('Konfigurasi Nomor Sertifikat Tabungan Sampah berhasil disimpan!', 'success');
    } catch (err) {
      console.error('Error saving cert config', err);
      showToast('Gagal menyimpan konfigurasi nomor sertifikat', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Stats
      const statsRes = await fetch(`/api/bank-sampah/stats${selectedMonth ? `?month=${selectedMonth}` : ''}`);
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.data);

      // Fetch Types
      const typesRes = await fetch('/api/bank-sampah/types');
      const typesData = await typesRes.json();
      if (typesData.success) setWasteTypes(typesData.data);

      // Fetch Transactions
      const transRes = await fetch(`/api/bank-sampah/transactions${selectedMonth ? `?month=${selectedMonth}` : ''}`);
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
    fetchCertConfig();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  // Compute Top Students from filtered month transactions
  const topWasteStudents = useMemo(() => {
    const studentMap = new Map<string, { name: string; kelas: string; weight: number; savings: number; nis: string; nisn: string }>();

    const normalizeClass = (kls: string) => {
      const m = String(kls || '').match(/\d+/);
      return m ? `Kelas ${m[0]}` : String(kls || '-');
    };

    transactions.forEach((t) => {
      const rawName = String(t.siswa || '').trim();
      if (!rawName) return;
      const tKelas = normalizeClass(t.kelas);
      if (selectedTopClass !== 'Semua Kelas' && tKelas !== selectedTopClass) return;

      const beratVal = Number(t.berat) || 0;
      const nilaiVal = Number(t.nilai) || 0;
      // Only count waste deposits (positive weight or positive deposit value) toward best saver ranking
      const depositWeight = beratVal > 0 ? beratVal : 0;
      const depositSavings = nilaiVal > 0 ? nilaiVal : 0;

      if (!studentMap.has(rawName)) {
        const matchedStudent = students.find(
          (s) => String(s['Nama Lengkap'] || '').trim().toLowerCase() === rawName.toLowerCase()
        );
        studentMap.set(rawName, {
          name: matchedStudent ? matchedStudent['Nama Lengkap'] : rawName,
          kelas: matchedStudent ? normalizeClass(matchedStudent.Kelas) : tKelas,
          nis: matchedStudent?.NIS || '-',
          nisn: matchedStudent?.NISN || '-',
          weight: 0,
          savings: 0
        });
      }

      const entry = studentMap.get(rawName)!;
      entry.weight += depositWeight;
      entry.savings += depositSavings;
    });

    return Array.from(studentMap.values())
      .filter((s) => s.weight > 0 || s.savings > 0)
      .sort((a, b) => {
        if (b.weight !== a.weight) return b.weight - a.weight;
        return b.savings - a.savings;
      });
  }, [transactions, students, selectedTopClass]);

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
      <header className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Tabungan Sampah</h1>
          <p className="text-slate-500 dark:text-slate-400">Konfigurasi Harga, Monitoring Tabungan & Apresiasi Siswa Terbaik</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-700 dark:text-white focus:ring-2 focus:ring-green-500 outline-none font-medium shadow-sm"
          />
          <button 
            onClick={() => {
              setExchangeData({ ...exchangeData, kelas: 'Kelas 1', siswa: '' });
              filterStudentsByClass(students, 'Kelas 1');
              setShowExchangeModal(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg shadow-purple-200 dark:shadow-none transition-all w-full sm:w-auto cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" /> Tukar ATK
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={() => setActiveTab('konfigurasi')}
          className={`px-4 py-2.5 font-semibold text-sm whitespace-nowrap rounded-xl transition-all flex items-center gap-2 border cursor-pointer ${
            activeTab === 'konfigurasi'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <Settings className="w-4 h-4" />
          Konfigurasi & Monitoring
        </button>
        <button
          onClick={() => setActiveTab('peringkat')}
          className={`px-4 py-2.5 font-semibold text-sm whitespace-nowrap rounded-xl transition-all flex items-center gap-2 border cursor-pointer ${
            activeTab === 'peringkat'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Peringkat Nasabah Terbaik
        </button>
        <button
          onClick={() => setActiveTab('sertifikat')}
          className={`px-4 py-2.5 font-semibold text-sm whitespace-nowrap rounded-xl transition-all flex items-center gap-2 border cursor-pointer ${
            activeTab === 'sertifikat'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <Award className="w-4 h-4" />
          Cetak Sertifikat
        </button>
      </div>

      {activeTab === 'sertifikat' && (
        <CertificateAppreciationView
          mode="tabungan_sampah"
          programLabel="Tabungan Sampah"
          selectedMonth={selectedMonth}
          onMonthChange={(m) => setSelectedMonth(m)}
          selectedClass={selectedTopClass}
          onClassChange={(kls) => setSelectedTopClass(kls)}
          classOptions={['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6']}
          topStudents={topWasteStudents.slice(0, 3).map((s, idx) => ({
            rank: (idx + 1) as 1 | 2 | 3,
            name: s.name,
            nis: s.nis,
            nisn: s.nisn,
            kelas: s.kelas,
            weight: s.weight,
            savings: s.savings
          }))}
          certificateNumber={nomorSertifikat}
          schoolIdentity={schoolIdentity}
          onGoToConfig={() => setActiveTab('konfigurasi')}
        />
      )}

      {activeTab === 'peringkat' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Peringkat Siswa Terbaik Tabungan Sampah</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Berdasarkan total berat setoran dan nilai tabungan sampah pada bulan terpilih
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedTopClass}
                onChange={(e) => setSelectedTopClass(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700 dark:text-white font-medium"
              >
                <option value="Semua Kelas">Semua Kelas</option>
                {['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'].map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
              <button
                onClick={() => setActiveTab('sertifikat')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Award className="w-4 h-4" /> Cetak Sertifikat 3 Terbaik
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {topWasteStudents.length > 0 ? (
              topWasteStudents.slice(0, 10).map((st, idx) => (
                <div
                  key={`${st.name}-${idx}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        idx === 0
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          : idx === 2
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">{st.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {st.kelas} • NIS: {st.nis} • NISN: {st.nisn}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                      {st.weight.toFixed(1)} kg
                    </div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Total Setoran Sampah
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Belum ada data setoran sampah pada periode bulan ini.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'konfigurasi' && (
        <>
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

          {/* Certificate Number Configuration Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">
            <form onSubmit={handleSaveCertConfig} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2 mb-1">
                  <Hash className="w-5 h-5 text-emerald-600" /> Konfigurasi Nomor Sertifikat Tabungan Sampah
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Nomor resmi yang ditampilkan pada 5 template Sertifikat Apresiasi 3 Siswa Terbaik Tabungan Sampah.
                </p>
                <input
                  type="text"
                  value={nomorSertifikat}
                  onChange={(e) => setNomorSertifikat(e.target.value)}
                  placeholder="Contoh: 421.2/ 016 /424.071.505/2026"
                  className="w-full max-w-md px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {savingConfig ? 'Menyimpan...' : 'Simpan Nomor Sertifikat'}
                </button>
              </div>
            </form>
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
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors cursor-pointer"
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
        </>
      )}

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
                  {exchangeData.harga && exchangeData.siswa && (
                    <p className={`text-xs mt-1 font-medium ${Number(exchangeData.harga) > getStudentBalance(exchangeData.siswa) ? 'text-red-500' : 'text-purple-600 dark:text-purple-400'}`}>
                      {Number(exchangeData.harga) > getStudentBalance(exchangeData.siswa) 
                        ? 'Saldo tabungan tidak mencukupi!' 
                        : `Saldo setelah penukaran: Rp ${(getStudentBalance(exchangeData.siswa) - Number(exchangeData.harga)).toLocaleString('id-ID')}`}
                    </p>
                  )}
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading || (exchangeData.siswa ? Number(exchangeData.harga) > getStudentBalance(exchangeData.siswa) : false)} 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-200 dark:shadow-none transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
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
