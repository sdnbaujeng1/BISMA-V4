import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Printer,
  RefreshCw,
  Award,
  TrendingUp,
  BookOpen,
  Users,
  Eye,
  X,
  FileText,
  Filter,
  ChevronRight,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { useSchoolIdentity } from '../hooks/useSchoolIdentity';

interface WeeklyItem {
  weekNumber: number;
  label: string;
  dateRangeLabel: string;
  realisasiJp: number;
  targetJp: number;
  standardTargetJp: number;
  jurnalCount: number;
  persentase: number;
}

interface JournalHistoryItem {
  id: any;
  timestamp: string;
  dateStr: string;
  dayNum: number;
  kelas: string;
  mata_pelajaran: string;
  jam_pembelajaran: string;
  jpCount: number;
  materi: string;
}

interface TeacherRecap {
  nip: string;
  nama_guru: string;
  wali_kelas: string;
  mengajar: string;
  kelas_diampu: string;
  targetJpMinggu: number;
  rataRataJpPerMinggu: number;
  totalRealisasiJpBulan: number;
  totalTargetJpBulan: number;
  totalJurnalBulan: number;
  hariAktifMengisi: number;
  persentaseCapaian: number;
  kategori: 'Sesuai Ekspektasi' | 'Cukup Optimal' | 'Perlu Ditingkatkan' | 'Perlu Pembinaan';
  weeklyBreakdown: WeeklyItem[];
  riwayatJurnal: JournalHistoryItem[];
}

interface RekapResponseData {
  month: string;
  year: number;
  monthNumber: number;
  availableMonths: string[];
  weeks: Array<{
    weekNumber: number;
    label: string;
    dateRangeLabel: string;
    effectiveDaysCount: number;
  }>;
  summary: {
    totalTeachers: number;
    totalTargetJpMingguSekolah: number;
    totalRealisasiJpBulanSekolah: number;
    totalTargetJpBulanSekolah: number;
    rataRataCapaianSekolah: number;
    guruSesuaiTarget: number;
    guruPerluPembinaan: number;
  };
  teachers: TeacherRecap[];
}

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

