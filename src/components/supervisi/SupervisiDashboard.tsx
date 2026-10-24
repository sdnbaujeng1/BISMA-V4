import React, { useState } from 'react';
import {
  Users,
  Calendar,
  ClipboardCheck,
  FileText,
  ArrowRight,
  CheckCircle2,
  Plus,
  Search,
  BookOpen,
  Award,
  ShieldCheck,
  MessageSquareText,
  Printer,
  Settings,
  Pencil,
  Trash2
} from 'lucide-react';
import {
  SupervisiActor,
  SupervisiConfig,
  SupervisionCycle,
  TeacherDirectoryItem,
  CYCLE_STATE_META,
  DEFAULT_PRIORITY_INDICATORS,
  GRADE_OPTIONS,
  getIndicatorByCode,
  getNextActionForCycle,
  formatIndonesianDate,
  formatClassLabel,
  getCycleStageUnlocks
} from './types';

interface SupervisiDashboardProps {
  actor: SupervisiActor;
  config: SupervisiConfig;
  cycles: SupervisionCycle[];
  teachers: TeacherDirectoryItem[];
  totalTargetTeachers: number;
  selectedCycle: SupervisionCycle | null;
  mode?: 'overview' | 'teacher_list';
  onSelectCycle: (cycle: SupervisionCycle) => void;
  onNavigatePage: (pageId: string, cycle?: SupervisionCycle) => void;
  onCreateCycle: (input: {
    teacher_nip?: string;
    teacher_name?: string;
    teacher_assignment?: string;
    academic_year: string;
    semester: string;
    grade: string;
    subject: string;
    indicator_code: string;
    proposed_date: string;
  }) => Promise<void>;
  onUpdateCycle?: (cycleId: string, updates: any) => Promise<void>;
  onDeleteCycle?: (cycleId: string) => Promise<void>;
}

export const SQUARE_3D_MENUS = [
  {
    key: 'stage_1',
    number: 1,
    title: 'Persiapan',
    badge: 'Form A',
    subtitle: 'Jadwal & Link Perangkat',
    pageTeacher: 'form_a',
    pageKS: 'ks_prep',
    icon: Calendar,
    tileBg: 'from-blue-50 via-white to-sky-50 hover:from-blue-100/80 hover:to-sky-100/80',
    tileBorder: 'border-blue-300 border-b-blue-600 text-blue-950',
    iconCube: 'from-blue-500 via-blue-600 to-indigo-700 border-blue-300 border-b-blue-950 shadow-blue-500/30',
    accentText: 'text-blue-700'
  },
  {
    key: 'stage_2',
    number: 2,
    title: 'Observasi Kelas',
    badge: 'Form B',
    subtitle: 'Bukti Pengamatan Kelas',
    pageTeacher: 'form_b',
    pageKS: 'ks_obs',
    icon: ClipboardCheck,
    tileBg: 'from-violet-50 via-white to-purple-50 hover:from-violet-100/80 hover:to-purple-100/80',
    tileBorder: 'border-violet-300 border-b-violet-600 text-violet-950',
    iconCube: 'from-violet-500 via-purple-600 to-indigo-800 border-violet-300 border-b-purple-950 shadow-violet-500/30',
    accentText: 'text-violet-700'
  },
  {
    key: 'stage_3',
    number: 3,
    title: 'Tindak Lanjut',
    badge: 'Form C',
    subtitle: 'Refleksi & Rencana Aksi',
    pageTeacher: 'form_c',
    pageKS: 'ks_followup',
    icon: FileText,
    tileBg: 'from-amber-50 via-white to-orange-50 hover:from-amber-100/80 hover:to-orange-100/80',
    tileBorder: 'border-amber-300 border-b-orange-600 text-amber-950',
    iconCube: 'from-amber-400 via-orange-500 to-red-600 border-amber-200 border-b-orange-950 shadow-orange-500/30',
    accentText: 'text-orange-700'
  },
  {
    key: 'stage_4',
    number: 4,
    title: 'Refleksi Dampak',
    badge: 'Form D',
    subtitle: 'Evaluasi & Bukti Dukung',
    pageTeacher: 'form_d',
    pageKS: 'ks_reflection',
    icon: MessageSquareText,
    tileBg: 'from-rose-50 via-white to-pink-50 hover:from-rose-100/80 hover:to-pink-100/80',
    tileBorder: 'border-rose-300 border-b-rose-600 text-rose-950',
    iconCube: 'from-fuchsia-500 via-pink-600 to-rose-700 border-pink-300 border-b-rose-950 shadow-rose-500/30',
    accentText: 'text-rose-700'
  },
  {
    key: 'stage_5',
    number: 5,
    title: 'Laporan PDF',
    badge: 'Cetak A4',
    subtitle: 'Arsip & Kop Resmi',
    pageTeacher: 'history_pdf',
    pageKS: 'ks_reports',
    icon: Printer,
    tileBg: 'from-emerald-50 via-white to-teal-50 hover:from-emerald-100/80 hover:to-teal-100/80',
    tileBorder: 'border-emerald-300 border-b-emerald-600 text-emerald-950',
    iconCube: 'from-emerald-400 via-teal-500 to-emerald-700 border-emerald-200 border-b-emerald-950 shadow-emerald-500/30',
    accentText: 'text-emerald-700'
  }
];

