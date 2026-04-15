import React, { useState, useEffect } from 'react';
import { Heart, Save, Edit, Trash2, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function KasihIbuAdmin({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [pointPrice, setPointPrice] = useState<string>('100');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('pengaturan')
        .select('value')
        .eq('key', 'kasih_ibu_point_price')
        .single();
      
      if (data) {
        setPointPrice(data.value);
      }
    } catch (e) {
      console.error("Error fetching config", e);
    }
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      // Check if exists
      const { data } = await supabase.from('pengaturan').select('id').eq('key', 'kasih_ibu_point_price');
      
      if (data && data.length > 0) {
        await supabase.from('pengaturan').update({ value: pointPrice }).eq('key', 'kasih_ibu_point_price');
      } else {
        await supabase.from('pengaturan').insert({ key: 'kasih_ibu_point_price', value: pointPrice });
      }
      showToast("Konfigurasi harga per poin berhasil disimpan", "success");
    } catch (e) {
      console.error("Error saving config", e);
      showToast("Gagal menyimpan konfigurasi", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-xl">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Konfigurasi Kasih Ibu</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Atur harga per poin untuk penukaran ATK di sekolah</p>
          </div>
        </div>

        <div className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Harga per Poin (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">Rp</span>
              <input
                type="number"
                value={pointPrice}
                onChange={(e) => setPointPrice(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-pink-500 outline-none transition-all"
                placeholder="Contoh: 100"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Nilai ini digunakan sebagai acuan saat siswa menukarkan poin Kasih Ibu dengan Alat Tulis Kantor (ATK).
            </p>
          </div>

          <button
            onClick={handleSaveConfig}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                Simpan Konfigurasi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