export default function RekapKinerjaGuruAdmin({
  onBack
}: {
  onBack?: () => void;
}) {
  const schoolIdentity = useSchoolIdentity();
  const now = new Date();
  const defaultMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonthStr);
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<string>('ALL'); // 'ALL' | '1' | '2' | '3' | '4' | '5'
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [rekapData, setRekapData] = useState<RekapResponseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [detailTeacher, setDetailTeacher] = useState<TeacherRecap | null>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const [selectedYearPart, selectedMonthPart] = useMemo(() => {
    const parts = selectedMonth.split('-');
    return [
      parts[0] || String(now.getFullYear()),
      parts[1] || String(now.getMonth() + 1).padStart(2, '0')
    ];
  }, [selectedMonth]);

  const fetchRekap = async (monthParam: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/rekap-kinerja-jp?month=${encodeURIComponent(monthParam)}`);
      const json = await res.json();
      if (json.success && json.data) {
        setRekapData(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch rekap kinerja JP:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRekap(selectedMonth);
  }, [selectedMonth]);

  const formatMonthLabel = (ym: string) => {
    const [y, m] = ym.split('-');
    const mIdx = Number(m) - 1;
    if (mIdx >= 0 && mIdx < 12) {
      return `${MONTH_NAMES[mIdx]} ${y}`;
    }
    return ym;
  };

  // Compute displayed metrics per teacher (supports filtering by specific week or full month)
  const processedTeachers = useMemo(() => {
    if (!rekapData?.teachers) return [];

    return rekapData.teachers
      .map(t => {
        if (selectedWeekFilter === 'ALL') {
          return {
            ...t,
            displayRealisasiJp: t.totalRealisasiJpBulan,
            displayTargetJp: t.totalTargetJpBulan,
            displayRataJpMinggu: t.rataRataJpPerMinggu,
            displayPersentase: t.persentaseCapaian,
            displayKategori: t.kategori
          };
        }

        const weekNum = Number(selectedWeekFilter);
        const wItem = t.weeklyBreakdown.find(w => w.weekNumber === weekNum);
        const realJp = wItem?.realisasiJp || 0;
        const targJp = wItem?.targetJp ?? t.targetJpMinggu;
        const pct = wItem?.persentase || 0;

        let kat: TeacherRecap['kategori'] = 'Perlu Pembinaan';
        if (pct >= 85) kat = 'Sesuai Ekspektasi';
        else if (pct >= 70) kat = 'Cukup Optimal';
        else if (pct >= 40) kat = 'Perlu Ditingkatkan';

        return {
          ...t,
          displayRealisasiJp: realJp,
          displayTargetJp: targJp,
          displayRataJpMinggu: realJp,
          displayPersentase: pct,
          displayKategori: kat
        };
      })
      .filter(t => {
        if (statusFilter !== 'ALL' && t.displayKategori !== statusFilter) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = t.nama_guru.toLowerCase().includes(q);
          const matchNip = t.nip.toLowerCase().includes(q);
          const matchMapel = t.mengajar.toLowerCase().includes(q);
          const matchKelas = t.kelas_diampu.toLowerCase().includes(q);
          return matchName || matchNip || matchMapel || matchKelas;
        }
        return true;
      });
  }, [rekapData, selectedWeekFilter, statusFilter, searchQuery]);

  // Chart data comparing Target JP/Minggu vs Realisasi JP/Minggu
  const chartData = useMemo(() => {
    return processedTeachers.map(t => {
      const shortName =
        t.nama_guru.length > 16 ? `${t.nama_guru.slice(0, 15)}…` : t.nama_guru;
      return {
        name: shortName,
        fullName: t.nama_guru,
        targetJpMinggu: t.targetJpMinggu,
        realisasiJpMinggu: t.displayRataJpMinggu,
        persentase: t.displayPersentase
      };
    });
  }, [processedTeachers]);

  const getBadgeStyle = (kategori: TeacherRecap['kategori']) => {
    switch (kategori) {
      case 'Sesuai Ekspektasi':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700';
      case 'Cukup Optimal':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700';
      case 'Perlu Ditingkatkan':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700';
      default:
        return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700';
    }
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 85) return 'bg-emerald-500';
    if (pct >= 70) return 'bg-blue-500';
    if (pct >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const handlePrintA4 = () => {
    const printEl = printAreaRef.current;
    if (!printEl) {
      window.print();
      return;
    }

    const existingIframe = document.getElementById('rekap-kinerja-jp-print-iframe');
    if (existingIframe && existingIframe.parentNode) {
      existingIframe.parentNode.removeChild(existingIframe);
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'rekap-kinerja-jp-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(el => el.outerHTML)
      .join('\n');

    const printDoc = iframe.contentWindow?.document;
    if (!printDoc || !iframe.contentWindow) {
      window.print();
      return;
    }

    printDoc.open();
    printDoc.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>Rekap_Kinerja_JP_Guru_${selectedMonth}</title>
  ${styleLinks}
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm 12mm;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #0f172a !important;
      font-family: 'Times New Roman', Times, serif, system-ui, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    table {
      width: 100% !important;
      border-collapse: collapse !important;
    }
    th, td {
      border: 1px solid #1e293b !important;
    }
    tr {
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  ${printEl.innerHTML}
</body>
</html>`);
    printDoc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        window.print();
      }
    }, 350);
  };

  const resolvedSchoolName = schoolIdentity.schoolName || 'SDN BAUJENG I BEJI';
  const resolvedPrincipalName = schoolIdentity.headmasterName || 'AKHMAD NASOR, S.Pd';
  const resolvedPrincipalNip = schoolIdentity.headmasterNIP || '198704082019031001';
  const resolvedKabLogo =
    schoolIdentity.logoKabupaten ||
    'https://upload.wikimedia.org/wikipedia/commons/9/9a/Lambang_Kabupaten_Pasuruan.png';
  const resolvedSchoolLogo = schoolIdentity.logo1x1 || schoolIdentity.schoolLogo || resolvedKabLogo;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header & Filter Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-700">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold mb-2">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>MONITORING AKADEMIK & KINERJA GURU</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Rekap Kinerja Guru — Pengisian Capaian Pembelajaran (JP/Minggu)
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Evaluasi keterlaksanaan Jam Pelajaran (JP) per minggu berdasarkan pengisian Jurnal KBM terhadap Jadwal & Hari Efektif Kalender Akademik.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                ← Dashboard
              </button>
            )}
            <button
              type="button"
              onClick={() => fetchRekap(selectedMonth)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Segarkan</span>
            </button>
            <button
              type="button"
              onClick={handlePrintA4}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Rekap A4</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="pt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
          {/* Filter Bulan */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Pilih Bulan
            </label>
            <select
              value={selectedMonthPart}
              onChange={e => setSelectedMonth(`${selectedYearPart}-${e.target.value}`)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {MONTH_NAMES.map((mName, idx) => {
                const mCode = String(idx + 1).padStart(2, '0');
                return (
                  <option key={mCode} value={mCode}>
                    {mName}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Filter Tahun */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Pilih Tahun
            </label>
            <select
              value={selectedYearPart}
              onChange={e => setSelectedMonth(`${e.target.value}-${selectedMonthPart}`)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {['2024', '2025', '2026', '2027'].map(yr => (
                <option key={yr} value={yr}>
                  Tahun {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Minggu ke- */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              Fokus Minggu
            </label>
            <select
              value={selectedWeekFilter}
              onChange={e => setSelectedWeekFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Semua Minggu (Akumulasi Bulan)</option>
              {(rekapData?.weeks || []).map(w => (
                <option key={w.weekNumber} value={String(w.weekNumber)}>
                  {w.label} (Tgl {w.dateRangeLabel})
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status Capaian */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              Status Kinerja
            </label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="Sesuai Ekspektasi">Sesuai Ekspektasi (≥85%)</option>
              <option value="Cukup Optimal">Cukup Optimal (70–84%)</option>
              <option value="Perlu Ditingkatkan">Perlu Ditingkatkan (40–69%)</option>
              <option value="Perlu Pembinaan">Perlu Pembinaan (&lt;40%)</option>
            </select>
          </div>

          {/* Cari Guru */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-indigo-600" />
              Cari Guru / Mapel
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Ketik nama, NIP, mapel..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* Quick Available Months Pills */}
        {rekapData?.availableMonths && rekapData.availableMonths.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Pintasan Bulan:
            </span>
            {rekapData.availableMonths.slice(0, 8).map(ym => {
              const active = ym === selectedMonth;
              return (
                <button
                  key={ym}
                  type="button"
                  onClick={() => setSelectedMonth(ym)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {formatMonthLabel(ym)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Guru & Beban JP
            </p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white">
              {rekapData?.summary.totalTeachers || 0} Guru
            </h3>
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
              Target: {rekapData?.summary.totalTargetJpMingguSekolah || 0} JP / Minggu
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Rata-Rata Capaian ({formatMonthLabel(selectedMonth)})
            </p>
            <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {rekapData?.summary.rataRataCapaianSekolah || 0}%
            </h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              Realisasi: {rekapData?.summary.totalRealisasiJpBulanSekolah || 0} /{' '}
              {rekapData?.summary.totalTargetJpBulanSekolah || 0} JP Bulan Ini
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Mencapai Target (≥80%)
            </p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {rekapData?.summary.guruSesuaiTarget || 0} Guru
            </h3>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
              Disiplin mengisi capaian JP/Minggu
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Perlu Pembinaan (&lt;80%)
            </p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {rekapData?.summary.guruPerluPembinaan || 0} Guru
            </h3>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mt-0.5">
              Belum mencapai target JP/Minggu
            </p>
          </div>
        </div>
      </div>

      {/* Grafik Perbandingan Target JP/Minggu vs Realisasi Rata-Rata JP/Minggu */}
      {!loading && chartData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Grafik Perbandingan Target JP/Minggu vs Realisasi Mengajar Guru ({formatMonthLabel(selectedMonth)})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Perbandingan beban mengajar wajib (JP/Minggu) dengan rata-rata keterisian jurnal capaian pembelajaran per minggu
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-3 h-3 rounded-xs bg-slate-300 dark:bg-slate-600 inline-block" />
                Target Wajib (JP/Minggu)
              </span>
              <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                <span className="w-3 h-3 rounded-xs bg-indigo-600 inline-block" />
                Realisasi (JP/Minggu)
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 35 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                  height={60}
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#475569' }}
                  label={{
                    value: 'Jam Pelajaran (JP)',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fontSize: 11, fill: '#64748b', fontWeight: 700 }
                  }}
                />
                <Tooltip
                  formatter={(value: any, name: string) => [
                    `${value} JP / Minggu`,
                    name === 'targetJpMinggu' ? 'Target Wajib' : 'Realisasi Mengisi'
                  ]}
                  labelFormatter={(label, payload) =>
                    payload?.[0]?.payload?.fullName || label
                  }
                  contentStyle={{
                    borderRadius: '14px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                />
                <Bar
                  dataKey="targetJpMinggu"
                  name="targetJpMinggu"
                  fill="#cbd5e1"
                  radius={[6, 6, 0, 0]}
                  barSize={18}
                />
                <Bar
                  dataKey="realisasiJpMinggu"
                  name="realisasiJpMinggu"
                  radius={[6, 6, 0, 0]}
                  barSize={18}
                >
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={
                        entry.persentase >= 85
                          ? '#10b981'
                          : entry.persentase >= 70
                          ? '#3b82f6'
                          : entry.persentase >= 40
                          ? '#f59e0b'
                          : '#f43f5e'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tabel Utama Rekap Kinerja Guru dalam Mengisi Capaian Pembelajaran JP/Minggu */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Tabel Rekapitulasi Capaian Pembelajaran Guru (JP/Minggu) — {formatMonthLabel(selectedMonth)}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Menampilkan rincian realisasi JP setiap minggu (M1 s.d. M5), rata-rata JP/Minggu, total jurnal terisi, dan persentase ketercapaian.
            </p>
          </div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Menampilkan <span className="text-indigo-600 dark:text-indigo-400">{processedTeachers.length}</span> Guru
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-500">
              Menghitung rekapitulasi capaian pembelajaran JP/Minggu guru...
            </p>
          </div>
        ) : processedTeachers.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
              Tidak Ada Data Guru yang Sesuai Filter
            </h3>
            <p className="text-xs text-slate-500">
              Coba ubah kata kunci pencarian atau pilih kategori status lainnya.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 text-center w-12">No</th>
                  <th className="py-3.5 px-4 min-w-[220px]">Nama Guru & Mapel</th>
                  <th className="py-3.5 px-3 text-center">Target Wajib (JP/Minggu)</th>
                  {(rekapData?.weeks || []).map(w => (
                    <th
                      key={w.weekNumber}
                      className={`py-3.5 px-3 text-center min-w-[92px] ${
                        selectedWeekFilter === String(w.weekNumber)
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                          : ''
                      }`}
                    >
                      <div>M{w.weekNumber}</div>
                      <div className="text-[9px] font-semibold text-slate-400 normal-case">
                        Tgl {w.dateRangeLabel}
                      </div>
                    </th>
                  ))}
                  <th className="py-3.5 px-3 text-center">Rata-Rata (JP/Minggu)</th>
                  <th className="py-3.5 px-3 text-center">Total JP Bulan Ini</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Capaian (%)</th>
                  <th className="py-3.5 px-3 text-center">Predikat Kinerja</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {processedTeachers.map((teacher, idx) => (
                  <tr
                    key={teacher.nip || idx}
                    className="hover:bg-slate-50/90 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {teacher.nama_guru}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        NIP. {teacher.nip || '-'}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {teacher.wali_kelas && teacher.wali_kelas !== '-' && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                            Wali {teacher.wali_kelas}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-[10px] truncate max-w-[200px]">
                          {teacher.mengajar}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs">
                        {teacher.targetJpMinggu} JP
                      </span>
                    </td>

                    {teacher.weeklyBreakdown.map(w => {
                      const isHighlighted = selectedWeekFilter === String(w.weekNumber);
                      const cellColor =
                        w.targetJp === 0
                          ? 'text-slate-400 bg-slate-50 dark:bg-slate-800'
                          : w.persentase >= 80
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300'
                          : w.persentase >= 40
                          ? 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300'
                          : 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300';
                      return (
                        <td
                          key={w.weekNumber}
                          className={`py-3.5 px-2.5 text-center ${
                            isHighlighted ? 'bg-indigo-50/60 dark:bg-indigo-900/20' : ''
                          }`}
                        >
                          <div
                            className={`inline-flex flex-col items-center px-2 py-1 rounded-lg border text-[11px] font-bold ${cellColor}`}
                          >
                            <span>
                              {w.realisasiJp} / {w.targetJp} JP
                            </span>
                            <span className="text-[9px] opacity-80">{w.persentase}%</span>
                          </div>
                        </td>
                      );
                    })}

                    <td className="py-3.5 px-3 text-center">
                      <div className="font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                        {teacher.displayRataJpMinggu} JP
                      </div>
                      <div className="text-[10px] text-slate-400">per minggu</div>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <div className="font-extrabold text-slate-800 dark:text-slate-200">
                        {teacher.displayRealisasiJp} / {teacher.displayTargetJp} JP
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {teacher.totalJurnalBulan} Jurnal • {teacher.hariAktifMengisi} Hari
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                        <span className="text-slate-700 dark:text-slate-200">
                          {teacher.displayPersentase}%
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Target 100%
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                            teacher.displayPersentase
                          )}`}
                          style={{ width: `${Math.min(100, teacher.displayPersentase)}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg border text-[10px] font-extrabold ${getBadgeStyle(
                          teacher.displayKategori
                        )}`}
                      >
                        {teacher.displayKategori}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setDetailTeacher(teacher)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Rincian</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detail Kinerja & Riwayat Pengisian Jurnal Guru */}
      {detailTeacher && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setDetailTeacher(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-3xl max-w-4xl w-full max-h-[88vh] overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-700 to-blue-800 text-white flex items-start justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-white/20 text-[10px] font-extrabold uppercase tracking-wider">
                  RINCIAN CAPAIAN PEMBELAJARAN GURU ({formatMonthLabel(selectedMonth)})
                </span>
                <h3 className="text-xl font-black mt-1">{detailTeacher.nama_guru}</h3>
                <p className="text-xs text-indigo-100 mt-0.5">
                  NIP. {detailTeacher.nip || '-'} • Mapel: {detailTeacher.mengajar} • Target Wajib:{' '}
                  <strong>{detailTeacher.targetJpMinggu} JP/Minggu</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailTeacher(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {/* Rincian Kartu Mingguan */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Capaian Jam Pelajaran (JP) Per Minggu — Bulan {formatMonthLabel(selectedMonth)}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {detailTeacher.weeklyBreakdown.map(w => (
                    <div
                      key={w.weekNumber}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/40"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                          {w.label}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          Tgl {w.dateRangeLabel}
                        </span>
                      </div>
                      <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1.5">
                        {w.realisasiJp} <span className="text-xs font-bold text-slate-400">/ {w.targetJp} JP</span>
                      </div>
                      <div className="mt-2 w-full h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getProgressColor(w.persentase)}`}
                          style={{ width: `${Math.min(100, w.persentase)}%` }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between text-[10px] font-bold text-slate-500">
                        <span>{w.jurnalCount} Jurnal</span>
                        <span>{w.persentase}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabel Riwayat Pengisian Jurnal KBM pada Bulan Terpilih */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Daftar Jurnal & Capaian Pembelajaran yang Diinput ({detailTeacher.riwayatJurnal.length} Entri)
                </h4>
                {detailTeacher.riwayatJurnal.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
                    Belum ada pengisian jurnal pembelajaran pada bulan {formatMonthLabel(selectedMonth)}.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                          <th className="p-3 border-b border-slate-200 dark:border-slate-600 w-10 text-center">No</th>
                          <th className="p-3 border-b border-slate-200 dark:border-slate-600">Tanggal</th>
                          <th className="p-3 border-b border-slate-200 dark:border-slate-600">Kelas</th>
                          <th className="p-3 border-b border-slate-200 dark:border-slate-600">Mata Pelajaran</th>
                          <th className="p-3 border-b border-slate-200 dark:border-slate-600 text-center">Jam Ke (JP)</th>
                          <th className="p-3 border-b border-slate-200 dark:border-slate-600">Materi / Capaian Pembelajaran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {detailTeacher.riwayatJurnal.map((j, i) => (
                          <tr key={j.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                            <td className="p-3 text-center font-bold text-slate-400">{i + 1}</td>
                            <td className="p-3 font-semibold whitespace-nowrap">{j.dateStr}</td>
                            <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                              {j.kelas}
                            </td>
                            <td className="p-3 font-medium">{j.mata_pelajaran}</td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold">
                                Jam {j.jam_pembelajaran} ({j.jpCount} JP)
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-300">{j.materi}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailTeacher(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Standalone Formal A4 Landscape Print Document */}
      <div className="hidden">
        <div ref={printAreaRef} className="p-4 text-slate-950 bg-white">
          {/* Kop Surat Resmi */}
          <div className="pb-3 mb-4 border-b-4 border-double border-slate-900 flex items-center justify-between gap-4">
            <img
              src={resolvedKabLogo}
              alt="Logo Kabupaten Pasuruan"
              style={{ width: '62px', height: '62px', objectFit: 'contain' }}
            />
            <div className="text-center flex-1">
              <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
                PEMERINTAH KABUPATEN PASURUAN
              </div>
              <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase' }}>
                DINAS PENDIDIKAN
              </div>
              <div style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', marginTop: '2px' }}>
                {resolvedSchoolName}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 600 }}>
                {schoolIdentity.schoolAddress || 'Kecamatan Beji, Kabupaten Pasuruan, Provinsi Jawa Timur'}
              </div>
            </div>
            <img
              src={resolvedSchoolLogo}
              alt="Logo Sekolah"
              style={{ width: '62px', height: '62px', objectFit: 'contain' }}
            />
          </div>

          <div className="text-center mb-4">
            <h2 style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', textDecoration: 'underline' }}>
              LAPORAN REKAPITULASI KINERJA GURU DALAM MENGISI CAPAIAN PEMBELAJARAN (JP/MINGGU)
            </h2>
            <p style={{ fontSize: '11px', fontWeight: 700, marginTop: '2px' }}>
              Periode Bulan: {formatMonthLabel(selectedMonth)}{' '}
              {selectedWeekFilter !== 'ALL' ? `• Minggu Ke-${selectedWeekFilter}` : '• Akumulasi Bulanan'}
            </p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 800 }}>
                <th style={{ padding: '6px', textAlign: 'center', width: '28px' }}>No</th>
                <th style={{ padding: '6px', textAlign: 'left' }}>Nama Guru & NIP</th>
                <th style={{ padding: '6px', textAlign: 'left' }}>Tugas / Mata Pelajaran</th>
                <th style={{ padding: '6px', textAlign: 'center' }}>Target Wajib (JP/Minggu)</th>
                {(rekapData?.weeks || []).map(w => (
                  <th key={w.weekNumber} style={{ padding: '6px', textAlign: 'center' }}>
                    M{w.weekNumber} ({w.dateRangeLabel})
                  </th>
                ))}
                <th style={{ padding: '6px', textAlign: 'center' }}>Rata-Rata (JP/Minggu)</th>
                <th style={{ padding: '6px', textAlign: 'center' }}>Total Realisasi Bulan Ini</th>
                <th style={{ padding: '6px', textAlign: 'center' }}>Capaian (%)</th>
                <th style={{ padding: '6px', textAlign: 'center' }}>Predikat Kinerja</th>
              </tr>
            </thead>
            <tbody>
              {processedTeachers.map((t, i) => (
                <tr key={t.nip || i}>
                  <td style={{ padding: '5px', textAlign: 'center' }}>{i + 1}</td>
                  <td style={{ padding: '5px' }}>
                    <div style={{ fontWeight: 800 }}>{t.nama_guru}</div>
                    <div style={{ fontSize: '9px' }}>NIP. {t.nip || '-'}</div>
                  </td>
                  <td style={{ padding: '5px' }}>
                    {t.wali_kelas && t.wali_kelas !== '-' ? `Wali ${t.wali_kelas} • ` : ''}
                    {t.mengajar}
                  </td>
                  <td style={{ padding: '5px', textAlign: 'center', fontWeight: 700 }}>
                    {t.targetJpMinggu} JP
                  </td>
                  {t.weeklyBreakdown.map(w => (
                    <td key={w.weekNumber} style={{ padding: '5px', textAlign: 'center' }}>
                      {w.realisasiJp}/{w.targetJp} JP ({w.persentase}%)
                    </td>
                  ))}
                  <td style={{ padding: '5px', textAlign: 'center', fontWeight: 700 }}>
                    {t.displayRataJpMinggu} JP
                  </td>
                  <td style={{ padding: '5px', textAlign: 'center', fontWeight: 700 }}>
                    {t.displayRealisasiJp} / {t.displayTargetJp} JP ({t.totalJurnalBulan} Jurnal)
                  </td>
                  <td style={{ padding: '5px', textAlign: 'center', fontWeight: 800 }}>
                    {t.displayPersentase}%
                  </td>
                  <td style={{ padding: '5px', textAlign: 'center', fontWeight: 700 }}>
                    {t.displayKategori}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tanda Tangan Kepala Sekolah */}
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', fontSize: '11px' }}>
            <div style={{ width: '260px', textAlign: 'center' }}>
              <div>
                Beji,{' '}
                {new Date().toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
              <div style={{ fontWeight: 700 }}>Kepala {resolvedSchoolName},</div>
              <div style={{ height: '64px' }} />
              <div style={{ fontWeight: 800, textDecoration: 'underline' }}>{resolvedPrincipalName}</div>
              <div>NIP. {resolvedPrincipalNip}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