export const KS_EXTRA_SQUARE_MENUS = [
  {
    key: 'ks_teachers',
    number: 6,
    title: 'Data Guru',
    badge: 'Monitoring',
    subtitle: 'Daftar & Siklus Guru',
    pageTarget: 'ks_teachers',
    icon: Users,
    tileBg: 'from-cyan-50 via-white to-sky-50 hover:from-cyan-100/80 hover:to-sky-100/80',
    tileBorder: 'border-cyan-300 border-b-cyan-600 text-cyan-950',
    iconCube: 'from-cyan-400 via-sky-500 to-blue-700 border-cyan-200 border-b-cyan-950 shadow-cyan-500/30',
    accentText: 'text-cyan-700'
  },
  {
    key: 'ks_settings',
    number: 7,
    title: 'Pengaturan',
    badge: 'Admin / KS',
    subtitle: 'Kop, Logo & API AI',
    pageTarget: 'ks_settings',
    icon: Settings,
    tileBg: 'from-slate-50 via-white to-indigo-50 hover:from-slate-100 hover:to-indigo-100/70',
    tileBorder: 'border-slate-300 border-b-slate-700 text-slate-900',
    iconCube: 'from-slate-600 via-slate-700 to-slate-900 border-slate-400 border-b-black shadow-slate-500/30',
    accentText: 'text-slate-700'
  }
];

