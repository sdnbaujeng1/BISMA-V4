import React, { useState, useRef } from 'react';
import { Printer, Award, Sparkles, Check, Calendar, Hash, UserCheck, Eye, Edit3, RotateCcw } from 'lucide-react';
import { SchoolIdentity } from '../hooks/useSchoolIdentity';

export interface TopStudentCertificateData {
  rank: 1 | 2 | 3;
  name: string;
  nis?: string;
  nisn?: string;
  kelas?: string;
  points?: number;      // For Kasih Ibu
  weight?: number;      // For Tabungan Sampah (kg)
  savings?: number;     // For Tabungan Sampah (Rp)
}

interface CertificateAppreciationViewProps {
  mode: 'kasih_ibu' | 'tabungan_sampah';
  programLabel?: string;
  selectedMonth: string; // YYYY-MM or ''
  onMonthChange: (month: string) => void;
  selectedClass?: string;
  onClassChange?: (kelas: string) => void;
  classOptions?: string[];
  topStudents: TopStudentCertificateData[];
  certificateNumber: string;
  schoolIdentity: SchoolIdentity;
  onGoToConfig?: () => void;
}

interface TemplateMeta {
  id: string;
  name: string;
  subtitle: string;
  badgeText: string;
  accentColor: string;
  previewBg: string;
  certTitle: string;
  certSubtitle: string;
}

const KASIH_IBU_TEMPLATES: TemplateMeta[] = [
  {
    id: 'kasih-1',
    name: '1. Royal Rose & Gold Klasik',
    subtitle: 'Bingkai klasik keemasan & mawar hangat',
    badgeText: 'Klasik Elegan',
    accentColor: 'from-rose-600 to-amber-600',
    previewBg: 'bg-rose-50 border-rose-300 text-rose-800',
    certTitle: 'SERTIFIKAT PENGHARGAAN',
    certSubtitle: 'APRESIASI DUTA KARAKTER & PEMBIASAAN BAIK'
  },
  {
    id: 'kasih-2',
    name: '2. Nusantara Heritage Budi Pekerti',
    subtitle: 'Ornamen budaya adiluhung & marun emas',
    badgeText: 'Nusantara',
    accentColor: 'from-red-800 to-amber-500',
    previewBg: 'bg-amber-50 border-amber-300 text-amber-900',
    certTitle: 'PIAGAM APRESIASI KARAKTER',
    certSubtitle: 'ANUGERAH BINTANG KEBIASAAN ANAK INDONESIA HEBAT'
  },
  {
    id: 'kasih-3',
    name: '3. Modern Prestasi Magenta & Violet',
    subtitle: 'Geometris kontemporer tegas & dinamis',
    badgeText: 'Modern',
    accentColor: 'from-fuchsia-600 to-purple-700',
    previewBg: 'bg-fuchsia-50 border-fuchsia-300 text-fuchsia-900',
    certTitle: 'SERTIFIKAT TELADAN UTAMA',
    certSubtitle: 'PENGHARGAAN SISWA BERKARAKTER TERBAIK BULANAN'
  },
  {
    id: 'kasih-4',
    name: '4. Floral Kasih Sayang Harmoni',
    subtitle: 'Nuansa lembut penuh kasih & ketulusan',
    badgeText: 'Floral Lembut',
    accentColor: 'from-pink-500 to-rose-400',
    previewBg: 'bg-pink-50 border-pink-300 text-pink-800',
    certTitle: 'PIAGAM PENGHARGAAN KASIH IBU',
    certSubtitle: 'TELADAN AKHLAK MULIA, IBADAH & KEDISIPLINAN DIRI'
  },
  {
    id: 'kasih-5',
    name: '5. Prestige Golden Star 7 Kebiasaan',
    subtitle: 'Imperial biru malam & bintang emas 7 kebiasaan',
    badgeText: 'Imperial Gold',
    accentColor: 'from-indigo-900 to-yellow-600',
    previewBg: 'bg-indigo-50 border-indigo-300 text-indigo-900',
    certTitle: 'SERTIFIKAT BINTANG KARAKTER',
    certSubtitle: 'APRESIASI PUNCAK PEMBIASAAN POSITIF SISWA'
  }
];

const TABUNGAN_SAMPAH_TEMPLATES: TemplateMeta[] = [
  {
    id: 'sampah-1',
    name: '1. Emerald Adiwiyata Nusantara',
    subtitle: 'Hijau zamrud & ornamen daun emas lestari',
    badgeText: 'Adiwiyata',
    accentColor: 'from-emerald-700 to-amber-600',
    previewBg: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    certTitle: 'SERTIFIKAT PENGHARGAAN LINGKUNGAN',
    certSubtitle: 'APRESIASI PAHLAWAN CILIK TABUNGAN SAMPAH'
  },
  {
    id: 'sampah-2',
    name: '2. Earth Guardian Botanical Gold',
    subtitle: 'Nuansa alam tropis & penjaga bumi hijau',
    badgeText: 'Botanical',
    accentColor: 'from-green-700 to-lime-600',
    previewBg: 'bg-green-50 border-green-300 text-green-900',
    certTitle: 'PIAGAM APRESIASI DUTA EKOLOGI',
    certSubtitle: 'PENGGERAK BUDAYA PILAH SAMPAH & DAUR ULANG'
  },
  {
    id: 'sampah-3',
    name: '3. Modern Zero Waste Teal & Lime',
    subtitle: 'Desain geometris modern bebas sampah',
    badgeText: 'Zero Waste',
    accentColor: 'from-teal-600 to-emerald-500',
    previewBg: 'bg-teal-50 border-teal-300 text-teal-900',
    certTitle: 'SERTIFIKAT PELOPOR ZERO WASTE',
    certSubtitle: 'PENGHARGAAN NASABAH TERBAIK TABUNGAN SAMPAH'
  },
  {
    id: 'sampah-4',
    name: '4. Green Harmony Sahabat Bumi',
    subtitle: 'Klasik zaitun & karangan daun perdamaian alam',
    badgeText: 'Sahabat Bumi',
    accentColor: 'from-lime-700 to-amber-700',
    previewBg: 'bg-lime-50 border-lime-300 text-lime-900',
    certTitle: 'PIAGAM KEHORMATAN SAHABAT BUMI',
    certSubtitle: 'APRESIASI KEPEDULIAN KEBERSIHAN & BANK SAMPAH'
  },
  {
    id: 'sampah-5',
    name: '5. Prestige Golden Eco-Champion',
    subtitle: 'Hijau pinus mewah & mahkota daur ulang emas',
    badgeText: 'Eco-Champion',
    accentColor: 'from-emerald-900 to-yellow-600',
    previewBg: 'bg-amber-50 border-amber-300 text-emerald-950',
    certTitle: 'SERTIFIKAT BINTANG ADIWIYATA',
    certSubtitle: 'ANUGERAH SISWA TERAKTIF TABUNGAN SAMPAH BULANAN'
  }
];

