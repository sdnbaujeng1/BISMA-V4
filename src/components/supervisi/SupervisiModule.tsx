import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardCheck,
  FileText,
  MessageSquareText,
  Printer,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Award,
  BookOpenCheck,
  ShieldCheck,
  Settings
} from 'lucide-react';
import { useSchoolIdentity } from '../../hooks/useSchoolIdentity';
import SupervisiAuthAdapter from './SupervisiAuthAdapter';
import SupervisiDashboard from './SupervisiDashboard';
import SupervisiJadwal from './SupervisiJadwal';
import SupervisiForm from './SupervisiForm';
import SupervisiHasil from './SupervisiHasil';
import SupervisiRefleksi from './SupervisiRefleksi';
import SupervisiLaporan, { ReportDocType } from './SupervisiLaporan';
import SupervisiPengaturanAdmin from './SupervisiPengaturanAdmin';
import {
  SupervisiActor,
  SupervisiConfig,
  SupervisionCycle,
  TeacherDirectoryItem,
  FormAPayload,
  FormBPayload,
  FormCPayload,
  FormDPayload,
  DEFAULT_PRIORITY_INDICATORS
} from './types';

interface SupervisiModuleProps {
  user?: any;
  bismaUser?: any;
  onBack?: () => void;
  onBackToBisma?: () => void;
  embeddedInAdmin?: boolean;
}

interface PageMenuItem {
  id: string;
  pageNumber: number;
  label: string;
  shortLabel: string;
  subtitle: string;
  icon: any;
  cubeGradient: string;
  activeCard: string;
}

const TEACHER_PAGES: PageMenuItem[] = [
  {
    id: 'dashboard',
    pageNumber: 1,
    label: 'Menu Utama',
    shortLabel: 'Dashboard',
    subtitle: 'Pusat Kotak Ikon 3D',
    icon: LayoutDashboard,
    cubeGradient: 'from-indigo-500 to-blue-700 border-indigo-300 border-b-indigo-950',
    activeCard: 'bg-indigo-700 text-white border-indigo-900'
  },
  {
    id: 'form_a',
    pageNumber: 2,
    label: 'Persiapan (Form A)',
    shortLabel: 'Form A',
    subtitle: 'Jadwal & Perangkat',
    icon: Calendar,
    cubeGradient: 'from-blue-500 to-indigo-700 border-blue-300 border-b-blue-950',
    activeCard: 'bg-blue-700 text-white border-blue-950'
  },
  {
    id: 'form_b',
    pageNumber: 3,
    label: 'Observasi (Form B)',
    shortLabel: 'Form B',
    subtitle: 'Bukti Pengamatan',
    icon: ClipboardCheck,
    cubeGradient: 'from-violet-500 to-purple-800 border-violet-300 border-b-purple-950',
    activeCard: 'bg-violet-700 text-white border-purple-950'
  },
  {
    id: 'form_c',
    pageNumber: 4,
    label: 'Tindak Lanjut (Form C)',
    shortLabel: 'Form C',
    subtitle: 'Rencana Perbaikan',
    icon: FileText,
    cubeGradient: 'from-amber-400 to-orange-600 border-amber-200 border-b-orange-950',
    activeCard: 'bg-orange-600 text-white border-orange-950'
  },
  {
    id: 'form_d',
    pageNumber: 5,
    label: 'Refleksi (Form D)',
    shortLabel: 'Form D',
    subtitle: 'Dampak & Bukti',
    icon: MessageSquareText,
    cubeGradient: 'from-fuchsia-500 to-rose-700 border-pink-300 border-b-rose-950',
    activeCard: 'bg-rose-600 text-white border-rose-950'
  },
  {
    id: 'history_pdf',
    pageNumber: 6,
    label: 'Laporan PDF',
    shortLabel: 'Cetak PDF',
    subtitle: 'Arsip A4 Resmi',
    icon: Printer,
    cubeGradient: 'from-emerald-400 to-teal-700 border-emerald-200 border-b-emerald-950',
    activeCard: 'bg-emerald-600 text-white border-emerald-950'
  }
];

