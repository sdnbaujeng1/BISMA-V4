import React, { useEffect, useState } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  Sparkles,
  Link2,
  Lock,
  Building2,
  Award,
  Image as ImageIcon,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { SupervisiActor, SupervisiConfig } from './types';

interface SupervisiPengaturanAdminProps {
  actor?: SupervisiActor;
  config?: SupervisiConfig;
  onSaved?: () => void;
}

export default function SupervisiPengaturanAdmin({
  actor,
  config,
  onSaved
}: SupervisiPengaturanAdminProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [kopHeaderLine1, setKopHeaderLine1] = useState(
    config?.kopHeaderLine1 || 'PEMERINTAH KABUPATEN PASURUAN'
  );
  const [kopHeaderLine2, setKopHeaderLine2] = useState(
    (config?.kopHeaderLine2 || 'DINAS PENDIDIKAN').replace(/\s*DAN\s+KEBUDAYAAN/gi, '').trim()
  );
  const [schoolName, setSchoolName] = useState(config?.schoolName || 'SDN BAUJENG I BEJI');
  const [schoolAddress, setSchoolAddress] = useState(
    config?.schoolAddress || 'Jl. Raya Baujeng No. 01, Kec. Beji, Kab. Pasuruan'
  );
  const [subdistrict, setSubdistrict] = useState(config?.subdistrict || 'Kecamatan Beji');
  const [district, setDistrict] = useState(config?.district || 'Kabupaten Pasuruan');
  const [province, setProvince] = useState(config?.province || 'Jawa Timur');
  const [motto, setMotto] = useState(
    config?.motto || 'BERMUTU — Beriman, Ramah, Mandiri, Unggul, Tangguh'
  );

  const [logoKabupaten, setLogoKabupaten] = useState(
    config?.logoKabupaten || '/assets/logo-kab-pasuruan.png'
  );
  const [logoSekolah, setLogoSekolah] = useState(
    config?.logo1x1 || config?.schoolLogo || ''
  );
  const [bismaLogoUrl, setBismaLogoUrl] = useState(
    'https://lh3.googleusercontent.com/d/1k2MibT1XHlAWHbFOQo80Cj4Lp5ZMeMLT'
  );

  const [headmasterName, setHeadmasterName] = useState(
    config?.headmasterName || 'AKHMAD KHUZAENI, S.Pd, M.Pd'
  );
  const [headmasterNIP, setHeadmasterNIP] = useState(
    config?.headmasterNIP || '198406022014061001'
  );
  const [tahunPelajaranAktif, setTahunPelajaranAktif] = useState(
    config?.tahunPelajaranAktif || '2026/2027'
  );
  const [semesterAktif, setSemesterAktif] = useState(
    config?.semesterAktif || 'Semester Ganjil'
  );

  const [enableSequentialUnlock, setEnableSequentialUnlock] = useState<boolean>(
    config?.enableSequentialUnlock !== false
  );
  const [enableDriveLinkEmbed, setEnableDriveLinkEmbed] = useState<boolean>(
    config?.enableDriveLinkEmbed !== false
  );
  const [enableAiAutofill, setEnableAiAutofill] = useState<boolean>(
    config?.enableAiAutofill !== false
  );
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [otherApiKey, setOtherApiKey] = useState<string>('');
  const [hasEmbeddedApiKey, setHasEmbeddedApiKey] = useState<boolean>(true);

  const fetchSettingsFromDb = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pengaturan');
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        if (d.kopHeaderLine1) setKopHeaderLine1(d.kopHeaderLine1);
        if (d.kopHeaderLine2) {
          setKopHeaderLine2(String(d.kopHeaderLine2).replace(/\s*DAN\s+KEBUDAYAAN/gi, '').trim());
        }
        if (d.schoolName) setSchoolName(d.schoolName);
        if (d.schoolAddress) setSchoolAddress(d.schoolAddress);
        if (d.subdistrict) setSubdistrict(d.subdistrict);
        if (d.district) setDistrict(d.district);
        if (d.province) setProvince(d.province);
        if (d.sloganText) setMotto(d.sloganText);
        if (d.logoKabupaten) setLogoKabupaten(d.logoKabupaten);
        if (d.logo1x1 || d.schoolLogo) setLogoSekolah(d.logo1x1 || d.schoolLogo);
        if (d.bismaLogoUrl) setBismaLogoUrl(d.bismaLogoUrl);
        if (d.headmasterName) setHeadmasterName(d.headmasterName);
        if (d.headmasterNIP) setHeadmasterNIP(d.headmasterNIP);
        if (d.tahunPelajaranAktif) setTahunPelajaranAktif(d.tahunPelajaranAktif);
        if (d.semesterAktif) setSemesterAktif(d.semesterAktif);
        if (d.supervisi_sequential_unlock !== undefined) {
          setEnableSequentialUnlock(d.supervisi_sequential_unlock !== 'false');
        }
        if (d.supervisi_drive_link_embed !== undefined) {
          setEnableDriveLinkEmbed(d.supervisi_drive_link_embed !== 'false');
        }
        if (d.supervisi_ai_autofill !== undefined) {
          setEnableAiAutofill(d.supervisi_ai_autofill !== 'false');
        }
        if (d.gemini_api_key) {
          setGeminiApiKey(d.gemini_api_key);
          setHasEmbeddedApiKey(true);
        }
        if (d.other_api_key) {
          setOtherApiKey(d.other_api_key);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsFromDb();
  }, []);

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const cleanedLine2 = kopHeaderLine2.replace(/\s*DAN\s+KEBUDAYAAN/gi, '').trim() || 'DINAS PENDIDIKAN';
      setKopHeaderLine2(cleanedLine2);

      const res = await fetch('/api/supervisi/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor,
          settings: {
            kopHeaderLine1: kopHeaderLine1.trim() || 'PEMERINTAH KABUPATEN PASURUAN',
            kopHeaderLine2: cleanedLine2,
            schoolName: schoolName.trim(),
            schoolAddress: schoolAddress.trim(),
            subdistrict: subdistrict.trim(),
            district: district.trim(),
            province: province.trim(),
            motto: motto.trim(),
            logoKabupaten: logoKabupaten.trim() || '/assets/logo-kab-pasuruan.png',
            logo1x1: logoSekolah.trim(),
            schoolLogo: logoSekolah.trim(),
            bismaLogoUrl: bismaLogoUrl.trim() || 'https://lh3.googleusercontent.com/d/1k2MibT1XHlAWHbFOQo80Cj4Lp5ZMeMLT',
            headmasterName: headmasterName.trim(),
            headmasterNIP: headmasterNIP.trim(),
            tahunPelajaranAktif: tahunPelajaranAktif.trim(),
            semesterAktif: semesterAktif.trim(),
            enableSequentialUnlock,
            enableDriveLinkEmbed,
            enableAiAutofill,
            geminiApiKey: geminiApiKey.trim(),
            otherApiKey: otherApiKey.trim()
          }
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menyimpan pengaturan (BISMA +) ke database.');
      }
      window.dispatchEvent(new Event('school-identity-update'));
      window.dispatchEvent(new Event('public-data-update'));
      setNotice({
        type: 'success',
        text: 'Seluruh pengaturan (BISMA +), Kop Surat, Logo Kabupaten Pasuruan, Logo Sekolah & Logo Tulisan BISMA Landing Page berhasil disimpan ke database.'
      });
      if (onSaved) onSaved();
    } catch (err: any) {
      setNotice({
        type: 'error',
        text: err?.message || 'Gagal menyimpan pengaturan.'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-6">
      {/* Top 3D Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl border-2 border-blue-500/40 border-b-[7px] border-b-blue-950 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-extrabold uppercase tracking-wider">
              <Settings className="w-3.5 h-3.5 text-amber-300" />
              <span>PUSAT PENGATURAN ADMIN • (BISMA +)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Pengaturan Kop Surat, Logo, Kunci Tahapan 3D, Link Drive & API (BISMA +)
            </h2>
            <p className="text-xs text-blue-100/90 max-w-3xl leading-relaxed">
              Seluruh perubahan pada halaman ini tersimpan langsung ke tabel <code className="font-bold text-amber-300">pengaturan</code> di database Supabase dan langsung diterapkan pada Dashboard Guru, Dashboard Kepala Sekolah, serta Cetakan Laporan A4.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={fetchSettingsFromDb}
              disabled={loading}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Muat Ulang DB</span>
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-black border-b-4 border-emerald-900 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan ke DB...' : 'Simpan Semua Pengaturan'}</span>
            </button>
          </div>
        </div>
      </div>

      {notice && (
        <div
          className={`p-4 rounded-2xl border-2 border-b-4 text-xs font-extrabold flex items-center justify-between gap-3 ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 border-b-emerald-600 text-emerald-950'
              : 'bg-rose-50 border-rose-300 border-b-rose-600 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{notice.text}</span>
          </div>
          <button type="button" onClick={() => setNotice(null)} className="text-xs font-black">
            ✕
          </button>
        </div>
      )}

      {/* LIVE KOP SURAT PREVIEW */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 border-b-[6px] border-b-blue-600 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-700" />
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              Pratinjau Langsung Kop Surat Resmi (Sesuai Database)
            </h3>
          </div>
          <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 text-[11px] font-extrabold">
            Tanpa Kata "Kebudayaan"
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-300 max-w-3xl mx-auto">
          <div className="pb-3 border-b-4 border-double border-slate-900 flex items-center justify-between gap-4">
            <img
              src={logoKabupaten || '/assets/logo-kab-pasuruan.png'}
              alt="Logo Kabupaten Pasuruan"
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain shrink-0"
              onError={e => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://upload.wikimedia.org/wikipedia/commons/9/9a/Lambang_Kabupaten_Pasuruan.png';
              }}
            />
            <div className="flex-1 text-center space-y-0.5 text-slate-900">
              <p className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                {kopHeaderLine1 || 'PEMERINTAH KABUPATEN PASURUAN'}
              </p>
              <p className="text-xs sm:text-sm font-black uppercase tracking-wider">
                {(kopHeaderLine2 || 'DINAS PENDIDIKAN').replace(/\s*DAN\s+KEBUDAYAAN/gi, '').trim()}
              </p>
              <h4 className="text-base sm:text-lg font-black uppercase tracking-wide pt-0.5">
                {schoolName || 'SDN BAUJENG I BEJI'}
              </h4>
              <p className="text-[11px] font-semibold text-slate-700">
                {schoolAddress || `${subdistrict}, ${district}, Provinsi ${province}`}
              </p>
              <p className="text-[10px] font-bold text-blue-900">{motto}</p>
            </div>
            {logoSekolah ? (
              <img
                src={logoSekolah}
                alt="Logo Sekolah"
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl border border-slate-300 flex items-center justify-center text-[9px] font-bold text-slate-500 shrink-0">
                LOGO SEKOLAH
              </div>
            )}
          </div>
        </div>

        {/* Form Fields for Kop Surat & Logos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 text-xs">
          <div>
            <label className="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
              Baris 1 Kop Pemerintah Daerah *
            </label>
            <input
              type="text"
              value={kopHeaderLine1}
              onChange={e => setKopHeaderLine1(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-900 bg-white"
            />
          </div>
          <div>
            <label className="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
              Baris 2 Kop Dinas (Tanpa Kebudayaan) *
            </label>
            <input
              type="text"
              value={kopHeaderLine2}
              onChange={e => setKopHeaderLine2(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-900 bg-white"
            />
          </div>
          <div>
            <label className="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
              Nama Satuan Pendidikan (Sesuai DB) *
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={e => setSchoolName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-900 bg-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
              Alamat Lengkap Satuan Pendidikan
            </label>
            <input
              type="text"
              value={schoolAddress}
              onChange={e => setSchoolAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-semibold text-slate-900 bg-white"
            />
          </div>
          <div>
            <label className="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
              Slogan / Motto Sekolah
            </label>
            <input
              type="text"
              value={motto}
              onChange={e => setMotto(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-semibold text-slate-900 bg-white"
            />
          </div>
          <div>
            <label className="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
              URL Logo Pemerintah Kabupaten Pasuruan
            </label>
            <input
              type="text"
              value={logoKabupaten}
              onChange={e => setLogoKabupaten(e.target.value)}
              placeholder="/assets/logo-kab-pasuruan.png"
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-semibold text-slate-900 bg-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
              URL Logo Sekolah (Dari Database `logo1x1` / `schoolLogo`)
            </label>
            <input
              type="text"
              value={logoSekolah}
              onChange={e => setLogoSekolah(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-semibold text-slate-900 bg-white"
            />
          </div>
          <div className="sm:col-span-3 pt-2 border-t border-slate-200 dark:border-slate-700">
            <label className="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
              URL Logo BISMA+ (Header Landing / Public Dashboard & Logo Halaman Login — Database `bismaLogoUrl`)
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0 min-w-[140px] h-11">
                {bismaLogoUrl ? (
                  <img
                    src={bismaLogoUrl}
                    alt="Preview Logo Tulisan BISMA"
                    referrerPolicy="no-referrer"
                    className="h-7 w-auto max-w-[160px] object-contain"
                  />
                ) : (
                  <span className="text-[10px] font-bold text-slate-400">Preview BISMA</span>
                )}
              </div>
              <input
                type="text"
                value={bismaLogoUrl}
                onChange={e => setBismaLogoUrl(e.target.value)}
                placeholder="https://lh3.googleusercontent.com/d/1k2MibT1XHlAWHbFOQo80Cj4Lp5ZMeMLT"
                className="flex-1 w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-semibold text-slate-900 bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: KEPALA SEKOLAH & PERIODE AKTIF */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 border-b-[6px] border-b-indigo-600 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Award className="w-5 h-5 text-indigo-700" />
          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
            Identitas Kepala Sekolah (Supervisor) & Tahun Ajaran Aktif
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-extrabold text-slate-700 mb-1">Nama Kepala Sekolah *</label>
            <input
              type="text"
              value={headmasterName}
              onChange={e => setHeadmasterName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-900 bg-white"
            />
          </div>
          <div>
            <label className="block font-extrabold text-slate-700 mb-1">NIP Kepala Sekolah *</label>
            <input
              type="text"
              value={headmasterNIP}
              onChange={e => setHeadmasterNIP(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-900 bg-white"
            />
          </div>
          <div>
            <label className="block font-extrabold text-slate-700 mb-1">Tahun Pelajaran Aktif *</label>
            <input
              type="text"
              value={tahunPelajaranAktif}
              onChange={e => setTahunPelajaranAktif(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-900 bg-white"
            />
          </div>
          <div>
            <label className="block font-extrabold text-slate-700 mb-1">Semester Aktif *</label>
            <select
              value={semesterAktif}
              onChange={e => setSemesterAktif(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-900 bg-white"
            >
              <option value="Semester Ganjil">Semester Ganjil</option>
              <option value="Semester Genap">Semester Genap</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 3: PENGATURAN FITUR (BISMA +): KUNCI BERTAHAP 3D, LINK DRIVE & API TERTANAM */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 border-b-[6px] border-b-emerald-600 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-700" />
          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
            Kontrol Fitur Supervisi Akademik (BISMA +)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Toggle 1: Drive Link Embed & KS Popup Preview */}
          <label className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 border-b-4 flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enableDriveLinkEmbed}
              onChange={e => setEnableDriveLinkEmbed(e.target.checked)}
              className="mt-1 w-4 h-4 accent-indigo-700 rounded"
            />
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                <Link2 className="w-4 h-4 text-indigo-700" />
                <span>Sematkan Link Drive & Pop-up Pratinjau KS</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Gunakan penyematan link Google Drive / URL oleh user dan tampilkan pop-up pratinjau + edit Catatan Tinjauan bagi Kepala Sekolah.
              </p>
            </div>
          </label>

          {/* Toggle 2: Embedded API Autofill */}
          <label className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 border-b-4 flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enableAiAutofill}
              onChange={e => setEnableAiAutofill(e.target.checked)}
              className="mt-1 w-4 h-4 accent-amber-600 rounded"
            />
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Isian Otomatis dari API Tertanam</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Aktifkan bantuan API tertanam untuk Catatan Tinjauan, PENCATATAN BUKTI PENGAMATAN KELAS, Persiapan KS, dan isian manual berdasarkan data.
              </p>
            </div>
          </label>
        </div>

        {/* Embedded API Keys in Database */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-200 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-extrabold text-amber-950">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span>Konfigurasi API Tertanam di Database (`pengaturan.gemini_api_key` & `other_api_key`)</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 text-[10px] font-extrabold">
              {hasEmbeddedApiKey ? '✓ API Tertanam Aktif di Database' : 'Menggunakan Default Server'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Gemini API Key Tertanam (`gemini_api_key`)
              </label>
              <input
                type="password"
                value={geminiApiKey}
                onChange={e => setGeminiApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2 rounded-xl border-2 border-amber-300 bg-white font-mono text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Cadangan / Secondary API Key (`other_api_key`)
              </label>
              <input
                type="password"
                value={otherApiKey}
                onChange={e => setOtherApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2 rounded-xl border-2 border-amber-300 bg-white font-mono text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
