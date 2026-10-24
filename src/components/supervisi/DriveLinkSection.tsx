import React, { useState } from 'react';
import {
  Link2,
  Eye,
  ExternalLink,
  Sparkles,
  Save,
  X,
  CheckCircle2,
  FileText,
  MessageSquareText,
  ShieldCheck,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  SupervisiActor,
  SupervisionCycle,
  SupervisionAttachment,
  toEmbedPreviewUrl,
  formatIndonesianDate,
  formatClassLabel
} from './types';

interface DriveLinkSectionProps {
  actor: SupervisiActor;
  cycle: SupervisionCycle;
  formCode: 'A' | 'B' | 'C' | 'D';
  sectionTitle?: string;
  sectionSubtitle?: string;
  defaultCategory?: string;
  categoryOptions?: string[];
  categories?: string[];
  indicatorTitle?: string;
  topic?: string;
  isLocked?: boolean;
  canAddLink?: boolean;
  optional?: boolean;
  onEmbedLink?: (params: {
    cycle_id: string;
    form_code: 'A' | 'B' | 'C' | 'D';
    file_name: string;
    link_url: string;
    evidence_category: string;
  }) => Promise<void>;
  onAddDriveLink?: (params: {
    cycle_id: string;
    form_code: 'A' | 'B' | 'C' | 'D';
    file_name: string;
    drive_url: string;
    evidence_category: string;
    principal_note?: string;
  }) => Promise<void>;
  onSaveAttachmentNote?: (params: {
    cycle_id: string;
    attachment_id: string;
    principal_note: string;
    file_name?: string;
    link_url?: string;
  }) => Promise<void>;
  onDeleteAttachment?: (params: {
    cycle_id: string;
    attachment_id: string;
  }) => Promise<void>;
}