export function formatIndonesianMonth(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) {
    const now = new Date();
    return now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }
  const [year, month] = monthStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  if (isNaN(date.getTime())) return monthStr;
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

function getRankLabel(rank: 1 | 2 | 3, mode: 'kasih_ibu' | 'tabungan_sampah'): {
  roman: string;
  predicate: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
} {
  if (rank === 1) {
    return {
      roman: 'I',
      predicate: mode === 'kasih_ibu' ? 'TERBAIK I (PERTAMA) — TELADAN UTAMA' : 'TERBAIK I (PERTAMA) — DUTA UTAMA LINGKUNGAN',
      badgeBg: '#FEF3C7',
      badgeBorder: '#D97706',
      badgeText: '#92400E'
    };
  }
  if (rank === 2) {
    return {
      roman: 'II',
      predicate: mode === 'kasih_ibu' ? 'TERBAIK II (KEDUA) — BINTANG INSPIRATIF' : 'TERBAIK II (KEDUA) — PELOPOR DAUR ULANG',
      badgeBg: '#F1F5F9',
      badgeBorder: '#64748B',
      badgeText: '#1E293B'
    };
  }
  return {
    roman: 'III',
    predicate: mode === 'kasih_ibu' ? 'TERBAIK III (KETIGA) — TUNAS BERKARAKTER' : 'TERBAIK III (KETIGA) — PENGGERAK KEBERSIHAN',
    badgeBg: '#FFEDD5',
    badgeBorder: '#EA580C',
    badgeText: '#9A3412'
  };
}

function buildNarrative(
  templateId: string,
  student: TopStudentCertificateData,
  monthLabel: string,
  programLabel: string
): string {
  const pts = student.points ?? 0;
  const weightStr = (student.weight ?? 0).toFixed(1).replace('.0', '');
  const savingsStr = (student.savings ?? 0).toLocaleString('id-ID');

  switch (templateId) {
    // --- KASIH IBU NARRATIVES ---
    case 'kasih-1':
      return `Diberikan dengan penuh rasa bangga sebagai bentuk apresiasi atas keteladanan, kedisiplinan, dan konsistensi luar biasa dalam melaksanakan program pembiasaan karakter "${programLabel}" (7 Kebiasaan Anak Indonesia Hebat) dengan perolehan ${pts} Poin pada bulan ${monthLabel}. Semoga terus menjadi pribadi yang berakhlak mulia, santun, dan menginspirasi teman sebaya.`;
    case 'kasih-2':
      return `Dianugerahkan atas dedikasi dan semangat pantang menyerah dalam mengamalkan kebiasaan positif sehari-hari sejak bangun pagi, taat beribadah, gemar belajar, hingga bermasyarakat pada program "${programLabel}" bulan ${monthLabel} (Total Capaian: ${pts} Poin). Teruslah tumbuh menjadi generasi penerus bangsa yang berbudi pekerti luhur dan membanggakan orang tua.`;
    case 'kasih-3':
      return `Apresiasi setinggi-tingginya diberikan karena telah menunjukkan komitmen unggul dalam menjaga rutinitas kebaikan, kemandirian, serta ketertiban diri melalui jurnal pembiasaan "${programLabel}" selama bulan ${monthLabel} dengan raihan ${pts} Poin. Prestasi karakter hari ini adalah fondasi kesuksesan gemilang di masa depan.`;
    case 'kasih-4':
      return `Dengan penuh kasih sayang dan kebanggaan, piagam ini dipersembahkan atas ketekunan dalam menanamkan nilai-nilai kebaikan hati, ketaatan beribadah, pola hidup sehat, dan kepedulian sosial pada program "${programLabel}" periode bulan ${monthLabel} (${pts} Poin). Semoga senantiasa menjadi anak hebat penyejuk hati keluarga dan sekolah.`;
    case 'kasih-5':
      return `Diberikan atas pencapaian gemilang sebagai Siswa Terbaik dalam pelaksanaan 7 Kebiasaan Anak Indonesia Hebat pada program "${programLabel}" bulan ${monthLabel} dengan total akumulasi ${pts} Poin. Kiranya keteladanan dalam beribadah, rajin belajar, dan berbuat kebajikan ini terus dipertahankan serta ditingkatkan.`;

    // --- TABUNGAN SAMPAH NARRATIVES ---
    case 'sampah-1':
      return `Diberikan sebagai wujud apresiasi tinggi atas kepedulian nyata terhadap kebersihan lingkungan sekolah dan keaktifan menabung sampah terpilah pada program Tabungan Sampah selama bulan ${monthLabel} (Total Setoran: ${weightStr} kg). Terima kasih telah berkontribusi menjaga bumi tetap hijau, bersih, dan lestari.`;
    case 'sampah-2':
      return `Dianugerahkan atas konsistensi dan keteladanan luar biasa dalam mengubah sampah menjadi berkah melalui program Bank & Tabungan Sampah Sekolah pada bulan ${monthLabel} dengan capaian tabungan seberat ${weightStr} kg. Langkah kecilmu memilah sampah hari ini adalah penyelamat lingkungan untuk masa depan.`;
    case 'sampah-3':
      return `Apresiasi terbaik diberikan karena telah menjadi pelopor pengurangan sampah anorganik di lingkungan sekolah serta disiplin menabung di Bank Sampah pada periode bulan ${monthLabel} (Total Capaian: ${weightStr} kg). Semoga semangat peduli lingkungan dan budaya hemat menabung ini menginspirasi seluruh warga sekolah.`;
    case 'sampah-4':
      return `Dipersembahkan dengan bangga atas dedikasi menjaga keindahan sekolah serta ketekunan mengumpulkan dan memilah sampah bernilai ekonomis pada program Tabungan Sampah bulan ${monthLabel} seberat ${weightStr} kg. Teruslah menjadi agen perubahan menuju sekolah yang bersih, sehat, dan berbudaya lingkungan.`;
    case 'sampah-5':
    default:
      return `Diberikan atas prestasi membanggakan sebagai Siswa Terbaik dalam gerakan literasi lingkungan dan kemandirian menabung sampah pada bulan ${monthLabel} dengan total perolehan ${weightStr} kg. Semoga kepedulian terhadap kelestarian alam ini menjadi karakter mulia sepanjang hayat.`;
  }
}

