import React, { useState } from 'react';
import {
  Printer,
  FileDown,
  FileText,
  CheckCircle2,
  Building2,
  ShieldCheck
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SchoolIdentity } from '../../hooks/useSchoolIdentity';
import {
  SupervisiActor,
  SupervisiConfig,
  SupervisionCycle,
  DEFAULT_PRIORITY_INDICATORS,
  RATING_CATEGORIES,
  CYCLE_STATE_META,
  getIndicatorByCode,
  formatIndonesianDate,
  formatClassLabel
} from './types';

export type ReportDocType = 'A' | 'B' | 'C' | 'D' | 'FULL' | 'SCHOOL';

interface SupervisiLaporanProps {
  actor: SupervisiActor;
  config: SupervisiConfig;
  cycles: SupervisionCycle[];
  selectedCycle: SupervisionCycle | null;
  schoolIdentity: SchoolIdentity;
  initialReportType?: ReportDocType;
  onSelectCycle: (cycle: SupervisionCycle) => void;
}

export default function SupervisiLaporan({
  actor,
  config,
  cycles,
  selectedCycle,
  schoolIdentity,
  initialReportType = 'FULL',
  onSelectCycle
}: SupervisiLaporanProps) {
  const isPrincipal = actor.supervisiRole === 'kepala_sekolah';
  const indicators = config.indicators || DEFAULT_PRIORITY_INDICATORS;
  const activeCycle = selectedCycle || cycles[0] || null;
  const [reportType, setReportType] = useState<ReportDocType>(initialReportType);

  const reportTabs: Array<{ code: ReportDocType; label: string; principalOnly?: boolean }> = [
    { code: 'FULL', label: '5. Laporan Lengkap (A–D)' },
    { code: 'A', label: '1. Form A (Persiapan)' },
    { code: 'B', label: '2. Form B (Observasi)' },
    { code: 'C', label: '3. Form C (Tindak Lanjut)' },
    { code: 'D', label: '4. Form D (Refleksi)' },
    ...(isPrincipal ? [{ code: 'SCHOOL' as ReportDocType, label: '6. Rekap Supervisi Sekolah', principalOnly: true }] : [])
  ];

  // Generate direct PDF using jsPDF + autoTable (Section R)
  const handleDownloadPdf = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const resolvedSchoolName = (schoolIdentity?.schoolName || config?.schoolName || 'SDN BAUJENG I BEJI').toUpperCase();
    const resolvedKopLine1 = (
      schoolIdentity?.kopHeaderLine1 ||
      config?.kopHeaderLine1 ||
      'PEMERINTAH KABUPATEN PASURUAN'
    ).toUpperCase();
    const resolvedKopLine2 = (
      schoolIdentity?.kopHeaderLine2 ||
      config?.kopHeaderLine2 ||
      'DINAS PENDIDIKAN'
    )
      .replace(/\s*DAN\s+KEBUDAYAAN/gi, '')
      .trim()
      .toUpperCase();
    const resolvedAddress =
      schoolIdentity?.schoolAddress ||
      config?.schoolAddress ||
      `${config.subdistrict || 'Kecamatan Beji'}, ${config.district || 'Kabupaten Pasuruan'}, Provinsi ${config.province || 'Jawa Timur'}`;

    // Header / Kop Surat
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(resolvedKopLine1, pageWidth / 2, 12, { align: 'center' });
    doc.setFontSize(12);
    doc.text(resolvedKopLine2, pageWidth / 2, 17, { align: 'center' });
    doc.setFontSize(14);
    doc.text(resolvedSchoolName, pageWidth / 2, 23, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`${resolvedAddress} • BERMUTU`, pageWidth / 2, 27.5, { align: 'center' });
    doc.setLineWidth(0.6);
    doc.line(14, 30, pageWidth - 14, 30);

    if (reportType === 'SCHOOL' && isPrincipal) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('LAPORAN REKAPITULASI SUPERVISI AKADEMIK SEKOLAH (BISMA +)', pageWidth / 2, 37, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Tahun Ajaran: ${config.tahunPelajaranAktif} | ${config.semesterAktif}`, pageWidth / 2, 42, { align: 'center' });

      autoTable(doc, {
        startY: 46,
        head: [['No', 'Nama Guru', 'NIP', 'Kelas & Mapel', 'Indikator Fokus', 'Tgl Observasi', 'Status Tahap']],
        body: cycles.map((c, idx) => [
          idx + 1,
          c.teacher_name,
          c.teacher_nip,
          `${formatClassLabel(c.grade)} - ${c.subject}`,
          getIndicatorByCode(c.indicator_code, indicators).title,
          formatIndonesianDate(c.confirmed_date || c.proposed_date),
          CYCLE_STATE_META[c.state].shortLabel
        ]),
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [30, 58, 138] }
      });

      const cleanYear = (config.tahunPelajaranAktif || '2024-2025').replace(/[^a-zA-Z0-9]/g, '-');
      const cleanSem = (config.semesterAktif || 'Genap').replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`Supervisi_RekapSekolah_${cleanYear}_${cleanSem}.pdf`);
      return;
    }

    if (!activeCycle) return;

    const ind = getIndicatorByCode(activeCycle.indicator_code, indicators);
    const pA = activeCycle.forms?.A?.payload;
    const pB = activeCycle.forms?.B?.payload;
    const pC = activeCycle.forms?.C?.payload;
    const pD = activeCycle.forms?.D?.payload;

    const titleMap: Record<ReportDocType, string> = {
      A: 'FORM A — DISKUSI PERSIAPAN OBSERVASI PEMBELAJARAN',
      B: 'FORM B — HASIL OBSERVASI KINERJA GURU',
      C: 'FORM C — RENCANA TINDAK LANJUT SUPERVISI',
      D: 'FORM D — REFLEKSI DAN EVALUASI TINDAK LANJUT',
      FULL: 'LAPORAN SUPERVISI AKADEMIK REFLEKTIF LENGKAP (BISMA +)',
      SCHOOL: 'REKAP SUPERVISI SEKOLAH'
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(titleMap[reportType], pageWidth / 2, 35, { align: 'center' });

    // Teacher & Cycle Identity Table
    autoTable(doc, {
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2 },
      body: [
        ['Nama Guru', activeCycle.teacher_name, 'Tahun Ajaran / Semester', `${activeCycle.academic_year} • ${activeCycle.semester}`],
        ['NIP Guru', activeCycle.teacher_nip, 'Kelas / Mata Pelajaran', `${formatClassLabel(activeCycle.grade)} / ${activeCycle.subject}`],
        ['Kepala Sekolah (Supervisor)', `${activeCycle.principal_name} (NIP. ${activeCycle.principal_nip})`, 'Status Siklus', CYCLE_STATE_META[activeCycle.state].label],
        ['Indikator Fokus', ind.title, 'Tanggal Observasi', formatIndonesianDate(activeCycle.confirmed_date || activeCycle.proposed_date)]
      ]
    });

    let currentY = (doc as any).lastAutoTable.finalY + 6;

    if (reportType === 'A' || reportType === 'FULL') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('BAGIAN I: PERSIAPAN OBSERVASI (FORM A)', 14, currentY);
      autoTable(doc, {
        startY: currentY + 2,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 64, 175] },
        head: [['Komponen Persiapan', 'Rincian Persiapan Guru & Tinjauan Kepala Sekolah']],
        body: [
          ['Topik Pembelajaran', pA?.topic || 'Belum diisi'],
          ['Tujuan Pembelajaran', (pA?.learning_objectives || []).join('; ') || 'Belum diisi'],
          [
            'Perilaku Sasaran Dipilih',
            ind.behaviors
              .filter(b => (pA?.target_behaviors || []).includes(b.code))
              .map(b => `• ${b.label}`)
              .join('\n') || 'Belum dipilih'
          ],
          ['Upaya Persiapan Guru', pA?.preparation_actions || 'Belum diisi'],
          ['Jadwal & Lokasi Observasi', `${formatIndonesianDate(pA?.confirmed_schedule || pA?.proposed_date)} (${pA?.start_time || '07:30'}-${pA?.end_time || '09:00'} WIB) di ${pA?.location || '-'}`],
          ['Catatan Persetujuan KS', pA?.review_note || 'Belum ditinjau']
        ]
      });
      currentY = (doc as any).lastAutoTable.finalY + 6;
    }

    if ((reportType === 'B' || reportType === 'FULL') && pB) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('BAGIAN II: HASIL OBSERVASI KINERJA KELAS (FORM B)', 14, currentY);
      autoTable(doc, {
        startY: currentY + 2,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [67, 56, 202] },
        head: [['Perilaku Sasaran yang Diamati', 'Kategori Internal (1–3)', 'Bukti Pengamatan Nyata', 'Dampak pada Murid']],
        body: (pB.ratings || []).map(r => [
          r.behavior_label,
          RATING_CATEGORIES.find(c => c.code === r.rating)?.label || String(r.rating),
          r.evidence || '-',
          r.learning_impact || '-'
        ])
      });
      currentY = (doc as any).lastAutoTable.finalY + 3;
      autoTable(doc, {
        startY: currentY,
        styles: { fontSize: 8, cellPadding: 2 },
        body: [
          ['Praktik Baik (Kekuatan)', pB.strengths || '-'],
          ['Area Pengembangan', pB.improvement_areas || '-'],
          ['Rekomendasi Kepala Sekolah', pB.recommendations || '-']
        ]
      });
      currentY = (doc as any).lastAutoTable.finalY + 6;
    }

    if ((reportType === 'C' || reportType === 'FULL') && pC) {
      if (currentY > 235) {
        doc.addPage();
        currentY = 18;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('BAGIAN III: RENCANA TINDAK LANJUT GURU (FORM C)', 14, currentY);
      autoTable(doc, {
        startY: currentY + 2,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [217, 119, 6] },
        head: [['Aspek Rencana Tindak Lanjut', 'Uraian Guru']],
        body: [
          ['Tantangan & Akar Penyebab', `Tantangan: ${pC.challenges || '-'}\nAkar Penyebab: ${pC.root_causes || '-'}`],
          ['Tujuan Perbaikan', (pC.goals || []).join('; ') || '-'],
          ['Langkah Konkret Perbaikan', (pC.action_steps || []).join('; ') || '-'],
          ['Pilihan Sumber Belajar', (pC.learning_sources || []).join(', ') || '-'],
          ['Dukungan & Indikator Keberhasilan', `Dukungan: ${pC.required_support || '-'}\nIndikator: ${(pC.success_indicators || []).join('; ') || '-'}`],
          ['Catatan Tinjauan KS', pC.principal_review_note || '-']
        ]
      });
      currentY = (doc as any).lastAutoTable.finalY + 6;
    }

    if ((reportType === 'D' || reportType === 'FULL') && pD) {
      if (currentY > 225) {
        doc.addPage();
        currentY = 18;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('BAGIAN IV: REFLEKSI, EVALUASI & PEMBINAAN AKHIR (FORM D)', 14, currentY);
      autoTable(doc, {
        startY: currentY + 2,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [126, 34, 206] },
        head: [['Komponen Refleksi & Evaluasi', 'Uraian Refleksi Guru & Umpan Balik Kepala Sekolah']],
        body: [
          ['Inspirasi Baru yang Diperoleh', pD.inspiration || '-'],
          ['Perubahan yang Diterapkan', (pD.actions_implemented || []).join('; ') || '-'],
          ['Kemajuan Praktik & Dampak Murid', `Kemajuan: ${pD.progress || '-'}\nDampak Murid: ${pD.learning_impact || '-'}`],
          ['Tantangan Tersisa & Strategi', `Tantangan: ${pD.remaining_challenges || '-'}\nStrategi: ${pD.improvement_strategy || '-'}`],
          ['Pengakuan Kemajuan (Kepala Sekolah)', pD.recognition_of_progress || '-'],
          ['Umpan Balik Pembinaan (Kepala Sekolah)', pD.coaching_feedback || '-'],
          ['Status Konfirmasi Akhir', pD.final_confirmation ? `Terkonfirmasi Selesai (${formatIndonesianDate(pD.finalized_at)})` : 'Proses Berjalan']
        ]
      });
    }

    // Add Page Numbers
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Dokumen Internal (BISMA +) ${schoolIdentity?.schoolName || config.schoolName} — Halaman ${i} dari ${totalPages}`,
        pageWidth / 2,
        290,
        { align: 'center' }
      );
    }

    // File naming required by Section R: Supervisi_[NamaGuru]_[TahunAjaran]_[Semester].pdf
    const cleanName = activeCycle.teacher_name.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanYear = activeCycle.academic_year.replace(/[^a-zA-Z0-9]/g, '-');
    const cleanSem = activeCycle.semester.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Supervisi_${cleanName}_${cleanYear}_${cleanSem}.pdf`);
  };

  const ind = activeCycle ? getIndicatorByCode(activeCycle.indicator_code, indicators) : indicators[0];
  const pA = activeCycle?.forms?.A?.payload;
  const pB = activeCycle?.forms?.B?.payload;
  const pC = activeCycle?.forms?.C?.payload;
  const pD = activeCycle?.forms?.D?.payload;

  return (
    <div className="space-y-6">
      {/* Control Deck (Hidden in Print) */}
      <div className="no-print bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 border-b-[6px] border-b-emerald-600 p-5 sm:p-6 shadow-[0_14px_28px_-8px_rgba(15,23,42,0.1)] space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-extrabold mb-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>(BISMA +) • PUSAT ARSIP & LAPORAN PDF OTOMATIS (6 FORMAT DOKUMEN A4)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              Cetak & Unduh Dokumen Resmi (BISMA +)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Format Penamaan PDF Otomatis:{' '}
              <code className="font-bold text-slate-800 dark:text-slate-200">
                Supervisi_{(activeCycle?.teacher_name || 'NamaGuru').replace(/\s+/g, '_')}_{activeCycle?.academic_year || '2024-2025'}_{activeCycle?.semester || 'Semester2'}.pdf
              </code>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {cycles.length > 1 && reportType !== 'SCHOOL' && (
              <select
                value={activeCycle?.id || ''}
                onChange={e => {
                  const found = cycles.find(c => c.id === e.target.value);
                  if (found) onSelectCycle(found);
                }}
                className="px-3.5 py-2.5 rounded-xl border-2 border-slate-300 text-xs font-extrabold text-slate-800 bg-slate-50"
              >
                {cycles.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.teacher_name} — {formatClassLabel(c.grade)} ({c.subject})
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold border-b-4 border-emerald-900 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              Unduh PDF Resmi
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Cetak A4 Portrait
            </button>
          </div>
        </div>

        {/* 6 Report Type Selector Buttons in 3D Style */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-4 border-t border-slate-200">
          {reportTabs.map(tab => {
            const active = reportType === tab.code;
            return (
              <button
                key={tab.code}
                type="button"
                onClick={() => setReportType(tab.code)}
                className={`p-3 rounded-2xl border-2 border-b-4 text-xs font-extrabold text-left transition-all cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-blue-700 to-indigo-800 border-blue-500 border-b-indigo-950 text-white shadow-md -translate-y-0.5'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 border-b-slate-300 text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          A4 PORTRAIT PRINTABLE DOCUMENT PREVIEW
         ===================================================================== */}
      <div className="bg-white text-slate-950 rounded-3xl border-2 border-slate-300 shadow-xl max-w-[210mm] mx-auto p-8 sm:p-10 print:shadow-none print:border-0 print:p-0 text-xs leading-relaxed">
        {/* 1. Official School Header / Letterhead with Kabupaten Pasuruan Logo & School Logo from DB */}
        <div className="pb-4 mb-5 border-b-4 border-double border-slate-900 flex items-center justify-between gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
            <img
              src={
                schoolIdentity?.logoKabupaten ||
                config.logoKabupaten ||
                '/assets/logo-kab-pasuruan.png'
              }
              alt="Logo Pemerintah Kabupaten Pasuruan"
              className="w-14 h-14 sm:w-18 sm:h-18 object-contain"
              onError={e => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://upload.wikimedia.org/wikipedia/commons/9/9a/Lambang_Kabupaten_Pasuruan.png';
              }}
            />
          </div>

          <div className="flex-1 text-center space-y-0.5">
            <p className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900">
              {schoolIdentity?.kopHeaderLine1 ||
                config.kopHeaderLine1 ||
                'PEMERINTAH KABUPATEN PASURUAN'}
            </p>
            <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
              {(
                schoolIdentity?.kopHeaderLine2 ||
                config.kopHeaderLine2 ||
                'DINAS PENDIDIKAN'
              )
                .replace(/\s*DAN\s+KEBUDAYAAN/gi, '')
                .trim()}
            </p>
            <h1 className="text-base sm:text-xl font-black uppercase tracking-wide text-slate-950 pt-0.5">
              {schoolIdentity?.schoolName || config.schoolName || 'SDN BAUJENG I BEJI'}
            </h1>
            <p className="text-[11px] font-semibold text-slate-700">
              {schoolIdentity?.schoolAddress ||
                config.schoolAddress ||
                `${config.subdistrict || 'Kecamatan Beji'}, ${config.district || 'Kabupaten Pasuruan'}, Provinsi ${config.province || 'Jawa Timur'}`}
            </p>
            <p className="text-[10px] font-bold text-blue-900">
              {schoolIdentity?.sloganText || config.motto || 'BERMUTU — Beriman, Ramah, Mandiri, Unggul, Tangguh'}
            </p>
          </div>

          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
            {(schoolIdentity?.logo1x1 || schoolIdentity?.schoolLogo || config.logo1x1 || config.schoolLogo) ? (
              <img
                src={
                  schoolIdentity?.logo1x1 ||
                  schoolIdentity?.schoolLogo ||
                  config.logo1x1 ||
                  config.schoolLogo
                }
                alt={`Logo ${schoolIdentity?.schoolName || config.schoolName}`}
                className="w-14 h-14 sm:w-18 sm:h-18 object-contain"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl border border-slate-300 flex items-center justify-center text-[9px] font-bold text-slate-500">
                LOGO SEKOLAH
              </div>
            )}
          </div>
        </div>

        {/* School-Wide Report View (Report 6) */}
        {reportType === 'SCHOOL' ? (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <h2 className="text-sm font-black uppercase underline">
                REKAPITULASI SUPERVISI AKADEMIK SEKOLAH (BISMA +)
              </h2>
              <p className="text-xs font-semibold text-slate-700">
                Tahun Ajaran {config.tahunPelajaranAktif} • {config.semesterAktif}
              </p>
            </div>

            <table className="w-full border-collapse border border-slate-400 text-[11px]">
              <thead>
                <tr className="bg-slate-100 font-extrabold">
                  <th className="border border-slate-400 p-2 text-center">No</th>
                  <th className="border border-slate-400 p-2 text-left">Nama Guru & NIP</th>
                  <th className="border border-slate-400 p-2 text-left">Kelas / Mapel</th>
                  <th className="border border-slate-400 p-2 text-left">Fokus Indikator</th>
                  <th className="border border-slate-400 p-2 text-left">Tanggal Observasi</th>
                  <th className="border border-slate-400 p-2 text-left">Tahap Siklus</th>
                </tr>
              </thead>
              <tbody>
                {cycles.map((c, idx) => (
                  <tr key={c.id}>
                    <td className="border border-slate-400 p-2 text-center">{idx + 1}</td>
                    <td className="border border-slate-400 p-2">
                      <p className="font-bold">{c.teacher_name}</p>
                      <p className="text-[10px] text-slate-600">NIP. {c.teacher_nip}</p>
                    </td>
                    <td className="border border-slate-400 p-2">{formatClassLabel(c.grade)} • {c.subject}</td>
                    <td className="border border-slate-400 p-2">{getIndicatorByCode(c.indicator_code, indicators).title}</td>
                    <td className="border border-slate-400 p-2">{formatIndonesianDate(c.confirmed_date || c.proposed_date)}</td>
                    <td className="border border-slate-400 p-2 font-bold">{CYCLE_STATE_META[c.state].shortLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !activeCycle ? (
          <p className="text-center py-8 text-slate-500">Pilih siklus supervisi terlebih dahulu.</p>
        ) : (
          <div className="space-y-5">
            {/* 2. Application Title & Report Header */}
            <div className="text-center space-y-1">
              <h2 className="text-sm font-black uppercase underline">
                {reportType === 'A'
                  ? 'FORM A — DISKUSI PERSIAPAN OBSERVASI PEMBELAJARAN'
                  : reportType === 'B'
                  ? 'FORM B — HASIL OBSERVASI KINERJA GURU'
                  : reportType === 'C'
                  ? 'FORM C — RENCANA TINDAK LANJUT SUPERVISI AKADEMIK'
                  : reportType === 'D'
                  ? 'FORM D — REFLEKSI DAN EVALUASI TINDAK LANJUT'
                  : 'LAPORAN SUPERVISI AKADEMIK REFLEKTIF LENGKAP (BISMA +)'}
              </h2>
              <p className="text-[11px] font-semibold text-slate-700">
                Sistem Supervisi Akademik Reflektif Terintegrasi (BISMA +) • {schoolIdentity?.schoolName || config.schoolName}
              </p>
            </div>

            {/* 3 & 4. Teacher Identity & Academic Year */}
            <table className="w-full border-collapse border border-slate-400 text-[11px]">
              <tbody>
                <tr>
                  <td className="border border-slate-400 p-2 font-bold bg-slate-50 w-1/4">Nama Guru</td>
                  <td className="border border-slate-400 p-2 font-bold w-1/4">{activeCycle.teacher_name}</td>
                  <td className="border border-slate-400 p-2 font-bold bg-slate-50 w-1/4">Tahun Ajaran / Semester</td>
                  <td className="border border-slate-400 p-2 w-1/4">{activeCycle.academic_year} • {activeCycle.semester}</td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2 font-bold bg-slate-50">NIP Guru</td>
                  <td className="border border-slate-400 p-2">{activeCycle.teacher_nip}</td>
                  <td className="border border-slate-400 p-2 font-bold bg-slate-50">Kelas / Mata Pelajaran</td>
                  <td className="border border-slate-400 p-2">{formatClassLabel(activeCycle.grade)} / {activeCycle.subject}</td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2 font-bold bg-slate-50">Supervisor (Kepala Sekolah)</td>
                  <td className="border border-slate-400 p-2">{activeCycle.principal_name} (NIP. {activeCycle.principal_nip})</td>
                  <td className="border border-slate-400 p-2 font-bold bg-slate-50">Status Siklus</td>
                  <td className="border border-slate-400 p-2 font-bold">{CYCLE_STATE_META[activeCycle.state].shortLabel}</td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2 font-bold bg-slate-50">Indikator Fokus</td>
                  <td className="border border-slate-400 p-2 font-bold" colSpan={3}>{ind.title} ({ind.dimension})</td>
                </tr>
              </tbody>
            </table>

            {/* 5 & 6. Preparation Summary & Target Behaviors (Form A) */}
            {(reportType === 'A' || reportType === 'FULL') && (
              <div className="space-y-2">
                <h3 className="font-extrabold text-xs uppercase bg-slate-100 p-2 border border-slate-400">
                  I. Ringkasan Persiapan Observasi & Perilaku Sasaran (Form A)
                </h3>
                <table className="w-full border-collapse border border-slate-400 text-[11px]">
                  <tbody>
                    <tr>
                      <td className="border border-slate-400 p-2 font-bold bg-slate-50 w-1/3">Topik & Tujuan Pembelajaran</td>
                      <td className="border border-slate-400 p-2">
                        <p className="font-bold">{pA?.topic || 'Belum diisi'}</p>
                        <ul className="list-disc list-inside mt-1">
                          {(pA?.learning_objectives || []).map((o, i) => <li key={i}>{o}</li>)}
                        </ul>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 font-bold bg-slate-50">Perilaku Sasaran yang Dipilih</td>
                      <td className="border border-slate-400 p-2">
                        <ul className="list-disc list-inside">
                          {ind.behaviors
                            .filter(b => (pA?.target_behaviors || []).includes(b.code))
                            .map(b => <li key={b.code}>{b.label}</li>)}
                        </ul>
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 font-bold bg-slate-50">Rencana Upaya Persiapan Guru</td>
                      <td className="border border-slate-400 p-2">{pA?.preparation_actions || 'Belum diisi'}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 font-bold bg-slate-50">Jadwal & Catatan Persetujuan KS</td>
                      <td className="border border-slate-400 p-2">
                        <p>Jadwal: {formatIndonesianDate(pA?.confirmed_schedule || pA?.proposed_date)} ({pA?.start_time || '07:30'}–{pA?.end_time || '09:00'} WIB) di {pA?.location || '-'}</p>
                        {pA?.review_note && <p className="mt-1 font-semibold">Catatan KS: "{pA.review_note}"</p>}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* 7, 8, 9. Observation Evidence, Categories & Principal Feedback (Form B) */}
            {(reportType === 'B' || reportType === 'FULL') && (
              <div className="space-y-2">
                <h3 className="font-extrabold text-xs uppercase bg-slate-100 p-2 border border-slate-400">
                  II. Bukti Pengamatan Kelas, Kategori Perilaku & Umpan Balik (Form B)
                </h3>
                {!pB ? (
                  <p className="p-3 border border-slate-400 italic text-slate-600">
                    Tahap Observasi Kelas (Form B) belum dipublikasikan.
                  </p>
                ) : (
                  <>
                    <table className="w-full border-collapse border border-slate-400 text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 font-bold">
                          <th className="border border-slate-400 p-2 text-left w-1/4">Perilaku Sasaran</th>
                          <th className="border border-slate-400 p-2 text-left w-1/5">Kategori Internal</th>
                          <th className="border border-slate-400 p-2 text-left">Bukti Konkret Pengamatan</th>
                          <th className="border border-slate-400 p-2 text-left w-1/4">Dampak pada Murid</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(pB.ratings || []).map((r, i) => (
                          <tr key={i}>
                            <td className="border border-slate-400 p-2 font-semibold">{r.behavior_label}</td>
                            <td className="border border-slate-400 p-2 font-bold">
                              {RATING_CATEGORIES.find(c => c.code === r.rating)?.label || r.rating}
                            </td>
                            <td className="border border-slate-400 p-2">{r.evidence || '-'}</td>
                            <td className="border border-slate-400 p-2">{r.learning_impact || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <table className="w-full border-collapse border border-slate-400 text-[11px]">
                      <tbody>
                        <tr>
                          <td className="border border-slate-400 p-2 font-bold bg-slate-50 w-1/3">Praktik Baik / Kekuatan</td>
                          <td className="border border-slate-400 p-2">{pB.strengths || '-'}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-400 p-2 font-bold bg-slate-50">Area Pengembangan</td>
                          <td className="border border-slate-400 p-2">{pB.improvement_areas || '-'}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-400 p-2 font-bold bg-slate-50">Rekomendasi Tindak Lanjut KS</td>
                          <td className="border border-slate-400 p-2 font-semibold">{pB.recommendations || '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            )}

            {/* 10. Follow-up Plan (Form C) */}
            {(reportType === 'C' || reportType === 'FULL') && (
              <div className="space-y-2">
                <h3 className="font-extrabold text-xs uppercase bg-slate-100 p-2 border border-slate-400">
                  III. Rencana Tindak Lanjut Pasca Observasi (Form C)
                </h3>
                {!pC ? (
                  <p className="p-3 border border-slate-400 italic text-slate-600">
                    Form C (Rencana Tindak Lanjut) belum dikirimkan.
                  </p>
                ) : (
                  <table className="w-full border-collapse border border-slate-400 text-[11px]">
                    <tbody>
                      <tr>
                        <td className="border border-slate-400 p-2 font-bold bg-slate-50 w-1/3">Tantangan & Akar Penyebab</td>
                        <td className="border border-slate-400 p-2">
                          <p><strong>Tantangan:</strong> {pC.challenges || '-'}</p>
                          <p className="mt-1"><strong>Akar Penyebab:</strong> {pC.root_causes || '-'}</p>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-400 p-2 font-bold bg-slate-50">Tujuan & Langkah Konkret Perbaikan</td>
                        <td className="border border-slate-400 p-2">
                          <p className="font-bold">Tujuan:</p>
                          <ul className="list-disc list-inside mb-1.5">
                            {(pC.goals || []).map((g, i) => <li key={i}>{g}</li>)}
                          </ul>
                          <p className="font-bold">Langkah Konkret:</p>
                          <ul className="list-disc list-inside">
                            {(pC.action_steps || []).map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-400 p-2 font-bold bg-slate-50">Pilihan Belajar & Dukungan</td>
                        <td className="border border-slate-400 p-2">
                          <p><strong>Pilihan Belajar:</strong> {(pC.learning_sources || []).join(', ') || '-'}</p>
                          <p className="mt-1"><strong>Dukungan Dibutuhkan:</strong> {pC.required_support || '-'}</p>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-400 p-2 font-bold bg-slate-50">Indikator Keberhasilan</td>
                        <td className="border border-slate-400 p-2">
                          <ul className="list-disc list-inside">
                            {(pC.success_indicators || []).map((si, i) => <li key={i}>{si}</li>)}
                          </ul>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* 11 & 12. Reflection, Evaluation & Conclusion (Form D) */}
            {(reportType === 'D' || reportType === 'FULL') && (
              <div className="space-y-2">
                <h3 className="font-extrabold text-xs uppercase bg-slate-100 p-2 border border-slate-400">
                  IV. Refleksi, Evaluasi Dampak & Kesimpulan Pembinaan Akhir (Form D)
                </h3>
                {!pD ? (
                  <p className="p-3 border border-slate-400 italic text-slate-600">
                    Form D (Refleksi dan Evaluasi Tindak Lanjut) belum dikirimkan.
                  </p>
                ) : (
                  <table className="w-full border-collapse border border-slate-400 text-[11px]">
                    <tbody>
                      <tr>
                        <td className="border border-slate-400 p-2 font-bold bg-slate-50 w-1/3">Inspirasi Baru & Tindakan Diterapkan</td>
                        <td className="border border-slate-400 p-2">
                          <p>{pD.inspiration || '-'}</p>
                          <ul className="list-disc list-inside mt-1">
                            {(pD.actions_implemented || []).map((a, i) => <li key={i}>{a}</li>)}
                          </ul>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-400 p-2 font-bold bg-slate-50">Kemajuan Praktik & Dampak pada Murid</td>
                        <td className="border border-slate-400 p-2">
                          <p><strong>Kemajuan Mengajar:</strong> {pD.progress || '-'}</p>
                          <p className="mt-1"><strong>Dampak Positif Murid:</strong> {pD.learning_impact || '-'}</p>
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-400 p-2 font-bold bg-slate-50">Pengakuan Kemajuan & Umpan Balik KS</td>
                        <td className="border border-slate-400 p-2">
                          <p><strong>Pengakuan Kemajuan:</strong> {pD.recognition_of_progress || 'Menunggu tinjauan Kepala Sekolah'}</p>
                          <p className="mt-1"><strong>Coaching Feedback:</strong> {pD.coaching_feedback || '-'}</p>
                          {pD.suggested_next_steps && <p className="mt-1"><strong>Saran Lanjutan:</strong> {pD.suggested_next_steps}</p>}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Embedded Drive Links & Principal Review Notes */}
            {(activeCycle.attachments || []).length > 0 && (
              <div className="space-y-2">
                <h3 className="font-extrabold text-xs uppercase bg-slate-100 p-2 border border-slate-400">
                  V. Tautan Google Drive / URL Bukti Dukung & Catatan Tinjauan Kepala Sekolah
                </h3>
                <table className="w-full border-collapse border border-slate-400 text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 font-bold">
                      <th className="border border-slate-400 p-2 text-left w-16">Tahap</th>
                      <th className="border border-slate-400 p-2 text-left w-1/4">Judul & Kategori Dokumen</th>
                      <th className="border border-slate-400 p-2 text-left w-1/3">Tautan Google Drive / URL</th>
                      <th className="border border-slate-400 p-2 text-left">Catatan Tinjauan Kepala Sekolah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeCycle.attachments || [])
                      .filter(a => reportType === 'FULL' || a.form_code === reportType)
                      .map(att => (
                        <tr key={att.id}>
                          <td className="border border-slate-400 p-2 font-bold text-center">Form {att.form_code}</td>
                          <td className="border border-slate-400 p-2">
                            <p className="font-bold">{att.file_name}</p>
                            <p className="text-[10px] text-slate-600">{att.evidence_category}</p>
                          </td>
                          <td className="border border-slate-400 p-2 break-all text-[10px] text-blue-800">
                            {att.drive_url || att.download_url || '-'}
                          </td>
                          <td className="border border-slate-400 p-2">
                            {att.principal_note || 'Belum ada catatan tinjauan'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 13. Digital Confirmation & Signatures Record (No Fabricated Handwritten Signatures) */}
            <div className="pt-6 grid grid-cols-2 gap-8 text-center text-[11px] break-inside-avoid">
              <div className="space-y-2">
                <p className="font-semibold">Guru yang Disupervisi,</p>
                <div className="py-3 px-4 rounded-xl border border-slate-300 bg-slate-50 inline-block my-1">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase">
                    ✓ Konfirmasi Digital (BISMA +)
                  </p>
                  <p className="text-[9px] text-slate-500">
                    Tercatat: {formatIndonesianDate(activeCycle.forms?.A?.submitted_at || activeCycle.updated_at)}
                  </p>
                </div>
                <p className="font-extrabold underline">{activeCycle.teacher_name}</p>
                <p>NIP. {activeCycle.teacher_nip}</p>
              </div>

              <div className="space-y-2">
                <p className="font-semibold">
                  Beji, {formatIndonesianDate(activeCycle.completed_at || activeCycle.published_at || activeCycle.updated_at)}
                  <br />
                  Kepala {schoolIdentity?.schoolName || config.schoolName} (Supervisor),
                </p>
                <div className="py-3 px-4 rounded-xl border border-slate-300 bg-slate-50 inline-block my-1">
                  <p className="text-[10px] font-bold text-blue-900 uppercase">
                    {activeCycle.state === 'completed'
                      ? '✓ Disahkan & Difinalisasi Kepala Sekolah'
                      : '✓ Diverifikasi Sistem Internal (BISMA +)'}
                  </p>
                  <p className="text-[9px] text-slate-500">
                    Tercatat: {formatIndonesianDate(activeCycle.completed_at || activeCycle.published_at || activeCycle.updated_at)}
                  </p>
                </div>
                <p className="font-extrabold underline">{schoolIdentity?.headmasterName || activeCycle.principal_name}</p>
                <p>NIP. {schoolIdentity?.headmasterNIP || activeCycle.principal_nip}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
