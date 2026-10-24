import React, { useEffect, useState } from 'react';
import {
  MessageSquareText,
  Send,
  Save,
  Printer,
  Upload,
  FileText,
  ArrowLeft,
  ArrowRight,
  Lock,
  CheckCircle2,
  Sparkles,
  Award,
  AlertCircle
} from 'lucide-react';
import {
  SupervisiActor,
  SupervisiConfig,
  SupervisionCycle,
  FormDPayload,
  DEFAULT_PRIORITY_INDICATORS,
  getIndicatorByCode,
  formatClassLabel
} from './types';
import DriveLinkSection from './DriveLinkSection';

interface SupervisiRefleksiProps {
  actor: SupervisiActor;
  config: SupervisiConfig;
  cycles: SupervisionCycle[];
  selectedCycle: SupervisionCycle | null;
  onSelectCycle: (cycle: SupervisionCycle) => void;
  onSaveFormD: (
    cycleId: string,
    payload: Partial<FormDPayload>,
    action: 'save_draft' | 'submit' | 'principal_finalize'
  ) => Promise<void>;
  onUploadAttachment: (params: {
    cycle_id: string;
    form_code: 'A' | 'B' | 'C' | 'D';
    file_name: string;
    mime_type?: string;
    base64_data?: string;
    drive_url?: string;
    evidence_category: string;
  }) => Promise<void>;
  onSaveAttachmentNote?: (params: {
    cycle_id: string;
    attachment_id: string;
    principal_note: string;
  }) => Promise<void>;
  onDeleteAttachment?: (params: {
    cycle_id: string;
    attachment_id: string;
  }) => Promise<void>;
  onNavigatePage: (pageId: string, cycle?: SupervisionCycle) => void;
  onOpenPrintReport: (reportType: 'A' | 'B' | 'C' | 'D' | 'FULL' | 'SCHOOL', cycle?: SupervisionCycle) => void;
}

const FORM_D_PAGES = [
  { step: 1, title: 'Lembar 1: Inspirasi, Implementasi & Dampak (Q1–Q4)', short: '1. Dampak Perbaikan' },
  { step: 2, title: 'Lembar 2: Tantangan, Strategi & Bukti Dukung (Q5–Q7)', short: '2. Strategi & Bukti' },
  { step: 3, title: 'Lembar 3: Umpan Balik Akhir KS & Finalisasi Siklus', short: '3. Finalisasi Siklus' }
];

const EVIDENCE_CATEGORIES = [
  'Materi Ajar / Modul Perbaikan',
  'Foto Kegiatan Pembelajaran di Kelas',
  'Catatan Reflektif Guru',
  'Ringkasan Asesmen Formatif',
  'Dokumentasi Aktivitas Kelompok'
];

