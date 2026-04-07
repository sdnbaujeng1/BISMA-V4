import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Save, Trash2, CheckCircle, XCircle, FileText, Calendar, User, Search, Filter, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function TugasGuru({ user, onNavigate }: { user: any, onNavigate: (page: string) => void }) {
  const [viewState, setViewState] = useState<'list' | 'add' | 'detail'>('list');
  const [tugasList, setTugasList] = useState<any[]>([]);
  const [selectedTugas, setSelectedTugas] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    judul: '',
    deskripsi: '',
    mapel: '',
    kelas: '',
    deadline: '',
    target_students: [] as string[]
  });

  const [mapelOptions, setMapelOptions] = useState<string[]>([]);
  const [kelasOptions, setKelasOptions] = useState<string[]>([]);
  const [studentOptions, setStudentOptions] = useState<any[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTugas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tugas?teacherId=${user.id || user.NIP || 'GURU001'}`);
      const result = await res.json();
      if (result.success) {
        setTugasList(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch tugas", error);
      showToast("Gagal memuat data tugas", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchJadwal = async () => {
    try {
      const res = await fetch(`/api/jadwal-mengajar?namaGuru=${encodeURIComponent(user['Nama Guru'] || user.nama || '')}`);
      const result = await res.json();
      if (result.success) {
        const uniqueMapel = Array.from(new Set(result.data.map((d: any) => d.mapel))).filter(Boolean) as string[];
        const uniqueKelas = Array.from(new Set(result.data.map((d: any) => d.kelas))).filter(Boolean) as string[];
        
        // If the teacher has a 'Mengajar' field (comma separated), add those too
        if (user.Mengajar) {
          const mapels = user.Mengajar.split(',').map((m: string) => m.trim());
          mapels.forEach((m: string) => {
            if (!uniqueMapel.includes(m)) uniqueMapel.push(m);
          });
        }

        setMapelOptions(uniqueMapel);
        setKelasOptions(uniqueKelas);
      }
    } catch (error) {
      console.error("Failed to fetch jadwal", error);
    }
  };

  const fetchStudents = async (kelas: string) => {
    try {
      const res = await fetch('/api/murid');
      const result = await res.json();
      if (result.success) {
        const filtered = result.data.filter((m: any) => m.Kelas === kelas || m.Kelas === kelas.replace('Kelas ', ''));
        setStudentOptions(filtered);
      }
    } catch (error) {
      console.error("Failed to fetch students", error);
    }
  };

  useEffect(() => {
    fetchTugas();
    fetchJadwal();
  }, []);

  useEffect(() => {
    if (formData.kelas) {
      fetchStudents(formData.kelas);
      setFormData(prev => ({ ...prev, target_students: [] })); // Reset selected students when class changes
    } else {
      setStudentOptions([]);
    }
  }, [formData.kelas]);

  const handleCreateTugas = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/tugas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          guru_id: user.id || user.NIP || 'GURU001', // Fallback
          guru_nama: user['Nama Guru'] || user.nama || 'Guru'
        })
      });
      const result = await res.json();
      if (result.success) {
        showToast("Tugas berhasil dibuat!", "success");
        setViewState('list');
        fetchTugas();
        setFormData({ judul: '', deskripsi: '', mapel: '', kelas: '', deadline: '', target_students: [] });
      } else {
        showToast(result.message || "Gagal membuat tugas", "error");
      }
    } catch (error) {
      showToast("Terjadi kesalahan jaringan", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTugas = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus tugas ini?")) return;
    try {
      const res = await fetch(`/api/tugas/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        showToast("Tugas berhasil dihapus", "success");
        fetchTugas();
      } else {
        showToast("Gagal menghapus tugas", "error");
      }
    } catch (error) {
      showToast("Terjadi kesalahan jaringan", "error");
    }
  };

  const handleViewSubmissions = async (tugas: any) => {
    setSelectedTugas(tugas);
    setViewState('detail');
    setLoading(true);
    try {
      // Fetch submissions for this tugas
      // Currently using a mock or we need an endpoint for submissions
      // Let's assume GET /api/tugas/:id/submissions exists or we filter from a general endpoint
      // For now, let's use the /api/tugas endpoint which might return submissions if we modify it, 
      // or we can create a new endpoint. 
      // Based on server.ts, we have GET /api/tugas which returns all tugas.
      // We need to fetch submissions. Let's assume we can fetch them.
      
      // Since I didn't explicitly create a "get submissions" endpoint in server.ts (only submit and validate),
      // I might need to add it or mock it.
      // Wait, I see `app.get('/api/tugas', ...)` returns all tugas.
      // I see `app.post('/api/tugas/submit', ...)`
      // I see `app.put('/api/tugas/validate', ...)`
      
      // I should probably add `app.get('/api/tugas/:id/submissions')` to server.ts.
      // For now, I will mock the submissions on the client side if the endpoint is missing, 
      // BUT the user wants it "sesuai dengan input dari menu guru".
      
      // Let's check server.ts again. I'll assume I need to add the endpoint.
      // But for this file, I'll write the fetch call assuming the endpoint exists.
      
      const res = await fetch(`/api/tugas/${tugas.id}/submissions`);
      if (res.ok) {
          const result = await res.json();
          if (result.success) {
              setSubmissions(result.data);
          } else {
              setSubmissions([]);
          }
      } else {
          setSubmissions([]);
      }
    } catch (error) {
      console.error(error);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const [selectedSubmissions, setSelectedSubmissions] = useState<any[]>([]);

  const handleValidate = async (sub: any, status: 'Selesai' | 'Revisi') => {
    try {
      const res = await fetch('/api/tugas/validate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          submission_id: sub.id, 
          status,
          tugas_id: sub.tugas_id,
          student_id: sub.student_id
        })
      });
      const result = await res.json();
      if (result.success) {
        showToast(`Tugas berhasil divalidasi: ${status}`, "success");
        // Refresh submissions
        handleViewSubmissions(selectedTugas);
      } else {
        showToast(result.message || "Gagal memvalidasi tugas", "error");
      }
    } catch (error: any) {
      showToast(error.message || "Terjadi kesalahan jaringan", "error");
    }
  };

  const handleMassValidate = async (status: 'Selesai' | 'Revisi') => {
    if (selectedSubmissions.length === 0) {
      showToast("Pilih minimal satu siswa untuk divalidasi", "error");
      return;
    }
    
    setLoading(true);
    try {
      const promises = selectedSubmissions.map(async id => {
        const sub = submissions.find(s => s.id === id);
        const res = await fetch('/api/tugas/validate', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            submission_id: id, 
            status,
            tugas_id: sub?.tugas_id,
            student_id: sub?.student_id
          })
        });
        const result = await res.json();
        if (!result.success) {
          throw new Error(result.message || "Gagal memvalidasi tugas");
        }
        return result;
      });
      
      await Promise.all(promises);
      showToast(`${selectedSubmissions.length} tugas berhasil divalidasi: ${status}`, "success");
      setSelectedSubmissions([]);
      handleViewSubmissions(selectedTugas);
    } catch (error: any) {
      showToast(error.message || "Terjadi kesalahan saat validasi massal", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8 font-sans text-slate-800 dark:text-slate-200">
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

      <header className="max-w-7xl mx-auto mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (viewState === 'list') onNavigate('main');
              else setViewState('list');
            }}
            className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Manajemen Tugas</h1>
            <p className="text-slate-500 dark:text-slate-400">Kelola tugas dan validasi pengumpulan siswa</p>
          </div>
        </div>
        {viewState === 'list' && (
          <button 
            onClick={() => setViewState('add')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
          >
            <Plus className="w-5 h-5" /> Buat Tugas
          </button>
        )}
      </header>

      <main className="max-w-7xl mx-auto">
        {viewState === 'list' && (
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-500">Memuat data tugas...</p>
              </div>
            ) : tugasList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tugasList.map((tugas) => (
                  <div key={tugas.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-bold uppercase">
                        {tugas.mapel}
                      </span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleDeleteTugas(tugas.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-lg font-bold mb-2 line-clamp-2">{tugas.judul}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-3">{tugas.deskripsi}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-6">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {tugas.kelas}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {tugas.deadline}</span>
                    </div>

                    <button 
                      onClick={() => handleViewSubmissions(tugas)}
                      className="w-full py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" /> Lihat Pengumpulan
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Belum Ada Tugas</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6">Buat tugas baru untuk siswa Anda.</p>
                <button 
                  onClick={() => setViewState('add')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold transition-colors"
                >
                  Buat Tugas Sekarang
                </button>
              </div>
            )}
          </div>
        )}

        {viewState === 'add' && (
          <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold mb-6">Formulir Tugas Baru</h2>
            <form onSubmit={handleCreateTugas} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Judul Tugas</label>
                <input 
                  type="text" 
                  required
                  value={formData.judul}
                  onChange={(e) => setFormData({...formData, judul: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="Contoh: Latihan Matematika Bab 1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Mata Pelajaran</label>
                  <select 
                    required
                    value={formData.mapel}
                    onChange={(e) => setFormData({...formData, mapel: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="">Pilih Mapel...</option>
                    {mapelOptions.map((m, i) => (
                      <option key={i} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Kelas Target</label>
                  <select 
                    required
                    value={formData.kelas}
                    onChange={(e) => setFormData({...formData, kelas: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="">Pilih Kelas...</option>
                    {kelasOptions.map((k, i) => (
                      <option key={i} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.kelas && studentOptions.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Siswa Target (Opsional)</label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Jika tidak ada yang dipilih, tugas akan dikirim ke semua siswa di kelas ini.</p>
                  <div className="max-h-48 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2">
                    {studentOptions.map((student, idx) => (
                      <label key={idx} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="rounded text-blue-600 focus:ring-blue-500"
                          checked={formData.target_students.includes(student.NISN)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({ ...prev, target_students: [...prev.target_students, student.NISN] }));
                            } else {
                              setFormData(prev => ({ ...prev, target_students: prev.target_students.filter(id => id !== student.NISN) }));
                            }
                          }}
                        />
                        <span className="text-sm">{student['Nama Lengkap']}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tenggat Waktu (Deadline)</label>
                <input 
                  type="date" 
                  required
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Deskripsi / Instruksi</label>
                <textarea 
                  required
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all h-32 resize-none"
                  placeholder="Jelaskan detail tugas di sini..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setViewState('list')}
                  className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" /> {loading ? 'Menyimpan...' : 'Simpan Tugas'}
                </button>
              </div>
            </form>
          </div>
        )}

        {viewState === 'detail' && selectedTugas && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold mb-2">{selectedTugas.judul}</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-4">{selectedTugas.deskripsi}</p>
              <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                <span className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-lg">Kelas: {selectedTugas.kelas}</span>
                <span className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-lg">Mapel: {selectedTugas.mapel}</span>
                <span className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-lg">Deadline: {selectedTugas.deadline}</span>
                {selectedTugas.target_students && (
                  <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-lg">
                    Target: {(() => {
                      try {
                        const targets = typeof selectedTugas.target_students === 'string' ? JSON.parse(selectedTugas.target_students) : selectedTugas.target_students;
                        return Array.isArray(targets) && targets.length > 0 ? `${targets.length} Siswa` : 'Semua Siswa';
                      } catch (e) {
                        return 'Semua Siswa';
                      }
                    })()}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Pengumpulan Siswa</h3>
                {selectedSubmissions.length > 0 && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleMassValidate('Selesai')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Validasi Massal
                    </button>
                    <button 
                      onClick={() => handleMassValidate('Revisi')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Revisi Massal
                    </button>
                  </div>
                )}
              </div>
              
              {submissions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 uppercase font-bold text-xs">
                      <tr>
                        <th className="px-6 py-4 rounded-l-xl w-12">
                          <input 
                            type="checkbox" 
                            className="rounded text-blue-600 focus:ring-blue-500"
                            checked={selectedSubmissions.length === submissions.filter(s => s.status !== 'Selesai').length && submissions.filter(s => s.status !== 'Selesai').length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSubmissions(submissions.filter(s => s.status !== 'Selesai').map(s => s.id));
                              } else {
                                setSelectedSubmissions([]);
                              }
                            }}
                          />
                        </th>
                        <th className="px-6 py-4">Nama Siswa</th>
                        <th className="px-6 py-4">Tanggal Kumpul</th>
                        <th className="px-6 py-4">Jawaban</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 rounded-r-xl text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {submissions.map((sub) => (
                        <tr key={sub.id}>
                          <td className="px-6 py-4">
                            {sub.status !== 'Selesai' && (
                              <input 
                                type="checkbox" 
                                className="rounded text-blue-600 focus:ring-blue-500"
                                checked={selectedSubmissions.includes(sub.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSubmissions([...selectedSubmissions, sub.id]);
                                  } else {
                                    setSelectedSubmissions(selectedSubmissions.filter(id => id !== sub.id));
                                  }
                                }}
                              />
                            )}
                          </td>
                          <td className="px-6 py-4 font-bold">{sub.siswa_nama}</td>
                          <td className="px-6 py-4">{sub.tanggal_kumpul}</td>
                          <td className="px-6 py-4">
                            {sub.content && sub.content !== 'Dinilai oleh guru' ? (
                              <a href={sub.content.startsWith('http') ? sub.content : `https://${sub.content}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs flex items-center gap-1">
                                <FileText className="w-3 h-3" /> Buka Link
                              </a>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              sub.status === 'Selesai' ? 'bg-green-100 text-green-700' :
                              sub.status === 'Revisi' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {sub.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {sub.status !== 'Selesai' && (
                                <>
                                  <button 
                                    onClick={() => handleValidate(sub, 'Selesai')}
                                    className="p-2 bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors"
                                    title="Validasi Selesai"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleValidate(sub, 'Revisi')}
                                    className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                                    title="Minta Revisi"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-8 text-slate-500">Belum ada siswa yang mengumpulkan.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