export default function SupervisiDashboard({
  actor,
  config,
  cycles,
  teachers,
  totalTargetTeachers,
  selectedCycle,
  mode = 'overview',
  onSelectCycle,
  onNavigatePage,
  onCreateCycle,
  onUpdateCycle,
  onDeleteCycle
}: SupervisiDashboardProps) {
  const isPrincipal = actor.supervisiRole === 'kepala_sekolah';
  const indicators = config.indicators || DEFAULT_PRIORITY_INDICATORS;

  // Simple Filters for Principal Monitoring
  const [filterGrade, setFilterGrade] = useState<string>('ALL');
  const [filterState, setFilterState] = useState<string>('ALL');
  const [searchTeacher, setSearchTeacher] = useState<string>('');

  // Modal Create New Cycle
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTeacherNip, setNewTeacherNip] = useState(
    isPrincipal ? (teachers[0]?.nip || '') : actor.nip
  );
  const [newGrade, setNewGrade] = useState('IV');
  const [newSubject, setNewSubject] = useState('IPAS');
  const [newIndicator, setNewIndicator] = useState('student_engagement');
  const [newProposedDate, setNewProposedDate] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  );
  const [newSemester, setNewSemester] = useState(config.semesterAktif || 'Semester 2 (Genap)');

  // Modal Edit Cycle (KS)
  const [editingCycle, setEditingCycle] = useState<SupervisionCycle | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Modal Delete Cycle Confirmation (KS)
  const [deletingCycle, setDeletingCycle] = useState<SupervisionCycle | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const chosenTeacher = teachers.find(t => t.nip === newTeacherNip || t.nama_guru === newTeacherNip);
      await onCreateCycle({
        teacher_nip: isPrincipal ? (chosenTeacher?.nip || newTeacherNip) : actor.nip,
        teacher_name: isPrincipal ? (chosenTeacher?.nama_guru || actor.nama) : actor.nama,
        teacher_assignment: isPrincipal
          ? (chosenTeacher?.mengajar || `Guru ${formatClassLabel(newGrade)}`)
          : (actor.mengajar || `Guru ${formatClassLabel(newGrade)}`),
        academic_year: config.tahunPelajaranAktif || '2024/2025',
        semester: newSemester,
        grade: newGrade,
        subject: newSubject,
        indicator_code: newIndicator,
        proposed_date: newProposedDate
      });
      setShowCreateModal(false);
    } finally {
      setCreating(false);
    }
  };

  const handleEditSubmit = async (updates: any) => {
    if (!editingCycle || !onUpdateCycle) return;
    setSavingEdit(true);
    try {
      await onUpdateCycle(editingCycle.id, updates);
      setEditingCycle(null);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCycle || !onDeleteCycle) return;
    setDeleting(true);
    try {
      await onDeleteCycle(deletingCycle.id);
      setDeletingCycle(null);
    } finally {
      setDeleting(false);
    }
  };

  const activeCycle = selectedCycle || cycles[0] || null;
  const stageUnlocks = getCycleStageUnlocks(activeCycle, false);

  const isStageFilled = (idx: number) => {
    const filledArr = [
      stageUnlocks.stage1Filled,
      stageUnlocks.stage2Filled,
      stageUnlocks.stage3Filled,
      stageUnlocks.stage4Filled,
      stageUnlocks.stage5Filled
    ];
    return Boolean(filledArr[idx]);
  };

  const handleSquareIconClick = (st: typeof SQUARE_3D_MENUS[number]) => {
    const targetPage = isPrincipal ? st.pageKS : st.pageTeacher;
    onNavigatePage(targetPage, activeCycle || undefined);
  };

  // =========================================================================
  // TEACHER VIEW — SIMPLE, CLEAN 3D SQUARE ICON HUB
  // =========================================================================
  if (!isPrincipal) {
    const nextAction = activeCycle ? getNextActionForCycle(activeCycle, 'guru') : null;

    return (
      <div className="space-y-6">
        {/* Compact & Friendly Teacher Welcome Header */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 border-2 border-indigo-400/30 border-b-[6px] border-b-indigo-950 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
              <BookOpen className="w-4 h-4" />
              <span>(BISMA +) • SUPERVISI AKADEMIK GURU</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Halo, {actor.nama}
            </h2>
            <p className="text-xs text-blue-100/90">
              {config.schoolName} • {activeCycle ? `${formatClassLabel(activeCycle.grade)} (${activeCycle.subject})` : config.tahunPelajaranAktif}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {cycles.length > 1 && (
              <select
                value={activeCycle?.id || ''}
                onChange={e => {
                  const found = cycles.find(c => c.id === e.target.value);
                  if (found) onSelectCycle(found);
                }}
                className="px-3.5 py-2.5 rounded-2xl bg-white/15 border border-white/25 text-white text-xs font-extrabold cursor-pointer"
              >
                {cycles.map(c => (
                  <option key={c.id} value={c.id} className="text-slate-900">
                    {formatClassLabel(c.grade)} - {c.subject} ({c.semester})
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-extrabold text-xs border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Siklus Baru</span>
            </button>
          </div>
        </div>

        {/* RESPONSIVE 3D SQUARE ICON MENU FOR GURU (ALL UNLOCKED, DISTINCT COLORS) */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 border-b-[6px] border-b-slate-300 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Menu Utama Supervisi (Klik Kotak Ikon 3D)
              </h3>
              <p className="text-xs text-slate-500">
                Semua menu langsung terbuka — pilih tahapan yang ingin Anda isi atau lihat
              </p>
            </div>
            {activeCycle && (
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 hidden sm:inline">
                Status: {CYCLE_STATE_META[activeCycle.state].shortLabel}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-4">
            {SQUARE_3D_MENUS.map((st, idx) => {
              const IconComp = st.icon;
              const filled = isStageFilled(idx);
              return (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => handleSquareIconClick(st)}
                  className={`group aspect-square rounded-3xl bg-gradient-to-br ${st.tileBg} border-2 border-b-[6px] ${st.tileBorder} p-4 flex flex-col items-center justify-between text-center shadow-sm hover:-translate-y-1 hover:shadow-lg active:translate-y-0.5 active:border-b-2 transition-all cursor-pointer`}
                >
                  <div className="w-full flex items-center justify-between text-[10px] font-extrabold opacity-80">
                    <span>{st.badge}</span>
                    {filled ? (
                      <span className="text-emerald-700 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Terisi
                      </span>
                    ) : (
                      <span>0{st.number}</span>
                    )}
                  </div>

                  {/* 3D Extruded Square Icon Cube */}
                  <div
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${st.iconCube} border-2 border-b-[5px] text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform my-1`}
                  >
                    <div className="absolute inset-x-1.5 top-1 h-2 rounded-full bg-white/30 pointer-events-none" />
                    <IconComp className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
                  </div>

                  <div className="space-y-0.5 w-full">
                    <p className="text-xs sm:text-sm font-black leading-tight truncate">
                      {st.title}
                    </p>
                    <p className="text-[10px] sm:text-[11px] font-medium opacity-75 line-clamp-1">
                      {st.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Simple Summary Cards for Guru */}
        {activeCycle ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Jadwal & Fokus */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 border-b-[5px] border-b-blue-600 p-5 shadow-sm flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-extrabold text-blue-700 uppercase">Jadwal & Fokus Observasi</span>
                  <span>{formatIndonesianDate(activeCycle.confirmed_date || activeCycle.proposed_date)}</span>
                </div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {formatClassLabel(activeCycle.grade)} • {activeCycle.subject}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Indikator Fokus: <span className="font-bold text-slate-900 dark:text-white">{getIndicatorByCode(activeCycle.indicator_code, indicators).title}</span>
                </p>
              </div>

              {nextAction && (
                <button
                  onClick={() => onNavigatePage(nextAction.targetPage, activeCycle)}
                  className="w-full py-2.5 px-4 rounded-2xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-extrabold border-b-4 border-blue-950 active:border-b-0 active:translate-y-0.5 transition-all flex items-center justify-between cursor-pointer"
                >
                  <span>{nextAction.title}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              )}
            </div>

            {/* Catatan Kepala Sekolah */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 border-b-[5px] border-b-emerald-600 p-5 shadow-sm flex flex-col justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-extrabold text-emerald-700 uppercase">Catatan / Umpan Balik Kepala Sekolah</span>
                  <span>{activeCycle.principal_name}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {activeCycle.forms?.D?.payload?.coaching_feedback ||
                    activeCycle.forms?.C?.payload?.principal_review_note ||
                    activeCycle.forms?.B?.payload?.recommendations ||
                    activeCycle.forms?.A?.payload?.review_note ||
                    'Belum ada catatan umpan balik terbaru pada siklus ini.'}
                </p>
              </div>
              <div className="flex items-center justify-end">
                <button
                  onClick={() => onNavigatePage('history_pdf', activeCycle)}
                  className="text-xs font-extrabold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Lihat & Cetak Laporan A4</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 border-b-[5px] border-b-slate-300 p-6 text-center">
            <p className="text-sm font-bold text-slate-700 mb-3">
              Belum ada siklus supervisi aktif. Klik tombol di bawah untuk memulai:
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-2xl bg-blue-700 hover:bg-blue-600 text-white font-extrabold text-xs border-b-4 border-blue-950 inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Buat Siklus Supervisi Baru
            </button>
          </div>
        )}

        {showCreateModal && (
          <CreateCycleModal
            isPrincipal={false}
            teachers={teachers}
            indicators={indicators}
            newTeacherNip={newTeacherNip}
            setNewTeacherNip={setNewTeacherNip}
            newGrade={newGrade}
            setNewGrade={setNewGrade}
            newSubject={newSubject}
            setNewSubject={setNewSubject}
            newIndicator={newIndicator}
            setNewIndicator={setNewIndicator}
            newProposedDate={newProposedDate}
            setNewProposedDate={setNewProposedDate}
            newSemester={newSemester}
            setNewSemester={setNewSemester}
            creating={creating}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateSubmit}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // PRINCIPAL / ADMIN VIEW — CLEAN, RESPONSIVE 3D SQUARE ICON HUB
  // =========================================================================
  const totalTeachersCount = Math.max(totalTargetTeachers, teachers.length, 1);
  const uniqueTeachersWithCycles = new Set(cycles.map(c => c.teacher_name.toLowerCase().trim())).size;
  const completedObservationsCount = cycles.filter(c =>
    ['observed', 'followup', 'reflected', 'completed'].includes(c.state)
  ).length;
  const finalizedCyclesCount = cycles.filter(c => c.state === 'completed').length;
  const overallCompletionPct = Math.min(
    100,
    Math.round((uniqueTeachersWithCycles / totalTeachersCount) * 100)
  );

  const filteredCycles = cycles.filter(c => {
    if (filterGrade !== 'ALL' && c.grade !== filterGrade) return false;
    if (filterState !== 'ALL' && c.state !== filterState) return false;
    if (searchTeacher.trim()) {
      const q = searchTeacher.toLowerCase().trim();
      const matchName = c.teacher_name.toLowerCase().includes(q);
      const matchSubj = c.subject.toLowerCase().includes(q);
      if (!matchName && !matchSubj) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Compact & Clean Header for Kepala Sekolah / Admin */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-5 sm:p-6 border-2 border-blue-400/25 border-b-[6px] border-b-slate-950 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-300">
            {actor.bismaRole === 'admin' ? <ShieldCheck className="w-4 h-4" /> : <Award className="w-4 h-4" />}
            <span>(BISMA +) • {config.kopHeaderLine2 || 'DINAS PENDIDIKAN'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {config.schoolName}
          </h2>
          <p className="text-xs text-blue-100/85">
            Supervisor: <span className="font-bold text-white">{actor.headmasterName}</span> (NIP. {actor.headmasterNIP})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {cycles.length > 0 && (
            <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-2xl px-3 py-1.5">
              <span className="text-[11px] font-bold text-sky-200">Guru Aktif:</span>
              <select
                value={activeCycle?.id || ''}
                onChange={e => {
                  const found = cycles.find(c => c.id === e.target.value);
                  if (found) onSelectCycle(found);
                }}
                className="bg-transparent text-white text-xs font-extrabold focus:outline-none cursor-pointer"
              >
                {cycles.map(c => (
                  <option key={c.id} value={c.id} className="text-slate-900">
                    {c.teacher_name} ({formatClassLabel(c.grade)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-extrabold text-xs border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tambah Siklus Guru</span>
          </button>
        </div>
      </div>

      {/* RESPONSIVE 3D SQUARE ICON GRID FOR KEPALA SEKOLAH / ADMIN (ALL UNLOCKED, DISTINCT COLORS) */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 border-b-[6px] border-b-slate-300 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              Menu Cepat Supervisi (Kotak Ikon 3D)
            </h3>
            <p className="text-xs text-slate-500">
              Pilih guru di atas lalu klik kotak ikon 3D untuk langsung membuka halaman tanpa penguncian
            </p>
          </div>
          {activeCycle && (
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
              Guru Terpilih: {activeCycle.teacher_name} ({formatClassLabel(activeCycle.grade)})
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-3.5">
          {SQUARE_3D_MENUS.map((st, idx) => {
            const IconComp = st.icon;
            const filled = isStageFilled(idx);
            return (
              <button
                key={st.key}
                type="button"
                onClick={() => handleSquareIconClick(st)}
                className={`group aspect-square rounded-3xl bg-gradient-to-br ${st.tileBg} border-2 border-b-[6px] ${st.tileBorder} p-3.5 flex flex-col items-center justify-between text-center shadow-sm hover:-translate-y-1 hover:shadow-lg active:translate-y-0.5 active:border-b-2 transition-all cursor-pointer`}
              >
                <div className="w-full flex items-center justify-between text-[10px] font-extrabold opacity-80">
                  <span>{st.badge}</span>
                  {filled ? (
                    <span className="text-emerald-700 flex items-center gap-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span>0{st.number}</span>
                  )}
                </div>

                {/* 3D Extruded Square Icon */}
                <div
                  className={`relative w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${st.iconCube} border-2 border-b-[5px] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform my-1`}
                >
                  <div className="absolute inset-x-1.5 top-1 h-1.5 rounded-full bg-white/30 pointer-events-none" />
                  <IconComp className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
                </div>

                <div className="space-y-0.5 w-full">
                  <p className="text-xs font-black leading-tight truncate">{st.title}</p>
                  <p className="text-[10px] font-medium opacity-75 line-clamp-1">{st.subtitle}</p>
                </div>
              </button>
            );
          })}

          {KS_EXTRA_SQUARE_MENUS.map(ex => {
            const IconComp = ex.icon;
            return (
              <button
                key={ex.key}
                type="button"
                onClick={() => onNavigatePage(ex.pageTarget)}
                className={`group aspect-square rounded-3xl bg-gradient-to-br ${ex.tileBg} border-2 border-b-[6px] ${ex.tileBorder} p-3.5 flex flex-col items-center justify-between text-center shadow-sm hover:-translate-y-1 hover:shadow-lg active:translate-y-0.5 active:border-b-2 transition-all cursor-pointer`}
              >
                <div className="w-full flex items-center justify-between text-[10px] font-extrabold opacity-80">
                  <span>{ex.badge}</span>
                  <span>0{ex.number}</span>
                </div>

                <div
                  className={`relative w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${ex.iconCube} border-2 border-b-[5px] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform my-1`}
                >
                  <div className="absolute inset-x-1.5 top-1 h-1.5 rounded-full bg-white/30 pointer-events-none" />
                  <IconComp className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
                </div>

                <div className="space-y-0.5 w-full">
                  <p className="text-xs font-black leading-tight truncate">{ex.title}</p>
                  <p className="text-[10px] font-medium opacity-75 line-clamp-1">{ex.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Compact 4-Stat Summary Row */}
      {mode === 'overview' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[
            { label: 'Total Guru Sasaran', value: totalTeachersCount, sub: 'Pendidik Aktif', border: 'border-b-slate-600 text-slate-900' },
            { label: 'Keterlaksanaan', value: `${uniqueTeachersWithCycles} (${overallCompletionPct}%)`, sub: 'Guru Bersiklus', border: 'border-b-blue-600 text-blue-900' },
            { label: 'Sudah Diobservasi', value: completedObservationsCount, sub: 'Form B Selesai', border: 'border-b-violet-600 text-violet-900' },
            { label: 'Siklus Tuntas', value: finalizedCyclesCount, sub: 'Laporan Final', border: 'border-b-emerald-600 text-emerald-900' }
          ].map((stat, i) => (
            <div
              key={i}
              className={`bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 border-b-[5px] p-4 shadow-sm ${stat.border}`}
            >
              <p className="text-[11px] font-extrabold text-slate-500 uppercase">{stat.label}</p>
              <p className="text-2xl font-black tracking-tight mt-0.5">{stat.value}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Easy-to-Use Teacher Supervision Table with Direct Stage Buttons */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 border-b-[6px] border-b-slate-300 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Daftar Siklus Supervisi Guru
            </h3>
            <p className="text-xs text-slate-500">
              Klik tombol A / B / C / D / PDF pada baris guru untuk langsung membuka halaman terkait
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTeacher}
                onChange={e => setSearchTeacher(e.target.value)}
                placeholder="Cari nama guru..."
                className="pl-9 pr-3 py-2 rounded-xl border-2 border-slate-200 text-xs font-semibold focus:border-blue-600 focus:outline-none"
              />
            </div>

            <select
              value={filterGrade}
              onChange={e => setFilterGrade(e.target.value)}
              className="px-3 py-2 rounded-xl border-2 border-slate-200 text-xs font-bold text-slate-700 bg-white"
            >
              <option value="ALL">Semua Kelas</option>
              {GRADE_OPTIONS.map(g => (
                <option key={g} value={g}>{formatClassLabel(g)}</option>
              ))}
            </select>

            <select
              value={filterState}
              onChange={e => setFilterState(e.target.value)}
              className="px-3 py-2 rounded-xl border-2 border-slate-200 text-xs font-bold text-slate-700 bg-white"
            >
              <option value="ALL">Semua Status</option>
              <option value="draft">Persiapan</option>
              <option value="scheduled">Terjadwal</option>
              <option value="observed">Diobservasi</option>
              <option value="followup">Tindak Lanjut</option>
              <option value="reflected">Direfleksi</option>
              <option value="completed">Selesai</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 text-[11px] font-extrabold uppercase text-slate-500 bg-slate-50/80">
                <th className="py-3 px-4 rounded-tl-xl">Nama Guru</th>
                <th className="py-3 px-3">Kelas & Mapel</th>
                <th className="py-3 px-3">Tgl Observasi</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 rounded-tr-xl text-right">Buka Halaman & Aksi KS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 text-xs">
              {filteredCycles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-semibold">
                    Tidak ada data siklus supervisi yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredCycles.map(cyc => {
                  const stateMeta = CYCLE_STATE_META[cyc.state];
                  const isSelected = activeCycle?.id === cyc.id;

                  return (
                    <tr
                      key={cyc.id}
                      onClick={() => onSelectCycle(cyc)}
                      className={`hover:bg-blue-50/50 transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-50/70' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-extrabold text-slate-900 dark:text-white">{cyc.teacher_name}</p>
                        <p className="text-[11px] text-slate-500">NIP. {cyc.teacher_nip}</p>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-700">
                        {formatClassLabel(cyc.grade)} • {cyc.subject}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 font-medium">
                        {formatIndonesianDate(cyc.confirmed_date || cyc.proposed_date)}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-700">
                        {stateMeta.shortLabel}
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                          {[
                            { label: 'Form A', page: 'ks_prep', cls: 'bg-blue-600 hover:bg-blue-500 border-blue-900' },
                            { label: 'Form B', page: 'ks_obs', cls: 'bg-violet-600 hover:bg-violet-500 border-violet-900' },
                            { label: 'Form C', page: 'ks_followup', cls: 'bg-orange-500 hover:bg-orange-400 border-orange-800' },
                            { label: 'Form D', page: 'ks_reflection', cls: 'bg-rose-600 hover:bg-rose-500 border-rose-900' },
                            { label: 'PDF', page: 'ks_reports', cls: 'bg-emerald-600 hover:bg-emerald-500 border-emerald-900' }
                          ].map(btn => (
                            <button
                              key={btn.page}
                              type="button"
                              onClick={() => {
                                onSelectCycle(cyc);
                                onNavigatePage(btn.page, cyc);
                              }}
                              className={`px-2.5 py-1.5 rounded-xl text-white text-[11px] font-extrabold border-b-[3px] active:border-b-0 active:translate-y-0.5 transition-all cursor-pointer ${btn.cls}`}
                            >
                              {btn.label}
                            </button>
                          ))}

                          <button
                            type="button"
                            onClick={() => setEditingCycle(cyc)}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-extrabold border border-amber-300 border-b-[3px] border-b-amber-500 active:border-b-0 active:translate-y-0.5 transition-all inline-flex items-center gap-1 cursor-pointer"
                            title="Edit Siklus Supervisi"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingCycle(cyc)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 text-[11px] font-extrabold border border-rose-300 border-b-[3px] border-b-rose-500 active:border-b-0 active:translate-y-0.5 transition-all inline-flex items-center gap-1 cursor-pointer"
                            title="Hapus Siklus Supervisi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <CreateCycleModal
          isPrincipal={true}
          teachers={teachers}
          indicators={indicators}
          newTeacherNip={newTeacherNip}
          setNewTeacherNip={setNewTeacherNip}
          newGrade={newGrade}
          setNewGrade={setNewGrade}
          newSubject={newSubject}
          setNewSubject={setNewSubject}
          newIndicator={newIndicator}
          setNewIndicator={setNewIndicator}
          newProposedDate={newProposedDate}
          setNewProposedDate={setNewProposedDate}
          newSemester={newSemester}
          setNewSemester={setNewSemester}
          creating={creating}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSubmit}
        />
      )}

      {editingCycle && (
        <EditCycleModal
          cycle={editingCycle}
          teachers={teachers}
          indicators={indicators}
          saving={savingEdit}
          onClose={() => setEditingCycle(null)}
          onSubmit={handleEditSubmit}
        />
      )}

      {deletingCycle && (
        <DeleteCycleModal
          cycle={deletingCycle}
          deleting={deleting}
          onClose={() => setDeletingCycle(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

function CreateCycleModal({
  isPrincipal,
  teachers,
  indicators,
  newTeacherNip,
  setNewTeacherNip,
  newGrade,
  setNewGrade,
  newSubject,
  setNewSubject,
  newIndicator,
  setNewIndicator,
  newProposedDate,
  setNewProposedDate,
  newSemester,
  setNewSemester,
  creating,
  onClose,
  onSubmit
}: any) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 border-b-[7px] border-b-blue-700 max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">
              SIKLUS SUPERVISI BARU (BISMA +)
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Mulai Siklus Supervisi Akademik
            </h3>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold cursor-pointer"
          >
            Tutup
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          {isPrincipal && (
            <div>
              <label className="block font-extrabold text-slate-700 mb-1">Pilih Guru Sasaran</label>
              <select
                value={newTeacherNip}
                onChange={e => setNewTeacherNip(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-800"
                required
              >
                {teachers.map((t: TeacherDirectoryItem) => (
                  <option key={t.nip + t.nama_guru} value={t.nip}>
                    {t.nama_guru} ({t.mengajar})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-extrabold text-slate-700 mb-1">Semester</label>
              <select
                value={newSemester}
                onChange={e => setNewSemester(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-800"
              >
                <option value="Semester 1 (Ganjil)">Semester 1 (Ganjil)</option>
                <option value="Semester 2 (Genap)">Semester 2 (Genap)</option>
              </select>
            </div>
            <div>
              <label className="block font-extrabold text-slate-700 mb-1">Kelas (I–VI)</label>
              <select
                value={newGrade}
                onChange={e => setNewGrade(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-800"
              >
                {GRADE_OPTIONS.map(g => (
                  <option key={g} value={g}>{formatClassLabel(g)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-extrabold text-slate-700 mb-1">Mata Pelajaran</label>
              <input
                type="text"
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
                placeholder="Contoh: IPAS / Matematika"
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block font-extrabold text-slate-700 mb-1">Usulan Tanggal Observasi</label>
              <input
                type="date"
                value={newProposedDate}
                onChange={e => setNewProposedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-800"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 mb-1">Fokus Indikator Observasi (A3)</label>
            <select
              value={newIndicator}
              onChange={e => setNewIndicator(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-800"
            >
              {indicators.map((ind: any) => (
                <option key={ind.code} value={ind.code}>
                  {ind.number}. {ind.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-extrabold border-b-4 border-blue-950 active:border-b-0 active:translate-y-1 transition-all cursor-pointer"
            >
              {creating ? 'Membuat Siklus...' : 'Buat & Lanjutkan ke Form A →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditCycleModal({
  cycle,
  teachers,
  indicators,
  saving,
  onClose,
  onSubmit
}: {
  cycle: SupervisionCycle;
  teachers: TeacherDirectoryItem[];
  indicators: any[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (updates: any) => Promise<void>;
}) {
  const [teacherNip, setTeacherNip] = useState(cycle.teacher_nip || '');
  const [teacherName, setTeacherName] = useState(cycle.teacher_name || '');
  const [academicYear, setAcademicYear] = useState(cycle.academic_year || '2024/2025');
  const [semester, setSemester] = useState(cycle.semester || 'Semester 2 (Genap)');
  const [grade, setGrade] = useState(String(cycle.grade || 'IV').replace(/^(?:kelas\s*)+/i, '').trim() || 'IV');
  const [subject, setSubject] = useState(cycle.subject || 'IPAS');
  const [indicatorCode, setIndicatorCode] = useState(cycle.indicator_code || 'student_engagement');
  const [proposedDate, setProposedDate] = useState(
    cycle.confirmed_date || cycle.proposed_date || new Date().toISOString().split('T')[0]
  );
  const [state, setState] = useState(cycle.state || 'draft');

  const handleTeacherChange = (val: string) => {
    const found = teachers.find(t => t.nip === val || t.nama_guru === val);
    if (found) {
      setTeacherNip(found.nip);
      setTeacherName(found.nama_guru);
    } else {
      setTeacherName(val);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      teacher_nip: teacherNip,
      teacher_name: teacherName,
      academic_year: academicYear,
      semester,
      grade,
      subject,
      indicator_code: indicatorCode,
      proposed_date: proposedDate,
      confirmed_date: proposedDate,
      state
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 border-b-[7px] border-b-amber-600 max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">
              EDIT DATA SIKLUS SUPERVISI GURU (BISMA +)
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Edit Siklus — {cycle.teacher_name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold cursor-pointer"
          >
            Tutup
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-extrabold text-slate-700 mb-1">Guru Sasaran</label>
            <select
              value={teacherNip}
              onChange={e => handleTeacherChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-800 bg-white"
            >
              {teachers.map(t => (
                <option key={t.nip + t.nama_guru} value={t.nip}>
                  {t.nama_guru} ({t.mengajar})
                </option>
              ))}
              {!teachers.some(t => t.nip === teacherNip) && (
                <option value={teacherNip}>{teacherName}</option>
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-extrabold text-slate-700 mb-1">Tahun Pelajaran</label>
              <input
                type="text"
                value={academicYear}
                onChange={e => setAcademicYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block font-extrabold text-slate-700 mb-1">Semester</label>
              <select
                value={semester}
                onChange={e => setSemester(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-800 bg-white"
              >
                <option value="Semester 1 (Ganjil)">Semester 1 (Ganjil)</option>
                <option value="Semester 2 (Genap)">Semester 2 (Genap)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-extrabold text-slate-700 mb-1">Kelas (I–VI)</label>
              <select
                value={grade}
                onChange={e => setGrade(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-800 bg-white"
              >
                {GRADE_OPTIONS.map(g => (
                  <option key={g} value={g}>
                    {formatClassLabel(g)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-extrabold text-slate-700 mb-1">Mata Pelajaran</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-800"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-extrabold text-slate-700 mb-1">Tanggal Observasi</label>
              <input
                type="date"
                value={proposedDate}
                onChange={e => setProposedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block font-extrabold text-slate-700 mb-1">Status Tahapan</label>
              <select
                value={state}
                onChange={e => setState(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-800 bg-white"
              >
                <option value="draft">1. Persiapan</option>
                <option value="scheduled">2. Terjadwal</option>
                <option value="observed">3. Diobservasi</option>
                <option value="followup">4. Tindak Lanjut</option>
                <option value="reflected">5. Direfleksi</option>
                <option value="completed">6. Selesai (Final)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-extrabold text-slate-700 mb-1">Fokus Indikator Observasi</label>
            <select
              value={indicatorCode}
              onChange={e => setIndicatorCode(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-800 bg-white"
            >
              {indicators.map((ind: any) => (
                <option key={ind.code} value={ind.code}>
                  {ind.number}. {ind.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-700 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold border-b-4 border-amber-900 active:border-b-0 active:translate-y-1 transition-all cursor-pointer"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteCycleModal({
  cycle,
  deleting,
  onClose,
  onConfirm
}: {
  cycle: SupervisionCycle;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-rose-200 border-b-[7px] border-b-rose-700 max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 border-b-4 border-rose-300 flex items-center justify-center shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700">
              KONFIRMASI HAPUS SIKLUS SUPERVISI
            </span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Hapus Siklus Supervisi Guru?
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Anda yakin ingin menghapus data siklus supervisi untuk{' '}
          <strong className="text-slate-900 dark:text-white">{cycle.teacher_name}</strong> ({formatClassLabel(cycle.grade)} • {cycle.subject})? Tindakan ini akan menghapus seluruh data formulir pada siklus ini.
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
          <button
            type="button"
            disabled={deleting}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border-2 border-slate-300 font-bold text-slate-700 text-xs cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs border-b-4 border-rose-950 active:border-b-0 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>{deleting ? 'Menghapus...' : 'Ya, Hapus Siklus'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

