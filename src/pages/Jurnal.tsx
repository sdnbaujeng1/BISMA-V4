import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, ArrowRight, Plus, XCircle, Send, X } from 'lucide-react';

export default function Jurnal({ user, onNavigate }: { user: any, onNavigate: (page: string) => void }) {
  const [step, setStep] = useState(1);
  const [initialData, setInitialData] = useState<any>(null);
  const [kelas, setKelas] = useState('');
  const [muridList, setMuridList] = useState<any[]>([]);
  const [kehadiran, setKehadiran] = useState<any>({});
  const [pembelajaran, setPembelajaran] = useState<any[]>([{ id: Date.now(), mataPelajaran: '', jamPembelajaran: [], materi: '' }]);
  const [catatan, setCatatan] = useState<any[]>([]);
  const [kebersihan, setKebersihan] = useState('');
  const [validasi, setValidasi] = useState('');
  const [guruPiket, setGuruPiket] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showCatatanPopup, setShowCatatanPopup] = useState(false);
  const [selectedCatatanType, setSelectedCatatanType] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isFromSchedule, setIsFromSchedule] = useState(false);
  const [customCatatan, setCustomCatatan] = useState('');

  const catatanOptions = [
    "Tidak membawa buku tulis",
    "Tidak membawa buku paket",
    "Membawa/menggunakan HP saat pembelajaran",
    "Rambut tidak rapi dan panjang",
    "Piket Kelas Belum terlaksana",
    "Izin keluar kelas tidak kembali",
    "Tidak mengumpulkan tugas",
    "Berkelahi",
    "Menangis",
    "Sudah berjalan dengan tertib",
    "Tidak mengerjakan PR"
  ];

  useEffect(() => {
    fetch('/api/initial-data')
      .then(res => res.json())
      .then(data => setInitialData(data))
      .catch(err => console.error("Failed to fetch initial data", err));
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('?')) {
      const params = new URLSearchParams(hash.split('?')[1]);
      const preKelas = params.get('kelas');
      const preMapel = params.get('mapel');
      const preJam = params.get('jam');
      
      if (preKelas) {
        setKelas(preKelas);
        setIsFromSchedule(true);
      }
      if (preMapel || preJam) {
        setPembelajaran([{
          id: Date.now(),
          mataPelajaran: preMapel || '',
          jamPembelajaran: preJam ? preJam.split(',').map(Number) : [],
          materi: ''
        }]);
      }
    }
  }, []);

  useEffect(() => {
    if (kelas && initialData && Array.isArray(initialData.murid)) {
      const filtered = initialData.murid.filter((m: any) => m.Kelas === kelas);
      setMuridList(filtered);
      const initialKehadiran: any = {};
      filtered.forEach((m: any) => {
        initialKehadiran[m['Nama Murid']] = 'Hadir';
      });
      setKehadiran(initialKehadiran);
    }
  }, [kelas, initialData]);

  const handleKehadiranChange = (nama: string, status: string) => {
    setKehadiran({ ...kehadiran, [nama]: status });
  };

  const handleAddPembelajaran = () => {
    setPembelajaran([...pembelajaran, { id: Date.now(), mataPelajaran: '', jamPembelajaran: [], materi: '' }]);
  };

  const handleRemovePembelajaran = (id: number) => {
    setPembelajaran(pembelajaran.filter(p => p.id !== id));
  };

  const handlePembelajaranChange = (id: number, field: string, value: any) => {
    setPembelajaran(pembelajaran.map(p => {
      if (p.id === id) {
        if (field === 'jamPembelajaran') {
          const newJam = p.jamPembelajaran.includes(value) 
            ? p.jamPembelajaran.filter((j: any) => j !== value)
            : [...p.jamPembelajaran, value];
          return { ...p, jamPembelajaran: newJam };
        }
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kebersihan || !validasi) {
      alert('Lengkapi validasi dan kebersihan.');
      return;
    }
    setShowSummary(true);
  };

  const handleSubmit = async () => {
    const attData: any = { Sakit: [], Izin: [], Alpa: [], Dispensasi: [] };
    Object.entries(kehadiran).forEach(([nama, status]: [string, any]) => {
      if (status !== 'Hadir' && attData[status]) {
        attData[status].push(nama);
      }
    });
    
    const ketidakhadiran = Object.keys(attData)
      .filter(k => attData[k].length > 0)
      .map(k => ({ type: k, students: attData[k] }));

    const formData = {
      nip: user.NIP,
      guru: user['Nama Guru'],
      kelas,
      pembelajaran,
      ketidakhadiran,
      catatan,
      kebersihanKelas: kebersihan,
      validasi: { status: validasi, guruPiketInval: guruPiket }
    };

    setLoading(true);
    try {
      const res = await fetch('/api/jurnal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setShowSummary(false);
        setShowSuccessPopup(true);
      } else {
        alert('Gagal menyimpan jurnal: ' + data.message);
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessPopup(false);
    window.location.hash = '';
    onNavigate('main');
  };

  const handleAddCatatan = (type: string) => {
    setSelectedCatatanType(type);
    setShowCatatanPopup(true);
  };

  const handleSaveCatatan = (studentName: string) => {
    setCatatan([...catatan, { type: selectedCatatanType, student: studentName }]);
    setShowCatatanPopup(false);
    setSelectedCatatanType('');
    setCustomCatatan('');
  };

  const handleRemoveCatatan = (index: number) => {
    setCatatan(catatan.filter((_, i) => i !== index));
  };

  const uniqueKelas = Array.isArray(initialData?.murid) ? [...new Set(initialData.murid.map((m: any) => m.Kelas))].sort() : [];
  const mapelOptions = user?.Mengajar ? user.Mengajar.split(';').map((s: string) => s.trim()) : [];
  const hash = window.location.hash;
  let preMapel = '';
  if (hash.includes('?')) {
    const params = new URLSearchParams(hash.split('?')[1]);
    preMapel = params.get('mapel') || '';
  }
  if (preMapel && !mapelOptions.includes(preMapel)) {
    mapelOptions.push(preMapel);
  }
  if (!mapelOptions.includes('Kegiatan Sekolah')) {
    mapelOptions.push('Kegiatan Sekolah');
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
      <header className="sticky top-0 z-30 bg-green-600 px-4 pb-4 pt-6 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button onClick={() => onNavigate('main')} className="p-2 rounded-full hover:bg-white/20 text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">Isi Jurnal KBM</h2>
            <p className="text-sm text-green-100 font-normal">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </header>
      
      <main className="flex-grow p-4 md:p-6 mt-4 relative">
        <div className="max-w-3xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8 px-2 md:px-0">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-slate-700 -z-10 rounded"></div>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`flex flex-col items-center relative z-10 bg-slate-50 dark:bg-slate-900 px-2`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 transition-colors ${step >= i ? 'bg-green-600 border-green-200 text-white' : 'bg-slate-200 dark:bg-slate-800 border-white dark:border-slate-900 text-slate-400'}`}>
                    {step > i ? <Check className="w-5 h-5" /> : i}
                  </div>
                  <span className={`text-xs mt-2 font-semibold hidden sm:block ${step >= i ? 'text-green-700 dark:text-green-400' : 'text-slate-400'}`}>
                    {i === 1 ? 'Kehadiran' : i === 2 ? 'Pembelajaran' : i === 3 ? 'Catatan' : 'Validasi'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleReview} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="font-bold text-lg border-b dark:border-slate-700 pb-3 text-slate-800 dark:text-slate-200">1. Pilih Kelas & Isi Kehadiran</h3>
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Pilih Kelas</label>
                  {isFromSchedule ? (
                    <div className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 bg-slate-100 dark:bg-slate-800 dark:text-white font-semibold">
                      {kelas}
                    </div>
                  ) : (
                    <select 
                      value={kelas} 
                      onChange={e => setKelas(e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-700 dark:text-white"
                    >
                      <option value="">-- Pilih Kelas --</option>
                      {uniqueKelas.map((k: any) => {
                        const label = String(k).toLowerCase().startsWith('kelas') ? k : `Kelas ${k}`;
                        return <option key={k} value={k}>{label}</option>;
                      })}
                      <option value="Kegiatan Sekolah">Kegiatan Sekolah</option>
                    </select>
                  )}
                </div>

                {kelas && kelas !== 'Kegiatan Sekolah' && (
                  <div className="mt-6">
                    <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                          <tr>
                            <th className="p-3 border-b dark:border-slate-700 text-center w-12">No</th>
                            <th className="p-3 border-b dark:border-slate-700 text-left">Nama Murid</th>
                            <th className="p-3 border-b dark:border-slate-700 text-center w-14">H</th>
                            <th className="p-3 border-b dark:border-slate-700 text-center w-14">S</th>
                            <th className="p-3 border-b dark:border-slate-700 text-center w-14">I</th>
                            <th className="p-3 border-b dark:border-slate-700 text-center w-14">A</th>
                          </tr>
                        </thead>
                        <tbody>
                          {muridList.map((m, i) => (
                            <tr key={m.NISN} className={`border-b dark:border-slate-700 last:border-0 ${i % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                              <td className="p-3 text-center text-slate-500 dark:text-slate-400">{i + 1}</td>
                              <td className="p-3 font-medium text-slate-700 dark:text-slate-300">{m['Nama Murid']}</td>
                              {['Hadir', 'Sakit', 'Izin', 'Alpa'].map(status => (
                                <td key={status} className="p-3 text-center">
                                  <input 
                                    type="radio" 
                                    name={`att-${m.NISN}`} 
                                    value={status}
                                    checked={kehadiran[m['Nama Murid']] === status}
                                    onChange={() => handleKehadiranChange(m['Nama Murid'], status)}
                                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <div className="flex justify-end pt-4">
                  <button 
                    type="button" 
                    onClick={() => setStep(2)} 
                    disabled={!kelas}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                  >
                    Selanjutnya <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="font-bold text-lg border-b dark:border-slate-700 pb-3 text-slate-800 dark:text-slate-200">2. Detail Pembelajaran</h3>
                
                <div className="space-y-6">
                  {pembelajaran.map((p, idx) => (
                    <div key={p.id} className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 relative">
                      {pembelajaran.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemovePembelajaran(p.id)}
                          className="absolute top-3 right-3 text-red-500 hover:text-red-700"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Mata Pelajaran</label>
                        <select 
                          value={p.mataPelajaran}
                          onChange={e => handlePembelajaranChange(p.id, 'mataPelajaran', e.target.value)}
                          className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-slate-700 dark:text-white"
                        >
                          <option value="">-- Pilih Mapel --</option>
                          {mapelOptions.map((m: string) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Jam Ke-</label>
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(j => (
                            <label key={j} className={`flex items-center justify-center p-2 rounded-lg border-2 cursor-pointer transition-colors ${p.jamPembelajaran.includes(j) ? 'bg-green-100 dark:bg-green-900/40 border-green-500 text-green-700 dark:text-green-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                              <input 
                                type="checkbox" 
                                className="hidden"
                                checked={p.jamPembelajaran.includes(j)}
                                onChange={() => handlePembelajaranChange(p.id, 'jamPembelajaran', j)}
                              />
                              <span className="font-bold">{j}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Materi</label>
                        <textarea 
                          rows={3}
                          value={p.materi}
                          onChange={e => handlePembelajaranChange(p.id, 'materi', e.target.value)}
                          className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-slate-700 dark:text-white"
                          placeholder="Deskripsi materi yang diajarkan..."
                        ></textarea>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button 
                    type="button" 
                    onClick={() => setStep(1)} 
                    className="w-full sm:w-auto text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-4 py-2 font-medium flex items-center justify-center gap-2 order-3 sm:order-1"
                  >
                    <ArrowLeft className="w-5 h-5" /> Kembali
                  </button>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto order-1 sm:order-2">
                    <button 
                      type="button" 
                      onClick={handleAddPembelajaran}
                      className="w-full sm:w-auto bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/60 px-4 py-3 sm:py-2 rounded-xl sm:rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Plus className="w-5 h-5" /> Tambah Mapel
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setStep(kelas === 'Kegiatan Sekolah' ? 4 : 3)} 
                      disabled={pembelajaran.some(p => !p.mataPelajaran || p.jamPembelajaran.length === 0)}
                      className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                    >
                      Selanjutnya <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="font-bold text-lg border-b dark:border-slate-700 pb-3 text-slate-800 dark:text-slate-200">3. Catatan Kedisiplinan</h3>
                
                {catatan.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    <p className="text-slate-500 dark:text-slate-400 mb-4">Tidak ada catatan kedisiplinan (Opsional)</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {catatan.map((c, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl">
                        <div>
                          <p className="font-bold text-red-700 dark:text-red-400">{c.type}</p>
                          <p className="text-sm text-red-600 dark:text-red-300">{c.student}</p>
                        </div>
                        <button type="button" onClick={() => handleRemoveCatatan(idx)} className="text-red-400 hover:text-red-600">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {catatanOptions.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddCatatan(opt)}
                      className="text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-sm text-slate-700 dark:text-slate-300"
                    >
                      {opt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleAddCatatan('Manual')}
                    className="text-left px-4 py-3 rounded-xl border border-dashed border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-sm text-green-700 dark:text-green-400 font-medium flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Tambah Catatan Manual
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button 
                    type="button" 
                    onClick={() => setStep(2)} 
                    className="w-full sm:w-auto text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-4 py-2 font-medium flex items-center justify-center gap-2 order-2 sm:order-1"
                  >
                    <ArrowLeft className="w-5 h-5" /> Kembali
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setStep(4)} 
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors order-1 sm:order-2"
                  >
                    Selanjutnya <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="font-bold text-lg border-b dark:border-slate-700 pb-3 text-slate-800 dark:text-slate-200">4. Validasi & Pengiriman</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-3 text-slate-700 dark:text-slate-300">Kebersihan Kelas <span className="text-red-500">*</span></label>
                  <div className="space-y-3">
                    <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-colors ${kebersihan === 'mengarahkan_piket' ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                      <input type="radio" name="kebersihan" value="mengarahkan_piket" onChange={e => setKebersihan(e.target.value)} className="w-5 h-5 text-green-600 focus:ring-green-500" />
                      <span className="ml-3 font-medium text-slate-700 dark:text-slate-300">Mengarahkan Piket</span>
                    </label>
                    <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-colors ${kebersihan === 'sudah_bersih' ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                      <input type="radio" name="kebersihan" value="sudah_bersih" onChange={e => setKebersihan(e.target.value)} className="w-5 h-5 text-green-600 focus:ring-green-500" />
                      <span className="ml-3 font-medium text-slate-700 dark:text-slate-300">Kelas Sudah Bersih</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3 text-slate-700 dark:text-slate-300">Validasi <span className="text-red-500">*</span></label>
                  <div className="space-y-3">
                    <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-colors ${validasi === 'hadir_kbm' ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                      <input type="radio" name="validasi" value="hadir_kbm" onChange={e => setValidasi(e.target.value)} className="w-5 h-5 text-green-600 focus:ring-green-500" />
                      <span className="ml-3 font-medium text-slate-700 dark:text-slate-300">KBM Tatap Muka</span>
                    </label>
                    <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-colors ${validasi === 'izin_tugas' ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                      <input type="radio" name="validasi" value="izin_tugas" onChange={e => setValidasi(e.target.value)} className="w-5 h-5 text-green-600 focus:ring-green-500" />
                      <span className="ml-3 font-medium text-slate-700 dark:text-slate-300">KBM Tugas (Izin)</span>
                    </label>
                    <label className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-colors ${validasi === 'inval' ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                      <input type="radio" name="validasi" value="inval" onChange={e => setValidasi(e.target.value)} className="w-5 h-5 text-green-600 focus:ring-green-500" />
                      <span className="ml-3 font-medium text-slate-700 dark:text-slate-300">Diinfal Guru Piket</span>
                    </label>
                  </div>
                  {validasi === 'inval' && (
                    <div className="mt-4">
                      <select 
                        value={guruPiket} 
                        onChange={e => setGuruPiket(e.target.value)}
                        className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-700 dark:text-white"
                      >
                        <option value="">-- Pilih Guru Piket --</option>
                        {Array.isArray(initialData?.guru) && initialData.guru.map((g: any) => <option key={g.NIP} value={g['Nama Guru']}>{g['Nama Guru']}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 border-t border-slate-100 dark:border-slate-700">
                  <button 
                    type="button" 
                    onClick={() => setStep(kelas === 'Kegiatan Sekolah' ? 2 : 3)} 
                    className="w-full sm:w-auto text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-4 py-2 font-medium flex items-center justify-center gap-2 order-2 sm:order-1"
                  >
                    <ArrowLeft className="w-5 h-5" /> Kembali
                  </button>
                  <button 
                    type="submit" 
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-200 dark:shadow-none transition-all order-1 sm:order-2"
                  >
                    Review & Kirim
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </main>

      {/* Catatan Popup */}
      {showCatatanPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Pilih Siswa</h3>
              <button onClick={() => setShowCatatanPopup(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-grow">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
                Catatan: <span className="text-red-600 dark:text-red-400">{selectedCatatanType === 'Manual' ? 'Catatan Manual' : selectedCatatanType}</span>
              </p>
              
              {selectedCatatanType === 'Manual' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">Isi Catatan</label>
                  <input 
                    type="text" 
                    value={customCatatan}
                    onChange={(e) => setCustomCatatan(e.target.value)}
                    placeholder="Masukkan catatan kedisiplinan..."
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-700 dark:text-white"
                  />
                </div>
              )}

              <div className="space-y-2">
                {muridList.map((m, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (selectedCatatanType === 'Manual' && !customCatatan.trim()) {
                        alert('Silakan isi catatan manual terlebih dahulu');
                        return;
                      }
                      const finalNote = selectedCatatanType === 'Manual' ? customCatatan : selectedCatatanType;
                      setSelectedCatatanType(finalNote);
                      handleSaveCatatan(m['Nama Murid']);
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-slate-700 dark:text-slate-200"
                  >
                    {m['Nama Murid']}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden text-center p-8">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Berhasil!</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">Data anda telah terkirim</p>
            <p className="text-green-600 dark:text-green-400 font-bold italic mb-8">"Selamat Berkhidmah Untuk Anak Bangsa"</p>
            <button 
              onClick={handleCloseSuccess}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Ringkasan Jurnal</h3>
              <button onClick={() => setShowSummary(false)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-grow space-y-4 text-sm text-slate-700 dark:text-slate-300">
              <div className="grid grid-cols-2 gap-2 border-b dark:border-slate-700 pb-4">
                <span className="text-slate-500 dark:text-slate-400">Kelas:</span>
                <span className="font-bold">{kelas}</span>
                <span className="text-slate-500 dark:text-slate-400">Kebersihan:</span>
                <span className="font-bold">{kebersihan === 'sudah_bersih' ? 'Sudah Bersih' : 'Mengarahkan Piket'}</span>
                <span className="text-slate-500 dark:text-slate-400">Validasi:</span>
                <span className="font-bold capitalize">{validasi.replace('_', ' ')} {validasi === 'inval' && `(${guruPiket})`}</span>
              </div>
              
              <div>
                <h4 className="font-bold mb-2 text-slate-800 dark:text-white">Pembelajaran:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {pembelajaran.map((p, i) => (
                    <li key={i}>{p.mataPelajaran} (Jam {p.jamPembelajaran.join(', ')}) - {p.materi}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-2 text-slate-800 dark:text-white">Ketidakhadiran:</h4>
                {Object.entries(kehadiran).filter(([_, status]) => status !== 'Hadir').length === 0 ? (
                  <p className="italic text-slate-500 dark:text-slate-400">Nihil (Semua Hadir)</p>
                ) : (
                  <ul className="list-disc list-inside space-y-1">
                    {Object.entries(kehadiran)
                      .filter(([_, status]) => status !== 'Hadir')
                      .map(([nama, status]: any, i) => (
                        <li key={i}>{nama} - <span className="font-semibold">{status}</span></li>
                      ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
              <button 
                onClick={() => setShowSummary(false)}
                className="px-4 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : <><Send className="w-4 h-4" /> Kirim Jurnal</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
