import React, { useEffect, useRef, useState } from 'react';
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
import QRCode from 'react-qr-code';
import QRCodeGen from 'qrcode';
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
  autoPrintTrigger?: number;
  onSelectCycle: (cycle: SupervisionCycle) => void;
}

async function loadImageAsDataUrl(url?: string, fallbackUrl?: string): Promise<string | null> {
  const tryLoad = (src: string): Promise<string | null> =>
    new Promise(resolve => {
      if (!src) return resolve(null);
      if (src.startsWith('data:image/')) return resolve(src);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const timeout = setTimeout(() => resolve(null), 3500);
      img.onload = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 200;
          canvas.height = img.naturalHeight || 200;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => {
        clearTimeout(timeout);
        resolve(null);
      };
      img.src = src;
    });

  if (url) {
    const first = await tryLoad(url);
    if (first) return first;
  }
  if (fallbackUrl && fallbackUrl !== url) {
    return await tryLoad(fallbackUrl);
  }
  return null;
}

export default function SupervisiLaporan({
  actor,
  config,
  cycles,
  selectedCycle,
  schoolIdentity,
  initialReportType = 'FULL',
  autoPrintTrigger = 0,
  onSelectCycle
}: SupervisiLaporanProps) {
  const isPrincipal = actor.supervisiRole === 'kepala_sekolah';
  const indicators = config.indicators || DEFAULT_PRIORITY_INDICATORS;
  const activeCycle = selectedCycle || cycles[0] || null;
  const [reportType, setReportType] = useState<ReportDocType>(initialReportType);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const printSheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialReportType) {
      setReportType(initialReportType);
    }
  }, [initialReportType]);

  const resolvedSchoolName =
    schoolIdentity?.schoolName || config?.schoolName || 'SDN BAUJENG I BEJI';
  const resolvedPrincipalName =
    schoolIdentity?.headmasterName ||
    config?.headmasterName ||
    activeCycle?.principal_name ||
    'Kepala Sekolah';
  const resolvedPrincipalNip =
    schoolIdentity?.headmasterNIP ||
    config?.headmasterNIP ||
    activeCycle?.principal_nip ||
    '-';
  const resolvedKabLogoUrl =
    schoolIdentity?.logoKabupaten ||
    config?.logoKabupaten ||
    '/assets/logo-kab-pasuruan.png';
  const resolvedSchoolLogoUrl =
    schoolIdentity?.logo1x1 ||
    schoolIdentity?.schoolLogo ||
    config?.logo1x1 ||
    config?.schoolLogo ||
    '';

  const reportTabs: Array<{ code: ReportDocType; label: string; principalOnly?: boolean }> = [
    { code: 'FULL', label: '5. Laporan Lengkap (A–D)' },
    { code: 'A', label: '1. Form A (Persiapan)' },
    { code: 'B', label: '2. Form B (Observasi)' },
    { code: 'C', label: '3. Form C (Tindak Lanjut)' },
    { code: 'D', label: '4. Form D (Refleksi)' },
    ...(isPrincipal ? [{ code: 'SCHOOL' as ReportDocType, label: '6. Rekap Supervisi Sekolah', principalOnly: true }] : [])
  ];

  // Generate direct PDF using jsPDF + autoTable with DB Logos and Guru/KS Signature Areas
  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const upperSchoolName = resolvedSchoolName.toUpperCase();
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
      const resolvedMotto =
        schoolIdentity?.sloganText ||
        config?.motto ||
        'BERMUTU — Beriman, Ramah, Mandiri, Unggul, Tangguh';

      // Load both Kabupaten and School Logos from DB
      const [kabLogoData, schoolLogoData] = await Promise.all([
        loadImageAsDataUrl(
          resolvedKabLogoUrl,
          'https://upload.wikimedia.org/wikipedia/commons/9/9a/Lambang_Kabupaten_Pasuruan.png'
        ),
        loadImageAsDataUrl(resolvedSchoolLogoUrl, resolvedKabLogoUrl)
      ]);

      // Render Logos in Kop Surat
      if (kabLogoData) {
        try {
          doc.addImage(kabLogoData, 'PNG', 14, 7.5, 19, 19);
        } catch {
          // ignore image format error
        }
      }
      if (schoolLogoData) {
        try {
          doc.addImage(schoolLogoData, 'PNG', pageWidth - 33, 7.5, 19, 19);
        } catch {
          // ignore image format error
        }
      }

      // Header / Kop Surat Text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text(resolvedKopLine1, pageWidth / 2, 11.5, { align: 'center' });
      doc.setFontSize(11.5);
      doc.text(resolvedKopLine2, pageWidth / 2, 16.5, { align: 'center' });
      doc.setFontSize(13.5);
      doc.text(upperSchoolName, pageWidth / 2, 22, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(resolvedAddress, pageWidth / 2, 26, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(resolvedMotto, pageWidth / 2, 29.5, { align: 'center' });
      doc.setLineWidth(0.7);
      doc.line(14, 31.5, pageWidth - 14, 31.5);
      doc.setLineWidth(0.25);
      doc.line(14, 32.4, pageWidth - 14, 32.4);

      if (reportType === 'SCHOOL' && isPrincipal) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11.5);
        doc.text('LAPORAN REKAPITULASI SUPERVISI AKADEMIK SEKOLAH (BISMA +)', pageWidth / 2, 39, { align: 'center' });
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Tahun Ajaran: ${config.tahunPelajaranAktif} | ${config.semesterAktif}`, pageWidth / 2, 44, { align: 'center' });

        autoTable(doc, {
          startY: 48,
          head: [['No', 'Nama Guru', 'NIP', 'Kelas & Mapel', 'Indikator Fokus', 'Tgl Observasi', 'Status Tahap']],
          body: cycles.map((c, idx) => [
            idx + 1,
            c.teacher_name,
            c.teacher_nip || '-',
            `${formatClassLabel(c.grade)} - ${c.subject}`,
            getIndicatorByCode(c.indicator_code, indicators).title,
            formatIndonesianDate(c.confirmed_date || c.proposed_date),
            CYCLE_STATE_META[c.state].shortLabel
          ]),
          styles: { fontSize: 8, cellPadding: 2.5 },
          headStyles: { fillColor: [30, 58, 138] }
        });

        let sigY = (doc as any).lastAutoTable.finalY + 12;
        if (sigY > 235) {
          doc.addPage();
          sigY = 25;
        }
        const rightCenterX = pageWidth - 52;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Beji, ${formatIndonesianDate(new Date().toISOString())}`, rightCenterX, sigY, { align: 'center' });
        doc.text(`Kepala ${resolvedSchoolName},`, rightCenterX, sigY + 5, { align: 'center' });
        // Blank space for manual wet-ink signature
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text(resolvedPrincipalName, rightCenterX, sigY + 28, { align: 'center' });
        const pWidth = doc.getTextWidth(resolvedPrincipalName);
        doc.line(rightCenterX - pWidth / 2, sigY + 28.8, rightCenterX + pWidth / 2, sigY + 28.8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text(`NIP. ${resolvedPrincipalNip}`, rightCenterX, sigY + 33, { align: 'center' });

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
      doc.text(titleMap[reportType], pageWidth / 2, 38.5, { align: 'center' });

      // Teacher & Cycle Identity Table (populated with DB principal & teacher data)
      autoTable(doc, {
        startY: 42,
        theme: 'grid',
        styles: { fontSize: 8.5, cellPadding: 2 },
        body: [
          ['Nama Guru', activeCycle.teacher_name, 'Tahun Ajaran / Semester', `${activeCycle.academic_year} • ${activeCycle.semester}`],
          ['NIP Guru', activeCycle.teacher_nip || '-', 'Kelas / Mata Pelajaran', `${formatClassLabel(activeCycle.grade)} / ${activeCycle.subject}`],
          ['Kepala Sekolah (Supervisor)', `${resolvedPrincipalName} (NIP. ${resolvedPrincipalNip})`, 'Status Siklus', CYCLE_STATE_META[activeCycle.state].label],
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
            ['Referensi RPP / Modul Ajar (Tautan Drive)', pA?.teaching_doc_ref || 'Lihat Bagian V (Bukti Dukung & QR Code)'],
            ['Jadwal & Lokasi Observasi', `${formatIndonesianDate(pA?.confirmed_schedule || pA?.proposed_date)} (${pA?.start_time || '07:30'}-${pA?.end_time || '09:00'} WIB) di ${pA?.location || '-'}`],
            ['Catatan Persetujuan KS', pA?.review_note || 'Belum ditinjau']
          ]
        });
        currentY = (doc as any).lastAutoTable.finalY + 6;
      }

      if ((reportType === 'B' || reportType === 'FULL') && pB) {
        if (currentY > 235) {
          doc.addPage();
          currentY = 18;
        }
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
            ['Saran Langkah Lanjutan (Kepala Sekolah)', pD.suggested_next_steps || '-'],
            ['Status Konfirmasi Akhir', pD.final_confirmation ? `Terkonfirmasi Selesai (${formatIndonesianDate(pD.finalized_at)})` : 'Proses Berjalan']
          ]
        });
        currentY = (doc as any).lastAutoTable.finalY + 6;
      }

      // Bagian V: Tautan Google Drive / URL Bukti Dukung, QR Code & Catatan Tinjauan Kepala Sekolah
      const baseAttachments = (activeCycle.attachments || []).filter(
        a => reportType === 'FULL' || a.form_code === reportType
      );
      const filteredAttachments = [...baseAttachments];
      const docRefTrimmed = (pA?.teaching_doc_ref || '').trim();
      if (
        (reportType === 'FULL' || reportType === 'A') &&
        /^https?:\/\/|drive\.google\.com|docs\.google\.com/i.test(docRefTrimmed)
      ) {
        const normalizedRefUrl = /^https?:\/\//i.test(docRefTrimmed)
          ? docRefTrimmed
          : `https://${docRefTrimmed}`;
        const alreadyExists = filteredAttachments.some(
          a => (a.drive_url || a.link_url || a.download_url || '').trim() === normalizedRefUrl
        );
        if (!alreadyExists) {
          filteredAttachments.unshift({
            id: 'ref-rpp-form-a',
            cycle_id: activeCycle.id,
            form_code: 'A',
            evidence_category: 'RPP / Modul Ajar',
            file_name: 'Referensi RPP / Modul Ajar (Form A)',
            drive_url: normalizedRefUrl,
            link_url: normalizedRefUrl,
            download_url: normalizedRefUrl,
            principal_note: pA?.review_note || '',
            uploaded_by: activeCycle.teacher_name,
            uploaded_at: activeCycle.updated_at
          } as any);
        }
      }

      if (filteredAttachments.length > 0) {
        if (currentY > 220) {
          doc.addPage();
          currentY = 18;
        }
        const qrDataUrls = await Promise.all(
          filteredAttachments.map(async att => {
            const rawUrl = (att.drive_url || att.link_url || att.download_url || '').trim();
            if (!rawUrl) return null;
            try {
              return await QRCodeGen.toDataURL(rawUrl, { width: 160, margin: 1 });
            } catch {
              return null;
            }
          })
        );

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text('BAGIAN V: TAUTAN GOOGLE DRIVE / BUKTI DUKUNG, QR CODE & CATATAN TINJAUAN KS', 14, currentY);
        autoTable(doc, {
          startY: currentY + 2,
          styles: { fontSize: 7.5, cellPadding: 2, valign: 'middle' },
          bodyStyles: { minCellHeight: 22 },
          headStyles: { fillColor: [15, 118, 110], halign: 'center' },
          columnStyles: {
            0: { cellWidth: 16, halign: 'center' },
            1: { cellWidth: 38 },
            2: { cellWidth: 52, textColor: [29, 78, 216] },
            3: { cellWidth: 23, halign: 'center' }
          },
          head: [['Tahap', 'Judul & Kategori Dokumen', 'Tautan Google Drive / URL', 'QR Code', 'Catatan Tinjauan Kepala Sekolah']],
          body: filteredAttachments.map(att => [
            `Form ${att.form_code}`,
            `${att.file_name}\n(${att.evidence_category || 'Bukti Dukung'})`,
            att.drive_url || att.link_url || att.download_url || '-',
            '',
            att.principal_note || 'Belum ada catatan tinjauan'
          ]),
          didDrawCell: data => {
            if (data.section === 'body') {
              const att = filteredAttachments[data.row.index];
              const targetUrl = (att?.drive_url || att?.link_url || att?.download_url || '').trim();
              if (data.column.index === 2 && targetUrl) {
                doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: targetUrl });
              }
              if (data.column.index === 3) {
                const qrImg = qrDataUrls[data.row.index];
                if (qrImg) {
                  const qrSize = 17;
                  const qrX = data.cell.x + (data.cell.width - qrSize) / 2;
                  const qrY = data.cell.y + (data.cell.height - qrSize) / 2;
                  try {
                    doc.addImage(qrImg, 'PNG', qrX, qrY, qrSize, qrSize);
                    if (targetUrl) {
                      doc.link(qrX, qrY, qrSize, qrSize, { url: targetUrl });
                    }
                  } catch {
                    // ignore qr image error
                  }
                }
              }
            }
          }
        });
        currentY = (doc as any).lastAutoTable.finalY + 6;
      }

      // Area Tanda Tangan (TTD) Guru dan Kepala Sekolah sesuai Data DB
      if (currentY > 228) {
        doc.addPage();
        currentY = 22;
      } else {
        currentY += 4;
      }

      const leftCenterX = 52;
      const rightCenterX = pageWidth - 52;
      const signDateStr = formatIndonesianDate(
        activeCycle.completed_at || activeCycle.published_at || activeCycle.updated_at
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);

      // Left Signature Column: Guru yang Disupervisi
      doc.text('Mengetahui / Mengonfirmasi,', leftCenterX, currentY, { align: 'center' });
      doc.text('Guru yang Disupervisi,', leftCenterX, currentY + 4.5, { align: 'center' });
      // Blank space for manual wet-ink signature
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(activeCycle.teacher_name, leftCenterX, currentY + 27.5, { align: 'center' });
      const teacherNameWidth = doc.getTextWidth(activeCycle.teacher_name);
      doc.setLineWidth(0.3);
      doc.line(
        leftCenterX - teacherNameWidth / 2,
        currentY + 28.3,
        leftCenterX + teacherNameWidth / 2,
        currentY + 28.3
      );
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`NIP. ${activeCycle.teacher_nip || '-'}`, leftCenterX, currentY + 32.5, { align: 'center' });

      // Right Signature Column: Kepala Sekolah (Supervisor)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Beji, ${signDateStr}`, rightCenterX, currentY, { align: 'center' });
      doc.text(`Kepala ${resolvedSchoolName},`, rightCenterX, currentY + 4.5, { align: 'center' });
      // Blank space for manual wet-ink signature
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(resolvedPrincipalName, rightCenterX, currentY + 27.5, { align: 'center' });
      const principalNameWidth = doc.getTextWidth(resolvedPrincipalName);
      doc.setLineWidth(0.3);
      doc.line(
        rightCenterX - principalNameWidth / 2,
        currentY + 28.3,
        rightCenterX + principalNameWidth / 2,
        currentY + 28.3
      );
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`NIP. ${resolvedPrincipalNip}`, rightCenterX, currentY + 32.5, { align: 'center' });

      // Add Page Numbers
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(71, 85, 105);
        doc.text(
          `Dokumen Resmi Supervisi Akademik (BISMA +) ${resolvedSchoolName} — Halaman ${i} dari ${totalPages}`,
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
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Dedicated standalone A4 Print Document handler (prints ONLY the formal A4 report document, NOT the web UI)
  const handlePrintStandaloneReport = () => {
    const sheetEl = printSheetRef.current;
    if (!sheetEl) {
      window.print();
      return;
    }

    const docTitle = activeCycle
      ? `Laporan_Supervisi_${activeCycle.teacher_name.replace(/\s+/g, '_')}_${reportType}`
      : `Laporan_Supervisi_${ resolvedSchoolName.replace(/\s+/g, '_') }`;

    const existingIframe = document.getElementById('bisma-supervisi-print-iframe');
    if (existingIframe && existingIframe.parentNode) {
      existingIframe.parentNode.removeChild(existingIframe);
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'bisma-supervisi-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
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
  <title>${docTitle}</title>
  ${styleLinks}
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 14mm 14mm;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #0f172a !important;
      font-family: 'Times New Roman', Times, serif, system-ui, -apple-system, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .bisma-print-sheet {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      background: #ffffff !important;
    }
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    th, td {
      border: 1px solid #334155 !important;
    }
  </style>
</head>
<body>
  <div class="bisma-print-sheet">
    ${sheetEl.innerHTML}
  </div>
</body>
</html>`);
    printDoc.close();

    const triggerPrint = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        window.print();
      }
    };

    const images = Array.from(printDoc.images || []);
    if (images.length === 0) {
      setTimeout(triggerPrint, 250);
    } else {
      let loadedCount = 0;
      let printed = false;
      const checkDone = () => {
        loadedCount += 1;
        if (!printed && loadedCount >= images.length) {
          printed = true;
          setTimeout(triggerPrint, 200);
        }
      };
      images.forEach(img => {
        if (img.complete) {
          checkDone();
        } else {
          img.addEventListener('load', checkDone, { once: true });
          img.addEventListener('error', checkDone, { once: true });
        }
      });
      setTimeout(() => {
        if (!printed) {
          printed = true;
          triggerPrint();
        }
      }, 1500);
    }
  };

  useEffect(() => {
    if (!autoPrintTrigger) return;
    const t = setTimeout(() => {
      handlePrintStandaloneReport();
    }, 350);
    return () => clearTimeout(t);
  }, [autoPrintTrigger]);

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
              disabled={downloadingPdf}
              onClick={handleDownloadPdf}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-extrabold border-b-4 border-emerald-900 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              {downloadingPdf ? 'Menyiapkan PDF...' : 'Unduh PDF Resmi'}
            </button>

            <button
              type="button"
              onClick={handlePrintStandaloneReport}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Cetak Dokumen Laporan (A4)
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
          A4 PORTRAIT PRINTABLE DOCUMENT PREVIEW (STANDALONE READY FOR PRINT OUT)
         ===================================================================== */}
      <div
        ref={printSheetRef}
        className="bg-white text-slate-950 rounded-3xl border-2 border-slate-300 shadow-xl max-w-[210mm] mx-auto p-8 sm:p-10 print:shadow-none print:border-0 print:p-0 text-xs leading-relaxed"
      >
        {/* 1. Official School Header / Letterhead with Kabupaten Pasuruan Logo & School Logo from DB */}
        <div className="pb-4 mb-5 border-b-4 border-double border-slate-900 flex items-center justify-between gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
            <img
              src={resolvedKabLogoUrl}
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
              {resolvedSchoolName}
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
            {resolvedSchoolLogoUrl ? (
              <img
                src={resolvedSchoolLogoUrl}
                alt={`Logo ${resolvedSchoolName}`}
                className="w-14 h-14 sm:w-18 sm:h-18 object-contain"
                onError={e => {
                  (e.currentTarget as HTMLImageElement).src = resolvedKabLogoUrl;
                }}
              />
            ) : (
              <img
                src={resolvedKabLogoUrl}
                alt={`Logo ${resolvedSchoolName}`}
                className="w-14 h-14 sm:w-18 sm:h-18 object-contain"
              />
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
                      <p className="text-[10px] text-slate-600">NIP. {c.teacher_nip || '-'}</p>
                    </td>
                    <td className="border border-slate-400 p-2">{formatClassLabel(c.grade)} • {c.subject}</td>
                    <td className="border border-slate-400 p-2">{getIndicatorByCode(c.indicator_code, indicators).title}</td>
                    <td className="border border-slate-400 p-2">{formatIndonesianDate(c.confirmed_date || c.proposed_date)}</td>
                    <td className="border border-slate-400 p-2 font-bold">{CYCLE_STATE_META[c.state].shortLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Signature Block for School Report */}
            <div className="pt-6 flex justify-end text-center text-[11px] break-inside-avoid">
              <div className="w-72">
                <p className="font-semibold">
                  Beji, {formatIndonesianDate(new Date().toISOString())}
                  <br />
                  Kepala {resolvedSchoolName},
                </p>
                <div className="h-20" />
                <p className="font-extrabold underline">{resolvedPrincipalName}</p>
                <p>NIP. {resolvedPrincipalNip}</p>
              </div>
            </div>
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
                Sistem Supervisi Akademik Reflektif Terintegrasi (BISMA +) • {resolvedSchoolName}
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
                  <td className="border border-slate-400 p-2">{activeCycle.teacher_nip || '-'}</td>
                  <td className="border border-slate-400 p-2 font-bold bg-slate-50">Kelas / Mata Pelajaran</td>
                  <td className="border border-slate-400 p-2">{formatClassLabel(activeCycle.grade)} / {activeCycle.subject}</td>
                </tr>
                <tr>
                  <td className="border border-slate-400 p-2 font-bold bg-slate-50">Supervisor (Kepala Sekolah)</td>
                  <td className="border border-slate-400 p-2">{resolvedPrincipalName} (NIP. {resolvedPrincipalNip})</td>
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
                      <td className="border border-slate-400 p-2 font-bold bg-slate-50">Referensi RPP / Modul Ajar</td>
                      <td className="border border-slate-400 p-2 break-all">
                        {pA?.teaching_doc_ref && /^https?:\/\/|drive\.google\.com|docs\.google\.com/i.test(pA.teaching_doc_ref.trim()) ? (
                          <a
                            href={/^https?:\/\//i.test(pA.teaching_doc_ref.trim()) ? pA.teaching_doc_ref.trim() : `https://${pA.teaching_doc_ref.trim()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-700 hover:text-blue-900 underline font-semibold"
                          >
                            {pA.teaching_doc_ref.trim()}
                          </a>
                        ) : (
                          pA?.teaching_doc_ref || 'Lihat Bagian V (Bukti Dukung & QR Code)'
                        )}
                      </td>
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

            {/* Embedded Drive Links, QR Code & Principal Review Notes */}
            {(() => {
              const baseAtts = (activeCycle.attachments || []).filter(
                a => reportType === 'FULL' || a.form_code === reportType
              );
              const combinedAtts = [...baseAtts];
              const refStr = (pA?.teaching_doc_ref || '').trim();
              if (
                (reportType === 'FULL' || reportType === 'A') &&
                /^https?:\/\/|drive\.google\.com|docs\.google\.com/i.test(refStr)
              ) {
                const normUrl = /^https?:\/\//i.test(refStr) ? refStr : `https://${refStr}`;
                const exists = combinedAtts.some(
                  a => (a.drive_url || a.link_url || a.download_url || '').trim() === normUrl
                );
                if (!exists) {
                  combinedAtts.unshift({
                    id: 'ref-rpp-form-a',
                    cycle_id: activeCycle.id,
                    form_code: 'A',
                    evidence_category: 'RPP / Modul Ajar',
                    file_name: 'Referensi RPP / Modul Ajar (Form A)',
                    drive_url: normUrl,
                    link_url: normUrl,
                    download_url: normUrl,
                    principal_note: pA?.review_note || '',
                    uploaded_by: activeCycle.teacher_name,
                    uploaded_at: activeCycle.updated_at
                  } as any);
                }
              }

              if (combinedAtts.length === 0) return null;

              return (
                <div className="space-y-2">
                  <h3 className="font-extrabold text-xs uppercase bg-slate-100 p-2 border border-slate-400">
                    V. Tautan Google Drive / URL Bukti Dukung, QR Code & Catatan Tinjauan Kepala Sekolah
                  </h3>
                  <table className="w-full border-collapse border border-slate-400 text-[11px]">
                    <thead>
                      <tr className="bg-slate-50 font-bold">
                        <th className="border border-slate-400 p-2 text-center w-14">Tahap</th>
                        <th className="border border-slate-400 p-2 text-left w-1/4">Judul & Kategori Dokumen</th>
                        <th className="border border-slate-400 p-2 text-left w-1/4">Tautan Google Drive / URL</th>
                        <th className="border border-slate-400 p-2 text-center w-24">QR Code</th>
                        <th className="border border-slate-400 p-2 text-left">Catatan Tinjauan Kepala Sekolah</th>
                      </tr>
                    </thead>
                    <tbody>
                      {combinedAtts.map(att => {
                        const url = (att.drive_url || att.link_url || att.download_url || '').trim();
                        return (
                          <tr key={att.id}>
                            <td className="border border-slate-400 p-2 font-bold text-center">Form {att.form_code}</td>
                            <td className="border border-slate-400 p-2">
                              <p className="font-bold">{att.file_name}</p>
                              <p className="text-[10px] text-slate-600">{att.evidence_category}</p>
                            </td>
                            <td className="border border-slate-400 p-2 break-all text-[10px]">
                              {url ? (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-700 hover:text-blue-900 underline font-semibold"
                                >
                                  {url}
                                </a>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="border border-slate-400 p-2 text-center">
                              {url ? (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex flex-col items-center p-1.5 bg-white border border-slate-300 rounded"
                                  title="Scan atau klik untuk membuka dokumen Google Drive"
                                >
                                  <QRCode value={url} size={54} />
                                  <span className="text-[8px] font-bold text-slate-600 mt-1 uppercase tracking-tight">
                                    Scan Drive
                                  </span>
                                </a>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="border border-slate-400 p-2">
                              {att.principal_note || 'Belum ada catatan tinjauan'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            {/* 13. Manual Signatures Area (Guru & Kepala Sekolah sesuai DB) */}
            <div className="pt-6 grid grid-cols-2 gap-8 text-center text-[11px] break-inside-avoid">
              <div>
                <p className="font-semibold">
                  Mengetahui / Mengonfirmasi,
                  <br />
                  Guru yang Disupervisi,
                </p>
                <div className="h-20" />
                <p className="font-extrabold underline">{activeCycle.teacher_name}</p>
                <p>NIP. {activeCycle.teacher_nip || '-'}</p>
              </div>

              <div>
                <p className="font-semibold">
                  Beji, {formatIndonesianDate(activeCycle.completed_at || activeCycle.published_at || activeCycle.updated_at)}
                  <br />
                  Kepala {resolvedSchoolName},
                </p>
                <div className="h-20" />
                <p className="font-extrabold underline">{resolvedPrincipalName}</p>
                <p>NIP. {resolvedPrincipalNip}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