export default function DriveLinkSection({
  actor,
  cycle,
  formCode,
  sectionTitle = 'Sematkan Link Google Drive / URL Dokumen Pendukung',
  sectionSubtitle = 'Masukkan tautan Google Drive (RPP, Modul Ajar, LKPD, Foto/Video Pembelajaran) agar dapat ditinjau langsung oleh Kepala Sekolah.',
  defaultCategory = 'Dokumen Persiapan / Modul Ajar',
  categoryOptions,
  categories,
  indicatorTitle = '',
  topic = '',
  isLocked = false,
  canAddLink = true,
  optional = false,
  onEmbedLink,
  onAddDriveLink,
  onSaveAttachmentNote,
  onDeleteAttachment
}: DriveLinkSectionProps) {
  const isPrincipal = actor.supervisiRole === 'kepala_sekolah';
  const attachments = (cycle.attachments || []).filter(a => a.form_code === formCode);
  const resolvedCategories = categoryOptions || categories || [];
  const allowAdding = !isLocked && canAddLink;

  // If optional and no attachments yet, start collapsed to keep the form clean & uncluttered
  const [isExpanded, setIsExpanded] = useState<boolean>(!optional || attachments.length > 0);
  const [docTitle, setDocTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Pop-up modal state for Preview & Principal Note Editing
  const [activeAttachment, setActiveAttachment] = useState<SupervisionAttachment | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [principalNote, setPrincipalNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanUrl = linkUrl.trim();
    if (!cleanUrl) {
      setErrorMsg('Silakan isi tautan Google Drive atau URL terlebih dahulu.');
      return;
    }
    const normalizedUrl = /^https?:\/\//i.test(cleanUrl) ? cleanUrl : `https://${cleanUrl}`;
    const finalTitle = docTitle.trim() || `Dokumen Form ${formCode} (${category})`;

    setSubmitting(true);
    try {
      if (onEmbedLink) {
        await onEmbedLink({
          cycle_id: cycle.id,
          form_code: formCode,
          file_name: finalTitle,
          link_url: normalizedUrl,
          evidence_category: category
        });
      } else if (onAddDriveLink) {
        await onAddDriveLink({
          cycle_id: cycle.id,
          form_code: formCode,
          file_name: finalTitle,
          drive_url: normalizedUrl,
          evidence_category: category
        });
      }
      setDocTitle('');
      setLinkUrl('');
    } finally {
      setSubmitting(false);
    }
  };

  const openPreviewModal = (att: SupervisionAttachment) => {
    setActiveAttachment(att);
    setEditTitle(att.file_name || '');
    setEditUrl(att.link_url || att.download_url || '');
    setPrincipalNote(att.principal_note || '');
  };

  const handleGenerateAiNote = async () => {
    if (!activeAttachment) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/supervisi/ai-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor,
          mode: 'attachment_ks_note',
          stage: `Tinjauan Berkas Form ${formCode}`,
          teacher_name: cycle.teacher_name,
          grade: cycle.grade,
          subject: cycle.subject,
          topic: topic || cycle.forms?.A?.payload?.topic || cycle.subject,
          indicator_title: indicatorTitle,
          file_name: editTitle || activeAttachment.file_name,
          evidence_category: activeAttachment.evidence_category
        })
      });
      const json = await res.json();
      if (json.success && json.suggestions?.principal_note) {
        setPrincipalNote(json.suggestions.principal_note);
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveModal = async () => {
    if (!activeAttachment || !onSaveAttachmentNote) return;
    setSavingNote(true);
    try {
      await onSaveAttachmentNote({
        cycle_id: cycle.id,
        attachment_id: activeAttachment.id,
        principal_note: principalNote,
        file_name: editTitle,
        link_url: editUrl
      });
      setActiveAttachment(null);
    } finally {
      setSavingNote(false);
    }
  };

  const previewEmbedUrl = activeAttachment
    ? toEmbedPreviewUrl(editUrl || activeAttachment.link_url || activeAttachment.download_url)
    : '';

  return (
    <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-slate-900/70 dark:to-slate-800 border-2 border-slate-200 dark:border-slate-700 border-b-[5px] border-b-blue-600 space-y-4 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-b-[3px] border-indigo-950 flex items-center justify-center shadow-sm shrink-0">
              <Link2 className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {sectionTitle}
            </h4>
            {optional && (
              <span className="text-[11px] font-bold text-slate-500">
                (Opsional / Tidak Wajib)
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {sectionSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-slate-600 font-bold text-[11px]">
            {attachments.length} Link Tersimpan
          </span>
          {optional && allowAdding && (
            <button
              type="button"
              onClick={() => setIsExpanded(prev => !prev)}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-blue-700 font-extrabold text-[11px] border-2 border-blue-200 border-b-4 active:border-b-2 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isExpanded ? (
                <>
                  <span>Sembunyikan Form</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>+ Sematkan Link (Opsional)</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Form Sematkan Link Drive / URL */}
      {allowAdding && isExpanded && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200/90 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {resolvedCategories.length > 0 ? (
              <div>
                <label className="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
                  Kategori Bukti Dukung {optional ? '(Opsional)' : ''}
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-300 bg-slate-50 font-bold text-slate-800"
                >
                  {resolvedCategories.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
                  Judul Dokumen / Berkas {optional ? '(Opsional)' : '*'}
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={e => setDocTitle(e.target.value)}
                  placeholder="Contoh: Modul Ajar & LKPD Google Drive"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-semibold text-slate-900"
                />
              </div>
            )}

            {resolvedCategories.length > 0 && (
              <div>
                <label className="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
                  Judul Dokumen / Berkas {optional ? '(Opsional)' : '*'}
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={e => setDocTitle(e.target.value)}
                  placeholder="Contoh: Dokumentasi Observasi Kelas"
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-semibold text-slate-900"
                />
              </div>
            )}

            <div className={resolvedCategories.length > 0 ? '' : 'md:col-span-2'}>
              <label className="block font-extrabold text-slate-700 dark:text-slate-200 mb-1">
                Sematkan Link Google Drive / URL {optional ? '(Opsional)' : '*'}
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/... (Kosongkan jika tidak ada)"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border-2 border-slate-300 font-semibold text-slate-900"
                />
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleAddLink}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-extrabold border-b-4 border-indigo-950 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
                >
                  <Link2 className="w-4 h-4" />
                  <span>{submitting ? 'Menyimpan...' : 'Sematkan Link'}</span>
                </button>
              </div>
            </div>
          </div>

          {errorMsg && (
            <p className="text-[11px] font-bold text-rose-600">{errorMsg}</p>
          )}
        </div>
      )}

      {/* Daftar Link Drive / URL yang Telah Disematkan */}
      {attachments.length > 0 && (
        <div className="space-y-2.5">
          {attachments.map(att => {
            const url = att.link_url || att.download_url || '';
            return (
              <div
                key={att.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 border-b-4 border-b-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-400 transition-all"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </span>
                    <button
                      type="button"
                      onClick={() => openPreviewModal(att)}
                      className="font-extrabold text-slate-900 dark:text-white hover:text-blue-700 text-left truncate cursor-pointer"
                    >
                      {att.file_name}
                    </button>
                    <span className="text-slate-500 text-[11px] font-medium">
                      • {att.evidence_category}
                    </span>
                    {att.principal_note && (
                      <span className="text-emerald-700 text-[11px] font-extrabold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Ada Catatan KS
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-blue-600 truncate pl-9">{url}</p>
                  {att.principal_note && (
                    <div className="ml-9 mt-1.5 p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-[11px] text-emerald-950">
                      <span className="font-extrabold text-emerald-800">Catatan Kepala Sekolah: </span>
                      "{att.principal_note}"
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 pl-9 sm:pl-0">
                  <button
                    type="button"
                    onClick={() => openPreviewModal(att)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-500 hover:to-blue-600 text-white font-extrabold text-[11px] border-b-[3px] border-indigo-950 active:border-b-0 active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isPrincipal ? 'Pratinjau & Edit Catatan KS' : 'Pratinjau & Lihat Catatan'}</span>
                  </button>
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                      title="Buka di Tab Baru"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {onDeleteAttachment && allowAdding && (
                    <button
                      type="button"
                      onClick={() => onDeleteAttachment({ cycle_id: cycle.id, attachment_id: att.id })}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                      title="Hapus Tautan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* POP-UP MODAL PRATINJAU & EDIT CATATAN KEPALA SEKOLAH */}
      {activeAttachment && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 border-b-[7px] border-b-indigo-700 max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-blue-200 text-[10px] font-extrabold uppercase mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>PRATINJAU TAUTAN DRIVE/URL & CATATAN TINJAUAN KEPALA SEKOLAH</span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold truncate">
                  {activeAttachment.file_name}
                </h3>
                <p className="text-[11px] text-blue-200/80">
                  Guru: {cycle.teacher_name} • {formatClassLabel(cycle.grade)} ({cycle.subject}) • Disematkan pada {formatIndonesianDate(activeAttachment.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveAttachment(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Split View (Preview Iframe + Note Editor) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left 7 cols: Live Document Preview */}
              <div className="lg:col-span-7 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span>Pratinjau Dokumen Google Drive / URL</span>
                  </span>
                  <a
                    href={editUrl || activeAttachment.link_url || activeAttachment.download_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-[11px] border border-blue-200 flex items-center gap-1.5"
                  >
                    <span>Buka Tautan Asli</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="w-full h-[340px] sm:h-[420px] rounded-2xl border-2 border-slate-300 bg-slate-100 overflow-hidden relative">
                  {previewEmbedUrl ? (
                    <iframe
                      src={previewEmbedUrl}
                      title={activeAttachment.file_name}
                      className="w-full h-full border-0"
                      allow="autoplay"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 p-6 text-center">
                      Tautan tidak tersedia untuk pratinjau.
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Tips: Pastikan akses berbagi Google Drive diatur ke <em>"Siapa saja yang memiliki link dapat melihat"</em> agar pratinjau tampil langsung di dalam jendela ini.
                </p>
              </div>

              {/* Right 5 cols: Link Details & Principal Review Note Editor */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 space-y-3">
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-600 mb-1">
                        Judul Dokumen / Perangkat Ajar
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-600 mb-1">
                        Tautan Google Drive / URL
                      </label>
                      <input
                        type="url"
                        value={editUrl}
                        onChange={e => setEditUrl(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-blue-700 text-xs"
                      />
                    </div>
                  </div>

                  {/* Principal Review Note Section */}
                  <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border-2 border-indigo-200 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                        <MessageSquareText className="w-4 h-4 text-indigo-700" />
                        <span>Catatan Tinjauan Kepala Sekolah</span>
                      </label>
                      {isPrincipal && (
                        <button
                          type="button"
                          disabled={aiLoading}
                          onClick={handleGenerateAiNote}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-[11px] border-b-[3px] border-amber-800 active:border-b-0 active:translate-y-0.5 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{aiLoading ? 'Menyusun...' : 'Isi dengan API AI'}</span>
                        </button>
                      )}
                    </div>

                    <textarea
                      rows={5}
                      value={principalNote}
                      disabled={!isPrincipal}
                      onChange={e => setPrincipalNote(e.target.value)}
                      placeholder={
                        isPrincipal
                          ? 'Tuliskan catatan tinjauan, apresiasi, atau saran perbaikan terhadap dokumen yang disematkan...'
                          : 'Belum ada catatan tinjauan dari Kepala Sekolah untuk berkas ini.'
                      }
                      className="w-full p-3.5 rounded-xl border-2 border-indigo-200 bg-white font-medium text-slate-900 text-xs leading-relaxed"
                    />

                    {activeAttachment.reviewed_by_name && (
                      <p className="text-[10px] font-semibold text-indigo-800">
                        Ditinjau oleh: {activeAttachment.reviewed_by_name} ({formatIndonesianDate(activeAttachment.reviewed_at)})
                      </p>
                    )}
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setActiveAttachment(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    disabled={savingNote}
                    onClick={handleSaveModal}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs border-b-4 border-emerald-950 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {savingNote
                        ? 'Menyimpan...'
                        : isPrincipal
                        ? 'Simpan Catatan Tinjauan KS'
                        : 'Simpan Perubahan Link'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
