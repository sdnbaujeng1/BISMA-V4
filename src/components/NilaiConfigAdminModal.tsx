import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Calendar,
  Image as ImageIcon,
  SlidersHorizontal,
  Award,
  CheckCircle2,
  Upload,
  RotateCcw,
  Eye,
  GraduationCap,
  Users,
  FileText,
} from 'lucide-react';
import { safeStorage } from '../lib/storage';

interface NilaiConfigAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const DEFAULT_SCHOOL_LOGO = 'https://lh3.googleusercontent.com/d/1VSxiSJ43i0sOp-hjn2QaqlFPqRl3A5AL';
const DEFAULT_KAB_LOGO = '/assets/logo-kab-pasuruan.png';
const DEFAULT_RAPORT_TAGLINE = 'BERMUTU - Beriman, Ramah, Mandiri, Unggul dan Tangguh';
const DEFAULT_CATATAN_SISWA =
  'Tetap semangat belajar, tingkatkan terus kedisiplinan, rajin membaca, serta jaga ibadah dan akhlak mulia baik di sekolah maupun di rumah.';
const KELAS_LIST_SD = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];

export default function NilaiConfigAdminModal({
  isOpen,
  onClose,
  showToast,
}: NilaiConfigAdminModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Tahun Aktif & Semester Aktif
  const [tahunAjaran, setTahunAjaran] = useState('2024/2025');
  const [customTahun, setCustomTahun] = useState('');
  const [semester, setSemester] = useState('Ganjil');

  // Konfigurasi Nilai
  const [jumlahUlangan, setJumlahUlangan] = useState('3');
  const [nilaiBobotHarian, setNilaiBobotHarian] = useState('50');
  const [nilaiBobotSts, setNilaiBobotSts] = useState('25');
  const [nilaiBobotAsas, setNilaiBobotAsas] = useState('25');

  // Logo yang ditampilkan pada fitur Nilai & Raport
  const [nilaiLogoMode, setNilaiLogoMode] = useState<'both' | 'sekolah' | 'kabupaten'>('both');
  const [nilaiLogoSekolah, setNilaiLogoSekolah] = useState(DEFAULT_SCHOOL_LOGO);
  const [nilaiLogoKabupaten, setNilaiLogoKabupaten] = useState(DEFAULT_KAB_LOGO);

  // Identitas Pengesahan Raport STS
  const [schoolName, setSchoolName] = useState('SDN BAUJENG I BEJI');
  const [jabatanKepalaSekolah, setJabatanKepalaSekolah] = useState('Kepala SDN BAUJENG I BEJI');
  const [headmasterName, setHeadmasterName] = useState('AKHMAD NASOR, S.Pd');
  const [headmasterNIP, setHeadmasterNIP] = useState('198704082019031001');
  const [nilaiTempatRaport, setNilaiTempatRaport] = useState('Beji');
  const [nilaiTanggalRaport, setNilaiTanggalRaport] = useState('');

  // Footer Kiri Raport (Nama Siswa | Kelas/NIS | [tagline]), Catatan Default & Konfigurasi Wali Kelas
  const [nilaiRaportTagline, setNilaiRaportTagline] = useState(DEFAULT_RAPORT_TAGLINE);
  const [nilaiCatatanDefault, setNilaiCatatanDefault] = useState(DEFAULT_CATATAN_SISWA);
  const [guruList, setGuruList] = useState<Array<{ nip: string; nama_guru: string; mengajar?: string }>>([]);
  const [waliKelasMap, setWaliKelasMap] = useState<Record<string, { nip: string; nama: string }>>({
    'Kelas 1': { nip: '', nama: '' },
    'Kelas 2': { nip: '', nama: '' },
    'Kelas 3': { nip: '', nama: '' },
    'Kelas 4': { nip: '', nama: '' },
    'Kelas 5': { nip: '', nama: '' },
    'Kelas 6': { nip: '', nama: '' },
  });

  const fileInputSekolahRef = useRef<HTMLInputElement>(null);
  const fileInputKabRef = useRef<HTMLInputElement>(null);

  const presetYears = [
    '2023/2024',
    '2024/2025',
    '2025/2026',
    '2026/2027',
    '2027/2028',
    '2028/2029',
    '2029/2030',
  ];

  useEffect(() => {
    if (!isOpen) return;

    const loadSettings = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/pengaturan');
        const result = await res.json();
        if (result.success && result.data) {
          const d = result.data;
          const resolvedSchoolName =
            d.schoolName && d.schoolName !== 'Sekolah' ? d.schoolName : 'SDN BAUJENG I BEJI';
          setSchoolName(resolvedSchoolName);
          setJabatanKepalaSekolah(
            d.jabatanKepalaSekolah
              ? d.jabatanKepalaSekolah.replace(/Kepala\s+UPT\s+Satuan\s+Pendidikan/gi, 'Kepala')
              : `Kepala ${resolvedSchoolName}`
          );
          setHeadmasterName(
            d.headmasterName && d.headmasterName !== 'Drs. H. Ahmad'
              ? d.headmasterName
              : 'AKHMAD NASOR, S.Pd'
          );
          setHeadmasterNIP(
            d.headmasterNIP && d.headmasterNIP !== '196001011980031001'
              ? d.headmasterNIP
              : '198704082019031001'
          );

          const resolvedYear =
            d.nilaiTahunAktif || d.tahunAjaran || d.tahunPelajaranAktif || '2024/2025';
          setTahunAjaran(resolvedYear);
          if (!presetYears.includes(resolvedYear)) {
            setCustomTahun(resolvedYear);
          }

          const resolvedSem = d.nilaiSemesterAktif || d.semester || d.semesterAktif || 'Ganjil';
          setSemester(resolvedSem.toLowerCase().includes('genap') || resolvedSem === '2' ? 'Genap' : 'Ganjil');

          setJumlahUlangan(String(d.jumlahUlangan || '3'));
          setNilaiBobotHarian(String(d.nilaiBobotHarian || '50'));
          setNilaiBobotSts(String(d.nilaiBobotSts || '25'));
          setNilaiBobotAsas(String(d.nilaiBobotAsas || '25'));

          setNilaiLogoMode((d.nilaiLogoMode as 'both' | 'sekolah' | 'kabupaten') || 'both');
          setNilaiLogoSekolah(d.nilaiLogoSekolah || d.logo1x1 || d.schoolLogo || DEFAULT_SCHOOL_LOGO);
          setNilaiLogoKabupaten(d.nilaiLogoKabupaten || d.logoKabupaten || DEFAULT_KAB_LOGO);

          setNilaiTempatRaport(d.nilaiTempatRaport || 'Beji');
          setNilaiTanggalRaport(d.nilaiTanggalRaport || '');
          setNilaiRaportTagline(
            d.nilaiRaportTagline || d.sloganText || DEFAULT_RAPORT_TAGLINE
          );
          setNilaiCatatanDefault(
            d.nilaiCatatanDefault || DEFAULT_CATATAN_SISWA
          );

          if (d.wali_kelas_mapping) {
            try {
              const parsedWk =
                typeof d.wali_kelas_mapping === 'string'
                  ? JSON.parse(d.wali_kelas_mapping)
                  : d.wali_kelas_mapping;
              if (parsedWk && typeof parsedWk === 'object') {
                setWaliKelasMap((prev) => {
                  const next = { ...prev };
                  KELAS_LIST_SD.forEach((kls) => {
                    if (parsedWk[kls] && typeof parsedWk[kls] === 'object') {
                      next[kls] = {
                        nip: String(parsedWk[kls].nip || ''),
                        nama: String(parsedWk[kls].nama || ''),
                      };
                    }
                  });
                  return next;
                });
              }
            } catch (e) {}
          }
        }

        // Fetch teacher list for Wali Kelas dropdown
        const resGuru = await fetch('/api/guru');
        const resultGuru = await resGuru.json();
        if (resultGuru.success && Array.isArray(resultGuru.data)) {
          setGuruList(resultGuru.data);
          // Also populate any teacher who already has wali_kelas set
          setWaliKelasMap((prev) => {
            const next = { ...prev };
            resultGuru.data.forEach((g: any) => {
              const wk = g.wali_kelas || g.waliKelas;
              if (wk && KELAS_LIST_SD.includes(wk) && !next[wk]?.nama) {
                next[wk] = { nip: g.nip || '', nama: g.nama_guru || '' };
              }
            });
            return next;
          });
        }
      } catch (err) {
        console.error('Error loading nilai config:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [isOpen]);

  const handleUploadImage = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'sekolah' | 'kabupaten'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran gambar maksimal 2 MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = String(reader.result || '');
      if (target === 'sekolah') {
        setNilaiLogoSekolah(resultStr);
      } else {
        setNilaiLogoKabupaten(resultStr);
      }
      showToast('Logo berhasil dimuat, klik Simpan Konfigurasi untuk menerapkan.');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalYear = (customTahun.trim() || tahunAjaran).trim();
    const bHarian = Number(nilaiBobotHarian) || 50;
    const bSts = Number(nilaiBobotSts) || 25;
    const bAsas = Number(nilaiBobotAsas) || 25;

    if (bHarian + bSts + bAsas !== 100) {
      showToast(
        `Total bobot Nilai Akhir harus 100% (Saat ini: ${bHarian + bSts + bAsas}%)`,
        'error'
      );
      return;
    }

    setSaving(true);
    try {
      const cleanSchoolName = schoolName.trim() || 'SDN BAUJENG I BEJI';
      const cleanJabatan =
        jabatanKepalaSekolah.trim().replace(/Kepala\s+UPT\s+Satuan\s+Pendidikan/gi, 'Kepala') ||
        `Kepala ${cleanSchoolName}`;

      // Build serialized wali_kelas_mapping with both class keys and nip keys
      const finalWkMapping: Record<string, any> = {};
      KELAS_LIST_SD.forEach((kls) => {
        const entry = waliKelasMap[kls];
        if (entry && (entry.nama.trim() || entry.nip.trim())) {
          finalWkMapping[kls] = {
            nip: entry.nip.trim(),
            nama: entry.nama.trim(),
          };
          if (entry.nip.trim()) {
            finalWkMapping[entry.nip.trim()] = kls;
          }
        }
      });

      const payload: Record<string, string> = {
        schoolName: cleanSchoolName,
        jabatanKepalaSekolah: cleanJabatan,
        headmasterName: headmasterName.trim() || 'AKHMAD NASOR, S.Pd',
        headmasterNIP: headmasterNIP.trim() || '198704082019031001',
        tahunAjaran: finalYear,
        nilaiTahunAktif: finalYear,
        tahunPelajaranAktif: finalYear,
        bisma_academicYear: finalYear,
        semester,
        nilaiSemesterAktif: semester,
        semesterAktif: `Semester ${semester}`,
        jumlahUlangan: String(Math.max(1, Math.min(10, parseInt(jumlahUlangan, 10) || 3))),
        nilaiBobotHarian: String(bHarian),
        nilaiBobotSts: String(bSts),
        nilaiBobotAsas: String(bAsas),
        nilaiLogoMode,
        nilaiLogoSekolah: nilaiLogoSekolah.trim() || DEFAULT_SCHOOL_LOGO,
        logo1x1: nilaiLogoSekolah.trim() || DEFAULT_SCHOOL_LOGO,
        schoolLogo: nilaiLogoSekolah.trim() || DEFAULT_SCHOOL_LOGO,
        nilaiLogoKabupaten: nilaiLogoKabupaten.trim() || DEFAULT_KAB_LOGO,
        logoKabupaten: nilaiLogoKabupaten.trim() || DEFAULT_KAB_LOGO,
        nilaiTempatRaport: nilaiTempatRaport.trim() || 'Beji',
        nilaiTanggalRaport: nilaiTanggalRaport.trim(),
        nilaiRaportTagline: nilaiRaportTagline.trim() || DEFAULT_RAPORT_TAGLINE,
        nilaiCatatanDefault: nilaiCatatanDefault.trim() || DEFAULT_CATATAN_SISWA,
        wali_kelas_mapping: JSON.stringify(finalWkMapping),
      };

      const res = await fetch('/api/pengaturan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (result.success) {
        const storedRaw = safeStorage.getItem('school_identity_data');
        const prevStored = storedRaw ? JSON.parse(storedRaw) : {};
        safeStorage.setItem('school_identity_data', JSON.stringify({ ...prevStored, ...payload }));
        window.dispatchEvent(new Event('school-identity-update'));
        window.dispatchEvent(new Event('public-data-update'));
        showToast(
          'Konfigurasi Nilai, Logo & Tahun Aktif berhasil disimpan dan diterapkan ke akun Guru & Siswa!',
          'success'
        );
        onClose();
      } else {
        showToast('Gagal menyimpan konfigurasi: ' + (result.message || ''), 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan jaringan saat menyimpan konfigurasi nilai', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const activeYearDisplay = (customTahun.trim() || tahunAjaran).trim();
  const cleanJabatanPreview =
    jabatanKepalaSekolah.trim().replace(/Kepala\s+UPT\s+Satuan\s+Pendidikan/gi, 'Kepala') ||
    `Kepala ${schoolName || 'SDN BAUJENG I BEJI'}`;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-700 via-blue-700 to-fuchsia-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">
                Konfigurasi Fitur Nilai, Logo & Tahun Aktif
              </h2>
              <p className="text-xs text-blue-100">
                Pengaturan ini berdampak langsung pada akun Guru & Siswa di menu Nilai dan Cetak Raport STS (A4)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-900/60">
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-semibold">
              Memuat konfigurasi nilai dari database...
            </div>
          ) : (
            <>
              {/* 1. TAHUN PELAJARAN AKTIF & SEMESTER AKTIF */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
                      1. Tahun Pelajaran Aktif & Semester Aktif
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Menentukan tahun pelajaran dan semester default pada halaman Nilai Guru, Nilai Siswa, dan Raport STS
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1.5">
                      Pilih Tahun Pelajaran Aktif
                    </label>
                    <select
                      value={presetYears.includes(tahunAjaran) ? tahunAjaran : '2024/2025'}
                      onChange={(e) => {
                        setTahunAjaran(e.target.value);
                        setCustomTahun('');
                      }}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700 dark:text-white font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {presetYears.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1.5">
                      Atau Ketik Tahun Kustom
                    </label>
                    <input
                      type="text"
                      value={customTahun}
                      onChange={(e) => setCustomTahun(e.target.value)}
                      placeholder="Contoh: 2025/2026"
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700 dark:text-white font-semibold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1.5">
                      Semester Aktif
                    </label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700 dark:text-white font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="Ganjil">Semester I (Ganjil)</option>
                      <option value="Genap">Semester II (Genap)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. LOGO YANG DITAMPILKAN PADA FITUR NILAI & RAPORT STS */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
                        2. Logo yang Ditampilkan pada Fitur Nilai & Kop Raport STS
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Atur logo yang tampil pada header Nilai Guru, Nilai Siswa, dan Kop Raport STS A4
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pilihan Mode Logo */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-2">
                    Mode Tampilan Logo pada Fitur Nilai & Raport
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: 'both',
                        label: 'Tampilkan Kedua Logo',
                        desc: 'Logo Pemkab (Kiri) & Logo Sekolah (Kanan)',
                      },
                      {
                        id: 'sekolah',
                        label: 'Hanya Logo Sekolah',
                        desc: 'Fokus menampilkan Logo Sekolah / SDN',
                      },
                      {
                        id: 'kabupaten',
                        label: 'Hanya Logo Kabupaten',
                        desc: 'Fokus menampilkan Logo Pemkab Pasuruan',
                      },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setNilaiLogoMode(opt.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          nilaiLogoMode === opt.id
                            ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20'
                            : 'bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 dark:text-white">
                            {opt.label}
                          </span>
                          {nilaiLogoMode === opt.id && (
                            <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {opt.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  {/* Logo Sekolah */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">
                        Logo Sekolah (Header Nilai & Kop Kanan)
                      </span>
                      <button
                        type="button"
                        onClick={() => setNilaiLogoSekolah(DEFAULT_SCHOOL_LOGO)}
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset Default
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 flex items-center justify-center p-1.5 shrink-0 shadow-2xs">
                        {nilaiLogoSekolah ? (
                          <img
                            src={nilaiLogoSekolah}
                            alt="Logo Sekolah"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={nilaiLogoSekolah}
                          onChange={(e) => setNilaiLogoSekolah(e.target.value)}
                          placeholder="URL Logo Sekolah (https://...)"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                        />
                        <input
                          ref={fileInputSekolahRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadImage(e, 'sekolah')}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputSekolahRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload File Logo Sekolah</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Logo Kabupaten */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">
                        Logo Pemkab / Daerah (Kop Kiri)
                      </span>
                      <button
                        type="button"
                        onClick={() => setNilaiLogoKabupaten(DEFAULT_KAB_LOGO)}
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset Default
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 flex items-center justify-center p-1.5 shrink-0 shadow-2xs">
                        {nilaiLogoKabupaten ? (
                          <img
                            src={nilaiLogoKabupaten}
                            alt="Logo Kabupaten"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                'https://upload.wikimedia.org/wikipedia/commons/9/9a/Lambang_Kabupaten_Pasuruan.png';
                            }}
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={nilaiLogoKabupaten}
                          onChange={(e) => setNilaiLogoKabupaten(e.target.value)}
                          placeholder="URL Logo Kabupaten (https://...)"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                        />
                        <input
                          ref={fileInputKabRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadImage(e, 'kabupaten')}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputKabRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload File Logo Kabupaten</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. KONFIGURASI KOLOM ULANGAN HARIAN & BOBOT PENILAIAN */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <div className="p-2 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-600 dark:text-fuchsia-400">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
                      3. Konfigurasi Kolom Nilai Harian & Bobot Nilai Akhir
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Mengatur jumlah kolom Penilaian Harian (PH) dan persentase perhitungan Nilai Akhir (NA)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Jumlah Kolom PH / Harian
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={jumlahUlangan}
                      onChange={(e) => setJumlahUlangan(e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2 bg-slate-50 dark:bg-slate-700 dark:text-white font-bold text-sm"
                    />
                    <span className="text-[11px] text-slate-400">Default: 3 kolom</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Bobot Rerata Harian (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={nilaiBobotHarian}
                      onChange={(e) => setNilaiBobotHarian(e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2 bg-slate-50 dark:bg-slate-700 dark:text-white font-bold text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Bobot Nilai STS (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={nilaiBobotSts}
                      onChange={(e) => setNilaiBobotSts(e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2 bg-slate-50 dark:bg-slate-700 dark:text-white font-bold text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Bobot Nilai ASAS (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={nilaiBobotAsas}
                      onChange={(e) => setNilaiBobotAsas(e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2 bg-slate-50 dark:bg-slate-700 dark:text-white font-bold text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 4. PENGESAHAN RAPORT STS (KEPALA SDN BAUJENG I BEJI) */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
                      4. Identitas Sekolah & Pengesahan Kepala Sekolah pada Raport STS
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Menampilkan jabatan resmi "{cleanJabatanPreview}" pada tanda tangan Raport STS A4
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Nama Sekolah
                    </label>
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => {
                        setSchoolName(e.target.value);
                        setJabatanKepalaSekolah(`Kepala ${e.target.value}`);
                      }}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2 bg-slate-50 dark:bg-slate-700 dark:text-white font-bold text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Label Jabatan Kepala Sekolah (Raport)
                    </label>
                    <input
                      type="text"
                      value={jabatanKepalaSekolah}
                      onChange={(e) => setJabatanKepalaSekolah(e.target.value)}
                      placeholder="Kepala SDN BAUJENG I BEJI"
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2 bg-slate-50 dark:bg-slate-700 dark:text-white font-bold text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Nama Kepala Sekolah
                    </label>
                    <input
                      type="text"
                      value={headmasterName}
                      onChange={(e) => setHeadmasterName(e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2 bg-slate-50 dark:bg-slate-700 dark:text-white font-bold text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      NIP Kepala Sekolah
                    </label>
                    <input
                      type="text"
                      value={headmasterNIP}
                      onChange={(e) => setHeadmasterNIP(e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2 bg-slate-50 dark:bg-slate-700 dark:text-white font-semibold text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Tempat Cetak Raport Default
                    </label>
                    <input
                      type="text"
                      value={nilaiTempatRaport}
                      onChange={(e) => setNilaiTempatRaport(e.target.value)}
                      placeholder="Beji"
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2 bg-slate-50 dark:bg-slate-700 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      Tanggal Cetak Raport Default (Opsional)
                    </label>
                    <input
                      type="text"
                      value={nilaiTanggalRaport}
                      onChange={(e) => setNilaiTanggalRaport(e.target.value)}
                      placeholder="Kosongkan untuk tanggal hari ini otomatis"
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2 bg-slate-50 dark:bg-slate-700 dark:text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 5. KONFIGURASI WALI KELAS (AKSES CETAK SELURUH MATA PELAJARAN) */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
                      5. Konfigurasi Guru Wali Kelas (Kelas 1 s.d. Kelas 6)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Guru yang ditetapkan sebagai Wali Kelas akan otomatis memperoleh fitur Leger & Print Out Wali Kelas untuk mencetak seluruh mata pelajaran
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {KELAS_LIST_SD.map((kls) => {
                    const currentWk = waliKelasMap[kls] || { nip: '', nama: '' };
                    return (
                      <div
                        key={kls}
                        className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-teal-700 dark:text-teal-300 uppercase">
                            Wali {kls}
                          </span>
                          {currentWk.nama && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200 font-bold">
                              Aktif
                            </span>
                          )}
                        </div>

                        <select
                          value={currentWk.nip || currentWk.nama || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) {
                              setWaliKelasMap((prev) => ({
                                ...prev,
                                [kls]: { nip: '', nama: '' },
                              }));
                              return;
                            }
                            const found = guruList.find(
                              (g) => g.nip === val || g.nama_guru === val
                            );
                            if (found) {
                              setWaliKelasMap((prev) => ({
                                ...prev,
                                [kls]: {
                                  nip: found.nip || '',
                                  nama: found.nama_guru || '',
                                },
                              }));
                            }
                          }}
                          className="w-full text-xs font-semibold px-2.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="">-- Pilih Guru Wali {kls} --</option>
                          {guruList.map((g) => (
                            <option key={g.nip || g.nama_guru} value={g.nip || g.nama_guru}>
                              {g.nama_guru} {g.nip ? `(${g.nip})` : ''}
                            </option>
                          ))}
                        </select>

                        <div className="grid grid-cols-2 gap-1.5">
                          <input
                            type="text"
                            value={currentWk.nama}
                            onChange={(e) =>
                              setWaliKelasMap((prev) => ({
                                ...prev,
                                [kls]: { ...currentWk, nama: e.target.value },
                              }))
                            }
                            placeholder="Nama Wali Kelas"
                            className="w-full text-[11px] px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                          />
                          <input
                            type="text"
                            value={currentWk.nip}
                            onChange={(e) =>
                              setWaliKelasMap((prev) => ({
                                ...prev,
                                [kls]: { ...currentWk, nip: e.target.value },
                              }))
                            }
                            placeholder="NIP Wali Kelas"
                            className="w-full text-[11px] px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 6. KONFIGURASI FOOTER SEBELAH KIRI & TAGLINE CETAK RAPORT STS */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
                      6. Konfigurasi Footer Sebelah Kiri & Tagline Cetak Raport A4
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Format Footer Sebelah Kiri: <strong className="text-slate-700 dark:text-slate-200">Nama Siswa | Kelas/NIS | [tagline]</strong>
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                        Teks [Tagline] pada Footer Kiri Raport
                      </label>
                      <button
                        type="button"
                        onClick={() => setNilaiRaportTagline(DEFAULT_RAPORT_TAGLINE)}
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset Default
                      </button>
                    </div>
                    <input
                      type="text"
                      value={nilaiRaportTagline}
                      onChange={(e) => setNilaiRaportTagline(e.target.value)}
                      placeholder="Contoh: BERMUTU - Beriman, Ramah, Mandiri, Unggul dan Tangguh"
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700 dark:text-white font-semibold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-dashed border-slate-300 dark:border-slate-700">
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Pratinjau Footer Sebelah Kiri Lembar Cetak A4:
                    </p>
                    <div className="flex items-center justify-between text-xs font-serif text-slate-800 dark:text-slate-200">
                      <span className="font-semibold">
                        AHMAD FAUZI | Kelas 4/1024 | {nilaiRaportTagline || DEFAULT_RAPORT_TAGLINE}
                      </span>
                      <span className="text-[10px] text-slate-400">Hal. 1</span>
                    </div>
                  </div>

                  {/* Konfigurasi Catatan Default Siswa */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                        Catatan Default Siswa pada Raport STS (Mode Default)
                      </label>
                      <button
                        type="button"
                        onClick={() => setNilaiCatatanDefault(DEFAULT_CATATAN_SISWA)}
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset Catatan Default
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={nilaiCatatanDefault}
                      onChange={(e) => setNilaiCatatanDefault(e.target.value)}
                      placeholder="Masukkan teks catatan default untuk siswa..."
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3.5 py-2 bg-slate-50 dark:bg-slate-700 dark:text-white font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Catatan ini otomatis digunakan untuk setiap siswa yang diatur ke mode <strong>Default</strong>. Guru / Wali Kelas tetap dapat memilih mode <strong>Default</strong> atau mengisi catatan <strong>Manual</strong> secara khusus untuk masing-masing siswa.
                    </p>
                  </div>
                </div>
              </div>

              {/* 7. PRATINJAU DAMPAK PADA AKUN GURU & SISWA */}
              <div className="bg-indigo-50/70 dark:bg-slate-800/90 p-5 rounded-2xl border border-indigo-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider">
                  <Eye className="w-4 h-4" />
                  <span>Pratinjau Tampilan pada Akun Guru & Siswa (Fitur Nilai & Raport STS)</span>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
                  <div className="flex items-center gap-3">
                    {(nilaiLogoMode === 'both' || nilaiLogoMode === 'kabupaten') && (
                      <img
                        src={nilaiLogoKabupaten || DEFAULT_KAB_LOGO}
                        alt="Logo Kab"
                        className="w-11 h-11 object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://upload.wikimedia.org/wikipedia/commons/9/9a/Lambang_Kabupaten_Pasuruan.png';
                        }}
                      />
                    )}
                    {(nilaiLogoMode === 'both' || nilaiLogoMode === 'sekolah') && (
                      <img
                        src={nilaiLogoSekolah || DEFAULT_SCHOOL_LOGO}
                        alt="Logo Sekolah"
                        className="w-11 h-11 object-contain"
                      />
                    )}
                    <div>
                      <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase">
                        {schoolName || 'SDN BAUJENG I BEJI'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Tahun Pelajaran Aktif: <strong className="text-indigo-600 dark:text-indigo-400">{activeYearDisplay}</strong> • Semester: <strong className="text-emerald-600 dark:text-emerald-400">{semester}</strong> • {jumlahUlangan} Kolom PH
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Footer Kiri Raport: <code className="text-rose-600 dark:text-rose-400 font-semibold">Nama Siswa | Kelas/NIS | {nilaiRaportTagline || DEFAULT_RAPORT_TAGLINE}</code>
                      </p>
                    </div>
                  </div>

                  <div className="text-center sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800 text-xs">
                    <p className="text-slate-500 dark:text-slate-400">Pengesahan Raport STS:</p>
                    <p className="font-bold text-slate-800 dark:text-white">{cleanJabatanPreview}</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-300 underline">{headmasterName}</p>
                    <p className="text-[10px] text-slate-500">NIP. {headmasterNIP}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold hover:bg-slate-300 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan & Terapkan ke Guru dan Siswa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