const PRINCIPAL_PAGES: PageMenuItem[] = [
  {
    id: 'dashboard',
    pageNumber: 1,
    label: 'Menu Utama',
    shortLabel: 'Dashboard',
    subtitle: 'Pusat Kotak Ikon 3D',
    icon: LayoutDashboard,
    cubeGradient: 'from-indigo-500 to-blue-700 border-indigo-300 border-b-indigo-950',
    activeCard: 'bg-indigo-700 text-white border-indigo-950'
  },
  {
    id: 'ks_prep',
    pageNumber: 2,
    label: 'Persiapan (Form A)',
    shortLabel: 'Form A',
    subtitle: 'Tinjau Jadwal Guru',
    icon: Calendar,
    cubeGradient: 'from-blue-500 to-indigo-700 border-blue-300 border-b-blue-950',
    activeCard: 'bg-blue-700 text-white border-blue-950'
  },
  {
    id: 'ks_obs',
    pageNumber: 3,
    label: 'Observasi (Form B)',
    shortLabel: 'Form B',
    subtitle: 'Bukti Pengamatan',
    icon: ClipboardCheck,
    cubeGradient: 'from-violet-500 to-purple-800 border-violet-300 border-b-purple-950',
    activeCard: 'bg-violet-700 text-white border-purple-950'
  },
  {
    id: 'ks_followup',
    pageNumber: 4,
    label: 'Tindak Lanjut (Form C)',
    shortLabel: 'Form C',
    subtitle: 'Tinjau Rencana Aksi',
    icon: FileText,
    cubeGradient: 'from-amber-400 to-orange-600 border-amber-200 border-b-orange-950',
    activeCard: 'bg-orange-600 text-white border-orange-950'
  },
  {
    id: 'ks_reflection',
    pageNumber: 5,
    label: 'Refleksi (Form D)',
    shortLabel: 'Form D',
    subtitle: 'Pembinaan & Finalisasi',
    icon: MessageSquareText,
    cubeGradient: 'from-fuchsia-500 to-rose-700 border-pink-300 border-b-rose-950',
    activeCard: 'bg-rose-600 text-white border-rose-950'
  },
  {
    id: 'ks_reports',
    pageNumber: 6,
    label: 'Laporan PDF',
    shortLabel: 'Cetak PDF',
    subtitle: '6 Format A4 Resmi',
    icon: Printer,
    cubeGradient: 'from-emerald-400 to-teal-700 border-emerald-200 border-b-emerald-950',
    activeCard: 'bg-emerald-600 text-white border-emerald-950'
  },
  {
    id: 'ks_teachers',
    pageNumber: 7,
    label: 'Data Guru',
    shortLabel: 'Data Guru',
    subtitle: 'Monitoring Siklus',
    icon: Users,
    cubeGradient: 'from-cyan-400 to-sky-700 border-cyan-200 border-b-cyan-950',
    activeCard: 'bg-cyan-700 text-white border-cyan-950'
  },
  {
    id: 'ks_settings',
    pageNumber: 8,
    label: 'Pengaturan',
    shortLabel: 'Pengaturan',
    subtitle: 'Kop, Logo & API AI',
    icon: Settings,
    cubeGradient: 'from-slate-600 to-slate-900 border-slate-400 border-b-black',
    activeCard: 'bg-slate-800 text-white border-slate-950'
  }
];

export default function SupervisiModule({
  user,
  bismaUser,
  onBack,
  onBackToBisma
}: SupervisiModuleProps) {
  const resolvedUser = bismaUser || user;
  const resolvedBack = onBack || onBackToBisma || (() => {});
  return (
    <SupervisiAuthAdapter bismaUser={resolvedUser} onExitToBisma={resolvedBack}>
      {({ actor, config }) => (
        <SupervisiWorkspace actor={actor} initialConfig={config} onBack={resolvedBack} />
      )}
    </SupervisiAuthAdapter>
  );
}

