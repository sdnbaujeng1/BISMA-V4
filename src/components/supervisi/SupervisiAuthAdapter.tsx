import React, { createContext, useContext, useEffect, useState } from 'react';
import { ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SupervisiActor, SupervisiConfig, DEFAULT_PRIORITY_INDICATORS } from './types';

interface SupervisiAuthContextValue {
  actor: SupervisiActor | null;
  config: SupervisiConfig;
  loading: boolean;
  error: string | null;
  refreshSession: () => Promise<void>;
}

const defaultConfig: SupervisiConfig = {
  schoolId: 'sdn-baujeng-1-beji',
  schoolCode: 'SDN-BAUJENG-1-BEJI',
  schoolName: 'SDN Baujeng I Beji',
  subdistrict: 'Kecamatan Beji',
  district: 'Kabupaten Pasuruan',
  province: 'Jawa Timur',
  motto: 'BERMUTU — Beriman, Ramah, Mandiri, Unggul, Tangguh.',
  tahunPelajaranAktif: '2024/2025',
  semesterAktif: 'Semester 2 (Genap)',
  indicators: DEFAULT_PRIORITY_INDICATORS
};

const SupervisiAuthContext = createContext<SupervisiAuthContextValue>({
  actor: null,
  config: defaultConfig,
  loading: true,
  error: null,
  refreshSession: async () => {}
});

export const useSupervisiAuth = () => useContext(SupervisiAuthContext);

interface SupervisiAuthAdapterProps {
  bismaUser: any;
  onExitToBisma: () => void;
  children: (auth: {
    actor: SupervisiActor;
    config: SupervisiConfig;
    refreshSession: () => Promise<void>;
  }) => React.ReactNode;
}

export default function SupervisiAuthAdapter({
  bismaUser,
  onExitToBisma,
  children
}: SupervisiAuthAdapterProps) {
  const [actor, setActor] = useState<SupervisiActor | null>(null);
  const [config, setConfig] = useState<SupervisiConfig>(defaultConfig);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const verifySession = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: supaSessionData } = await supabase.auth.getSession();
      const supaUser = supaSessionData?.session?.user;

      const candidatePayload = {
        nip:
          bismaUser?.NIP ||
          bismaUser?.nip ||
          bismaUser?.Username ||
          bismaUser?.username ||
          supaUser?.user_metadata?.nip ||
          '',
        nama:
          bismaUser?.['Nama Guru'] ||
          bismaUser?.Nama ||
          bismaUser?.Nama_Tendik ||
          bismaUser?.nama_guru ||
          supaUser?.user_metadata?.nama ||
          '',
        bismaRole:
          bismaUser?.role ||
          supaUser?.user_metadata?.role ||
          ''
      };

      if (!bismaUser && !supaUser) {
        setError('Sesi pengguna BISMA tidak ditemukan. Silakan masuk melalui halaman utama BISMA terlebih dahulu.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/supervisi/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidatePayload)
      });

      const json = await res.json();
      if (!res.ok || !json.success || !json.data?.actor) {
        throw new Error(json.message || 'Gagal memverifikasi sesi pengguna (BISMA +).');
      }

      const resolvedActor: SupervisiActor = json.data.actor;

      if (bismaUser?.role === 'siswa' || bismaUser?.role === 'monitoring') {
        setError('Modul (BISMA +) hanya dapat diakses oleh Kepala Sekolah, Guru, dan Administrator.');
        setLoading(false);
        return;
      }

      setActor(resolvedActor);
      if (json.data.config) {
        setConfig({
          ...defaultConfig,
          ...json.data.config,
          indicators: json.data.config.indicators || DEFAULT_PRIORITY_INDICATORS
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan saat memverifikasi sesi BISMA.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifySession();
  }, [bismaUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 border-b-[6px] border-b-blue-600 rounded-3xl p-8 max-w-md w-full text-center shadow-[0_20px_40px_-12px_rgba(30,58,138,0.2)]">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-b-4 border-indigo-900 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">
            Memverifikasi Sesi (BISMA +)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Menyinkronkan identitas pengguna dan hak akses peran dengan basis data Supabase...
          </p>
        </div>
      </div>
    );
  }

  if (error || !actor) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-800 border-2 border-rose-200 border-b-[6px] border-b-rose-600 rounded-3xl p-8 max-w-md w-full text-center shadow-[0_20px_40px_-12px_rgba(225,29,72,0.2)]">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 border-b-4 border-rose-300 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">
            Akses Modul Dibatasi
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
            {error || 'Sesi tidak valid.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onExitToBisma}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 flex items-center gap-2 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Dashboard BISMA
            </button>
            <button
              onClick={verifySession}
              className="px-4 py-2.5 rounded-xl bg-white border-2 border-slate-300 border-b-4 text-slate-700 text-xs font-bold hover:bg-slate-50 active:border-b-2 active:translate-y-0.5 transition-all cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SupervisiAuthContext.Provider
      value={{
        actor,
        config,
        loading,
        error,
        refreshSession: verifySession
      }}
    >
      {children({ actor, config, refreshSession: verifySession })}
    </SupervisiAuthContext.Provider>
  );
}
