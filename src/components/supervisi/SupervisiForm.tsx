import React, { useEffect, useState } from 'react';
import {
  ClipboardCheck,
  Save,
  CheckCircle2,
  Lock,
  Printer,
  ArrowLeft,
  ArrowRight,
  EyeOff,
  Sparkles,
  Calendar,
  AlertCircle
} from 'lucide-react';
import {
  SupervisiActor,
  SupervisiConfig,
  SupervisionCycle,
  FormBPayload,
  BehaviorObservationRating,
  BehaviorRatingCode,
  DEFAULT_PRIORITY_INDICATORS,
  RATING_CATEGORIES,
  getIndicatorByCode,
  formatIndonesianDate,
  formatClassLabel
} from './types';
import DriveLinkSection from './DriveLinkSection';

interface SupervisiFormProps {
  actor: SupervisiActor;
  config: SupervisiConfig;
  cycles: SupervisionCycle[];
  selectedCycle: SupervisionCycle | null;
  onSelectCycle: (cycle: SupervisionCycle) => void;
  onSaveFormB: (cycleId: string, payload: Partial<FormBPayload>, publish: boolean) => Promise<void>;
  onUploadAttachment?: (params: {
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

const FORM_B_PAGES = [
  { step: 1, title: 'Lembar 1: Fokus Indikator & Panduan Praktik', short: '1. Panduan Fokus' },
  { step: 2, title: 'Lembar 2: Bukti Pengamatan & Kategori (1–3)', short: '2. Bukti & Kategori' },
  { step: 3, title: 'Lembar 3: Kekuatan, Rekomendasi & Publikasi', short: '3. Publikasi Hasil' }
];

export default function SupervisiForm({
  actor,
  config,
  cycles,
  selectedCycle,
  onSelectCycle,
  onSaveFormB,
  onUploadAttachment,
  onSaveAttachmentNote,
  onDeleteAttachment,
  onNavigatePage,
  onOpenPrintReport
}: SupervisiFormProps) {
  const isPrincipal = actor.supervisiRole === 'kepala_sekolah';
  const indicators = config.indicators || DEFAULT_PRIORITY_INDICATORS;
  const activeCycle = selectedCycle || cycles[0] || null;

  const [pageStep, setPageStep] = useState<number>(1);
  const [saving, setSaving] = useState<boolean>(false);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiNotice, setAiNotice] = useState<string>('');

  const [observedAt, setObservedAt] = useState<string>('');
  const [ratings, setRatings] = useState<BehaviorObservationRating[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [strengths, setStrengths] = useState<string>('');
  const [improvementAreas, setImprovementAreas] = useState<string>('');
  const [recommendations, setRecommendations] = useState<string>('');

  useEffect(() => {
    if (!activeCycle) return;
    const ind = getIndicatorByCode(
      activeCycle.forms?.A?.payload?.indicator_code || activeCycle.indicator_code,
      indicators
    );
    const selectedCodes = activeCycle.forms?.A?.payload?.target_behaviors || [];
    const targetBehaviorsList =
      selectedCodes.length > 0
        ? ind.behaviors.filter(b => selectedCodes.includes(b.code))
        : ind.behaviors;

    const existingB = activeCycle.forms?.B?.payload;
    setObservedAt(
      existingB?.observed_at ||
        activeCycle.confirmed_date ||
        activeCycle.proposed_date ||
        new Date().toISOString().split('T')[0]
    );
    setSummary(existingB?.summary || '');
    setStrengths(existingB?.strengths || '');
    setImprovementAreas(existingB?.improvement_areas || '');
    setRecommendations(existingB?.recommendations || '');

    const initialRatings: BehaviorObservationRating[] = targetBehaviorsList.map(beh => {
      const found = (existingB?.ratings || []).find(r => r.behavior_code === beh.code);
      return {
        behavior_code: beh.code,
        behavior_label: beh.label,
        rating: (found?.rating || 2) as BehaviorRatingCode,
        evidence: found?.evidence || '',
        learning_impact: found?.learning_impact || '',
        notes: found?.notes || ''
      };
    });
    setRatings(initialRatings);
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

  const currentIndicator = getIndicatorByCode(
    activeCycle.forms?.A?.payload?.indicator_code || activeCycle.indicator_code,
    indicators
  );
  const isPublished =
    activeCycle.forms?.B?.status === 'published' ||
    activeCycle.forms?.B?.status === 'finalized' ||
    Boolean(activeCycle.forms?.B?.payload?.is_published);
  const isCycleCompleted = activeCycle.state === 'completed';

  // Rule I & P.8: Teacher cannot view Form B until published by Principal!
  if (!isPrincipal && !isPublished) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-indigo-200 border-b-[7px] border-b-indigo-700 p-8 text-center shadow-[0_16px_32px_-10px_rgba(30,58,138,0.15)] max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-700 border-b-4 border-indigo-200 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <span className="px-3 py-1 rounded-xl bg-indigo-100 text-indigo-900 text-xs font-extrabold uppercase">
            MENUNGGU PUBLIKASI HASIL OBSERVASI KEPALA SEKOLAH
          </span>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-3 mb-2">
            Form B (Hasil Observasi Kinerja) Belum Dipublikasikan
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
            Sesuai prosedur supervisi reflektif <strong>(BISMA +)</strong>, catatan pengamatan kelas bersifat draf internal selama observasi berlangsung dan baru dapat dibaca oleh Guru setelah Kepala Sekolah mempublikasikan hasil observasi.
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left space-y-1.5 mb-6">
            <p><span className="text-slate-500">Fokus Indikator Anda:</span> <span className="font-extrabold text-slate-900">{currentIndicator.title}</span></p>
            <p><span className="text-slate-500">Jadwal Observasi:</span> <span className="font-extrabold text-slate-900">{formatIndonesianDate(activeCycle.confirmed_date || activeCycle.proposed_date)}</span></p>
            <p><span className="text-slate-500">Supervisor:</span> <span className="font-extrabold text-slate-900">{activeCycle.principal_name}</span></p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => onNavigatePage('form_a', activeCycle)}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-extrabold border-b-4 border-slate-950 flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Halaman Persiapan (Form A)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const updateRatingField = (code: string, field: keyof BehaviorObservationRating, value: any) => {
    if (!isPrincipal || isCycleCompleted) return;
    setRatings(prev =>
      prev.map(r => (r.behavior_code === code ? { ...r, [field]: value } : r))
    );
  };

  const handleSave = async (publish: boolean) => {
    setSaving(true);
    try {
      await onSaveFormB(
        activeCycle.id,
        {
          observed_at: observedAt,
          ratings,
          summary,
          strengths,
          improvement_areas: improvementAreas,
          recommendations
        },
        publish
      );
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateObservationEvidenceAI = async () => {
    setAiLoading(true);
    setAiNotice('');
    try {
      const res = await fetch('/api/supervisi/generate-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycle: {
            ...activeCycle,
            indicator_title: currentIndicator.title,
            forms: {
              ...activeCycle.forms,
              B: {
                ...(activeCycle.forms?.B || {}),
                payload: {
                  observed_at: observedAt,
                  ratings,
                  summary,
                  strengths,
                  improvement_areas: improvementAreas,
                  recommendations
                }
              }
            }
          },
          mode: 'observation_evidence'
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        const mainEvidence =
          d.bukti_pengamatan ||
          `Guru melaksanakan pembelajaran ${activeCycle.subject} pada ${formatClassLabel(activeCycle.grade)} dengan menerapkan fokus indikator ${currentIndicator.title} secara terstruktur dan interaktif.`;
        const mainImpact =
          d.dampak_murid ||
          'Murid tampak aktif berdiskusi di dalam kelompok, berani mengemukakan pendapat, serta mampu menyelesaikan tugas pembelajaran dengan baik.';

        setRatings(prev =>
          prev.map((item, idx) => ({
            ...item,
            evidence:
              item.evidence.trim() ||
              `${mainEvidence} Pada perilaku "${item.behavior_label}", guru memfasilitasi murid secara nyata di ruang kelas.`,
            learning_impact:
              item.learning_impact.trim() ||
              `${mainImpact} (Perilaku sasaran #${idx + 1} berdampak positif pada keterlibatan murid).`
          }))
        );

        if (d.ringkasan_observasi && !summary.trim()) {
          setSummary(d.ringkasan_observasi);
        } else if (!summary.trim()) {
          setSummary(mainEvidence);
        }
        if (d.kekuatan_utama && !strengths.trim()) {
          setStrengths(d.kekuatan_utama);
        }
        if (d.area_pengembangan && !improvementAreas.trim()) {
          setImprovementAreas(d.area_pengembangan);
        }
        if (d.rekomendasi_pembinaan && !recommendations.trim()) {
          setRecommendations(d.rekomendasi_pembinaan);
        }
        setAiNotice(
          'PENCATATAN BUKTI PENGAMATAN KELAS, dampak murid, kekuatan, dan rekomendasi pembinaan KS berhasil diisi menggunakan API tertanam berdasarkan data.'
        );
      }
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 3D Top Header */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 border-b-[6px] border-b-indigo-700 p-5 sm:p-6 shadow-[0_14px_28px_-8px_rgba(15,23,42,0.1)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-100 text-indigo-900 text-xs font-extrabold mb-1.5">
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>(BISMA +) • FORM B — HASIL OBSERVASI PRAKTIK PEMBELAJARAN (PER HALAMAN)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              Pengamatan Berbasis Bukti Nyata di Kelas
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Guru: <span className="font-bold text-slate-800 dark:text-slate-200">{activeCycle.teacher_name}</span> • {formatClassLabel(activeCycle.grade)} ({activeCycle.subject}) • Status:{' '}
              <span className={`font-extrabold uppercase ${isPublished ? 'text-emerald-700' : 'text-amber-700'}`}>
                {isPublished ? 'TERPUBLIKASI KE GURU' : 'DRAF PRIVAT KEPALA SEKOLAH'}
              </span>
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

            {isPrincipal && !isCycleCompleted && (
              <button
                type="button"
                onClick={handleGenerateObservationEvidenceAI}
                disabled={aiLoading}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiLoading ? 'Mengisi dari API...' : 'Isi Bukti Pengamatan & Catatan KS dengan API'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenPrintReport('B', activeCycle)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border-b-4 border-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak Form B
            </button>
          </div>
        </div>

        {/* 3D Stepper Lembar 1 - 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-5 pt-5 border-t border-slate-200/80">
          {FORM_B_PAGES.map(p => {
            const active = pageStep === p.step;
            const passed = pageStep > p.step;
            return (
              <button
                key={p.step}
                type="button"
                onClick={() => setPageStep(p.step)}
                className={`p-3 rounded-2xl border-2 border-b-4 text-left transition-all cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-indigo-700 to-blue-800 border-indigo-500 border-b-indigo-950 text-white shadow-md -translate-y-0.5'
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

      {/* =====================================================================
          HALAMAN 1 / 3: IDENTITAS, JADWAL & PANDUAN PRAKTIK FOKUS
         ===================================================================== */}
      {pageStep === 1 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 border-b-[6px] border-b-slate-300 p-6 sm:p-7 shadow-[0_14px_28px_-8px_rgba(15,23,42,0.08)] space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700">
                LEMBAR 1 DARI 3 • ACUAN OBSERVASI KELAS
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Identitas Pembelajaran & Fokus Perilaku yang Diamati
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="w-4 h-4 text-indigo-700" />
              <input
                type="date"
                value={observedAt}
                disabled={!isPrincipal || isCycleCompleted}
                onChange={e => setObservedAt(e.target.value)}
                className="px-3 py-1.5 rounded-xl border-2 border-slate-300 font-bold text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">Nama Guru & Kelas</span>
              <span className="font-extrabold text-slate-900 text-sm">
                {activeCycle.teacher_name} • {formatClassLabel(activeCycle.grade)}
              </span>
              <span className="block text-[11px] text-slate-500">Mapel: {activeCycle.subject}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Topik Pembelajaran (Form A)</span>
              <span className="font-extrabold text-slate-900 text-sm">
                {activeCycle.forms?.A?.payload?.topic || '-'}
              </span>
              <span className="block text-[11px] text-slate-500">
                Lokasi: {activeCycle.forms?.A?.payload?.confirmed_location || activeCycle.forms?.A?.payload?.location || `Ruang ${formatClassLabel(activeCycle.grade)}`}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Fokus Indikator Prioritas</span>
              <span className="font-extrabold text-indigo-800 text-sm">{currentIndicator.title}</span>
              <span className="block text-[11px] text-slate-500">{currentIndicator.dimension}</span>
            </div>
          </div>

          {/* Recommended Practices & Practices to Avoid Reference */}
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
              Daftar Perilaku Sasaran, Praktik yang Dianjurkan, dan Praktik yang Dihindari:
            </h4>
            {currentIndicator.behaviors.map(beh => (
              <div key={beh.code} className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3 text-xs">
                <p className="font-extrabold text-slate-900 text-sm">{beh.label}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                    <span className="font-extrabold block mb-1 text-emerald-800">✓ Praktik yang Dianjurkan:</span>
                    <ul className="list-disc list-inside space-y-1">
                      {beh.recommended_practices.map((rp, i) => <li key={i}>{rp}</li>)}
                    </ul>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-950">
                    <span className="font-extrabold block mb-1 text-rose-800">✕ Praktik yang Dihindari:</span>
                    <ul className="list-disc list-inside space-y-1">
                      {beh.practices_to_avoid.map((pa, i) => <li key={i}>{pa}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setPageStep(2)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-700 to-blue-800 hover:from-indigo-600 hover:to-blue-700 text-white text-xs sm:text-sm font-extrabold border-b-4 border-indigo-950 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <span>Lanjutkan ke Penilaian & Bukti Nyata (Lembar 2/3)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          HALAMAN 2 / 3: RATING MODEL 1-3 & BUKTI PENGAMATAN NYATA
         ===================================================================== */}
      {pageStep === 2 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 border-b-[6px] border-b-slate-300 p-6 sm:p-7 shadow-[0_14px_28px_-8px_rgba(15,23,42,0.08)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700">
                LEMBAR 2 DARI 3 • PENCATATAN BUKTI PENGAMATAN KELAS
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Kategori Perilaku (1–3) & Catatan Bukti Konkret di Kelas
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">
                Catatan: Kode 1–3 adalah kategori pembinaan internal (BISMA +), bukan predikat e-Kinerja ASN.
              </span>
            </div>

            {isPrincipal && !isCycleCompleted && (
              <button
                type="button"
                onClick={handleGenerateObservationEvidenceAI}
                disabled={aiLoading}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-extrabold border-b-4 border-amber-700 active:border-b-0 active:translate-y-0.5 text-xs flex items-center gap-2 cursor-pointer shadow-md shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>{aiLoading ? 'Menyusun Bukti Pengamatan...' : 'Isi PENCATATAN BUKTI PENGAMATAN KELAS dengan API'}</span>
              </button>
            )}
          </div>

          {aiNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{aiNotice}</span>
            </div>
          )}

          <div className="space-y-6">
            {ratings.map((item, idx) => (
              <div
                key={item.behavior_code}
                className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 border-b-[5px] border-b-slate-300 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-lg bg-indigo-100 text-indigo-900 text-[11px] font-extrabold">
                      Perilaku Sasaran #{idx + 1}
                    </span>
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mt-1">
                      {item.behavior_label}
                    </h4>
                  </div>
                </div>

                {/* Rating Model 1-3 Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {RATING_CATEGORIES.map(cat => {
                    const selected = item.rating === cat.code;
                    return (
                      <button
                        key={cat.code}
                        type="button"
                        disabled={!isPrincipal || isCycleCompleted}
                        onClick={() => updateRatingField(item.behavior_code, 'rating', cat.code)}
                        className={`p-3.5 rounded-2xl border-2 border-b-4 text-left transition-all cursor-pointer ${
                          selected
                            ? `${cat.cardClass} shadow-sm -translate-y-0.5 font-bold`
                            : 'bg-white border-slate-200 border-b-slate-300 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-extrabold">{cat.label}</span>
                          {selected && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                        </div>
                        <p className="text-[11px] opacity-85 leading-snug">{cat.description}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Concrete Observation Evidence & Learning Impact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-extrabold text-slate-800 mb-1">
                      Bukti Konkret Pengamatan di Kelas (Wajib Diisi Berdasarkan Fakta Observasi) *
                    </label>
                    <textarea
                      rows={3}
                      value={item.evidence}
                      disabled={!isPrincipal || isCycleCompleted}
                      onChange={e => updateRatingField(item.behavior_code, 'evidence', e.target.value)}
                      placeholder="Contoh: Saat diskusi kelompok, guru mengajukan pertanyaan terbuka dan mengundang siswa dari beberapa kelompok untuk berbagi ide..."
                      className="w-full p-3 rounded-xl border-2 border-slate-300 bg-white font-medium text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-extrabold text-slate-800 mb-1">
                      Dampak Perilaku Guru pada Pembelajaran Murid *
                    </label>
                    <textarea
                      rows={3}
                      value={item.learning_impact}
                      disabled={!isPrincipal || isCycleCompleted}
                      onChange={e => updateRatingField(item.behavior_code, 'learning_impact', e.target.value)}
                      placeholder="Contoh: Murid tampak antusias berdiskusi dan saling menanggapi gagasan teman secara aktif..."
                      className="w-full p-3 rounded-xl border-2 border-slate-300 bg-white font-medium text-slate-900"
                    />
                  </div>
                </div>
              </div>
            ))}
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
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-700 to-blue-800 hover:from-indigo-600 hover:to-blue-700 text-white text-xs sm:text-sm font-extrabold border-b-4 border-indigo-950 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <span>Lanjutkan ke Ringkasan & Publikasi (Lembar 3/3)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          HALAMAN 3 / 3: KEKUATAN, AREA PENGEMBANGAN, REKOMENDASI & PUBLIKASI
         ===================================================================== */}
      {pageStep === 3 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 border-b-[6px] border-b-indigo-700 p-6 sm:p-7 shadow-[0_14px_28px_-8px_rgba(15,23,42,0.1)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700">
                LEMBAR 3 DARI 3 • UMPAN BALIK PEMBINAAN & PUBLIKASI HASIL
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Ringkasan Observasi, Praktik Baik & Rekomendasi Kepala Sekolah
              </h3>
            </div>
            {isPrincipal && !isCycleCompleted && (
              <button
                type="button"
                onClick={handleGenerateObservationEvidenceAI}
                disabled={aiLoading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-extrabold border-b-4 border-amber-700 active:border-b-0 active:translate-y-0.5 text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiLoading ? 'Menyusun dengan API...' : 'Isi Catatan Tinjauan & Umpan Balik KS dengan API'}</span>
              </button>
            )}
          </div>

          {aiNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{aiNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-extrabold text-slate-800 mb-1.5">
                Ringkasan Umum Observasi Pembelajaran
              </label>
              <textarea
                rows={3}
                value={summary}
                disabled={!isPrincipal || isCycleCompleted}
                onChange={e => setSummary(e.target.value)}
                placeholder="Ringkasan jalannya proses pembelajaran di kelas..."
                className="w-full p-3.5 rounded-2xl border-2 border-slate-300 font-medium text-slate-900"
              />
            </div>
            <div>
              <label className="block font-extrabold text-emerald-800 mb-1.5">
                Praktik Baik / Kekuatan yang Teramati (Strengths) *
              </label>
              <textarea
                rows={3}
                value={strengths}
                disabled={!isPrincipal || isCycleCompleted}
                onChange={e => setStrengths(e.target.value)}
                placeholder="Hal-hal efektif yang sudah dilakukan guru dengan sangat baik..."
                className="w-full p-3.5 rounded-2xl border-2 border-emerald-300 bg-emerald-50/30 font-medium text-slate-900"
              />
            </div>
            <div>
              <label className="block font-extrabold text-amber-800 mb-1.5">
                Peluang Peningkatan / Area Pengembangan *
              </label>
              <textarea
                rows={3}
                value={improvementAreas}
                disabled={!isPrincipal || isCycleCompleted}
                onChange={e => setImprovementAreas(e.target.value)}
                placeholder="Praktik yang masih dapat ditingkatkan agar berdampak lebih optimal pada murid..."
                className="w-full p-3.5 rounded-2xl border-2 border-amber-300 bg-amber-50/30 font-medium text-slate-900"
              />
            </div>
            <div>
              <label className="block font-extrabold text-blue-800 mb-1.5">
                Rekomendasi Langkah Tindak Lanjut (Coaching Kepala Sekolah) *
              </label>
              <textarea
                rows={3}
                value={recommendations}
                disabled={!isPrincipal || isCycleCompleted}
                onChange={e => setRecommendations(e.target.value)}
                placeholder="Saran konkret dari Kepala Sekolah untuk ditindaklanjuti guru pada Form C..."
                className="w-full p-3.5 rounded-2xl border-2 border-blue-300 bg-blue-50/30 font-medium text-slate-900"
              />
            </div>
          </div>

          {/* Sematkan Link Drive / URL Dokumentasi Observasi Kelas (Form B) — Opsional */}
          {onUploadAttachment && (
            <DriveLinkSection
              actor={actor}
              cycle={activeCycle}
              formCode="B"
              optional={true}
              sectionTitle="Sematkan Link Drive / URL Dokumentasi Observasi Kelas (Form B)"
              sectionSubtitle="Bersifat opsional (tidak wajib). Anda dapat menyematkan tautan foto/video pengamatan kelas atau langsung menyimpan/mempublikasikan Form B tanpa tautan."
              categories={[
                'Dokumentasi Foto / Video Observasi Kelas',
                'Catatan Bukti Pengamatan Kelas',
                'Hasil Karya / Aktivitas Murid Saat Observasi',
                'Tautan Dokumentasi Observasi Lainnya'
              ]}
              defaultCategory="Dokumentasi Foto / Video Observasi Kelas"
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
          )}

          {isPrincipal && !isCycleCompleted && (
            <div className="p-5 rounded-2xl bg-indigo-50/80 border-2 border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs space-y-1">
                <p className="font-extrabold text-indigo-950 text-sm flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-indigo-700" />
                  <span>Kontrol Privasi & Publikasi Hasil Observasi</span>
                </p>
                <p className="text-slate-600">
                  Draf yang disimpan bersifat privat (hanya terlihat oleh Kepala Sekolah). Klik <strong>Publikasikan Hasil Observasi</strong> agar Guru dapat membaca hasil dan mengisi Form C.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave(false)}
                  className="px-4 py-2.5 rounded-xl bg-white border-2 border-slate-300 border-b-4 text-slate-800 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Simpan Draf Privat
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave(true)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold border-b-4 border-emerald-900 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {saving ? 'Memproses...' : 'Publikasikan Hasil Observasi (Form B)'}
                </button>
              </div>
            </div>
          )}

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
              onClick={() => onNavigatePage(isPrincipal ? 'ks_followup' : 'form_c', activeCycle)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs sm:text-sm font-extrabold border-b-4 border-emerald-950 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <span>Lanjutkan ke Halaman Rencana Tindak Lanjut (Form C)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
