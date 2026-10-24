import React, { useState, useMemo } from 'react';
import { 
  X, Download, Copy, Check, Search, FileCode2, Terminal, Shield, 
  User, GraduationCap, Briefcase, Monitor, Award, BookOpen, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ringkasanPromptData, 
  downloadPromptSummaryJson, 
  downloadPromptSummaryJs,
  PromptRoleItem,
  PromptFeatureItem
} from '../data/ringkasanPromptData';

interface PromptSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PromptSummaryModal({ isOpen, onClose }: PromptSummaryModalProps) {
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedType, setCopiedType] = useState<'json' | 'js' | null>(null);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);

  const roleIcons: Record<string, React.ReactNode> = {
    admin: <Shield className="w-4 h-4 text-rose-500" />,
    ks: <Award className="w-4 h-4 text-indigo-500" />,
    guru: <User className="w-4 h-4 text-emerald-500" />,
    walikelas: <BookOpen className="w-4 h-4 text-amber-500" />,
    tendik: <Briefcase className="w-4 h-4 text-cyan-500" />,
    siswa: <GraduationCap className="w-4 h-4 text-purple-500" />,
    monitoring: <Monitor className="w-4 h-4 text-teal-500" />
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(ringkasanPromptData, null, 2));
      setCopiedType('json');
      setTimeout(() => setCopiedType(null), 2500);
    } catch {
      alert('Gagal menyalin ke clipboard.');
    }
  };

  const handleCopyJs = async () => {
    try {
      const jsContent = `export const ringkasanPromptAplikasi = ${JSON.stringify(ringkasanPromptData, null, 2)};\nexport default ringkasanPromptAplikasi;`;
      await navigator.clipboard.writeText(jsContent);
      setCopiedType('js');
      setTimeout(() => setCopiedType(null), 2500);
    } catch {
      alert('Gagal menyalin ke clipboard.');
    }
  };

  const filteredRoles = useMemo(() => {
    let roles = ringkasanPromptData.roles;
    if (selectedRole !== 'all') {
      roles = roles.filter(r => r.id === selectedRole);
    }
    if (!searchQuery.trim()) {
      return roles;
    }
    const q = searchQuery.toLowerCase();
    return roles.map(role => {
      const matchingFeatures = role.fitur.filter(f => 
        f.nama.toLowerCase().includes(q) ||
        f.kategori.toLowerCase().includes(q) ||
        f.ringkasan_prompt.toLowerCase().includes(q) ||
        f.logika_utama.toLowerCase().includes(q)
      );
      return {
        ...role,
        fitur: matchingFeatures
      };
    }).filter(r => r.fitur.length > 0 || r.nama.toLowerCase().includes(q));
  }, [selectedRole, searchQuery]);

  const totalFilteredFeatures = useMemo(() => {
    return filteredRoles.reduce((acc, r) => acc + r.fitur.length, 0);
  }, [filteredRoles]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl flex flex-col max-h-[92vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <FileCode2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    Ringkasan Prompt Fitur per Role
                  </h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                    JSON & JS Ready
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Blueprint rekayasa sistem, input, logika utama, dan output seluruh fitur aplikasi BISMA.
                </p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Bar (Download & Copy Buttons) */}
          <div className="p-4 sm:px-6 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={downloadPromptSummaryJson}
                className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5"
                title="Unduh File ringkasan_prompt_aplikasi_bisma.json"
              >
                <Download className="w-4 h-4" />
                Unduh JSON (.json)
              </button>

              <button
                onClick={downloadPromptSummaryJs}
                className="bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl flex items-center gap-2 shadow-md shadow-teal-600/20 transition-all transform hover:-translate-y-0.5"
                title="Unduh Modul JavaScript (.js)"
              >
                <Terminal className="w-4 h-4" />
                Unduh JavaScript (.js)
              </button>

              <button
                onClick={handleCopyJson}
                className="bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                title="Salin JSON ke Clipboard"
              >
                {copiedType === 'json' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copiedType === 'json' ? 'JSON Tersalin!' : 'Salin JSON'}
              </button>

              <button
                onClick={handleCopyJs}
                className="bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
                title="Salin Kode JavaScript Module ke Clipboard"
              >
                {copiedType === 'js' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {copiedType === 'js' ? 'JS Tersalin!' : 'Salin JS'}
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari fitur, prompt, logika..."
                className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Role Filter Tabs */}
          <div className="px-4 sm:px-6 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-x-auto flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1 mr-1">
              <Layers className="w-3.5 h-3.5" /> Filter:
            </span>
            <button
              onClick={() => setSelectedRole('all')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                selectedRole === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              Semua Role ({ringkasanPromptData.roles.length})
            </button>
            {ringkasanPromptData.roles.map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  selectedRole === r.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {roleIcons[r.id] || <User className="w-3.5 h-3.5" />}
                {r.nama} ({r.fitur.length})
              </button>
            ))}
          </div>

          {/* Content Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-grow space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium pb-2 border-b border-slate-200 dark:border-slate-800">
              <span>Menampilkan <strong>{totalFilteredFeatures} fitur</strong> dari <strong>{filteredRoles.length} role</strong></span>
              <span>Format: <code>JSON Schema & JavaScript ES6</code></span>
            </div>

            {filteredRoles.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Search className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="font-semibold">Tidak ditemukan fitur yang cocok dengan pencarian.</p>
                <button 
                  onClick={() => { setSearchQuery(''); setSelectedRole('all'); }}
                  className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold underline"
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              filteredRoles.map(role => (
                <div key={role.id} className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {roleIcons[role.id] || <Shield className="w-5 h-5 text-emerald-500" />}
                    </div>
                    <div>
                      <h4 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                        {role.nama}
                        <span className="text-[11px] font-mono font-normal text-slate-400 dark:text-slate-500">
                          (role: {role.id})
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                        {role.deskripsi}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {role.fitur.map(f => {
                      const isExpanded = expandedFeature === f.id;
                      return (
                        <div 
                          key={f.id}
                          className="bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                {f.kategori}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                #{f.id}
                              </span>
                            </div>

                            <h5 className="font-extrabold text-sm text-slate-900 dark:text-white mb-1.5">
                              {f.nama}
                            </h5>

                            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700/70 mb-3">
                              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Terminal className="w-3 h-3 text-emerald-500" /> Ringkasan Prompt Rekayasa:
                              </p>
                              <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed italic">
                                "{f.ringkasan_prompt}"
                              </p>
                            </div>

                            {/* Collapsible Details */}
                            {isExpanded && (
                              <div className="space-y-2 text-xs border-t border-slate-200 dark:border-slate-700/70 pt-2.5 mb-3 animate-in fade-in duration-200">
                                <div>
                                  <span className="font-bold text-slate-600 dark:text-slate-300">Input Data:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {f.input.map((inp, idx) => (
                                      <span key={idx} className="text-[10px] px-2 py-0.5 bg-slate-200/70 dark:bg-slate-700/70 rounded-md font-mono text-slate-700 dark:text-slate-300">
                                        {inp}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <span className="font-bold text-slate-600 dark:text-slate-300">Logika & Algoritma:</span>
                                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                                    {f.logika_utama}
                                  </p>
                                </div>

                                <div>
                                  <span className="font-bold text-slate-600 dark:text-slate-300">Output Hasil:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {f.output.map((out, idx) => (
                                      <span key={idx} className="text-[10px] px-2 py-0.5 bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-md font-medium">
                                        {out}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <span className="font-bold text-slate-600 dark:text-slate-300">Aturan Bisnis:</span>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    {f.aturan_bisnis}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700/70">
                            <button
                              onClick={() => setExpandedFeature(isExpanded ? null : f.id)}
                              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                              {isExpanded ? 'Sembunyikan Rincian' : 'Lihat Rincian Logika & Input'}
                            </button>

                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(f, null, 2));
                                alert(`JSON fitur "${f.nama}" tersalin ke clipboard!`);
                              }}
                              className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1"
                              title="Salin JSON Fitur Ini"
                            >
                              <Copy className="w-3 h-3" /> Salin Fitur
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:px-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">{ringkasanPromptData.aplikasi.nama}</span>
              <span>•</span>
              <span>Versi {ringkasanPromptData.aplikasi.versi}</span>
              <span>•</span>
              <span>{ringkasanPromptData.aplikasi.institusi}</span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/ringkasan_prompt_aplikasi.json"
                download="ringkasan_prompt_aplikasi.json"
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Direct Link (/ringkasan_prompt_aplikasi.json)
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
