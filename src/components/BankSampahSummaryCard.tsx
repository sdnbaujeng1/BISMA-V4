import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Wallet, TrendingUp, ChevronRight } from 'lucide-react';

export default function BankSampahSummaryCard({ user }: { user: any }) {
  const [loading, setLoading] = useState(true);
  const [saldo, setSaldo] = useState(0);

  useEffect(() => {
    const fetchSaldo = async () => {
      if (!user?.NISN && !user?.NIS) return;
      
      try {
        const nisn = user.NISN || user.NIS;
        const { data, error } = await supabase
          .from('bank_sampah')
          .select('saldo')
          .eq('nisn', nisn)
          .order('timestamp', { ascending: false })
          .limit(1);

        if (error) throw error;
        
        if (data && data.length > 0) {
          setSaldo(data[0].saldo);
        }
      } catch (err) {
        console.error("Error fetching saldo:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSaldo();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 h-full flex items-center justify-center min-h-[160px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-4 sm:p-6 shadow-lg text-white relative overflow-hidden transition-all duration-300 group hover:shadow-xl hover:shadow-emerald-200 dark:hover:shadow-none">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl group-hover:scale-110 transition-transform duration-500"></div>
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-50" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-emerald-50">Tabungan Sampah</h3>
              <p className="text-[10px] sm:text-xs text-emerald-100/80">Klik 2x untuk detail</p>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-100" />
            <span className="text-[10px] font-medium text-emerald-100">Aktif</span>
          </div>
        </div>
        
        <div className="mt-auto">
          <p className="text-emerald-100 text-xs sm:text-sm mb-1">Total Saldo</p>
          <div className="flex items-end justify-between">
            <h2 className="text-2xl sm:text-4xl font-black drop-shadow-md">
              Rp {saldo.toLocaleString('id-ID')}
            </h2>
            <ChevronRight className="w-5 h-5 text-emerald-200 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