function SupervisiWorkspace({
  actor,
  initialConfig,
  onBack
}: {
  actor: SupervisiActor;
  initialConfig: SupervisiConfig;
  onBack: () => void;
}) {
  const schoolIdentity = useSchoolIdentity();
  const isPrincipal = actor.supervisiRole === 'kepala_sekolah';
  const pages = isPrincipal ? PRINCIPAL_PAGES : TEACHER_PAGES;

  const [activePageId, setActivePageId] = useState<string>('dashboard');
  const [config, setConfig] = useState<SupervisiConfig>(initialConfig);
  const [cycles, setCycles] = useState<SupervisionCycle[]>([]);
  const [teachers, setTeachers] = useState<TeacherDirectoryItem[]>([]);
  const [totalTargetTeachers, setTotalTargetTeachers] = useState<number>(0);
  const [selectedCycle, setSelectedCycle] = useState<SupervisionCycle | null>(null);
  const [initialReportType, setInitialReportType] = useState<ReportDocType>('FULL');
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 5000);
  };

  const fetchAllData = async (preserveCycleId?: string) => {
    setLoadingData(true);
    try {
      const qs = new URLSearchParams({
        nip: actor.nip || '',
        nama: actor.nama || '',
        role: actor.bismaRole || ''
      }).toString();

      const res = await fetch(`/api/supervisi/data?${qs}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Data belum tersimpan. Periksa koneksi internet lalu coba kembali.');
      }

      const loadedCycles: SupervisionCycle[] = json.data.cycles || [];
      setCycles(loadedCycles);
      setTeachers(json.data.teachers || []);
      setTotalTargetTeachers(json.data.totalTargetTeachers || 0);
      if (json.data.config) {
        setConfig({
          ...initialConfig,
          ...json.data.config,
          indicators: json.data.config.indicators || DEFAULT_PRIORITY_INDICATORS
        });
      }

      const targetId = preserveCycleId || selectedCycle?.id;
      if (targetId) {
        const matched = loadedCycles.find(c => c.id === targetId);
        setSelectedCycle(matched || loadedCycles[0] || null);
      } else {
        setSelectedCycle(loadedCycles[0] || null);
      }
    } catch (err: any) {
      showNotice('error', err?.message || 'Gagal memuat data supervisi dari Supabase.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [actor.uuid]);

  // Direct Navigation without any lock restrictions
  const handleNavigatePage = (pageId: string, cycle?: SupervisionCycle) => {
    if (cycle) {
      setSelectedCycle(cycle);
    }
    setActivePageId(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPrintReport = (reportType: ReportDocType, cycle?: SupervisionCycle) => {
    if (cycle) setSelectedCycle(cycle);
    setInitialReportType(reportType);
    setActivePageId(isPrincipal ? 'ks_reports' : 'history_pdf');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // CRUD Handlers
  const handleCreateCycle = async (cycleInput: any) => {
    const res = await fetch('/api/supervisi/cycle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor, cycleInput })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      showNotice('error', json.message || 'Gagal membuat siklus supervisi baru.');
      throw new Error(json.message);
    }
    showNotice('success', json.message);
    await fetchAllData(json.data?.id);
    setActivePageId(isPrincipal ? 'ks_prep' : 'form_a');
  };

  const handleUpdateCycle = async (cycleId: string, updates: any) => {
    const res = await fetch('/api/supervisi/update-cycle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor, cycle_id: cycleId, updates })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      showNotice('error', json.message || 'Gagal memperbarui siklus supervisi.');
      throw new Error(json.message);
    }
    showNotice('success', json.message);
    await fetchAllData(cycleId);
  };

  const handleDeleteCycle = async (cycleId: string) => {
    const res = await fetch('/api/supervisi/delete-cycle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor, cycle_id: cycleId })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      showNotice('error', json.message || 'Gagal menghapus siklus supervisi.');
      throw new Error(json.message);
    }
    showNotice('success', json.message);
    await fetchAllData();
  };

  const handleSaveFormA = async (
    cycleId: string,
    payload: Partial<FormAPayload>,
    action: 'save_draft' | 'submit' | 'principal_approve' | 'request_revision'
  ) => {
    const res = await fetch('/api/supervisi/form-a', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor, cycle_id: cycleId, payload, action })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      showNotice('error', json.message || 'Gagal menyimpan Form A.');
      throw new Error(json.message);
    }
    showNotice('success', json.message);
    await fetchAllData(cycleId);
  };

  const handleSaveFormB = async (
    cycleId: string,
    payload: Partial<FormBPayload>,
    publish: boolean
  ) => {
    const res = await fetch('/api/supervisi/form-b', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor, cycle_id: cycleId, payload, publish })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      showNotice('error', json.message || 'Gagal menyimpan Form B.');
      throw new Error(json.message);
    }
    showNotice('success', json.message);
    await fetchAllData(cycleId);
  };

  const handleSaveFormC = async (
    cycleId: string,
    payload: Partial<FormCPayload>,
    action: 'save_draft' | 'submit' | 'principal_review'
  ) => {
    const res = await fetch('/api/supervisi/form-c', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor, cycle_id: cycleId, payload, action })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      showNotice('error', json.message || 'Gagal menyimpan Form C.');
      throw new Error(json.message);
    }
    showNotice('success', json.message);
    await fetchAllData(cycleId);
  };

  const handleSaveFormD = async (
    cycleId: string,
    payload: Partial<FormDPayload>,
    action: 'save_draft' | 'submit' | 'principal_finalize'
  ) => {
    const res = await fetch('/api/supervisi/form-d', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor, cycle_id: cycleId, payload, action })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      showNotice('error', json.message || 'Gagal menyimpan Form D.');
      throw new Error(json.message);
    }
    showNotice('success', json.message);
    await fetchAllData(cycleId);
  };

  const handleUploadAttachment = async (params: {
    cycle_id: string;
    form_code: 'A' | 'B' | 'C' | 'D';
    file_name: string;
    mime_type?: string;
    base64_data?: string;
    drive_url?: string;
    evidence_category: string;
  }) => {
    const res = await fetch('/api/supervisi/upload-attachment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor, ...params })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      showNotice('error', json.message || 'Gagal menyematkan tautan bukti dukung.');
      throw new Error(json.message);
    }
    showNotice('success', json.message);
    await fetchAllData(params.cycle_id);
  };

  const handleSaveAttachmentNote = async (params: {
    cycle_id: string;
    attachment_id: string;
    principal_note: string;
  }) => {
    const res = await fetch('/api/supervisi/attachment-note', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor, ...params })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      showNotice('error', json.message || 'Gagal menyimpan catatan tinjauan Kepala Sekolah.');
      throw new Error(json.message);
    }
    showNotice('success', json.message);
    await fetchAllData(params.cycle_id);
  };

  const handleDeleteAttachment = async (params: {
    cycle_id: string;
    attachment_id: string;
  }) => {
    const res = await fetch('/api/supervisi/delete-attachment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor, ...params })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      showNotice('error', json.message || 'Gagal menghapus tautan.');
      throw new Error(json.message);
    }
    showNotice('success', json.message);
    await fetchAllData(params.cycle_id);
  };

  const currentIndex = Math.max(0, pages.findIndex(p => p.id === activePageId));
  const currentPage = pages[currentIndex] || pages[0];
  const prevPage = currentIndex > 0 ? pages[currentIndex - 1] : null;
  const nextPage = currentIndex < pages.length - 1 ? pages[currentIndex + 1] : null;

  const RoleIcon =
    actor.bismaRole === 'admin'
      ? ShieldCheck
      : actor.supervisiRole === 'kepala_sekolah'
      ? Award
      : BookOpenCheck;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top 3D App Bar */}
      <header className="no-print sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b-4 border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={onBack}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold border-b-4 border-slate-950 active:border-b-0 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Kembali ke BISMA</span>
            </button>

            {activePageId !== 'dashboard' && (
              <button
                onClick={() => handleNavigatePage('dashboard')}
                className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-extrabold border-b-4 border-blue-950 active:border-b-0 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Menu Kotak 3D</span>
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white border-b-4 border-indigo-950 flex items-center justify-center shadow-md shrink-0">
                <RoleIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white">
                  (BISMA +)
                </h1>
                <p className="text-[11px] text-slate-500 font-semibold truncate max-w-[180px] sm:max-w-none">
                  {schoolIdentity?.schoolName || config.schoolName}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                {actor.nama}
              </span>
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400">
                {actor.jabatan}
              </span>
            </div>

            <button
              onClick={() => fetchAllData()}
              disabled={loadingData}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 transition-all cursor-pointer"
              title="Sinkronkan Data Supabase"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div className="no-print fixed bottom-6 right-6 z-50 max-w-md animate-in fade-in slide-in-from-bottom-4">
          <div
            className={`p-4 rounded-2xl border-2 border-b-[5px] shadow-2xl flex items-start gap-3 text-xs font-bold ${
              toast.type === 'success'
                ? 'bg-emerald-950 text-white border-emerald-500 border-b-emerald-700'
                : 'bg-rose-950 text-white border-rose-500 border-b-rose-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <div className="flex-1 leading-relaxed">{toast.message}</div>
            <button onClick={() => setToast(null)} className="opacity-75 hover:opacity-100 cursor-pointer">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Container: Full Width, Uncluttered, Easy to Use */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Compact Responsive 3D Square Quick-Nav Bar when inside a specific page */}
        {activePageId !== 'dashboard' && (
          <div className="no-print bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 border-b-[5px] border-b-slate-300 p-3.5 shadow-sm">
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 gap-2">
              {pages.map(item => {
                const Icon = item.icon;
                const isActive = activePageId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigatePage(item.id)}
                    className={`group p-2.5 rounded-2xl border-2 border-b-4 transition-all flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer ${
                      isActive
                        ? `${item.activeCard} shadow-md -translate-y-0.5`
                        : 'bg-slate-50 hover:bg-white border-slate-200 border-b-slate-300 text-slate-700 hover:-translate-y-0.5'
                    }`}
                  >
                    <div
                      className={`relative w-9 h-9 rounded-xl bg-gradient-to-br ${item.cubeGradient} border border-b-[3px] text-white flex items-center justify-center shadow-sm`}
                    >
                      <div className="absolute inset-x-1 top-0.5 h-1 rounded-full bg-white/30 pointer-events-none" />
                      <Icon className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <span className="text-[11px] font-extrabold leading-tight truncate w-full">
                      {item.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Page Content */}
        <main className="min-w-0 space-y-6">
          {activePageId === 'dashboard' && (
            <SupervisiDashboard
              actor={actor}
              config={config}
              cycles={cycles}
              teachers={teachers}
              totalTargetTeachers={totalTargetTeachers}
              selectedCycle={selectedCycle}
              mode="overview"
              onSelectCycle={setSelectedCycle}
              onNavigatePage={handleNavigatePage}
              onCreateCycle={handleCreateCycle}
              onUpdateCycle={handleUpdateCycle}
              onDeleteCycle={handleDeleteCycle}
            />
          )}

          {activePageId === 'ks_teachers' && (
            <SupervisiDashboard
              actor={actor}
              config={config}
              cycles={cycles}
              teachers={teachers}
              totalTargetTeachers={totalTargetTeachers}
              selectedCycle={selectedCycle}
              mode="teacher_list"
              onSelectCycle={setSelectedCycle}
              onNavigatePage={handleNavigatePage}
              onCreateCycle={handleCreateCycle}
              onUpdateCycle={handleUpdateCycle}
              onDeleteCycle={handleDeleteCycle}
            />
          )}

          {(activePageId === 'form_a' || activePageId === 'ks_prep') && (
            <SupervisiJadwal
              actor={actor}
              config={config}
              cycles={cycles}
              selectedCycle={selectedCycle}
              onSelectCycle={setSelectedCycle}
              onSaveFormA={handleSaveFormA}
              onUploadAttachment={handleUploadAttachment}
              onSaveAttachmentNote={handleSaveAttachmentNote}
              onDeleteAttachment={handleDeleteAttachment}
              onNavigatePage={handleNavigatePage}
              onOpenPrintReport={handleOpenPrintReport}
            />
          )}

          {(activePageId === 'form_b' || activePageId === 'ks_obs') && (
            <SupervisiForm
              actor={actor}
              config={config}
              cycles={cycles}
              selectedCycle={selectedCycle}
              onSelectCycle={setSelectedCycle}
              onSaveFormB={handleSaveFormB}
              onUploadAttachment={handleUploadAttachment}
              onSaveAttachmentNote={handleSaveAttachmentNote}
              onDeleteAttachment={handleDeleteAttachment}
              onNavigatePage={handleNavigatePage}
              onOpenPrintReport={handleOpenPrintReport}
            />
          )}

          {(activePageId === 'form_c' || activePageId === 'ks_followup') && (
            <SupervisiHasil
              actor={actor}
              config={config}
              cycles={cycles}
              selectedCycle={selectedCycle}
              onSelectCycle={setSelectedCycle}
              onSaveFormC={handleSaveFormC}
              onUploadAttachment={handleUploadAttachment}
              onSaveAttachmentNote={handleSaveAttachmentNote}
              onDeleteAttachment={handleDeleteAttachment}
              onNavigatePage={handleNavigatePage}
              onOpenPrintReport={handleOpenPrintReport}
            />
          )}

          {(activePageId === 'form_d' || activePageId === 'ks_reflection') && (
            <SupervisiRefleksi
              actor={actor}
              config={config}
              cycles={cycles}
              selectedCycle={selectedCycle}
              onSelectCycle={setSelectedCycle}
              onSaveFormD={handleSaveFormD}
              onUploadAttachment={handleUploadAttachment}
              onSaveAttachmentNote={handleSaveAttachmentNote}
              onDeleteAttachment={handleDeleteAttachment}
              onNavigatePage={handleNavigatePage}
              onOpenPrintReport={handleOpenPrintReport}
            />
          )}

          {(activePageId === 'history_pdf' || activePageId === 'ks_reports') && (
            <SupervisiLaporan
              actor={actor}
              config={config}
              cycles={cycles}
              selectedCycle={selectedCycle}
              schoolIdentity={schoolIdentity}
              initialReportType={initialReportType}
              onSelectCycle={setSelectedCycle}
            />
          )}

          {activePageId === 'ks_settings' && (
            <SupervisiPengaturanAdmin
              actor={actor}
              config={config}
              onSaved={() => fetchAllData(selectedCycle?.id)}
            />
          )}

          {/* Global 3D Page-to-Page Footer ("Sebelumnya / Lanjutkan") */}
          {activePageId !== 'dashboard' && (
            <div className="no-print bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 border-b-[6px] border-b-slate-300 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                {prevPage ? (
                  <button
                    type="button"
                    onClick={() => handleNavigatePage(prevPage.id)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Sebelumnya: {prevPage.label}</span>
                  </button>
                ) : null}
              </div>

              <div className="text-center text-xs font-extrabold text-slate-600">
                Halaman {currentPage.pageNumber} dari {pages.length} • {currentPage.label}
              </div>

              <div>
                {nextPage ? (
                  <button
                    type="button"
                    onClick={() => handleNavigatePage(nextPage.id)}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white text-xs sm:text-sm font-extrabold border-b-4 border-indigo-950 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    <span>Lanjutkan ke {nextPage.label}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleNavigatePage('dashboard')}
                    className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold border-b-4 border-emerald-900 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Selesai • Kembali ke Menu Utama</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