export default function CertificateAppreciationView({
  mode,
  programLabel = 'Kasih Ibu',
  selectedMonth,
  onMonthChange,
  selectedClass,
  onClassChange,
  classOptions = [],
  topStudents,
  certificateNumber,
  schoolIdentity,
  onGoToConfig
}: CertificateAppreciationViewProps) {
  const templates = mode === 'kasih_ibu' ? KASIH_IBU_TEMPLATES : TABUNGAN_SAMPAH_TEMPLATES;
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0].id);
  const [selectedRankFilter, setSelectedRankFilter] = useState<'all' | 1 | 2 | 3>('all');
  const [issueDate, setIssueDate] = useState<string>(() => {
    const today = new Date();
    return today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  });
  const [customNarratives, setCustomNarratives] = useState<Record<string, string>>({});
  const [isEditingNarrative, setIsEditingNarrative] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  const activeTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];
  const monthLabel = formatIndonesianMonth(selectedMonth);

  // Ensure we always have 3 slots (Terbaik 1, 2, 3) even if DB has fewer than 3 records in the filtered month
  const displayTop3: TopStudentCertificateData[] = [1, 2, 3].map((r) => {
    const found = topStudents[r - 1];
    if (found) {
      return { ...found, rank: r as 1 | 2 | 3 };
    }
    return {
      rank: r as 1 | 2 | 3,
      name: `[Belum Ada Data Siswa Terbaik ${r}]`,
      nis: '-',
      nisn: '-',
      kelas: selectedClass && selectedClass !== 'Semua Kelas' ? selectedClass : '-',
      points: 0,
      weight: 0,
      savings: 0
    };
  });

  const filteredCertificates = selectedRankFilter === 'all'
    ? displayTop3
    : displayTop3.filter(s => s.rank === selectedRankFilter);

  const handlePrint = (rankToPrint?: 'all' | 1 | 2 | 3) => {
    if (rankToPrint && rankToPrint !== selectedRankFilter) {
      setSelectedRankFilter(rankToPrint);
      setTimeout(() => executePrintWindow(), 120);
    } else {
      executePrintWindow();
    }
  };

  const executePrintWindow = () => {
    if (!printAreaRef.current) return;
    const contentHtml = printAreaRef.current.innerHTML;
    const printWin = window.open('', '_blank', 'width=1200,height=850');
    if (!printWin) {
      window.print();
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Cetak Sertifikat Apresiasi - ${schoolIdentity.schoolName}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 landscape;
              margin: 0mm;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              font-family: 'Plus Jakarta Sans', sans-serif;
            }
            .cert-page {
              width: 297mm;
              height: 210mm;
              page-break-after: always;
              break-after: page;
              position: relative;
              overflow: hidden;
              margin: 0 auto;
            }
            .cert-page:last-child {
              page-break-after: auto;
              break-after: auto;
            }
            .font-cinzel { font-family: 'Cinzel', serif; }
            .font-playfair { font-family: 'Playfair Display', serif; }
          </style>
        </head>
        <body>
          ${contentHtml}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 600);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-start gap-4">
            <div className={`p-3.5 rounded-2xl text-white shadow-lg bg-gradient-to-br ${
              mode === 'kasih_ibu' ? 'from-pink-600 to-rose-600 shadow-pink-500/20' : 'from-emerald-600 to-teal-600 shadow-emerald-500/20'
            }`}>
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                Cetak Sertifikat Apresiasi 3 Siswa Terbaik
                <span className={`text-xs px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                  mode === 'kasih_ibu' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                }`}>
                  {mode === 'kasih_ibu' ? programLabel : 'Tabungan Sampah'}
                </span>
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Pilih 1 dari 5 template sertifikat eksklusif untuk mengapresiasi 3 siswa terbaik pada bulan <strong className="text-slate-700 dark:text-slate-200">{monthLabel}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handlePrint('all')}
              className={`px-5 py-2.5 rounded-xl font-bold text-white shadow-md flex items-center gap-2 transition-all cursor-pointer ${
                mode === 'kasih_ibu'
                  ? 'bg-pink-600 hover:bg-pink-700 shadow-pink-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
              }`}
            >
              <Printer className="w-4 h-4" />
              Cetak 3 Terbaik Sekaligus (A4)
            </button>
          </div>
        </div>

        {/* Filter & Metadata Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-5 border-b border-slate-100 dark:border-slate-700">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Filter Bulan Apresiasi
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold text-sm focus:ring-2 focus:ring-pink-500 outline-none"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Bulan tampil: <strong>{monthLabel}</strong>
            </span>
          </div>

          {onClassChange && classOptions.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Filter Lingkup Kelas
              </label>
              <select
                value={selectedClass || 'Semua Kelas'}
                onChange={(e) => onClassChange(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold text-sm focus:ring-2 focus:ring-pink-500 outline-none"
              >
                <option value="Semua Kelas">Semua Kelas (Sekolah)</option>
                {classOptions.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Menampilkan 3 terbaik dari {selectedClass || 'Semua Kelas'}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" /> Nomor Sertifikat (Konfigurasi)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={certificateNumber || '421.2/    /424.071.505/2026'}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 font-mono text-xs"
              />
              {onGoToConfig && (
                <button
                  onClick={onGoToConfig}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap transition-colors cursor-pointer"
                  title="Ubah Nomor Sertifikat di Tab Konfigurasi"
                >
                  Ubah
                </button>
              )}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Diatur pada tab Konfigurasi menu ini
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" /> Tanggal Terbit & Penandatangan
            </label>
            <input
              type="text"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              placeholder="Contoh: 31 Maret 2026"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-semibold text-sm focus:ring-2 focus:ring-pink-500 outline-none"
            />
            <span className="text-[11px] text-slate-400 mt-1 block truncate" title={`${schoolIdentity.headmasterName} (NIP. ${schoolIdentity.headmasterNIP})`}>
              KS: <strong>{schoolIdentity.headmasterName}</strong> ({schoolIdentity.headmasterNIP})
            </span>
          </div>
        </div>

        {/* 5 Template Selector Cards */}
        <div className="pt-5">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" /> Pilih 1 dari 5 Template Desain & Narasi Sertifikat ({mode === 'kasih_ibu' ? programLabel : 'Tabungan Sampah'})
            </label>
            <button
              onClick={() => setIsEditingNarrative(!isEditingNarrative)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditingNarrative ? 'Tutup Editor Narasi' : 'Kustomisasi Teks Narasi'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {templates.map((tpl) => {
              const isSelected = tpl.id === selectedTemplateId;
              return (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`text-left p-3.5 rounded-2xl border-2 transition-all relative overflow-hidden cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? mode === 'kasih_ibu'
                        ? 'border-pink-600 bg-pink-50/70 dark:bg-pink-950/30 shadow-md'
                        : 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30 shadow-md'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/60'
                  }`}
                >
                  <div>
                    <div className={`h-2 w-full rounded-full bg-gradient-to-r ${tpl.accentColor} mb-2.5`} />
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${tpl.previewBg}`}>
                        {tpl.badgeText}
                      </span>
                      {isSelected && (
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${
                          mode === 'kasih_ibu' ? 'bg-pink-600' : 'bg-emerald-600'
                        }`}>
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-xs text-slate-800 dark:text-white leading-snug mt-1">
                      {tpl.name}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2">
                    {tpl.subtitle}
                  </p>
                </button>
              );
            })}
          </div>

          {isEditingNarrative && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Kustomisasi Narasi untuk Template "{activeTemplate.name}" (Opsional)
                </span>
                {customNarratives[selectedTemplateId] && (
                  <button
                    onClick={() => {
                      const next = { ...customNarratives };
                      delete next[selectedTemplateId];
                      setCustomNarratives(next);
                    }}
                    className="text-xs text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset ke Narasi Default
                  </button>
                )}
              </div>
              <textarea
                rows={2}
                value={
                  customNarratives[selectedTemplateId] !== undefined
                    ? customNarratives[selectedTemplateId]
                    : buildNarrative(selectedTemplateId, displayTop3[0], monthLabel, programLabel)
                }
                onChange={(e) =>
                  setCustomNarratives({
                    ...customNarratives,
                    [selectedTemplateId]: e.target.value
                  })
                }
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-500">
                Catatan: Jika dikosongkan/direset, narasi otomatis menyesuaikan poin/berat tabungan masing-masing juara (Terbaik I, II, dan III) pada bulan {monthLabel}.
              </p>
            </div>
          )}
        </div>

        {/* Top 3 Summary & Quick Individual Print Buttons */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-400" />
              Daftar 3 Siswa Terbaik Bulan {monthLabel}
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedRankFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedRankFilter === 'all'
                    ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                Tampilkan Semua (3 Siswa)
              </button>
              {[1, 2, 3].map((r) => (
                <button
                  key={r}
                  onClick={() => setSelectedRankFilter(r as 1 | 2 | 3)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    selectedRankFilter === r
                      ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  Hanya Terbaik {r === 1 ? 'I' : r === 2 ? 'II' : 'III'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {displayTop3.map((st) => {
              const rankColors =
                st.rank === 1
                  ? 'border-amber-300 bg-amber-50/60 dark:border-amber-700/60 dark:bg-amber-950/20'
                  : st.rank === 2
                  ? 'border-slate-300 bg-slate-50/80 dark:border-slate-600 dark:bg-slate-800/60'
                  : 'border-orange-300 bg-orange-50/50 dark:border-orange-800/50 dark:bg-orange-950/20';

              return (
                <div
                  key={st.rank}
                  className={`p-4 rounded-xl border ${rankColors} flex items-center justify-between gap-3`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl font-black text-base flex items-center justify-center shrink-0 ${
                      st.rank === 1
                        ? 'bg-amber-400 text-amber-950 shadow-sm'
                        : st.rank === 2
                        ? 'bg-slate-300 text-slate-800'
                        : 'bg-orange-300 text-orange-950'
                    }`}>
                      #{st.rank}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Siswa Terbaik {st.rank === 1 ? 'I' : st.rank === 2 ? 'II' : 'III'}
                      </div>
                      <div className="font-bold text-slate-800 dark:text-white text-sm truncate">
                        {st.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {mode === 'kasih_ibu'
                          ? `${st.points ?? 0} Poin Kebiasaan`
                          : `Total Setoran: ${(st.weight ?? 0).toFixed(1)} kg`}
                        {st.kelas && st.kelas !== '-' ? ` • ${st.kelas}` : ''}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePrint(st.rank)}
                    className="p-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 text-slate-700 dark:text-slate-200 shadow-xs shrink-0 cursor-pointer"
                    title={`Cetak Sertifikat Terbaik ${st.rank}`}
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Preview Container (A4 Landscape Aspect Ratio) */}
      <div className="bg-slate-200/70 dark:bg-slate-950/70 rounded-2xl p-4 md:p-8 overflow-x-auto border border-slate-300/80 dark:border-slate-800">
        <div className="max-w-[1122px] mx-auto space-y-8" ref={printAreaRef}>
          {filteredCertificates.map((student) => (
            <SingleCertificateSheet
              key={`${selectedTemplateId}-${student.rank}`}
              mode={mode}
              template={activeTemplate}
              student={student}
              monthLabel={monthLabel}
              programLabel={programLabel}
              certificateNumber={certificateNumber || '421.2/    /424.071.505/2026'}
              issueDate={issueDate}
              schoolIdentity={schoolIdentity}
              customNarrative={customNarratives[selectedTemplateId]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface SingleCertificateSheetProps {
  mode: 'kasih_ibu' | 'tabungan_sampah';
  template: TemplateMeta;
  student: TopStudentCertificateData;
  monthLabel: string;
  programLabel: string;
  certificateNumber: string;
  issueDate: string;
  schoolIdentity: SchoolIdentity;
  customNarrative?: string;
}

function SingleCertificateSheet({
  mode,
  template,
  student,
  monthLabel,
  programLabel,
  certificateNumber,
  issueDate,
  schoolIdentity,
  customNarrative
}: SingleCertificateSheetProps) {
  const rankMeta = getRankLabel(student.rank, mode);
  const narrativeText =
    customNarrative && customNarrative.trim() !== ''
      ? customNarrative
      : buildNarrative(template.id, student, monthLabel, programLabel);

  // Distinct visual styling per template ID
  const getThemeStyles = (id: string) => {
    switch (id) {
      case 'kasih-1':
        return {
          outerBg: 'linear-gradient(135deg, #fff1f2 0%, #ffffff 50%, #fef3c7 100%)',
          outerBorder: '#be123c',
          innerBorder: '#d97706',
          accentPrimary: '#9f1239',
          accentSecondary: '#b45309',
          ribbonBg: 'linear-gradient(90deg, #9f1239, #e11d48, #9f1239)',
          cornerColor: '#be123c',
          emblemTitle: 'KARAKTER MULIA',
          watermarkSvg: 'heart'
        };
      case 'kasih-2':
        return {
          outerBg: 'linear-gradient(135deg, #fefce8 0%, #fffbeb 55%, #fef2f2 100%)',
          outerBorder: '#7c2d12',
          innerBorder: '#ca8a04',
          accentPrimary: '#7c2d12',
          accentSecondary: '#a16207',
          ribbonBg: 'linear-gradient(90deg, #7c2d12, #b45309, #7c2d12)',
          cornerColor: '#9a3412',
          emblemTitle: 'BUDI PEKERTI',
          watermarkSvg: 'star'
        };
      case 'kasih-3':
        return {
          outerBg: 'linear-gradient(135deg, #fdf4ff 0%, #ffffff 50%, #f3e8ff 100%)',
          outerBorder: '#86198f',
          innerBorder: '#c026d3',
          accentPrimary: '#701a75',
          accentSecondary: '#9333ea',
          ribbonBg: 'linear-gradient(90deg, #701a75, #c026d3, #701a75)',
          cornerColor: '#86198f',
          emblemTitle: 'TELADAN UTAMA',
          watermarkSvg: 'heart'
        };
      case 'kasih-4':
        return {
          outerBg: 'linear-gradient(135deg, #fff5f7 0%, #ffffff 50%, #fff0f3 100%)',
          outerBorder: '#db2777',
          innerBorder: '#f472b6',
          accentPrimary: '#9d174d',
          accentSecondary: '#db2777',
          ribbonBg: 'linear-gradient(90deg, #be185d, #ec4899, #be185d)',
          cornerColor: '#db2777',
          emblemTitle: 'KASIH SAYANG',
          watermarkSvg: 'heart'
        };
      case 'kasih-5':
        return {
          outerBg: 'linear-gradient(135deg, #eef2ff 0%, #ffffff 50%, #fef9c3 100%)',
          outerBorder: '#1e1b4b',
          innerBorder: '#ca8a04',
          accentPrimary: '#1e1b4b',
          accentSecondary: '#b45309',
          ribbonBg: 'linear-gradient(90deg, #1e1b4b, #312e81, #1e1b4b)',
          cornerColor: '#ca8a04',
          emblemTitle: '7 KEBIASAAN HEBAT',
          watermarkSvg: 'star'
        };

      // --- TABUNGAN SAMPAH ---
      case 'sampah-1':
        return {
          outerBg: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 50%, #fef3c7 100%)',
          outerBorder: '#065f46',
          innerBorder: '#d97706',
          accentPrimary: '#064e3b',
          accentSecondary: '#047857',
          ribbonBg: 'linear-gradient(90deg, #064e3b, #059669, #064e3b)',
          cornerColor: '#047857',
          emblemTitle: 'PAHLAWAN HIJAU',
          watermarkSvg: 'leaf'
        };
      case 'sampah-2':
        return {
          outerBg: 'linear-gradient(135deg, #f0fdf4 0%, #fffff8 50%, #ecfccb 100%)',
          outerBorder: '#15803d',
          innerBorder: '#65a30d',
          accentPrimary: '#14532d',
          accentSecondary: '#15803d',
          ribbonBg: 'linear-gradient(90deg, #14532d, #16a34a, #14532d)',
          cornerColor: '#15803d',
          emblemTitle: 'DUTA EKOLOGI',
          watermarkSvg: 'leaf'
        };
      case 'sampah-3':
        return {
          outerBg: 'linear-gradient(135deg, #f0fdfa 0%, #ffffff 50%, #ccfbf1 100%)',
          outerBorder: '#0f766e',
          innerBorder: '#14b8a6',
          accentPrimary: '#134e4a',
          accentSecondary: '#0d9488',
          ribbonBg: 'linear-gradient(90deg, #134e4a, #0d9488, #134e4a)',
          cornerColor: '#0f766e',
          emblemTitle: 'ZERO WASTE',
          watermarkSvg: 'recycle'
        };
      case 'sampah-4':
        return {
          outerBg: 'linear-gradient(135deg, #f7fee7 0%, #fffef5 50%, #fef3c7 100%)',
          outerBorder: '#3f6212',
          innerBorder: '#b45309',
          accentPrimary: '#365314',
          accentSecondary: '#4d7c0f',
          ribbonBg: 'linear-gradient(90deg, #365314, #65a30d, #365314)',
          cornerColor: '#3f6212',
          emblemTitle: 'SAHABAT BUMI',
          watermarkSvg: 'leaf'
        };
      case 'sampah-5':
      default:
        return {
          outerBg: 'linear-gradient(135deg, #ecfdf5 0%, #fffbeb 50%, #d1fae5 100%)',
          outerBorder: '#022c22',
          innerBorder: '#ca8a04',
          accentPrimary: '#022c22',
          accentSecondary: '#b45309',
          ribbonBg: 'linear-gradient(90deg, #022c22, #065f46, #022c22)',
          cornerColor: '#ca8a04',
          emblemTitle: 'BINTANG ADIWIYATA',
          watermarkSvg: 'recycle'
        };
    }
  };

  const theme = getThemeStyles(template.id);
  const tempatTerbit = schoolIdentity.nilaiTempatRaport || 'Beji';
  const kabLogo = schoolIdentity.nilaiLogoKabupaten || schoolIdentity.logoKabupaten || '/assets/logo-kab-pasuruan.png';
  const schLogo = schoolIdentity.nilaiLogoSekolah || schoolIdentity.schoolLogo;

  return (
    <div
      className="cert-page shadow-2xl rounded-sm mx-auto select-none"
      style={{
        width: '297mm',
        height: '210mm',
        background: theme.outerBg,
        position: 'relative',
        overflow: 'hidden',
        padding: '10mm',
        boxSizing: 'border-box',
        color: '#0f172a'
      }}
    >
      {/* Decorative Corner Ornaments */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '48mm',
          height: '48mm',
          background: `linear-gradient(135deg, ${theme.outerBorder} 0%, ${theme.innerBorder} 60%, transparent 61%)`,
          opacity: 0.9
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '48mm',
          height: '48mm',
          background: `linear-gradient(225deg, ${theme.outerBorder} 0%, ${theme.innerBorder} 60%, transparent 61%)`,
          opacity: 0.9
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '48mm',
          height: '48mm',
          background: `linear-gradient(45deg, ${theme.outerBorder} 0%, ${theme.innerBorder} 60%, transparent 61%)`,
          opacity: 0.9
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '48mm',
          height: '48mm',
          background: `linear-gradient(315deg, ${theme.outerBorder} 0%, ${theme.innerBorder} 60%, transparent 61%)`,
          opacity: 0.9
        }}
      />

      {/* Outer Frame */}
      <div
        style={{
          width: '100%',
          height: '100%',
          border: `3.5px solid ${theme.outerBorder}`,
          padding: '2.5mm',
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.86)',
          boxSizing: 'border-box'
        }}
      >
        {/* Inner Filigree Frame */}
        <div
          style={{
            width: '100%',
            height: '100%',
            border: `1.5px solid ${theme.innerBorder}`,
            padding: '7mm 12mm',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box'
          }}
        >
          {/* Corner Filigree Squares */}
          {[
            { top: '2mm', left: '2mm' },
            { top: '2mm', right: '2mm' },
            { bottom: '2mm', left: '2mm' },
            { bottom: '2mm', right: '2mm' }
          ].map((pos, idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute',
                ...pos,
                width: '6mm',
                height: '6mm',
                border: `2px solid ${theme.innerBorder}`,
                transform: 'rotate(45deg)'
              }}
            />
          ))}

          {/* Subtle Background Watermark */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              opacity: 0.045
            }}
          >
            {theme.watermarkSvg === 'heart' && (
              <svg width="360" height="360" viewBox="0 0 24 24" fill={theme.outerBorder}>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            )}
            {theme.watermarkSvg === 'star' && (
              <svg width="360" height="360" viewBox="0 0 24 24" fill={theme.outerBorder}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            )}
            {theme.watermarkSvg === 'leaf' && (
              <svg width="360" height="360" viewBox="0 0 24 24" fill={theme.outerBorder}>
                <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66l.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
              </svg>
            )}
            {theme.watermarkSvg === 'recycle' && (
              <svg width="360" height="360" viewBox="0 0 24 24" fill={theme.outerBorder}>
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" />
              </svg>
            )}
          </div>

          {/* TOP HEADER: Logos & 3-Line School Identity */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '20px',
                padding: '0 10px'
              }}
            >
              <div
                style={{
                  width: '84px',
                  height: '84px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {kabLogo && (
                  <img
                    src={kabLogo}
                    alt="Logo Kabupaten Pasuruan"
                    style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                  />
                )}
              </div>

              <div style={{ textAlign: 'center', flex: 1 }}>
                <div
                  style={{
                    fontSize: '15.5px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    color: '#1e293b',
                    textTransform: 'uppercase',
                    lineHeight: 1.25
                  }}
                >
                  {schoolIdentity.kopHeaderLine1 || 'PEMERINTAH KABUPATEN PASURUAN'}
                </div>
                <div
                  style={{
                    fontSize: '17.5px',
                    fontWeight: 800,
                    letterSpacing: '0.14em',
                    color: '#0f172a',
                    textTransform: 'uppercase',
                    lineHeight: 1.25,
                    marginTop: '1px'
                  }}
                >
                  {schoolIdentity.kopHeaderLine2 || 'DINAS PENDIDIKAN'}
                </div>
                <div
                  style={{
                    fontSize: '24px',
                    fontWeight: 900,
                    letterSpacing: '0.07em',
                    color: theme.accentPrimary,
                    textTransform: 'uppercase',
                    lineHeight: 1.2,
                    marginTop: '2px'
                  }}
                >
                  {schoolIdentity.schoolName || 'SDN BAUJENG I BEJI'}
                </div>
              </div>

              <div
                style={{
                  width: '84px',
                  height: '84px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {schLogo && (
                  <img
                    src={schLogo}
                    alt="Logo Sekolah"
                    style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                  />
                )}
              </div>
            </div>

            <div
              style={{
                height: '2.5px',
                background: `linear-gradient(90deg, transparent, ${theme.innerBorder}, ${theme.outerBorder}, ${theme.innerBorder}, transparent)`,
                margin: '8px auto 10px auto',
                width: '92%'
              }}
            />

            {/* Certificate Title & Number */}
            <div style={{ textAlign: 'center' }}>
              <h1
                className="font-cinzel"
                style={{
                  fontSize: '33px',
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  color: theme.accentPrimary,
                  margin: 0,
                  lineHeight: 1.15
                }}
              >
                {template.certTitle}
              </h1>
              <div
                style={{
                  display: 'inline-block',
                  marginTop: '5px',
                  padding: '4px 22px',
                  borderRadius: '999px',
                  background: theme.ribbonBg,
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase'
                }}
              >
                {template.certSubtitle}
              </div>
              <div
                style={{
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: '#334155',
                  marginTop: '5px',
                  fontFamily: 'monospace'
                }}
              >
                Nomor: {certificateNumber}
              </div>
            </div>
          </div>

          {/* CENTER BODY: Recipient & Narrative */}
          <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, margin: '2px 0' }}>
            <div style={{ fontSize: '14px', fontStyle: 'italic', color: '#475569', marginBottom: '4px' }}>
              Sertifikat penghargaan ini diberikan dengan penuh apresiasi kepada:
            </div>

            <div
              className="font-playfair"
              style={{
                fontSize: '36px',
                fontWeight: 800,
                color: theme.accentPrimary,
                letterSpacing: '0.02em',
                borderBottom: `2.5px solid ${theme.innerBorder}`,
                display: 'inline-block',
                padding: '0 32px 5px 32px',
                marginBottom: '6px',
                maxWidth: '90%',
                lineHeight: 1.15
              }}
            >
              {student.name}
            </div>

            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
              {student.kelas && student.kelas !== '-' ? `${student.kelas} • ` : ''}
              {student.nis && student.nis !== '-' ? `NIS: ${student.nis} • ` : ''}
              {student.nisn && student.nisn !== '-' ? `NISN: ${student.nisn}` : ''}
            </div>

            {/* Predicate Badge */}
            <div style={{ marginBottom: '10px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 22px',
                  borderRadius: '8px',
                  backgroundColor: rankMeta.badgeBg,
                  border: `1.5px solid ${rankMeta.badgeBorder}`,
                  color: rankMeta.badgeText,
                  fontSize: '13px',
                  fontWeight: 800,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase'
                }}
              >
                ★ {rankMeta.predicate} — BULAN {monthLabel.toUpperCase()} ★
              </span>
            </div>

            {/* Narrative Paragraph */}
            <p
              style={{
                maxWidth: '86%',
                margin: '0 auto',
                fontSize: '14.5px',
                lineHeight: 1.58,
                color: '#1e293b',
                fontWeight: 500
              }}
            >
              {narrativeText}
            </p>
          </div>

          {/* BOTTOM FOOTER: Achievement Box, Proportional Trophy (Piala) & Principal Signature */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              position: 'relative',
              zIndex: 2,
              marginTop: '4px',
              padding: '0 16px'
            }}
          >
            {/* Left Info Box: Program & Achievement Summary */}
            <div style={{ textAlign: 'left', width: '260px' }}>
              <div
                style={{
                  border: `1.5px solid ${theme.innerBorder}`,
                  borderRadius: '10px',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.92)'
                }}
              >
                <div style={{ fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.accentSecondary }}>
                  {mode === 'kasih_ibu' ? `Program ${programLabel}` : 'Program Tabungan Sampah'}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: theme.accentPrimary, marginTop: '3px' }}>
                  {mode === 'kasih_ibu'
                    ? `Total Skor: ${student.points ?? 0} Poin`
                    : `Total Setoran: ${(student.weight ?? 0).toFixed(1)} Kg`}
                </div>
                <div style={{ fontSize: '11.5px', color: '#475569', fontWeight: 600, marginTop: '2px' }}>
                  Periode Bulan: {monthLabel}
                </div>
              </div>
            </div>

            {/* Center Proportional Golden Trophy (Piala Penghargaan) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
              <div style={{ position: 'relative', width: '96px', height: '102px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="96" height="102" viewBox="0 0 120 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id={`trophyGold-${student.rank}`} x1="20" y1="10" x2="100" y2="95" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#FFFBEB" />
                      <stop offset="28%" stopColor="#FDE047" />
                      <stop offset="65%" stopColor="#EAB308" />
                      <stop offset="100%" stopColor="#A16207" />
                    </linearGradient>
                    <linearGradient id={`trophyBase-${student.rank}`} x1="30" y1="95" x2="90" y2="124" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#78350F" />
                      <stop offset="50%" stopColor="#451A03" />
                      <stop offset="100%" stopColor="#270E02" />
                    </linearGradient>
                  </defs>

                  {/* Left & Right Handles */}
                  <path
                    d="M34 26H20C14.5 26 11 31 12 37.5C13.5 47 22 54 34 55"
                    stroke={`url(#trophyGold-${student.rank})`}
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M86 26H100C105.5 26 109 31 108 37.5C106.5 47 98 54 86 55"
                    stroke={`url(#trophyGold-${student.rank})`}
                    strokeWidth="6"
                    strokeLinecap="round"
                  />

                  {/* Main Trophy Cup */}
                  <path
                    d="M30 16H90V44C90 62 76.5 75 60 75C43.5 75 30 62 30 44V16Z"
                    fill={`url(#trophyGold-${student.rank})`}
                    stroke={theme.outerBorder}
                    strokeWidth="2.5"
                  />

                  {/* Top Rim of Trophy */}
                  <rect
                    x="26"
                    y="11"
                    width="68"
                    height="7"
                    rx="3.5"
                    fill="#FEF08A"
                    stroke={theme.outerBorder}
                    strokeWidth="2"
                  />

                  {/* Trophy Stem & Collar */}
                  <path
                    d="M53 74H67L70 94H50L53 74Z"
                    fill={`url(#trophyGold-${student.rank})`}
                    stroke={theme.outerBorder}
                    strokeWidth="2"
                  />
                  <rect
                    x="42"
                    y="92"
                    width="36"
                    height="6"
                    rx="3"
                    fill="#FACC15"
                    stroke={theme.outerBorder}
                    strokeWidth="2"
                  />

                  {/* Pedestal Base */}
                  <path
                    d="M32 98H88L93 120H27L32 98Z"
                    fill={`url(#trophyBase-${student.rank})`}
                    stroke={theme.innerBorder}
                    strokeWidth="2"
                  />

                  {/* Gold Plaque on Base */}
                  <rect
                    x="35"
                    y="103"
                    width="50"
                    height="12"
                    rx="2"
                    fill="#FEF08A"
                    stroke="#CA8A04"
                    strokeWidth="1"
                  />

                  {/* Star Emblem Inside Cup */}
                  <circle cx="60" cy="43" r="17" fill="#FFFFFF" fillOpacity="0.88" stroke="#CA8A04" strokeWidth="1.5" />
                  <text
                    x="60"
                    y="35"
                    textAnchor="middle"
                    fill="#713F12"
                    fontSize="6.5"
                    fontWeight="800"
                    letterSpacing="0.06em"
                  >
                    TERBAIK
                  </text>
                  <text
                    x="60"
                    y="53"
                    textAnchor="middle"
                    fill={theme.accentPrimary}
                    fontSize="18"
                    fontWeight="900"
                    fontFamily="Cinzel, serif"
                  >
                    {rankMeta.roman}
                  </text>

                  {/* Base Plaque Text */}
                  <text
                    x="60"
                    y="111.5"
                    textAnchor="middle"
                    fill="#422006"
                    fontSize="6.5"
                    fontWeight="900"
                    letterSpacing="0.05em"
                  >
                    {theme.emblemTitle}
                  </text>
                </svg>
              </div>
            </div>

            {/* Right: Principal Signature */}
            <div style={{ textAlign: 'center', width: '260px' }}>
              <div style={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>
                {tempatTerbit}, {issueDate}
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                Kepala {schoolIdentity.schoolName || 'SDN BAUJENG I BEJI'}
              </div>

              <div style={{ height: '54px' }} />

              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#0f172a',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px'
                }}
              >
                {schoolIdentity.headmasterName || 'AKHMAD NASOR, S.Pd'}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginTop: '3px' }}>
                NIP. {schoolIdentity.headmasterNIP || '198704082019031001'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
