import React, { useEffect, useRef, useState } from 'react';
import {
  FileText,
  Sparkles,
  Save,
  Send,
  Printer,
  ArrowLeft,
  ArrowRight,
  Lock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import {
  SupervisiActor,
  SupervisiConfig,
  SupervisionCycle,
  FormCPayload,
  DEFAULT_PRIORITY_INDICATORS,
  LEARNING_SOURCE_OPTIONS,
  RATING_CATEGORIES,
  getIndicatorByCode,
  formatIndonesianDate,
  formatClassLabel
} from './types';
import DriveLinkSection from './DriveLinkSection';

interface SupervisiHasilProps {
  actor: SupervisiActor;
  config: SupervisiConfig;
  cycles: SupervisionCycle[];
  selectedCycle: SupervisionCycle | null;
  onSelectCycle: (cycle: SupervisionCycle) => void;
  onSaveFormC: (
    cycleId: string,
    payload: Partial<FormCPayload>,
    action: 'save_draft' | 'submit' | 'principal_review',
    opts?: { silent?: boolean }
  ) => Promise<void>;
  onUploadAttachment?: (params: {
    cycle_id: string;
    form_code: 'A' | 'B' | 'C' | 'D';
    file_name: string;
    mime_type?: string;
    base64_data?: string;
    drive_url?: string;
    link_url?: string;
    evidence_category: string;
  }) => Promise<void>;
  onSaveAttachmentNote?: (
    params: {
      cycle_id: string;
      attachment_id: string;
      principal_note: string;
      link_url?: string;
      drive_url?: string;
    },
    opts?: { silent?: boolean }
  ) => Promise<void>;
  onDeleteAttachment?: (params: {
    cycle_id: string;
    attachment_id: string;
  }) => Promise<void>;
  onNavigatePage: (pageId: string, cycle?: SupervisionCycle) => void;
  onOpenPrintReport: (reportType: 'A' | 'B' | 'C' | 'D' | 'FULL' | 'SCHOOL', cycle?: SupervisionCycle) => void;
}

const FORM_C_PAGES = [
  { step: 1, title: 'Lembar 1: Temuan Observasi & Akar Tantangan (Q1–Q3)', short: '1. Tantangan & Akar' },
  { step: 2, title: 'Lembar 2: Tujuan, Langkah & Pilihan Belajar (Q4–Q6)', short: '2. Tujuan & Langkah' },
  { step: 3, title: 'Lembar 3: Dukungan, Indikator & Pengiriman (Q7–Q8)', short: '3. Indikator & Kirim' }
];

export default function SupervisiHasil({
  actor,
  config,
  cycles,
  selectedCycle,
  onSelectCycle,
  onSaveFormC,
  onUploadAttachment,
  onSaveAttachmentNote,
  onDeleteAttachment,
  onNavigatePage,
  onOpenPrintReport
}: SupervisiHasilProps) {
  const isPrincipal = actor.supervisiRole === 'kepala_sekolah';
  const indicators = config.indicators || DEFAULT_PRIORITY_INDICATORS;
  const activeCycle = selectedCycle || cycles[0] || null;

  const [pageStep, setPageStep] = useState<number>(1);
  const [saving, setSaving] = useState<boolean>(false);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiNotice, setAiNotice] = useState<string>('');
  const [pendingDrive, setPendingDrive] = useState<{ title: string; url: string; category: string }>({
    title: '',
    url: '',
    category: 'Revisi RPP / Modul Ajar Pasca Observasi'
  });
  const isHydratedRef = useRef<boolean>(false);

  // Form C fields
  const [challenges, setChallenges] = useState('');
  const [rootCauses, setRootCauses] = useState('');
  const [practicesToImprove, setPracticesToImprove] = useState('');
  const [goalsText, setGoalsText] = useState('');
  const [actionStepsText, setActionStepsText] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [learningSources, setLearningSources] = useState<string[]>([]);
  const [requiredSupport, setRequiredSupport] = useState('');
  const [successIndicatorsText, setSuccessIndicatorsText] = useState('');
  const [principalReviewNote, setPrincipalReviewNote] = useState('');

  useEffect(() => {
    if (!activeCycle) return;
    isHydratedRef.current = false;
    const p = activeCycle.forms?.C?.payload;
    let cached: Partial<FormCPayload> | null = null;
    try {
      const raw = localStorage.getItem(`bisma_supervisi_draft_${activeCycle.id}_C`);
      if (raw) cached = JSON.parse(raw);
    } catch {
      cached = null;
    }

    setChallenges(cached?.challenges || p?.challenges || '');
    setRootCauses(cached?.root_causes || p?.root_causes || '');
    setPracticesToImprove(
      cached?.practices_to_improve ||
        p?.practices_to_improve ||
        activeCycle.forms?.B?.payload?.improvement_areas ||
        ''
    );
    const resolvedGoals = cached?.goals?.length ? cached.goals : p?.goals || [];
    setGoalsText(resolvedGoals.join('\n'));
    const resolvedSteps = cached?.action_steps?.length ? cached.action_steps : p?.action_steps || [];
    setActionStepsText(resolvedSteps.join('\n'));
    setTargetDate(
      cached?.target_date ||
        p?.target_date ||
        new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
    );
    setLearningSources(
      cached?.learning_sources?.length
        ? cached.learning_sources
        : p?.learning_sources?.length
        ? p.learning_sources
        : ['Komunitas Belajar Guru (Kombel / KKG)', 'Praktik Mandiri & Eksperimen di Kelas']
    );
    setRequiredSupport(cached?.required_support || p?.required_support || '');
    const resolvedIndicators = cached?.success_indicators?.length
      ? cached.success_indicators
      : p?.success_indicators || [];
    setSuccessIndicatorsText(resolvedIndicators.join('\n'));
    setPrincipalReviewNote(cached?.principal_review_note || p?.principal_review_note || '');

    setTimeout(() => {
      isHydratedRef.current = true;
    }, 80);
  }, [activeCycle?.id]);

  // Auto-save Form C notes to localStorage & DB so manual/API notes never disappear on Back or Refresh
  useEffect(() => {
    if (!activeCycle || !isHydratedRef.current || activeCycle.state === 'completed') return;
    const payloadToSave: Partial<FormCPayload> & Record<string, any> = {
      challenges,
      root_causes: rootCauses,
      practices_to_improve: practicesToImprove,
      goals: goalsText.split('\n').map(s => s.trim()).filter(Boolean),
      action_steps: actionStepsText.split('\n').map(s => s.trim()).filter(Boolean),
      target_date: targetDate,
      learning_sources: learningSources,
      required_support: requiredSupport,
      success_indicators: successIndicatorsText.split('\n').map(s => s.trim()).filter(Boolean),
      principal_review_note: principalReviewNote,
      ...(pendingDrive.url.trim()
        ? {
            pending_drive_url: pendingDrive.url.trim(),
            pending_drive_title: pendingDrive.title.trim(),
            pending_drive_category: pendingDrive.category
          }
        : {})
    };
    try {
      localStorage.setItem(`bisma_supervisi_draft_${activeCycle.id}_C`, JSON.stringify(payloadToSave));
    } catch {
      // ignore storage quota errors
    }

    const timer = setTimeout(() => {
      onSaveFormC(activeCycle.id, payloadToSave, 'save_draft', { silent: true }).catch(() => {});
    }, 900);
    return () => clearTimeout(timer);
  }, [
    activeCycle?.id,
    challenges,
    rootCauses,
    practicesToImprove,
    goalsText,
    actionStepsText,
    targetDate,
    learningSources,
    requiredSupport,
    successIndicatorsText,
    principalReviewNote,
    pendingDrive.url
  ]);

  if (!activeCycle) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 border-b-[6px] border-b-slate-300 p-8 text-center">
        <p className="text-sm font-bold text-slate-600 mb-4">
          Pilih siklus supervisi terlebih dahulu di halaman Dashboard.
        </p>
        <button
          onClick={() => onNavigatePage('dashboard')}
          className="px-5 py-2.5 rounded-xl bg-blue-700 text-white text-xs font-extrabold border-b-4 border-blue-950 cursor-pointer"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  // Prerequisite Rule TEST 06: Form C available only after Form B is published!
  const isFormBPublished =
    activeCycle.forms?.B?.status === 'published' ||
    activeCycle.forms?.B?.status === 'finalized' ||
    Boolean(activeCycle.forms?.B?.payload?.is_published);

  if (!isFormBPublished) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-amber-200 border-b-[7px] border-b-amber-600 p-8 text-center shadow-[0_16px_32px_-10px_rgba(217,119,6,0.18)] max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border-b-4 border-amber-200 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 text-xs font-extrabold uppercase">
          PRASYARAT TAHAP BELUM TERPENUHI
        </span>
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-3 mb-2">
          Form C (Rencana Tindak Lanjut) Belum Dapat Dibuka
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          Rencana Tindak Lanjut (Form C) hanya dapat diisi setelah Kepala Sekolah menyelesaikan observasi kelas dan mempublikasikan Hasil Observasi (Form B).
        </p>
        <button
          onClick={() => onNavigatePage(isPrincipal ? 'ks_obs' : 'form_b', activeCycle)}
          className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold border-b-4 border-amber-900 inline-flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Ke Halaman Observasi (Form B)
        </button>
      </div>
    );
  }

  const currentIndicator = getIndicatorByCode(activeCycle.indicator_code, indicators);
  const formCStatus = activeCycle.forms?.C?.status || 'draft';
  const isCycleCompleted = activeCycle.state === 'completed';
  const formBData = activeCycle.forms?.B?.payload;

  const toggleLearningSource = (src: string) => {
    if (isCycleCompleted) return;
    setLearningSources(prev =>
      prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]
    );
  };

  const buildPayload = (): Partial<FormCPayload> & Record<string, any> => ({
    challenges,
    root_causes: rootCauses,
    practices_to_improve: practicesToImprove,
    goals: goalsText.split('\n').map(s => s.trim()).filter(Boolean),
    action_steps: actionStepsText.split('\n').map(s => s.trim()).filter(Boolean),
    target_date: targetDate,
    learning_sources: learningSources,
    required_support: requiredSupport,
    success_indicators: successIndicatorsText.split('\n').map(s => s.trim()).filter(Boolean),
    principal_review_note: principalReviewNote,
    ...(pendingDrive.url.trim()
      ? {
          pending_drive_url: pendingDrive.url.trim(),
          pending_drive_title: pendingDrive.title.trim(),
          pending_drive_category: pendingDrive.category
        }
      : {})
  });

  const handleAction = async (action: 'save_draft' | 'submit' | 'principal_review') => {
    setSaving(true);
    try {
      const payload = buildPayload();
      try {
        localStorage.setItem(`bisma_supervisi_draft_${activeCycle.id}_C`, JSON.stringify(payload));
      } catch {
        // ignore
      }
      await onSaveFormC(activeCycle.id, payload, action);
    } finally {
      setSaving(false);
    }
  };

  const handleAskAiAssistant = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/supervisi/ai-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor,
          cycle_id: activeCycle.id,
          cycle: activeCycle,
          attachments: activeCycle.attachments || [],
          link_url: pendingDrive.url,
          stage: 'Form C — Rencana Tindak Lanjut Pasca Observasi',
          indicator_title: currentIndicator.title,
          target_behaviors: (formBData?.ratings || []).map(r => r.behavior_label),
          context_notes: `Area pengembangan dari KS: ${formBData?.improvement_areas || ''}. Rekomendasi KS: ${formBData?.recommendations || ''}. Tantangan guru: ${challenges}`
        })
      });
      const json = await res.json();
      if (json.success && json.suggestions) {
        setAiNotice(
          json.notice ||
            'Isian otomatis Form C berhasil disusun menggunakan API tertanam berdasarkan data observasi & tautan bukti dukung.'
        );
        const nextChallenges = challenges.trim()
          ? challenges
          : formBData?.improvement_areas ||
            `Pengelolaan waktu diskusi kelompok dan pemerataan partisipasi aktif seluruh murid pada ${formatClassLabel(activeCycle.grade)} (${activeCycle.subject}).`;
        const nextRootCauses = rootCauses.trim()
          ? rootCauses
          : 'Pembagian peran di dalam kelompok belum terstruktur secara spesifik dan panduan waktu pengerjaan LKPD belum ditampilkan secara visual di depan kelas.';
        const nextPractices = practicesToImprove.trim()
          ? practicesToImprove
          : formBData?.recommendations ||
            `Meningkatkan kualitas fasilitasi diskusi kelompok dan umpan balik konstruktif sesuai indikator ${currentIndicator.title}.`;
        const nextGoalsText =
          Array.isArray(json.suggestions.goals) && !goalsText.trim()
            ? json.suggestions.goals.join('\n')
            : goalsText;
        const nextActionStepsText =
          Array.isArray(json.suggestions.action_steps) && !actionStepsText.trim()
            ? json.suggestions.action_steps.join('\n')
            : actionStepsText;
        const nextSuccessIndicatorsText =
          Array.isArray(json.suggestions.success_indicators) && !successIndicatorsText.trim()
            ? json.suggestions.success_indicators.join('\n')
            : successIndicatorsText;
        const nextRequiredSupport = requiredSupport.trim()
          ? requiredSupport
          : 'Dukungan berbagi praktik baik bersama rekan sejawat di Komunitas Belajar (Kombel / KKG) serta pendampingan reflektif Kepala Sekolah.';
        const nextPrincipalReviewNote =
          isPrincipal && !principalReviewNote.trim()
            ? `Rencana Tindak Lanjut (Form C) yang disusun oleh ${activeCycle.teacher_name} telah spesifik, realistis, dan menjawab langsung temuan observasi kelas pada ${formatClassLabel(activeCycle.grade)}. Kepala Sekolah mendukung penuh implementasi perbaikan ini.`
            : principalReviewNote;

        setChallenges(nextChallenges);
        setRootCauses(nextRootCauses);
        setPracticesToImprove(nextPractices);
        setGoalsText(nextGoalsText);
        setActionStepsText(nextActionStepsText);
        setSuccessIndicatorsText(nextSuccessIndicatorsText);
        setRequiredSupport(nextRequiredSupport);
        if (isPrincipal) setPrincipalReviewNote(nextPrincipalReviewNote);

        // Immediately save API-generated notes to localStorage & DB so they never disappear on Back or Refresh
        const immediatePayload: Partial<FormCPayload> = {
          challenges: nextChallenges,
          root_causes: nextRootCauses,
          practices_to_improve: nextPractices,
          goals: nextGoalsText.split('\n').map(s => s.trim()).filter(Boolean),
          action_steps: nextActionStepsText.split('\n').map(s => s.trim()).filter(Boolean),
          target_date: targetDate,
          learning_sources: learningSources,
          required_support: nextRequiredSupport,
          success_indicators: nextSuccessIndicatorsText.split('\n').map(s => s.trim()).filter(Boolean),
          principal_review_note: nextPrincipalReviewNote
        };
        try {
          localStorage.setItem(`bisma_supervisi_draft_${activeCycle.id}_C`, JSON.stringify(immediatePayload));
        } catch {
          // ignore
        }
        await onSaveFormC(activeCycle.id, immediatePayload, 'save_draft', { silent: true }).catch(() => {});
      }
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 3D Top Header */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 border-b-[6px] border-b-amber-600 p-5 sm:p-6 shadow-[0_14px_28px_-8px_rgba(15,23,42,0.1)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-100 text-amber-900 text-xs font-extrabold mb-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>(BISMA +) • FORM C — RENCANA TINDAK LANJUT PASCA OBSERVASI (PER HALAMAN)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              Refleksi Tantangan & Perencanaan Perbaikan Pembelajaran
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Guru: <span className="font-bold text-slate-800 dark:text-slate-200">{activeCycle.teacher_name}</span> • {formatClassLabel(activeCycle.grade)} ({activeCycle.subject}) • Status Form C:{' '}
              <span className="font-extrabold uppercase text-amber-700">{formCStatus}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {cycles.length > 1 && (
              <select
                value={activeCycle.id}
                onChange={e => {
                  const found = cycles.find(c => c.id === e.target.value);
                  if (found) onSelectCycle(found);
                }}
                className="px-3.5 py-2 rounded-xl border-2 border-slate-300 text-xs font-extrabold text-slate-800 bg-slate-50"
              >
                {cycles.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.teacher_name} — {formatClassLabel(c.grade)} ({c.subject})
                  </option>
                ))}
              </select>
            )}

            {!isCycleCompleted && (
              <button
                type="button"
                onClick={handleAskAiAssistant}
                disabled={aiLoading}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiLoading ? 'Mengisi dari API...' : 'Isi Otomatis dengan API Berdasarkan Data'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleAskAiAssistant}
              disabled={aiLoading || isCycleCompleted}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-b-4 border-amber-800 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {aiLoading ? 'Menyusun Saran...' : 'Asisten Refleksi BISMA+'}
            </button>

            <button
              type="button"
              onClick={() => onOpenPrintReport('C', activeCycle)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border-b-4 border-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Form C
            </button>
          </div>
        </div>

        {/* 3D Stepper Bar Lembar 1 - 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-5 pt-5 border-t border-slate-200/80">
          {FORM_C_PAGES.map(p => {
            const active = pageStep === p.step;
            const passed = pageStep > p.step;
            return (
              <button
                key={p.step}
                type="button"
                onClick={() => setPageStep(p.step)}
                className={`p-3 rounded-2xl border-2 border-b-4 text-left transition-all cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 border-amber-400 border-b-amber-900 text-white shadow-md -translate-y-0.5'
                    : passed
                    ? 'bg-emerald-50 border-emerald-300 border-b-emerald-500 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 border-b-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider mb-1">
                  <span>Halaman {p.step} / 3</span>
                  {passed && <span>✓</span>}
                </div>
                <p className="text-xs font-extrabold truncate">{p.title}</p>
              </button>
            );
          })}
        </div>
      </div>

      {aiNotice && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 border-b-4 text-amber-950 text-xs font-bold flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{aiNotice}</span>
        </div>
      )}

      {/* =====================================================================
          HALAMAN 1 / 3: TEMUAN OBSERVASI & REFLEKSI TANTANGAN (Q1-Q3)
         ===================================================================== */}
      {pageStep === 1 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 border-b-[6px] border-b-slate-300 p-6 sm:p-7 shadow-[0_14px_28px_-8px_rgba(15,23,42,0.08)] space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700">
              LEMBAR 1 DARI 3 • TEMUAN OBSERVASI & IDENTIFIKASI TANTANGAN
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Ringkasan Umpan Balik Kepala Sekolah & Pertanyaan Reflektif 1–3
            </h3>
          </div>

          {/* Summary of Principal Observation Findings (From Form B) */}
          <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3 text-xs">
            <p className="font-extrabold text-slate-900 text-sm">
              Rangkuman Temuan Observasi Kelas (Form B — {formatIndonesianDate(formBData?.observed_at)})
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="font-extrabold text-emerald-900 block mb-1">Kekuatan yang Teramati:</span>
                <p className="text-emerald-950">{formBData?.strengths || '-'}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <span className="font-extrabold text-amber-900 block mb-1">Area Pengembangan:</span>
                <p className="text-amber-950">{formBData?.improvement_areas || '-'}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                <span className="font-extrabold text-blue-900 block mb-1">Rekomendasi Kepala Sekolah:</span>
                <p className="text-blue-950">{formBData?.recommendations || '-'}</p>
              </div>
            </div>

            {formBData?.ratings && formBData.ratings.length > 0 && (
              <div className="pt-2 space-y-2">
                {formBData.ratings.map((r, i) => {
                  const cat = RATING_CATEGORIES.find(c => c.code === r.rating);
                  return (
                    <div key={i} className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900">{r.behavior_label}</p>
                        <p className="text-[11px] text-slate-600">Bukti: {r.evidence}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border shrink-0 ${cat?.badgeClass || ''}`}>
                        {cat?.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reflection Questions 1, 2, 3 */}
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-extrabold text-slate-800 text-sm mb-1">
                1. Tantangan apa yang Anda hadapi saat melaksanakan pembelajaran tersebut? (Main Challenge) *
              </label>
              <textarea
                rows={3}
                value={challenges}
                disabled={isCycleCompleted}
                onChange={e => setChallenges(e.target.value)}
                placeholder="Ceritakan tantangan atau kesulitan nyata yang Anda rasakan selama mengajar di kelas..."
                className="w-full p-3.5 rounded-2xl border-2 border-slate-300 font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-800 text-sm mb-1">
                2. Menurut Anda, apa penyebab utama munculnya tantangan tersebut? (Root Cause) *
              </label>
              <textarea
                rows={3}
                value={rootCauses}
                disabled={isCycleCompleted}
                onChange={e => setRootCauses(e.target.value)}
                placeholder="Identifikasi faktor penyebab dari sisi strategi mengajar, pengelolaan waktu, media, atau kesiapan murid..."
                className="w-full p-3.5 rounded-2xl border-2 border-slate-300 font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-800 text-sm mb-1">
                3. Praktik pembelajaran mana yang paling perlu ditingkatkan? *
              </label>
              <textarea
                rows={2}
                value={practicesToImprove}
                disabled={isCycleCompleted}
                onChange={e => setPracticesToImprove(e.target.value)}
                placeholder="Tuliskan aspek praktik mengajar yang ingin Anda fokuskan perbaikannya..."
                className="w-full p-3.5 rounded-2xl border-2 border-slate-300 font-medium text-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              disabled={saving || isCycleCompleted}
              onClick={() => handleAction('save_draft')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold border-b-4 border-slate-300 flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Simpan Draf
            </button>
            <button
              type="button"
              onClick={() => setPageStep(2)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs sm:text-sm font-extrabold border-b-4 border-amber-900 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <span>Lanjutkan ke Tujuan & Langkah (Lembar 2/3)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          HALAMAN 2 / 3: TUJUAN, LANGKAH KONKRET & PILIHAN BELAJAR (Q4-Q6)
         ===================================================================== */}
      {pageStep === 2 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 border-b-[6px] border-b-slate-300 p-6 sm:p-7 shadow-[0_14px_28px_-8px_rgba(15,23,42,0.08)] space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700">
              LEMBAR 2 DARI 3 • RENCANA AKSI & PILIHAN BELAJAR
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Tujuan Perbaikan, Langkah Konkret & Sumber Pengembangan Diri (Pertanyaan 4–6)
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-extrabold text-slate-800 text-sm mb-1">
                4. Perubahan atau peningkatan apa yang ingin Anda capai? (Satu tujuan per baris) *
              </label>
              <textarea
                rows={3}
                value={goalsText}
                disabled={isCycleCompleted}
                onChange={e => setGoalsText(e.target.value)}
                placeholder="Contoh:&#10;Meningkatkan ketepatan waktu diskusi kelompok.&#10;Memastikan seluruh siswa terlibat aktif melalui pembagian peran."
                className="w-full p-3.5 rounded-2xl border-2 border-slate-300 font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-800 text-sm mb-1">
                5. Langkah konkret apa yang akan Anda lakukan untuk mencapai peningkatan tersebut? (Satu langkah per baris) *
              </label>
              <textarea
                rows={3}
                value={actionStepsText}
                disabled={isCycleCompleted}
                onChange={e => setActionStepsText(e.target.value)}
                placeholder="Contoh:&#10;Menayangkan timer visual di layar kelas.&#10;Menyiapkan kartu peran anggota kelompok dan lembar exit ticket."
                className="w-full p-3.5 rounded-2xl border-2 border-slate-300 font-medium text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-extrabold text-slate-800 text-sm mb-1">
                  6. Kapan Anda akan mengimplementasikan langkah perbaikan ini? (Tenggat Waktu) *
                </label>
                <input
                  type="date"
                  value={targetDate}
                  disabled={isCycleCompleted}
                  onChange={e => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Learning Options (Section J: Ruang GTK, Teacher learning community, Peer discussion, Principal coaching, Classroom practice, Other) */}
            <div>
              <label className="block font-extrabold text-slate-800 text-sm mb-2">
                Pilihan Belajar / Sumber Pengembangan Kompetensi (Pilih satu atau lebih):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {LEARNING_SOURCE_OPTIONS.map(opt => {
                  const checked = learningSources.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleLearningSource(opt)}
                      className={`p-3 rounded-2xl border-2 border-b-4 text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                        checked
                          ? 'bg-amber-50 border-amber-500 border-b-amber-700 text-amber-950'
                          : 'bg-white border-slate-200 border-b-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input type="checkbox" checked={checked} readOnly className="accent-amber-600" />
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                if (!isCycleCompleted) {
                  onSaveFormC(activeCycle.id, buildPayload(), 'save_draft', { silent: true }).catch(() => {});
                }
                setPageStep(1);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold border-b-4 border-slate-300 flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Sebelumnya (Lembar 1/3)
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isCycleCompleted) {
                  onSaveFormC(activeCycle.id, buildPayload(), 'save_draft', { silent: true }).catch(() => {});
                }
                setPageStep(3);
              }}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs sm:text-sm font-extrabold border-b-4 border-amber-900 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <span>Lanjutkan ke Dukungan & Indikator (Lembar 3/3)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          HALAMAN 3 / 3: DUKUNGAN, INDIKATOR KEBERHASILAN & PENGIRIMAN (Q7-Q8)
         ===================================================================== */}
      {pageStep === 3 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 border-b-[6px] border-b-amber-600 p-6 sm:p-7 shadow-[0_14px_28px_-8px_rgba(15,23,42,0.1)] space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700">
              LEMBAR 3 DARI 3 • DUKUNGAN, INDIKATOR KEBERHASILAN & PENGIRIMAN
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Kebutuhan Dukungan & Ukuran Keberhasilan (Pertanyaan 7–8)
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-extrabold text-slate-800 text-sm mb-1">
                7. Bantuan atau sumber daya apa yang Anda butuhkan untuk melaksanakan perbaikan ini? *
              </label>
              <textarea
                rows={3}
                value={requiredSupport}
                disabled={isCycleCompleted}
                onChange={e => setRequiredSupport(e.target.value)}
                placeholder="Contoh: Dukungan diskusi rekan sejawat di KKG/Kombel, alat peraga kelas, atau coaching bersama Kepala Sekolah..."
                className="w-full p-3.5 rounded-2xl border-2 border-slate-300 font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-800 text-sm mb-1">
                8. Bagaimana Anda akan mengetahui bahwa perbaikan telah berhasil terjadi di kelas? (Indikator Keberhasilan) *
              </label>
              <textarea
                rows={3}
                value={successIndicatorsText}
                disabled={isCycleCompleted}
                onChange={e => setSuccessIndicatorsText(e.target.value)}
                placeholder="Contoh:&#10;Seluruh kelompok menuntaskan presentasi tepat waktu.&#10;Minimal 85% siswa berpartisipasi aktif dan mengumpulkan exit ticket."
                className="w-full p-3.5 rounded-2xl border-2 border-slate-300 font-medium text-slate-900"
              />
            </div>
          </div>

          {/* Sematkan Link Drive / URL Rencana Tindak Lanjut (Form C) */}
          {onUploadAttachment && (
            <DriveLinkSection
              actor={actor}
              cycle={activeCycle}
              formCode="C"
              indicatorTitle={currentIndicator.title}
              topic={activeCycle.forms?.A?.payload?.topic || activeCycle.subject}
              sectionTitle="Sematkan Link Drive / URL Dokumen Rencana Tindak Lanjut (Form C)"
              sectionSubtitle="Guru menyematkan tautan Google Drive / URL revisi perangkat ajar, bahan refleksi Kombel, atau rencana aksi perbaikan. Jika dibuka oleh Kepala Sekolah, muncul pop-up untuk pratinjau dan edit sebagai Catatan Tinjauan."
              categories={[
                'Revisi RPP / Modul Ajar Pasca Observasi',
                'Catatan Diskusi Komunitas Belajar (Kombel / KKG)',
                'Media / Instrumen Perbaikan Pembelajaran',
                'Tautan Bukti Tindak Lanjut Lainnya'
              ]}
              defaultCategory="Revisi RPP / Modul Ajar Pasca Observasi"
              canAddLink={!isCycleCompleted}
              onPendingLinkChange={setPendingDrive}
              onAddDriveLink={async params => {
                await onUploadAttachment({
                  cycle_id: params.cycle_id,
                  form_code: params.form_code,
                  file_name: params.file_name,
                  drive_url: params.drive_url,
                  link_url: params.drive_url,
                  evidence_category: params.evidence_category
                });
              }}
              onSaveAttachmentNote={onSaveAttachmentNote}
              onDeleteAttachment={onDeleteAttachment}
            />
          )}

          {/* Teacher Save & Submit Controls */}
          {!isPrincipal && !isCycleCompleted && (
            <div className="p-5 rounded-2xl bg-amber-50/80 border-2 border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs">
                <p className="font-extrabold text-amber-950 text-sm">
                  Kirim Rencana Tindak Lanjut (Form C)
                </p>
                <p className="text-slate-600">
                  Setelah Form C dikirim, Anda dapat mengimplementasikan langkah perbaikan di kelas dan melanjutkan pengisian Form D (Refleksi & Evaluasi).
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleAction('save_draft')}
                  className="px-4 py-2.5 rounded-xl bg-white border-2 border-slate-300 border-b-4 text-slate-800 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Simpan Draf
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleAction('submit')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold border-b-4 border-emerald-900 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {saving ? 'Mengirim...' : 'Kirim Tindak Lanjut (Form C)'}
                </button>
              </div>
            </div>
          )}

          {/* Principal Review of Form C */}
          {isPrincipal && (
            <div className="p-5 rounded-2xl bg-indigo-50/80 border-2 border-indigo-200 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-extrabold text-indigo-950 text-sm">
                  <ShieldCheck className="w-5 h-5 text-indigo-700" />
                  <span>Catatan Tinjauan Rencana Tindak Lanjut oleh Kepala Sekolah</span>
                </div>
                {!isCycleCompleted && (
                  <button
                    type="button"
                    onClick={handleAskAiAssistant}
                    disabled={aiLoading}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-extrabold border-b-4 border-amber-700 active:border-b-0 active:translate-y-0.5 text-[11px] flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{aiLoading ? 'Menyusun dengan API...' : 'Isi Catatan Tinjauan KS dengan API'}</span>
                  </button>
                )}
              </div>
              <textarea
                rows={3}
                value={principalReviewNote}
                disabled={isCycleCompleted}
                onChange={e => setPrincipalReviewNote(e.target.value)}
                placeholder="Berikan catatan penguatan atau dukungan atas rencana tindak lanjut guru (atau klik tombol API di atas)..."
                className="w-full p-3.5 rounded-xl border-2 border-slate-300 bg-white font-medium"
              />
              {!isCycleCompleted && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleAction('principal_review')}
                    className="px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white font-extrabold border-b-4 border-indigo-950 flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Simpan Tinjauan Form C
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                if (!isCycleCompleted) {
                  onSaveFormC(activeCycle.id, buildPayload(), 'save_draft', { silent: true }).catch(() => {});
                }
                setPageStep(2);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold border-b-4 border-slate-300 flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Sebelumnya (Lembar 2/3)
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isCycleCompleted) {
                  onSaveFormC(activeCycle.id, buildPayload(), 'save_draft', { silent: true }).catch(() => {});
                }
                onNavigatePage(isPrincipal ? 'ks_reflection' : 'form_d', activeCycle);
              }}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 text-white text-xs sm:text-sm font-extrabold border-b-4 border-purple-950 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <span>Lanjutkan ke Halaman Refleksi & Evaluasi (Form D)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
