import { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function NilaiSiswa({ user, onBack }: { user: any, onBack: () => void }) {
  const [nilaiData, setNilaiData] = useState<any>({});
  const [jumlahUlangan, setJumlahUlangan] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch settings for jumlahUlangan
        const res = await fetch('/api/pengaturan');
        const result = await res.json();
        if (result.success && result.data && result.data.jumlahUlangan) {
          setJumlahUlangan(parseInt(result.data.jumlahUlangan));
        } else {
          const stored = localStorage.getItem('school_identity_data');
          if (stored) {
            const data = JSON.parse(stored);
            if (data.jumlahUlangan) setJumlahUlangan(parseInt(data.jumlahUlangan));
          }
        }

        // Fetch student's grades
        const allNilai = JSON.parse(localStorage.getItem('all_student_nilai') || '{}');
        const myNilai = allNilai[user?.NISN] || {};
        setNilaiData(myNilai);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const mapelList = Object.keys(nilaiData).length > 0 ? Object.keys(nilaiData) : ['Matematika', 'Bahasa Indonesia', 'IPAS', 'Pendidikan Pancasila', 'Seni Budaya', 'PJOK', 'Pendidikan Agama'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-300">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Nilai Akademik</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Rekapitulasi nilai ulangan dan ujian</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-center w-12">No</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 min-w-[200px]">Mata Pelajaran</th>
                <th colSpan={jumlahUlangan} className="px-4 py-2 border-r border-slate-200 dark:border-slate-700 text-center border-b">Nilai Harian (Smt 1)</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-center bg-fuchsia-50 dark:bg-fuchsia-900/20 w-20">STS</th>
                <th colSpan={jumlahUlangan} className="px-4 py-2 border-r border-slate-200 dark:border-slate-700 text-center border-b">Nilai Harian (Smt 2)</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-center bg-fuchsia-50 dark:bg-fuchsia-900/20 w-20">ASAS</th>
                <th rowSpan={2} className="px-4 py-3 text-center bg-slate-100 dark:bg-slate-800 w-24 font-bold">Nilai Akhir</th>
              </tr>
              <tr>
                {Array.from({ length: jumlahUlangan }).map((_, i) => (
                  <th key={`h1-${i}`} className="px-2 py-2 border-r border-slate-200 dark:border-slate-700 text-center w-16">{i + 1}</th>
                ))}
                {Array.from({ length: jumlahUlangan }).map((_, i) => (
                  <th key={`h2-${i}`} className="px-2 py-2 border-r border-slate-200 dark:border-slate-700 text-center w-16">{i + 1 + jumlahUlangan}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5 + (jumlahUlangan * 2)} className="px-4 py-8 text-center text-slate-500">Memuat data nilai...</td>
                </tr>
              ) : mapelList.length === 0 ? (
                <tr>
                  <td colSpan={5 + (jumlahUlangan * 2)} className="px-4 py-8 text-center text-slate-500">Belum ada data nilai.</td>
                </tr>
              ) : (
                mapelList.map((mapel, idx) => {
                  const data = nilaiData[mapel] || {};
                  return (
                    <tr key={mapel} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-700/50 text-center">{idx + 1}</td>
                      <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-700/50 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-slate-400" />
                        {mapel}
                      </td>
                      
                      {Array.from({ length: jumlahUlangan }).map((_, i) => (
                        <td key={`val-h1-${i}`} className="px-2 py-3 border-r border-slate-100 dark:border-slate-700/50 text-center text-slate-600 dark:text-slate-300">
                          {data.harian1?.[i] !== undefined && data.harian1?.[i] !== '' ? data.harian1[i] : '-'}
                        </td>
                      ))}
                      
                      <td className="px-2 py-3 border-r border-slate-100 dark:border-slate-700/50 text-center bg-fuchsia-50/50 dark:bg-fuchsia-900/10 font-medium text-fuchsia-700 dark:text-fuchsia-300">
                        {data.sts !== undefined && data.sts !== '' ? data.sts : '-'}
                      </td>

                      {Array.from({ length: jumlahUlangan }).map((_, i) => (
                        <td key={`val-h2-${i}`} className="px-2 py-3 border-r border-slate-100 dark:border-slate-700/50 text-center text-slate-600 dark:text-slate-300">
                          {data.harian2?.[i] !== undefined && data.harian2?.[i] !== '' ? data.harian2[i] : '-'}
                        </td>
                      ))}

                      <td className="px-2 py-3 border-r border-slate-100 dark:border-slate-700/50 text-center bg-fuchsia-50/50 dark:bg-fuchsia-900/10 font-medium text-fuchsia-700 dark:text-fuchsia-300">
                        {data.asas !== undefined && data.asas !== '' ? data.asas : '-'}
                      </td>

                      <td className="px-4 py-3 text-center bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-800 dark:text-white">
                        {data.na !== undefined && data.na !== '' ? data.na : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
