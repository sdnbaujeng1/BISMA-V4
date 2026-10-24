import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Upload,
  FileText,
  Printer,
  Save,
  Send,
  ArrowLeft,
  ArrowRight,
  Eye,
  ShieldCheck,
  Clock,
  MapPin,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import {
  SupervisiActor,
  SupervisiConfig,
  SupervisionCycle,
  FormAPayload,
  DEFAULT_PRIORITY_INDICATORS,
  GRADE_OPTIONS,
  getIndicatorByCode,
  formatIndonesianDate,
  formatClassLabel
} from './types';
import DriveLinkSection from './DriveLinkSection';

interface SupervisiJadwalProps {
  actor: SupervisiActor;
  config: SupervisiConfig;
  cycles: SupervisionCycle[];
  selectedCycle: SupervisionCycle | null;
  onSelectCycle: (cycle: SupervisionCycle) => void;
  onSaveFormA: (
    cycleId: string,
    payload: Partial<FormAPayload>,
    action: 'save_draft' | 'submit' | 'principal_approve' | 'request_revision'
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

const FORM_A_PAGES = [
  { step: 1, title: 'A1 & A2: Identitas & Informasi Pembelajaran', short: '1. Info Mengajar' },
  { step: 2, title: 'A3 & A4: Fokus Indikator & Perilaku Sasaran', short: '2. Fokus & Perilaku' },
  { step: 3, title: 'A5–A7: Upaya Persiapan, Jadwal & Dokumen', short: '3. Jadwal & Bukti' },
  { step: 4, title: 'A8: Ringkasan, Tinjauan KS & Pengiriman', short: '4. Kirim & Tinjauan' }
];

export default function SupervisiJadwal({
  actor,
  config,
  cycles,
  selectedCycle,
  onSelectCycle,
  onSaveFormA,
  onUploadAttachment,
  onSaveAttachmentNote,
  onDeleteAttachment,
  onNavigatePage,
  onOpenPrintReport
}: SupervisiJadwalProps) {
  const isPrincipal = actor.supervisiRole === 'kepala_sekolah';
  const indicators = config.indicators || DEFAULT_PRIORITY_INDICATORS;
  const activeCycle = selectedCycle || cycles[0] || null;

  // Multi-page wizard state (Lembar 1 s.d. 4)
  const [pageStep, setPageStep] = useState<number>(1);
  const [showRubricModal, setShowRubricModal] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [autoSaveInfo, setAutoSaveInfo] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiReviewLoading, setAiReviewLoading] = useState<boolean>(false);
  const [aiNotice, setAiNotice] = useState<string>('');

  // Form A state
  const [grade, setGrade] = useState('IV');
  const [subject, setSubject] = useState('IPAS');
  const [topic, setTopic] = useState('');
  const [objectivesText, setObjectivesText] = useState('');
  const [learningDate, setLearningDate] = useState('');
  const [teachingDocRef, setTeachingDocRef] = useState('');
  const [indicatorCode, setIndicatorCode] = useState('student_engagement');
  const [targetBehaviors, setTargetBehaviors] = useState<string[]>([]);
  const [preparationActions, setPreparationActions] = useState('');
  const [proposedDate, setProposedDate] = useState('');
  const [startTime, setStartTime] = useState('07:30');
  const [endTime, setEndTime] = useState('09:00');
  const [location, setLocation] = useState(`Ruang Kelas IV ${config.schoolName || 'SDN BAUJENG I BEJI'}`);
  const [supportingRppTitle, setSupportingRppTitle] = useState('');
  const [supportingMaterialNote, setSupportingMaterialNote] = useState('');

  // Principal A8 Review fields
  const [reviewNote, setReviewNote] = useState('');
  const [confirmedSchedule, setConfirmedSchedule] = useState('');
  const [confirmedStartTime, setConfirmedStartTime] = useState('07:30');
  const [confirmedEndTime, setConfirmedEndTime] = useState('09:00');
  const [confirmedLocation, setConfirmedLocation] = useState('');

  useEffect(() => {
    if (!activeCycle) return;
    const p = activeCycle.forms?.A?.payload;
    setGrade(p?.grade || activeCycle.grade || 'IV');
    setSubject(p?.subject || activeCycle.subject || 'IPAS');
    setTopic(p?.topic || '');
    setObjectivesText((p?.learning_objectives || []).join('\n'));
    setLearningDate(p?.learning_date || activeCycle.proposed_date || '');
    setTeachingDocRef(p?.teaching_doc_ref || '');
    setIndicatorCode(p?.indicator_code || activeCycle.indicator_code || 'student_engagement');
    setTargetBehaviors(p?.target_behaviors || []);
    setPreparationActions(p?.preparation_actions || '');
    setProposedDate(p?.proposed_date || activeCycle.proposed_date || '');
    setStartTime(p?.start_time || '07:30');
    setEndTime(p?.end_time || '09:00');
    setLocation(p?.location || `Ruang ${formatClassLabel(activeCycle.grade || 'IV')} ${config.schoolName || 'SDN BAUJENG I BEJI'}`);
    setSupportingRppTitle(p?.supporting_rpp_title || '');
    setSupportingMaterialNote(p?.supporting_material_note || '');

    setReviewNote(p?.review_note || '');
    setConfirmedSchedule(p?.confirmed_schedule || p?.proposed_date || activeCycle.proposed_date || '');
    setConfirmedStartTime(p?.confirmed_start_time || p?.start_time || '07:30');
    setConfirmedEndTime(p?.confirmed_end_time || p?.end_time || '09:00');
    setConfirmedLocation(p?.confirmed_location || p?.location || `Ruang ${formatClassLabel(activeCycle.grade || 'IV')} ${config.schoolName || 'SDN BAUJENG I BEJI'}`);
  }, [activeCycle?.id, config.schoolName]);

  if (!activeCycle) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 border-b-[6px] border-b-slate-300 p-8 text-center">
        <p className="text-sm font-bold text-slate-600 mb-4">
          Belum ada siklus supervisi yang dipilih. Silakan pilih atau buat siklus supervisi terlebih dahulu di halaman Dashboard.
        </p>
        <button
          onClick={() => onNavigatePage('dashboard')}
          className="px-5 py-2.5 rounded-xl bg-blue-700 text-white text-xs font-extrabold border-b-4 border-blue-950 cursor-pointer"
        >
          Kembali ke Halaman Dashboard
        </button>
      </div>
    );
  }

  const currentIndicator = getIndicatorByCode(indicatorCode, indicators);
  const formAStatus = activeCycle.forms?.A?.status || 'draft';
  const isLockedForTeacher = !isPrincipal && (formAStatus === 'reviewed' || activeCycle.state === 'completed');

  const buildPayload = (): Partial<FormAPayload> => ({
    grade,
    subject,
    topic,
    learning_objectives: objectivesText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean),
    learning_date: learningDate || proposedDate,
    teaching_doc_ref: teachingDocRef,
    indicator_code: indicatorCode,
    target_behaviors: targetBehaviors,
    preparation_actions: preparationActions,
    proposed_date: proposedDate,
    start_time: startTime,
    end_time: endTime,
    location,
    supporting_rpp_title: supportingRppTitle,
    supporting_material_note: supportingMaterialNote,
    review_note: reviewNote,
    confirmed_schedule: confirmedSchedule || proposedDate,
    confirmed_start_time: confirmedStartTime,
    confirmed_end_time: confirmedEndTime,
    confirmed_location: confirmedLocation || location
  });

  const toggleBehavior = (code: string) => {
    if (isLockedForTeacher) return;
    setTargetBehaviors(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleAction = async (action: 'save_draft' | 'submit' | 'principal_approve' | 'request_revision') => {
    setSaving(true);
    try {
      await onSaveFormA(activeCycle.id, buildPayload(), action);
      if (action === 'save_draft') {
        setAutoSaveInfo(`Draf tersimpan otomatis pada ${new Date().toLocaleTimeString('id-ID')}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleNextStepWithAutoSave = async (nextStep: number) => {
    if (!isLockedForTeacher && !isPrincipal && activeCycle.state === 'draft') {
      try {
        await onSaveFormA(activeCycle.id, buildPayload(), 'save_draft');
        setAutoSaveInfo(`Draf halaman ${pageStep} tersimpan (${new Date().toLocaleTimeString('id-ID')})`);
      } catch {
        // Ignore auto-save validation error when moving between draft steps
      }
    }
    setPageStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAskAiPrep = async () => {
    setAiLoading(true);
    try {
      const chosenLabels = currentIndicator.behaviors
        .filter(b => targetBehaviors.includes(b.code))
        .map(b => b.label);
      const res = await fetch('/api/supervisi/ai-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor,
          stage: 'Form A — Persiapan Observasi Kelas',
          indicator_title: currentIndicator.title,
          target_behaviors: chosenLabels,
          context_notes: `${formatClassLabel(grade)}, Mapel ${subject}, Topik: ${topic || 'Pembelajaran Aktif'}`
        })
      });
      const json = await res.json();
      if (json.success && json.suggestions) {
        setAiNotice(
          json.notice ||
            'Isian otomatis berhasil disusun dari API tertanam berdasarkan data guru dan kelas.'
        );
        if (!topic.trim()) {
          setTopic(`Eksplorasi Kontekstual & Kolaboratif pada Mata Pelajaran ${subject} (${formatClassLabel(grade)})`);
        }
        if (!teachingDocRef.trim()) {
          setTeachingDocRef(`Modul Ajar Kurikulum Merdeka ${subject} ${formatClassLabel(grade)} Semester ${activeCycle.semester}`);
        }
        if (!objectivesText.trim()) {
          setObjectivesText(
            `1. Melalui pengamatan media kontekstual dan diskusi kelompok pada ${formatClassLabel(grade)}, peserta didik mampu memahami konsep utama materi ${subject} secara tepat.\n2. Melalui kegiatan kerja kelompok dan presentasi, peserta didik mampu mendemonstrasikan hasil pemecahan masalah secara aktif dan percaya diri.`
          );
        }
        if (!supportingRppTitle.trim()) {
          setSupportingRppTitle(`Modul Ajar ${subject} ${formatClassLabel(grade)} — ${topic || 'Pembelajaran Berpusat pada Murid'}`);
        }
        if (!supportingMaterialNote.trim()) {
          setSupportingMaterialNote('LKPD Kelompok Kontekstual, Kartu Pertanyaan Pemantik, dan Media Visual Interaktif');
        }
        if (targetBehaviors.length === 0 && currentIndicator.behaviors.length > 0) {
          setTargetBehaviors(currentIndicator.behaviors.slice(0, 2).map(b => b.code));
        }
        if (json.suggestions.outline && !preparationActions.trim()) {
          setPreparationActions(json.suggestions.outline);
        } else if (Array.isArray(json.suggestions.action_steps)) {
          setPreparationActions(prev =>
            prev ? `${prev}\n• ${json.suggestions.action_steps.join('\n• ')}` : json.suggestions.action_steps.join('\n• ')
          );
        }
        if (isPrincipal && !reviewNote.trim()) {
          setReviewNote(
            `Perencanaan pembelajaran ${activeCycle.teacher_name} pada ${formatClassLabel(grade)} (${subject}) telah tersusun sistematis dan selaras dengan fokus indikator ${currentIndicator.title}. Jadwal observasi disetujui.`
          );
        }
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleGeneratePrincipalReviewAI = async () => {
    setAiReviewLoading(true);
    try {
      const res = await fetch('/api/supervisi/generate-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycle: {
            ...activeCycle,
            grade,
            subject,
            forms: {
              ...activeCycle.forms,
              A: {
                ...(activeCycle.forms?.A || {}),
                payload: buildPayload()
              }
            }
          },
          mode: 'principal_prep_review'
        })
      });
      const json = await res.json();
      if (json.success && json.data?.catatan_tinjauan) {
        setReviewNote(json.data.catatan_tinjauan);
        setAiNotice('Catatan Tinjauan & Persiapan KS berhasil disusun menggunakan API tertanam berdasarkan data.');
      }
    } finally {
      setAiReviewLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top 3D Header & Cycle Selector */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 border-b-[6px] border-b-blue-700 p-5 sm:p-6 shadow-[0_14px_28px_-8px_rgba(15,23,42,0.1)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-100 text-blue-900 text-xs font-extrabold mb-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>(BISMA +) • FORM A — DISKUSI PERSIAPAN OBSERVASI (DISAJIKAN PER HALAMAN)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              Perencanaan Fokus & Jadwal Observasi Kelas
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Guru: <span className="font-bold text-slate-800 dark:text-slate-200">{activeCycle.teacher_name}</span> • {formatClassLabel(grade)} ({subject}) • Status Form A:{' '}
              <span className="font-extrabold uppercase text-blue-700">{formAStatus}</span>
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

            <button
              type="button"
              onClick={handleAskAiPrep}
              disabled={aiLoading}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{aiLoading ? 'Mengisi dari API...' : 'Isi Otomatis dengan API Berdasarkan Data'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowRubricModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-2 border-indigo-200 border-b-4 border-b-indigo-300 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              Lihat Rubrik
            </button>

            <button
              type="button"
              onClick={() => onOpenPrintReport('A', activeCycle)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border-b-4 border-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Form A
            </button>
          </div>
        </div>

        {/* 3D Page Stepper Bar (Lembar 1 s.d. 4) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-5 border-t border-slate-200/80">
          {FORM_A_PAGES.map(p => {
            const active = pageStep === p.step;
            const passed = pageStep > p.step;
            return (
              <button
                key={p.step}
                type="button"
                onClick={() => setPageStep(p.step)}
                className={`p-3 rounded-2xl border-2 border-b-4 text-left transition-all cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-blue-700 to-indigo-700 border-blue-500 border-b-indigo-950 text-white shadow-md -translate-y-0.5'
                    : passed
                    ? 'bg-emerald-50 border-emerald-300 border-b-emerald-500 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 border-b-slate-300 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider mb-1">
                  <span>Halaman {p.step} / 4</span>
                  {passed && <span>✓</span>}
                </div>
                <p className="text-xs font-extrabold truncate">{p.short}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          HALAMAN 1 / 4: A1 IDENTITAS GURU & A2 INFORMASI PEMBELAJARAN
         ===================================================================== */}
      {pageStep === 1 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 border-b-[6px] border-b-slate-300 p-6 sm:p-7 shadow-[0_14px_28px_-8px_rgba(15,23,42,0.08)] space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700">
                LEMBAR 1 DARI 4 • IDENTITAS & RENCANA MENGAJAR
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                A1. Identitas Guru & A2. Informasi Pembelajaran
              </h3>
            </div>
            {autoSaveInfo && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                {autoSaveInfo}
              </span>
            )}
          </div>

          {/* A1. Automatic Teacher Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border-2 border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-500 font-semibold block">Nama Guru (Otomatis)</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">{activeCycle.teacher_name}</span>
              <span className="block text-[11px] text-slate-500">NIP. {activeCycle.teacher_nip}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block">Satuan Pendidikan (Otomatis)</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">{config.schoolName}</span>
              <span className="block text-[11px] text-slate-500">{config.subdistrict}, {config.district}</span>
            </div>
            <div>
              <span className="text-slate-500 font-semibold block">Tahun Ajaran & Semester</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                {activeCycle.academic_year} • {activeCycle.semester}
              </span>
              <span className="block text-[11px] text-slate-500">Tugas: {activeCycle.teacher_assignment}</span>
            </div>
          </div>

          {/* A2. Teaching Information */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-extrabold text-slate-700 dark:text-slate-200 mb-1.5">
                Kelas Sasaran (I–VI) *
              </label>
              <select
                value={grade}
                disabled={isLockedForTeacher}
                onChange={e => setGrade(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-900 bg-white"
              >
                {GRADE_OPTIONS.map(g => (
                  <option key={g} value={g}>{formatClassLabel(g)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-extrabold text-slate-700 dark:text-slate-200 mb-1.5">
                Mata Pelajaran *
              </label>
              <input
                type="text"
                value={subject}
                disabled={isLockedForTeacher}
                onChange={e => setSubject(e.target.value)}
                placeholder="Contoh: IPAS / Matematika / Bahasa Indonesia"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-extrabold text-slate-700 dark:text-slate-200 mb-1.5">
                Tanggal Pembelajaran *
              </label>
              <input
                type="date"
                value={learningDate}
                disabled={isLockedForTeacher}
                onChange={e => {
                  setLearningDate(e.target.value);
                  if (!proposedDate) setProposedDate(e.target.value);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-extrabold text-slate-700 dark:text-slate-200 mb-1.5">
                Topik / Materi Pembelajaran *
              </label>
              <input
                type="text"
                value={topic}
                disabled={isLockedForTeacher}
                onChange={e => setTopic(e.target.value)}
                placeholder="Contoh: Perubahan Wujud Benda di Sekitar Kita"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-extrabold text-slate-700 dark:text-slate-200 mb-1.5">
                Referensi Dokumen Ajar (Opsional)
              </label>
              <input
                type="text"
                value={teachingDocRef}
                disabled={isLockedForTeacher}
                onChange={e => setTeachingDocRef(e.target.value)}
                placeholder="Contoh: Modul Ajar IPAS Fase B Bab 4"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-extrabold text-slate-700 dark:text-slate-200 mb-1.5">
              Tujuan Pembelajaran (Satu tujuan per baris) *
            </label>
            <textarea
              rows={3}
              value={objectivesText}
              disabled={isLockedForTeacher}
              onChange={e => setObjectivesText(e.target.value)}
              placeholder="Tuliskan tujuan pembelajaran yang ingin dicapai peserta didik pada pertemuan ini..."
              className="w-full p-3.5 rounded-2xl border-2 border-slate-300 font-medium text-slate-900 leading-relaxed"
            />
          </div>

          {/* 3D Wizard Page Navigation Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => handleAction('save_draft')}
              disabled={saving || isLockedForTeacher}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Simpan Draf
            </button>
            <button
              type="button"
              onClick={() => handleNextStepWithAutoSave(2)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white text-xs sm:text-sm font-extrabold border-b-4 border-indigo-950 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <span>Lanjutkan ke Fokus Observasi (Lembar 2/4)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          HALAMAN 2 / 4: A3 FOKUS OBSERVASI & A4 PERILAKU SASARAN
         ===================================================================== */}
      {pageStep === 2 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 border-b-[6px] border-b-slate-300 p-6 sm:p-7 shadow-[0_14px_28px_-8px_rgba(15,23,42,0.08)] space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700">
                LEMBAR 2 DARI 4 • FOKUS INDIKATOR & TARGET PERILAKU
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                A3. Pilih Indikator Prioritas & A4. Perilaku Sasaran Guru
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowRubricModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              Panduan Rubrik
            </button>
          </div>

          {/* A3. 6 Priority Indicators in 3D Cards */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-3">
              A3. Pilih 1 (Satu) Indikator Prioritas Fokus Observasi Kelas:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {indicators.map(ind => {
                const selected = indicatorCode === ind.code;
                return (
                  <button
                    key={ind.code}
                    type="button"
                    disabled={isLockedForTeacher}
                    onClick={() => {
                      setIndicatorCode(ind.code);
                      // Select first behavior by default when switching indicator
                      setTargetBehaviors([ind.behaviors[0]?.code].filter(Boolean));
                    }}
                    className={`p-4 rounded-2xl border-2 border-b-[5px] text-left transition-all cursor-pointer ${
                      selected
                        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-600 border-b-blue-800 shadow-md -translate-y-0.5'
                        : 'bg-white hover:bg-slate-50 border-slate-200 border-b-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${
                          selected ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        Indikator {ind.number}
                      </span>
                      {selected && <CheckCircle2 className="w-4 h-4 text-blue-700" />}
                    </div>
                    <p className="text-xs font-extrabold text-slate-900 mb-1">{ind.title}</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">
                      {ind.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* A4. Target Teacher Behaviors */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border-2 border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  A4. Pilih Perilaku Sasaran Guru yang Akan Ditampilkan (Wajib Pilih Minimal 1) *
                </h4>
                <p className="text-[11px] text-slate-500">
                  Indikator Aktif: <span className="font-bold text-blue-700">{currentIndicator.title}</span>
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-blue-100 text-blue-900 text-xs font-extrabold">
                {targetBehaviors.length} Perilaku Dipilih
              </span>
            </div>

            <div className="space-y-3">
              {currentIndicator.behaviors.map(beh => {
                const checked = targetBehaviors.includes(beh.code);
                return (
                  <div
                    key={beh.code}
                    onClick={() => toggleBehavior(beh.code)}
                    className={`p-4 rounded-2xl border-2 border-b-4 transition-all cursor-pointer ${
                      checked
                        ? 'bg-white border-emerald-500 border-b-emerald-700 shadow-sm'
                        : 'bg-white/70 border-slate-200 border-b-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}}
                        className="mt-1 w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                      />
                      <div className="flex-1 space-y-2">
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                          {beh.label}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                          <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-950">
                            <span className="font-extrabold block mb-1 text-emerald-800">✓ Perilaku yang Dianjurkan:</span>
                            <ul className="list-disc list-inside space-y-0.5">
                              {beh.recommended_practices.map((rp, idx) => (
                                <li key={idx}>{rp}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-950">
                            <span className="font-extrabold block mb-1 text-rose-800">✕ Perilaku yang Dihindari:</span>
                            <ul className="list-disc list-inside space-y-0.5">
                              {beh.practices_to_avoid.map((pa, idx) => (
                                <li key={idx}>{pa}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3D Wizard Page Navigation Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setPageStep(1)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Sebelumnya (Lembar 1/4)
            </button>
            <button
              type="button"
              onClick={() => handleNextStepWithAutoSave(3)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white text-xs sm:text-sm font-extrabold border-b-4 border-indigo-950 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <span>Lanjutkan ke Upaya & Jadwal (Lembar 3/4)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          HALAMAN 3 / 4: A5 UPAYA PERSIAPAN, A6 USULAN JADWAL & A7 DOKUMEN
         ===================================================================== */}
      {pageStep === 3 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 border-b-[6px] border-b-slate-300 p-6 sm:p-7 shadow-[0_14px_28px_-8px_rgba(15,23,42,0.08)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700">
                LEMBAR 3 DARI 4 • UPAYA PERSIAPAN, JADWAL & BUKTI PENDUKUNG
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                A5. Rencana Upaya Guru, A6. Usulan Jadwal & A7. Sematkan Link Drive / URL
              </h3>
            </div>
            {!isLockedForTeacher && (
              <button
                type="button"
                onClick={handleAskAiPrep}
                disabled={aiLoading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-extrabold border-b-4 border-amber-800 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {aiLoading ? 'Menyusun Ide dari API...' : 'Isi Otomatis dengan API (BISMA +)'}
              </button>
            )}
          </div>

          {aiNotice && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{aiNotice}</span>
            </div>
          )}

          {/* A5. Teacher Preparation */}
          <div className="text-xs space-y-1.5">
            <label className="block font-extrabold text-slate-800 dark:text-slate-100 text-sm">
              A5. Upaya apa yang akan Anda lakukan untuk menampilkan perilaku sasaran yang telah dipilih? *
            </label>
            <p className="text-slate-500">
              Tuliskan langkah persiapan nyata yang akan dilakukan di kelas (media, pengelompokan, pertanyaan pemantik, atau kesepakatan kelas).
            </p>
            <textarea
              rows={4}
              value={preparationActions}
              disabled={isLockedForTeacher}
              onChange={e => setPreparationActions(e.target.value)}
              placeholder="Contoh: Menyiapkan kartu pertanyaan pemantik, membagi murid dalam 5 kelompok heterogen dengan peran masing-masing, serta menyiapkan LKPD eksperimen..."
              className="w-full p-4 rounded-2xl border-2 border-slate-300 font-medium text-slate-900 leading-relaxed"
            />
          </div>

          {/* A6. Proposed Observation Schedule */}
          <div className="p-5 rounded-2xl bg-blue-50/60 border-2 border-blue-200 space-y-4">
            <h4 className="text-xs sm:text-sm font-extrabold text-blue-950 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-700" />
              <span>A6. Usulan Jadwal Observasi Kelas</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5 text-xs">
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Tanggal Usulan *</label>
                <input
                  type="date"
                  value={proposedDate}
                  disabled={isLockedForTeacher}
                  onChange={e => setProposedDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-300 bg-white font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Jam Mulai *</label>
                <input
                  type="time"
                  value={startTime}
                  disabled={isLockedForTeacher}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-300 bg-white font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Jam Selesai *</label>
                <input
                  type="time"
                  value={endTime}
                  disabled={isLockedForTeacher}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-300 bg-white font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block font-extrabold text-slate-700 mb-1">Lokasi Ruang Kelas *</label>
                <input
                  type="text"
                  value={location}
                  disabled={isLockedForTeacher}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Ruang Kelas IV"
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-300 bg-white font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* A7. Supporting Preparation & Drive / URL Link Embed + Principal Preview Pop-up */}
          <div className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-4 text-xs">
            <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-700" />
              <span>A7. Identitas Dokumen & Sematkan Tautan Google Drive / URL Perangkat Ajar</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul RPP / Modul Ajar</label>
                <input
                  type="text"
                  value={supportingRppTitle}
                  disabled={isLockedForTeacher}
                  onChange={e => setSupportingRppTitle(e.target.value)}
                  placeholder="Contoh: Modul Ajar IPAS Kelas IV - Eksperimen Wujud Benda"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 bg-white font-semibold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Media / Alat Peraga yang Disiapkan</label>
                <input
                  type="text"
                  value={supportingMaterialNote}
                  disabled={isLockedForTeacher}
                  onChange={e => setSupportingMaterialNote(e.target.value)}
                  placeholder="Contoh: Kit Percobaan, LKPD Kelompok, Slide Interaktif"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 bg-white font-semibold"
                />
              </div>
            </div>

            <DriveLinkSection
              actor={actor}
              cycle={activeCycle}
              formCode="A"
              sectionTitle="Sematkan Link Drive / URL Perangkat Pembelajaran (Form A)"
              sectionSubtitle="Guru menyematkan tautan Google Drive / URL RPP, Modul Ajar, LKPD, atau Media Ajar. Jika dibuka oleh Kepala Sekolah, muncul pop-up untuk pratinjau langsung dan edit sebagai Catatan Tinjauan."
              categories={[
                'RPP / Modul Ajar (Form A)',
                'Media / Bahan Ajar Interaktif',
                'LKPD / Lembar Kerja Murid',
                'Instrumen Asesmen Pembelajaran',
                'Tautan Dokumen Persiapan Lainnya'
              ]}
              defaultCategory="RPP / Modul Ajar (Form A)"
              canAddLink={!isLockedForTeacher || isPrincipal}
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

          {/* 3D Wizard Page Navigation Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setPageStep(2)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Sebelumnya (Lembar 2/4)
            </button>
            <button
              type="button"
              onClick={() => handleNextStepWithAutoSave(4)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white text-xs sm:text-sm font-extrabold border-b-4 border-indigo-950 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <span>Lanjutkan ke Tinjauan & Kirim (Lembar 4/4)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          HALAMAN 4 / 4: A8 TINJAUAN KEPALA SEKOLAH & PENGIRIMAN FORM A
         ===================================================================== */}
      {pageStep === 4 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 border-b-[6px] border-b-blue-700 p-6 sm:p-7 shadow-[0_14px_28px_-8px_rgba(15,23,42,0.1)] space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700">
                LEMBAR 4 DARI 4 • KONFIRMASI PENGIRIMAN & PERSETUJUAN JADWAL
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Ringkasan Form A & A8. Tinjauan Kepala Sekolah
              </h3>
            </div>
            <span className="px-3 py-1 rounded-xl bg-blue-100 text-blue-900 text-xs font-extrabold uppercase">
              Status: {formAStatus}
            </span>
          </div>

          {/* Summary of Form A */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs">
            <div className="space-y-2">
              <p className="font-extrabold text-slate-900 text-sm">Ringkasan Rencana Pembelajaran</p>
              <p><span className="text-slate-500">Guru:</span> <span className="font-bold">{activeCycle.teacher_name}</span></p>
              <p><span className="text-slate-500">Kelas / Mapel:</span> <span className="font-bold">{formatClassLabel(grade)} • {subject}</span></p>
              <p><span className="text-slate-500">Topik:</span> <span className="font-bold">{topic || '(Belum diisi)'}</span></p>
              <p><span className="text-slate-500">Usulan Jadwal:</span> <span className="font-bold">{formatIndonesianDate(proposedDate)} ({startTime} - {endTime} WIB) di {location}</span></p>
            </div>
            <div className="space-y-2">
              <p className="font-extrabold text-slate-900 text-sm">Fokus Indikator & Perilaku Sasaran</p>
              <p className="font-bold text-blue-800">{currentIndicator.title}</p>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                {currentIndicator.behaviors
                  .filter(b => targetBehaviors.includes(b.code))
                  .map(b => (
                    <li key={b.code}>{b.label}</li>
                  ))}
              </ul>
            </div>
          </div>

          {/* Teacher Submit Buttons */}
          {!isPrincipal && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs space-y-1">
                <p className="font-extrabold text-blue-950 text-sm">
                  {formAStatus === 'reviewed'
                    ? '✓ Jadwal Observasi Telah Disetujui Kepala Sekolah'
                    : formAStatus === 'submitted'
                    ? 'Persiapan supervisi Anda telah dikirim. Silakan menunggu konfirmasi jadwal dari kepala sekolah.'
                    : 'Pastikan seluruh isian Form A telah sesuai sebelum dikirim ke Kepala Sekolah.'}
                </p>
                {activeCycle.forms?.A?.payload?.review_note && (
                  <p className="text-slate-700">
                    <span className="font-bold">Catatan Kepala Sekolah:</span> "{activeCycle.forms.A.payload.review_note}"
                  </p>
                )}
              </div>

              {!isLockedForTeacher && (
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
                    {saving ? 'Mengirim...' : 'Kirim Persiapan (Form A)'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* A8. Principal Review & Schedule Confirmation Panel */}
          {isPrincipal && (
            <div className="p-5 rounded-2xl bg-indigo-50/70 border-2 border-indigo-200 space-y-4 text-xs">
              <div className="flex items-center gap-2 text-indigo-950 font-extrabold text-sm">
                <ShieldCheck className="w-5 h-5 text-indigo-700" />
                <span>A8. Panel Tinjauan & Konfirmasi Jadwal Observasi (Kepala Sekolah)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Tanggal Observasi Disetujui *</label>
                  <input
                    type="date"
                    value={confirmedSchedule}
                    onChange={e => setConfirmedSchedule(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-300 bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={confirmedStartTime}
                    onChange={e => setConfirmedStartTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-300 bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={confirmedEndTime}
                    onChange={e => setConfirmedEndTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-300 bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-extrabold text-slate-700 mb-1">Lokasi Terkonfirmasi</label>
                  <input
                    type="text"
                    value={confirmedLocation}
                    onChange={e => setConfirmedLocation(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-300 bg-white font-bold"
                  />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <label className="block font-extrabold text-slate-700">
                    Catatan Tinjauan & Persiapan Kepala Sekolah (A8)
                  </label>
                  <button
                    type="button"
                    onClick={handleGeneratePrincipalReviewAI}
                    disabled={aiReviewLoading}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-extrabold border-b-4 border-amber-700 active:border-b-0 active:translate-y-0.5 text-[11px] flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{aiReviewLoading ? 'Menyusun dengan API...' : 'Susun Catatan Tinjauan & Persiapan KS dengan API'}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  placeholder="Berikan apresiasi atau catatan penguatan terhadap persiapan observasi guru (atau klik tombol API di atas)..."
                  className="w-full p-3.5 rounded-xl border-2 border-slate-300 bg-white font-medium"
                />
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleAction('request_revision')}
                  className="px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold border-b-4 border-amber-300 cursor-pointer"
                >
                  Minta Revisi ke Guru
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleAction('principal_approve')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold border-b-4 border-emerald-900 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {saving ? 'Memproses...' : 'Setujui Form A & Konfirmasi Jadwal'}
                </button>
              </div>
            </div>
          )}

          {/* 3D Wizard Footer with "Lanjutkan ke Halaman Berikutnya" */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setPageStep(3)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Sebelumnya (Lembar 3/4)
            </button>

            <button
              type="button"
              onClick={() => onNavigatePage(isPrincipal ? 'ks_obs' : 'form_b', activeCycle)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-700 to-blue-800 hover:from-indigo-600 hover:to-blue-700 text-white text-xs sm:text-sm font-extrabold border-b-4 border-indigo-950 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <span>Lanjutkan ke Halaman Observasi (Form B)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Lihat Rubrik */}
      {showRubricModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 border-b-[7px] border-b-indigo-700 max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">
                  RUBRIK OBSERVASI KELAS INTERNAL (BISMA +)
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {currentIndicator.title}
                </h3>
              </div>
              <button
                onClick={() => setShowRubricModal(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-extrabold cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {currentIndicator.behaviors.map(b => (
                <div key={b.code} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="font-extrabold text-slate-900 text-sm">{b.label}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <p className="font-extrabold text-emerald-900 mb-1">✓ Perilaku yang Dianjurkan:</p>
                      <ul className="list-disc list-inside space-y-1 text-emerald-950">
                        {b.recommended_practices.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                      <p className="font-extrabold text-rose-900 mb-1">✕ Perilaku yang Dihindari:</p>
                      <ul className="list-disc list-inside space-y-1 text-rose-950">
                        {b.practices_to_avoid.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