export default function SupervisiRefleksi({
  actor,
  config,
  cycles,
  selectedCycle,
  onSelectCycle,
  onSaveFormD,
  onUploadAttachment,
  onSaveAttachmentNote,
  onDeleteAttachment,
  onNavigatePage,
  onOpenPrintReport
}: SupervisiRefleksiProps) {
  const isPrincipal = actor.supervisiRole === 'kepala_sekolah';
  const indicators = config.indicators || DEFAULT_PRIORITY_INDICATORS;
  const activeCycle = selectedCycle || cycles[0] || null;

  const [pageStep, setPageStep] = useState<number>(1);
  const [saving, setSaving] = useState<boolean>(false);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiNotice, setAiNotice] = useState<string>('');

  // Form D fields (Q1 - Q7)
  const [inspiration, setInspiration] = useState('');
  const [actionsImplementedText, setActionsImplementedText] = useState('');
  const [progress, setProgress] = useState('');
  const [learningImpact, setLearningImpact] = useState('');
  const [remainingChallenges, setRemainingChallenges] = useState('');
  const [improvementStrategy, setImprovementStrategy] = useState('');
  const [nextGoalsText, setNextGoalsText] = useState('');

  // Principal final review fields
  const [recognitionOfProgress, setRecognitionOfProgress] = useState('');
  const [coachingFeedback, setCoachingFeedback] = useState('');
  const [suggestedNextSteps, setSuggestedNextSteps] = useState('');

  useEffect(() => {
    if (!activeCycle) return;
    const p = activeCycle.forms?.D?.payload;
    setInspiration(p?.inspiration || '');
    setActionsImplementedText((p?.actions_implemented || []).join('\n'));
    setProgress(p?.progress || '');
    setLearningImpact(p?.learning_impact || '');
    setRemainingChallenges(p?.remaining_challenges || '');
    setImprovementStrategy(p?.improvement_strategy || '');
    setNextGoalsText((p?.next_goals || []).join('\n'));

    setRecognitionOfProgress(p?.recognition_of_progress || '');
    setCoachingFeedback(p?.coaching_feedback || '');
    setSuggestedNextSteps(p?.suggested_next_steps || '');
  }, [activeCycle?.id]);

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

  // Prerequisite Rule TEST 07: Form D cannot be opened/submitted before Form C is submitted!
  const isFormCSubmitted =
    activeCycle.forms?.C?.status === 'submitted' ||
    activeCycle.forms?.C?.status === 'reviewed' ||
    activeCycle.forms?.C?.status === 'finalized';

  if (!isFormCSubmitted) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-purple-200 border-b-[7px] border-b-purple-700 p-8 text-center shadow-[0_16px_32px_-10px_rgba(126,34,206,0.18)] max-w-2xl mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-700 border-b-4 border-purple-200 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <span className="px-3 py-1 rounded-xl bg-purple-100 text-purple-900 text-xs font-extrabold uppercase">
          PRASYARAT TAHAP BELUM TERPENUHI
        </span>
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-3 mb-2">
          Form D (Refleksi & Evaluasi) Menunggu Pengiriman Form C
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          Sesuai alur supervisi reflektif <strong>(BISMA +)</strong>, Guru perlu menyusun dan mengirim Rencana Tindak Lanjut (Form C) terlebih dahulu sebelum mengisi Refleksi & Evaluasi (Form D).
        </p>
        <button
          onClick={() => onNavigatePage(isPrincipal ? 'ks_followup' : 'form_c', activeCycle)}
          className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-extrabold border-b-4 border-purple-950 inline-flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Ke Halaman Rencana Tindak Lanjut (Form C)
        </button>
      </div>
    );
  }

  const currentIndicator = getIndicatorByCode(activeCycle.indicator_code, indicators);
  const formDStatus = activeCycle.forms?.D?.status || 'draft';
  const isCycleCompleted = activeCycle.state === 'completed';

  const buildPayload = (): Partial<FormDPayload> => ({
    inspiration,
    actions_implemented: actionsImplementedText.split('\n').map(s => s.trim()).filter(Boolean),
    progress,
    learning_impact: learningImpact,
    remaining_challenges: remainingChallenges,
    improvement_strategy: improvementStrategy,
    next_goals: nextGoalsText.split('\n').map(s => s.trim()).filter(Boolean),
    recognition_of_progress: recognitionOfProgress,
    coaching_feedback: coachingFeedback,
    suggested_next_steps: suggestedNextSteps
  });

  const handleAction = async (action: 'save_draft' | 'submit' | 'principal_finalize') => {
    setSaving(true);
    try {
      await onSaveFormD(activeCycle.id, buildPayload(), action);
    } finally {
      setSaving(false);
    }
  };

  const handleAskAiOutline = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/supervisi/ai-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor,
          stage: 'Form D — Refleksi dan Evaluasi Tindak Lanjut',
          indicator_title: currentIndicator.title,
          target_behaviors: activeCycle.forms?.C?.payload?.action_steps || [],
          context_notes: `Langkah perbaikan yang direncanakan: ${(activeCycle.forms?.C?.payload?.action_steps || []).join(', ')}`
        })
      });
      const json = await res.json();
      if (json.success && json.suggestions) {
        setAiNotice(
          json.notice ||
            'Isian otomatis Form D dan catatan tinjauan KS berhasil disusun menggunakan API tertanam berdasarkan data.'
        );
        if (json.suggestions.outline && !inspiration.trim()) {
          setInspiration(json.suggestions.outline);
        }
        if (!actionsImplementedText.trim()) {
          const stepsC = activeCycle.forms?.C?.payload?.action_steps || [];
          setActionsImplementedText(
            stepsC.length > 0
              ? stepsC.join('\n')
              : Array.isArray(json.suggestions.action_steps)
              ? json.suggestions.action_steps.join('\n')
              : 'Menerapkan pembagian peran kelompok terstruktur dan memfasilitasi diskusi aktif murid di kelas.'
          );
        }
        if (!progress.trim()) {
          setProgress(
            `Praktik mengajar pada ${formatClassLabel(activeCycle.grade)} (${activeCycle.subject}) menjadi lebih terarah, manajemen waktu diskusi kelompok lebih efektif, dan umpan balik kepada murid tersampaikan secara konstruktif.`
          );
        }
        if (!learningImpact.trim()) {
          setLearningImpact(
            'Murid menjadi jauh lebih antusias, berani bertanya dan menanggapi pendapat teman, serta ketuntasan pemahaman konsep pada asesmen formatif meningkat secara nyata.'
          );
        }
        if (!remainingChallenges.trim()) {
          setRemainingChallenges(
            'Masih terdapat 2–3 murid yang membutuhkan pendampingan individual lebih intensif saat menyimpulkan hasil diskusi kelompok.'
          );
        }
        if (!improvementStrategy.trim()) {
          setImprovementStrategy(
            'Memberikan scaffolding bertahap (pertanyaan penuntun) dan memasangkan murid tersebut dengan tutor sebaya yang suportif.'
          );
        }
        if (!nextGoalsText.trim()) {
          setNextGoalsText(
            `Mengembangkan variasi asesmen formatif dan media interaktif pada ${formatClassLabel(activeCycle.grade)}.\nBerbagi praktik baik hasil tindak lanjut supervisi di Komunitas Belajar (Kombel / KKG) sekolah.`
          );
        }
        if (isPrincipal) {
          if (!recognitionOfProgress.trim()) {
            setRecognitionOfProgress(
              `Apresiasi tinggi kepada ${activeCycle.teacher_name} atas komitmen nyata dalam menindaklanjuti hasil observasi pada ${formatClassLabel(activeCycle.grade)} (${activeCycle.subject}) hingga berdampak positif pada keterlibatan murid.`
            );
          }
          if (!coachingFeedback.trim()) {
            setCoachingFeedback(
              `Perubahan praktik pembelajaran terkait indikator ${currentIndicator.title} telah berjalan efektif dan terdokumentasi dengan baik melalui tautan bukti dukung.`
            );
          }
          if (!suggestedNextSteps.trim()) {
            setSuggestedNextSteps(
              'Pertahankan konsistensi praktik baik ini dan bagikan pengalaman implementasi di forum Komunitas Belajar (Kombel) sekolah.'
            );
          }
        }
      }
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 3D Header */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 border-b-[6px] border-b-purple-700 p-5 sm:p-6 shadow-[0_14px_28px_-8px_rgba(15,23,42,0.1)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-purple-100 text-purple-900 text-xs font-extrabold mb-1.5">
              <MessageSquareText className="w-3.5 h-3.5" />
              <span>(BISMA +) • FORM D — REFLEKSI DAN EVALUASI TINDAK LANJUT (PER HALAMAN)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              Evaluasi Dampak Perbaikan & Pembinaan Akhir Siklus
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Guru: <span className="font-bold text-slate-800 dark:text-slate-200">{activeCycle.teacher_name}</span> • {formatClassLabel(activeCycle.grade)} ({activeCycle.subject}) • Status Form D:{' '}
              <span className="font-extrabold uppercase text-purple-700">{formDStatus}</span>
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
                onClick={handleAskAiOutline}
                disabled={aiLoading}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-b-4 border-amber-800 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {aiLoading ? 'Menyusun...' : 'Kerangka Refleksi AI'}
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenPrintReport('D', activeCycle)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border-b-4 border-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Form D
            </button>
          </div>
        </div>

        {/* 3D Stepper Bar Lembar 1 - 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-5 pt-5 border-t border-slate-200/80">
          {FORM_D_PAGES.map(p => {
            const active = pageStep === p.step;
            const passed = pageStep > p.step;
            return (
              <button
                key={p.step}
                type="button"
                onClick={() => setPageStep(p.step)}
                className={`p-3 rounded-2xl border-2 border-b-4 text-left transition-all cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-purple-700 to-indigo-800 border-purple-500 border-b-purple-950 text-white shadow-md -translate-y-0.5'
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
          HALAMAN 1 / 3: INSPIRASI, TINDAKAN & DAMPAK PADA MURID (Q1-Q4)
         ===================================================================== */}
      {pageStep === 1 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 border-b-[6px] border-b-slate-300 p-6 sm:p-7 shadow-[0_14px_28px_-8px_rgba(15,23,42,0.08)] space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700">
              LEMBAR 1 DARI 3 • DAMPAK TINDAK LANJUT DI KELAS
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Inspirasi Baru, Langkah yang Diterapkan & Perubahan pada Murid (Pertanyaan 1–4)
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-extrabold text-slate-800 text-sm mb-1">
                1. Inspirasi baru apa yang Anda peroleh dari proses tindak lanjut dan belajar ini? *
              </label>
              <textarea
                rows={3}
                value={inspiration}
                disabled={isCycleCompleted}
                onChange={e => setInspiration(e.target.value)}
                placeholder="Tuliskan wawasan atau kesadaran baru yang Anda dapatkan setelah mempelajari hasil observasi dan berlatih..."
                className="w-full p-3.5 rounded-2xl border-2 border-slate-300 font-medium text-slate-900"
              />
            </div>

            <div>
              <label className="block font-extrabold text-slate-800 text-sm mb-1">
                2. Perubahan atau perbaikan apa yang telah Anda terapkan di kelas? (Satu poin per baris) *
              </label>
              <textarea
                rows={3}
                value={actionsImplementedText}
                disabled={isCycleCompleted}
                onChange={e => setActionsImplementedText(e.target.value)}
                placeholder="Contoh:&#10;Menayangkan timer visual saat kerja kelompok.&#10;Menggunakan kartu peran kelompok dan lembar exit ticket."
                className="w-full p-3.5 rounded-2xl border-2 border-slate-300 font-medium text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-extrabold text-slate-800 text-sm mb-1">
                  3. Kemajuan apa yang Anda amati dalam praktik mengajar Anda? *
                </label>
                <textarea
                  rows={3}
                  value={progress}
                  disabled={isCycleCompleted}
                  onChange={e => setProgress(e.target.value)}
                  placeholder="Ceritakan peningkatan nyata pada cara Anda mengelola kelas atau memfasilitasi diskusi..."
                  className="w-full p-3.5 rounded-2xl border-2 border-slate-300 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-extrabold text-emerald-800 text-sm mb-1">
                  4. Perubahan positif apa yang terjadi pada partisipasi atau hasil belajar murid? *
                </label>
                <textarea
                  rows={3}
                  value={learningImpact}
                  disabled={isCycleCompleted}
                  onChange={e => setLearningImpact(e.target.value)}
                  placeholder="Ceritakan dampak positif yang tampak pada keaktifan, antusiasme, atau pemahaman murid..."
                  className="w-full p-3.5 rounded-2xl border-2 border-emerald-300 bg-emerald-50/30 font-medium text-slate-900"
                />
              </div>
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
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 text-white text-xs sm:text-sm font-extrabold border-b-4 border-purple-950 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <span>Lanjutkan ke Tantangan & Bukti Dukung (Lembar 2/3)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          HALAMAN 2 / 3: TANTANGAN TERSISA, STRATEGI & UPLOAD BUKTI DUKUNG (Q5-Q7)
         ===================================================================== */}
      {pageStep === 2 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 border-b-[6px] border-b-slate-300 p-6 sm:p-7 shadow-[0_14px_28px_-8px_rgba(15,23,42,0.08)] space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700">
              LEMBAR 2 DARI 3 • STRATEGI KEBERLANJUTAN & BUKTI DUKUNG PRIVAT
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Tantangan Tersisa, Strategi & Dokumentasi Bukti Pembelajaran (Pertanyaan 5–7)
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-extrabold text-slate-800 text-sm mb-1">
                  5. Tantangan apa yang masih tersisa setelah implementasi perbaikan?
                </label>
                <textarea
                  rows={3}
                  value={remainingChallenges}
                  disabled={isCycleCompleted}
                  onChange={e => setRemainingChallenges(e.target.value)}
                  placeholder="Tuliskan kendala yang masih ditemukan saat menerapkan rencana tindak lanjut..."
                  className="w-full p-3.5 rounded-2xl border-2 border-slate-300 font-medium text-slate-900"
                />
              </div>
              <div>
                <label className="block font-extrabold text-slate-800 text-sm mb-1">
                  6. Bagaimana cara atau strategi Anda untuk mengatasi tantangan tersebut?
                </label>
                <textarea
                  rows={3}
                  value={improvementStrategy}
                  disabled={isCycleCompleted}
                  onChange={e => setImprovementStrategy(e.target.value)}
                  placeholder="Jelaskan solusi atau penyesuaian yang Anda lakukan..."
                  className="w-full p-3.5 rounded-2xl border-2 border-slate-300 font-medium text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-extrabold text-slate-800 text-sm mb-1">
                7. Apa yang akan terus Anda tingkatkan pada pengembangan profesional berikutnya? (Satu target per baris)
              </label>
              <textarea
                rows={2}
                value={nextGoalsText}
                disabled={isCycleCompleted}
                onChange={e => setNextGoalsText(e.target.value)}
                placeholder="Contoh:&#10;Mengembangkan variasi asesmen formatif di mata pelajaran lain.&#10;Berbagi praktik baik di Komunitas Belajar sekolah."
                className="w-full p-3.5 rounded-2xl border-2 border-slate-300 font-medium text-slate-900"
              />
            </div>

            {/* Sematkan Link Drive / URL Bukti Dukung Tindak Lanjut (Form D) */}
            <DriveLinkSection
              actor={actor}
              cycle={activeCycle}
              formCode="D"
              sectionTitle="Sematkan Link Drive / URL Bukti Dukung Tindak Lanjut (Form D)"
              sectionSubtitle="Guru menyematkan tautan Google Drive / URL foto kegiatan perbaikan di kelas, materi ajar revisi, catatan reflektif, atau ringkasan asesmen formatif. Jika dibuka oleh Kepala Sekolah, muncul pop-up untuk pratinjau langsung dan edit sebagai Catatan Tinjauan."
              categories={EVIDENCE_CATEGORIES}
              defaultCategory={EVIDENCE_CATEGORIES[0]}
              canAddLink={!isCycleCompleted}
              onAddDriveLink={async params => {
                await onUploadAttachment({
                  cycle_id: params.cycle_id,
                  form_code: params.form_code,
                  file_name: params.file_name,
                  drive_url: params.drive_url,
                  evidence_category: params.evidence_category
                });
              }}
              onSaveAttachmentNote={onSaveAttachmentNote}
              onDeleteAttachment={onDeleteAttachment}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setPageStep(1)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold border-b-4 border-slate-300 flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Sebelumnya (Lembar 1/3)
            </button>
            <button
              type="button"
              onClick={() => setPageStep(3)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 text-white text-xs sm:text-sm font-extrabold border-b-4 border-purple-950 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <span>Lanjutkan ke Pengiriman & Pembinaan Akhir (Lembar 3/3)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          HALAMAN 3 / 3: PENGIRIMAN REFLEKSI & PEMBINAAN AKHIR KEPALA SEKOLAH
         ===================================================================== */}
      {pageStep === 3 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 border-b-[6px] border-b-purple-700 p-6 sm:p-7 shadow-[0_14px_28px_-8px_rgba(15,23,42,0.1)] space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700">
              LEMBAR 3 DARI 3 • KONFIRMASI REFLEKSI & FINALISASI SIKLUS
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Pengiriman Form D & Umpan Balik Pembinaan Akhir Kepala Sekolah
            </h3>
          </div>

          {!isPrincipal && !isCycleCompleted && (
            <div className="p-5 rounded-2xl bg-purple-50 border-2 border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs">
                <p className="font-extrabold text-purple-950 text-sm">
                  Kirim Refleksi & Evaluasi Tindak Lanjut (Form D)
                </p>
                <p className="text-slate-600">
                  Setelah dikirim, Kepala Sekolah akan memberikan pengakuan kemajuan, umpan balik pembinaan, dan memfinalisasi siklus supervisi ini.
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
                  {saving ? 'Mengirim...' : 'Kirim Refleksi (Form D)'}
                </button>
              </div>
            </div>
          )}

          {/* Principal Review & Final Confirmation (Section K) */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-teal-50 border-2 border-emerald-300 border-b-[5px] border-b-emerald-600 space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-emerald-950 font-extrabold text-sm">
                <Award className="w-5 h-5 text-emerald-700" />
                <span>Catatan Tinjauan & Konfirmasi Akhir Kepala Sekolah (Section K)</span>
              </div>
              <div className="flex items-center gap-2">
                {isPrincipal && !isCycleCompleted && (
                  <button
                    type="button"
                    onClick={handleAskAiOutline}
                    disabled={aiLoading}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-extrabold border-b-4 border-amber-700 active:border-b-0 active:translate-y-0.5 text-[11px] flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{aiLoading ? 'Menyusun dengan API...' : 'Isi Catatan Tinjauan Akhir KS dengan API'}</span>
                  </button>
                )}
                {isCycleCompleted && (
                  <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-extrabold">
                    ✓ SIKLUS TERFINALISASI (ARSIP PERMANEN)
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-extrabold text-slate-800 mb-1">
                  Pengakuan Kemajuan Guru (Recognition of Progress) *
                </label>
                <textarea
                  rows={3}
                  value={recognitionOfProgress}
                  disabled={!isPrincipal || isCycleCompleted}
                  onChange={e => setRecognitionOfProgress(e.target.value)}
                  placeholder="Apresiasi Kepala Sekolah terhadap usaha dan kemajuan praktik mengajar guru..."
                  className="w-full p-3 rounded-xl border-2 border-slate-300 bg-white font-medium"
                />
              </div>
              <div>
                <label className="block font-extrabold text-slate-800 mb-1">
                  Umpan Balik Pembinaan (Coaching Feedback) *
                </label>
                <textarea
                  rows={3}
                  value={coachingFeedback}
                  disabled={!isPrincipal || isCycleCompleted}
                  onChange={e => setCoachingFeedback(e.target.value)}
                  placeholder="Catatan pembinaan reflektif atas dampak perbaikan terhadap murid..."
                  className="w-full p-3 rounded-xl border-2 border-slate-300 bg-white font-medium"
                />
              </div>
              <div>
                <label className="block font-extrabold text-slate-800 mb-1">
                  Saran Langkah Lanjutan (Suggested Next Steps)
                </label>
                <textarea
                  rows={3}
                  value={suggestedNextSteps}
                  disabled={!isPrincipal || isCycleCompleted}
                  onChange={e => setSuggestedNextSteps(e.target.value)}
                  placeholder="Rekomendasi pengembangan berkelanjutan di semester berikutnya..."
                  className="w-full p-3 rounded-xl border-2 border-slate-300 bg-white font-medium"
                />
              </div>
            </div>

            {isPrincipal && !isCycleCompleted && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleAction('principal_finalize')}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold border-b-4 border-emerald-900 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {saving ? 'Memfinalisasi...' : 'Konfirmasi & Finalisasi Siklus Supervisi Internal'}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setPageStep(2)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold border-b-4 border-slate-300 flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Sebelumnya (Lembar 2/3)
            </button>
            <button
              type="button"
              onClick={() => onNavigatePage(isPrincipal ? 'ks_reports' : 'history_pdf', activeCycle)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs sm:text-sm font-extrabold border-b-4 border-emerald-950 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <span>Lanjutkan ke Halaman Riwayat & Laporan PDF Lengkap</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
