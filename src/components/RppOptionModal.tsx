import React, { useEffect } from 'react';
import { X, Sparkles, FileText, ArrowRight, ExternalLink, Bot, Globe, CheckCircle2, Laptop } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RppOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectApi: () => void;
  onSelectNonApi: () => void;
}

export default function RppOptionModal({
  isOpen,
  onClose,
  onSelectApi,
  onSelectNonApi,
}: RppOptionModalProps) {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Decorative Background Glow */}
          <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-indigo-500/15 via-purple-500/10 to-transparent pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-sm"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="relative pt-7 px-6 sm:px-8 pb-4 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Generator Modul Ajar & RPP</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Pilih Metode Pembuatan RPP
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              Silakan pilih salah satu opsi di bawah ini sesuai kenyamanan Anda dalam menyusun Rencana Pelaksanaan Pembelajaran:
            </p>
          </div>

          {/* Cards Grid */}
          <div className="p-6 sm:p-8 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Opsi 1: RPP dengan API */}
            <div
              onClick={onSelectApi}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectApi();
                }
              }}
              className="group relative flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-indigo-50/60 via-white to-white dark:from-slate-800/90 dark:via-slate-850 dark:to-slate-800/90 border-2 border-indigo-200/80 hover:border-indigo-500 dark:border-indigo-900/50 dark:hover:border-indigo-500 shadow-lg shadow-indigo-500/5 hover:shadow-xl hover:shadow-indigo-500/15 transition-all duration-300 hover:-translate-y-1 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/60 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Tetap di Aplikasi
                </span>
              </div>

              <div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300 mb-4">
                  <Bot className="w-6 h-6" />
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Buat RPP dengan API
                  <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">
                    AI Pintar
                  </span>
                </h3>

                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Menyusun RPP & Modul Ajar otomatis berbantuan kecerdasan buatan (Sigma AI) langsung di dalam layar BISMA tanpa keluar aplikasi.
                </p>

                <ul className="mt-4 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Layar generator terintegrasi di BISMA</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Proses cepat, sistematis & otomatis</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Tautan: sigmabai.netlify.app</span>
                  </li>
                </ul>
              </div>

              <div className="mt-5 pt-4 border-t border-indigo-100 dark:border-slate-700/80 flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1.5">
                  Buka RPP dengan API
                  <ArrowRight className="w-4 h-4" />
                </span>
                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">In-App View</span>
              </div>
            </div>

            {/* Opsi 2: RPP Non-API */}
            <div
              onClick={onSelectNonApi}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectNonApi();
                }
              }}
              className="group relative flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-sky-50/60 via-white to-white dark:from-slate-800/90 dark:via-slate-850 dark:to-slate-800/90 border-2 border-sky-200/80 hover:border-sky-500 dark:border-sky-900/50 dark:hover:border-sky-500 shadow-lg shadow-sky-500/5 hover:shadow-xl hover:shadow-sky-500/15 transition-all duration-300 hover:-translate-y-1 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300/60 dark:border-sky-800/60 shadow-2xs">
                  <Globe className="w-3 h-3 text-sky-600" />
                  Web Portal
                </span>
              </div>

              <div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-sky-500/30 group-hover:scale-110 transition-transform duration-300 mb-4">
                  <FileText className="w-6 h-6" />
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  Buat RPP Non-API
                  <span className="text-xs px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-semibold">
                    Google Sites
                  </span>
                </h3>

                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Menyusun RPP melalui portal web form RPP generator resmi di Google Sites tanpa membutuhkan konfigurasi API.
                </p>

                <ul className="mt-4 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span>Format formulir siap pakai guru</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span>Bebas token & kuota API</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span>Tautan: sites.google.com/view/akhmadnasor/rpp-generator</span>
                  </li>
                </ul>
              </div>

              <div className="mt-5 pt-4 border-t border-sky-100 dark:border-slate-700/80 flex items-center justify-between">
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1.5">
                  Buka RPP Non-API
                  <ExternalLink className="w-4 h-4" />
                </span>
                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Tab Baru</span>
              </div>
            </div>
          </div>

          {/* Footer Guidance */}
          <div className="px-6 sm:px-8 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              💡 <strong>Tips:</strong> Gunakan <strong>Versi API</strong> untuk pembuatan cerdas di dalam BISMA, atau pilih <strong>Non-API</strong> jika ingin menggunakan template form Google Sites.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
