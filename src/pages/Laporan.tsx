import React, { useState, useEffect, Fragment, useMemo } from 'react';
import { ArrowLeft, Printer, Users, UserX, AlertCircle, FileText } from 'lucide-react';
import { useSchoolIdentity } from '../hooks/useSchoolIdentity';
import { parseKetidakhadiran } from '../lib/ketidakhadiran';

export default function Laporan({ user, onNavigate }: { user: any, onNavigate: (page: string) => void }) {
  const [jurnalData, setJurnalData] = useState<any[]>([]);
  const [filterBulan, setFilterBulan] = useState('semua');
  const [filterTahun, setFilterTahun] = useState('semua');
  const [filterKelas, setFilterKelas] = useState('semua');
  const [filterAbsensi, setFilterAbsensi] = useState<'semua' | 'ada_ketidakhadiran' | 'nihil'>('semua');
  const [loading, setLoading] = useState(true);
  
  const schoolIdentity = useSchoolIdentity();

  useEffect(() => {
    fetch(`/api/laporan?nip=${user?.NIP || ''}&namaGuru=${encodeURIComponent(user?.['Nama Guru'] || '')}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setJurnalData(data.data || []);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [user]);

  const handlePrint = () => {
    window.print();
  };

  // Available classes from loaded journal data
  const availableClasses = useMemo(() => {
    const list = [...new Set(jurnalData.map(j => j.Kelas))].filter(Boolean);
    return list.sort();
  }, [jurnalData]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return jurnalData.filter(j => {
      const date = new Date(j.Timestamp);
      const monthMatch = filterBulan === 'semua' || date.getMonth().toString() === filterBulan;
      const yearMatch = filterTahun === 'semua' || date.getFullYear().toString() === filterTahun;
      const classMatch = filterKelas === 'semua' || j.Kelas === filterKelas;
      
      const absentList = parseKetidakhadiran(j.Ketidakhadiran);
      const hasAbsence = absentList.length > 0;
      
      let absensiMatch = true;
      if (filterAbsensi === 'ada_ketidakhadiran') absensiMatch = hasAbsence;
      else if (filterAbsensi === 'nihil') absensiMatch = !hasAbsence;

      return monthMatch && yearMatch && classMatch && absensiMatch;
    });
  }, [jurnalData, filterBulan, filterTahun, filterKelas, filterAbsensi]);

  // Statistics and absent student recap
  const stats = useMemo(() => {
    let totalSakit = 0;
    let totalIzin = 0;
    let totalAlpa = 0;
    let totalDispensasi = 0;
    const allAbsentStudents: Array<{
      tanggal: string;
      kelas: string;
      mapel: string;
      nama: string;
      keterangan: string;
    }> = [];

    filteredData.forEach(item => {
      const absentList = parseKetidakhadiran(item.Ketidakhadiran);
      const dateStr = new Date(item.Timestamp).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      
      absentList.forEach(a => {
        const norm = (a.keterangan || '').toLowerCase();
        if (norm.includes('sakit')) totalSakit++;
        else if (norm.includes('izin') || norm.includes('ijin')) totalIzin++;
        else if (norm.includes('alpa') || norm.includes('tanpa')) totalAlpa++;
        else if (norm.includes('dispen')) totalDispensasi++;
        else totalAlpa++;

        allAbsentStudents.push({
          tanggal: dateStr,
          kelas: item.Kelas || '-',
          mapel: item.Mata_Pelajaran || '-',
          nama: a.nama,
          keterangan: a.keterangan
        });
      });
    });

    const totalTidakHadir = totalSakit + totalIzin + totalAlpa + totalDispensasi;

    return {
      totalJurnal: filteredData.length,
      totalTidakHadir,
      totalSakit,
      totalIzin,
      totalAlpa,
      totalDispensasi,
      allAbsentStudents
    };
  }, [filteredData]);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const getPeriodeText = () => {
    if (filterBulan === 'semua' && filterTahun === 'semua') return 'Semua Waktu';
    if (filterBulan === 'semua') return `Tahun ${filterTahun}`;
    if (filterTahun === 'semua') return `Bulan ${monthNames[Number(filterBulan)]}`;
    return `${monthNames[Number(filterBulan)]} ${filterTahun}`;
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
      <header className="sticky top-0 z-30 bg-green-600 px-4 pb-4 pt-6 shadow-lg print:hidden">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button onClick={() => onNavigate('main')} className="p-2 rounded-full hover:bg-white/20 text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">Laporan & Cetak Jurnal Guru</h2>
            <p className="text-xs text-green-100">Rekap KBM dan Ketidakhadiran Siswa</p>
          </div>
        </div>
      </header>
      
      <main className="flex-grow p-4 md:p-6 mt-4">
        <div className="max-w-7xl mx-auto">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 print:hidden mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Bulan</label>
                <select 
                  value={filterBulan} 
                  onChange={e => setFilterBulan(e.target.value)}
                  className="text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-700 dark:text-white"
                >
                  <option value="semua">Semua Bulan</option>
                  {monthNames.map((m, idx) => (
                    <option key={idx} value={String(idx)}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Tahun</label>
                <select 
                  value={filterTahun}
                  onChange={e => setFilterTahun(e.target.value)}
                  className="text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-700 dark:text-white"
                >
                  <option value="semua">Semua Tahun</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Kelas</label>
                <select 
                  value={filterKelas}
                  onChange={e => setFilterKelas(e.target.value)}
                  className="text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-700 dark:text-white"
                >
                  <option value="semua">Semua Kelas</option>
                  {availableClasses.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Status Ketidakhadiran</label>
                <select 
                  value={filterAbsensi}
                  onChange={e => setFilterAbsensi(e.target.value as any)}
                  className="text-sm border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 dark:bg-slate-700 dark:text-white font-medium"
                >
                  <option value="semua">Semua Entri Jurnal</option>
                  <option value="ada_ketidakhadiran">Hanya Yang Ada Siswa Tidak Hadir</option>
                  <option value="nihil">Hanya Yang Nihil (Semua Hadir)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={handlePrint}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                title="Cetak Tabel Jurnal & Rekapitulasi Ketidakhadiran"
              >
                <Printer className="w-5 h-5" /> Cetak Laporan
              </button>
            </div>
          </div>

          {/* Quick Summary Cards (Screen View) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 print:hidden">
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Total Jurnal</p>
                <p className="text-xl font-black text-slate-800 dark:text-white">{stats.totalJurnal}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                <UserX className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Total Tidak Hadir</p>
                <p className="text-xl font-black text-rose-600 dark:text-rose-400">{stats.totalTidakHadir}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-sm">S</span>
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Sakit</p>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{stats.totalSakit}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-sm">I</span>
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Izin</p>
                <p className="text-xl font-black text-amber-600 dark:text-amber-400">{stats.totalIzin}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-sm">A</span>
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Alpa</p>
                <p className="text-xl font-black text-rose-600 dark:text-rose-400">{stats.totalAlpa}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-sm">D</span>
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">Dispensasi</p>
                <p className="text-xl font-black text-purple-600 dark:text-purple-400">{stats.totalDispensasi}</p>
              </div>
            </div>
          </div>

          {/* Printable Report Canvas */}
          <div className="bg-white dark:bg-slate-800 text-black dark:text-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-700 print:shadow-none print:border-none print:p-0 print:bg-white print:text-black print:w-full print:max-w-[210mm] print:mx-auto">
            {loading ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400 font-medium">Memuat data laporan...</div>
            ) : (
              <div className="overflow-x-auto print:overflow-visible">
                {/* Print Header */}
                <div className="hidden print:block mb-4 border-b-2 border-black pb-3 text-black">
                  <div className="flex items-center gap-4">
                    {schoolIdentity.schoolLogo && (
                      <img src={schoolIdentity.schoolLogo} className="h-16 w-16 object-contain" alt="Logo" />
                    )}
                    <div className="text-left flex-grow">
                      <h2 className="text-lg font-black uppercase tracking-wide leading-tight">{schoolIdentity.schoolName}</h2>
                      <h3 className="text-sm font-bold text-slate-800 mt-0.5">LAPORAN JURNAL PEMBELAJARAN (KBM) GURU</h3>
                      <div className="flex flex-wrap gap-x-6 text-xs text-slate-700 mt-1">
                        <span><strong>Guru:</strong> {user?.['Nama Guru'] || '-'} (NIP: {user?.NIP || '-'})</span>
                        <span><strong>Periode:</strong> {getPeriodeText()}</span>
                        {filterKelas !== 'semua' && <span><strong>Kelas:</strong> {filterKelas}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Journal Table */}
                <table className="w-full text-sm print:text-xs border-collapse border border-slate-300 dark:border-slate-600 print:border-black min-w-[850px] print:min-w-0">
                  <thead className="bg-slate-100 dark:bg-slate-700 print:bg-slate-100">
                    <tr className="bg-slate-100 dark:bg-slate-700 print:bg-slate-100 text-slate-800 dark:text-slate-100 print:text-black">
                      <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2 print:p-1 text-center w-10 print:w-8 font-bold">No</th>
                      <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2 print:p-1 text-left w-32 print:w-24 font-bold">Hari, Tanggal</th>
                      <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2 print:p-1 text-center w-16 print:w-12 font-bold">Kelas</th>
                      <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2 print:p-1 text-left w-32 print:w-24 font-bold">Mata Pelajaran</th>
                      <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2 print:p-1 text-center w-16 print:w-12 font-bold">Jam</th>
                      <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2 print:p-1 text-left min-w-[200px] font-bold">Materi/Kegiatan</th>
                      <th className="border border-slate-300 dark:border-slate-600 print:border-black p-2 print:p-1 text-left min-w-[200px] font-bold bg-amber-50/50 dark:bg-amber-950/20 print:bg-slate-100">Ketidakhadiran Siswa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="border border-slate-300 dark:border-slate-600 print:border-black p-6 text-center text-slate-500 dark:text-slate-400 italic">
                          Tidak ada data jurnal sesuai filter yang dipilih.
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((item, idx) => {
                        let parsedMateri: any[] = [];
                        try {
                          parsedMateri = JSON.parse(item.Materi);
                          if (!Array.isArray(parsedMateri)) {
                            parsedMateri = [{ mataPelajaran: item.Mata_Pelajaran || '-', jamPembelajaran: [], materi: item.Materi }];
                          }
                        } catch {
                          parsedMateri = [{ mataPelajaran: item.Mata_Pelajaran || '-', jamPembelajaran: [], materi: item.Materi }];
                        }

                        const absentStudents = parseKetidakhadiran(item.Ketidakhadiran);
                        const hasAbsents = absentStudents.length > 0;

                        return (
                          <Fragment key={idx}>
                            {parsedMateri.map((m: any, i: number) => {
                              const jams = m.jamPembelajaran || [];
                              let jamText = jams.join(', ');
                              if (jams.length > 1) {
                                const sortedJams = [...jams].map(Number).sort((a: number, b: number) => a - b);
                                const isSequential = sortedJams.every((val: number, sIdx: number, arr: number[]) => sIdx === 0 || val === arr[sIdx - 1] + 1);
                                if (isSequential) {
                                  jamText = `${sortedJams[0]}-${sortedJams[sortedJams.length - 1]}`;
                                }
                              }

                              return (
                                <tr key={`${idx}-${i}`} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 print:hover:bg-transparent break-inside-avoid">
                                  {i === 0 && (
                                    <>
                                      <td rowSpan={parsedMateri.length} className="border border-slate-300 dark:border-slate-600 print:border-black p-2 print:p-1 text-center align-top font-medium">
                                        {idx + 1}
                                      </td>
                                      <td rowSpan={parsedMateri.length} className="border border-slate-300 dark:border-slate-600 print:border-black p-2 print:p-1 align-top text-xs">
                                        {new Date(item.Timestamp).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                      </td>
                                      <td rowSpan={parsedMateri.length} className="border border-slate-300 dark:border-slate-600 print:border-black p-2 print:p-1 text-center font-bold align-top">
                                        {item.Kelas}
                                      </td>
                                    </>
                                  )}
                                  <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2 print:p-1 align-top break-words font-medium">
                                    {m.mataPelajaran}
                                  </td>
                                  <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2 print:p-1 text-center align-top font-mono text-xs">
                                    {jamText || '-'}
                                  </td>
                                  <td className="border border-slate-300 dark:border-slate-600 print:border-black p-2 print:p-1 align-top break-words whitespace-pre-wrap">
                                    {m.materi || '-'}
                                  </td>
                                  {i === 0 && (
                                    <td 
                                      rowSpan={parsedMateri.length} 
                                      className={`border border-slate-300 dark:border-slate-600 print:border-black p-2 print:p-1 align-top break-words ${hasAbsents ? 'bg-amber-50/30 dark:bg-amber-950/10 print:bg-transparent' : ''}`}
                                    >
                                      {!hasAbsents ? (
                                        <span className="text-slate-400 dark:text-slate-500 italic text-xs print:text-slate-500">
                                          Nihil (Semua Hadir)
                                        </span>
                                      ) : (
                                        <ul className="list-disc pl-4 space-y-1 print:pl-3 print:space-y-0.5 text-xs">
                                          {absentStudents.map((a, sIdx) => {
                                            const norm = (a.keterangan || '').toLowerCase();
                                            const isSakit = norm.includes('sakit');
                                            const isIzin = norm.includes('izin') || norm.includes('ijin');
                                            const isAlpa = norm.includes('alpa') || norm.includes('tanpa');
                                            const isDispen = norm.includes('dispen');
                                            
                                            const badgeColor = isSakit 
                                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                                              : isIzin
                                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                                              : isAlpa
                                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                                              : isDispen
                                              ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300'
                                              : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';

                                            return (
                                              <li key={sIdx} className="leading-snug">
                                                <span className="font-bold text-slate-900 dark:text-slate-100 print:text-black">
                                                  {a.nama}
                                                </span>
                                                {' '}
                                                <span className={`inline-block px-1.5 py-0.2 rounded text-[11px] font-bold border print:border-none print:px-0 print:text-black ${badgeColor}`}>
                                                  ({a.keterangan})
                                                </span>
                                              </li>
                                            );
                                          })}
                                        </ul>
                                      )}
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>

                {/* Printable Recap Table: Rekapitulasi Khusus Siswa Tidak Hadir */}
                {stats.allAbsentStudents.length > 0 && (
                  <div className="mt-8 break-inside-avoid">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 print:text-black flex items-center gap-2">
                        <UserX className="w-4 h-4 text-rose-600 print:text-black" />
                        Rekapitulasi Siswa Tidak Hadir ({stats.allAbsentStudents.length} Kejadian)
                      </h4>
                      <div className="text-xs text-slate-600 dark:text-slate-400 print:text-black flex gap-3">
                        <span>Sakit: <strong>{stats.totalSakit}</strong></span>
                        <span>Izin: <strong>{stats.totalIzin}</strong></span>
                        <span>Alpa: <strong>{stats.totalAlpa}</strong></span>
                        <span>Dispensasi: <strong>{stats.totalDispensasi}</strong></span>
                      </div>
                    </div>
                    
                    <table className="w-full text-xs border-collapse border border-slate-300 dark:border-slate-600 print:border-black">
                      <thead className="bg-slate-100 dark:bg-slate-700 print:bg-slate-100">
                        <tr className="text-slate-800 dark:text-slate-100 print:text-black">
                          <th className="border border-slate-300 dark:border-slate-600 print:border-black p-1.5 text-center w-8">No</th>
                          <th className="border border-slate-300 dark:border-slate-600 print:border-black p-1.5 text-left w-28">Tanggal</th>
                          <th className="border border-slate-300 dark:border-slate-600 print:border-black p-1.5 text-center w-20">Kelas</th>
                          <th className="border border-slate-300 dark:border-slate-600 print:border-black p-1.5 text-left">Nama Siswa</th>
                          <th className="border border-slate-300 dark:border-slate-600 print:border-black p-1.5 text-center w-28">Keterangan</th>
                          <th className="border border-slate-300 dark:border-slate-600 print:border-black p-1.5 text-left w-36">Mata Pelajaran</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.allAbsentStudents.map((ab, aIdx) => (
                          <tr key={aIdx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 print:hover:bg-transparent">
                            <td className="border border-slate-300 dark:border-slate-600 print:border-black p-1.5 text-center">{aIdx + 1}</td>
                            <td className="border border-slate-300 dark:border-slate-600 print:border-black p-1.5">{ab.tanggal}</td>
                            <td className="border border-slate-300 dark:border-slate-600 print:border-black p-1.5 text-center font-semibold">{ab.kelas}</td>
                            <td className="border border-slate-300 dark:border-slate-600 print:border-black p-1.5 font-bold">{ab.nama}</td>
                            <td className="border border-slate-300 dark:border-slate-600 print:border-black p-1.5 text-center">
                              <span className="font-semibold">{ab.keterangan}</span>
                            </td>
                            <td className="border border-slate-300 dark:border-slate-600 print:border-black p-1.5">{ab.mapel}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Signature Block */}
            <div className="mt-12 grid grid-cols-2 gap-8 text-sm text-black dark:text-white print:text-black break-inside-avoid">
              <div className="text-center">
                <p>Mengetahui Kepala Sekolah,</p>
                <div className="h-20"></div>
                <p className="font-bold underline">{schoolIdentity.headmasterName}</p>
                <p>NIP. {schoolIdentity.headmasterNIP}</p>
              </div>
              <div className="text-center">
                <p>Beji, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p>Guru Mata Pelajaran,</p>
                <div className="h-20"></div>
                <p className="font-bold underline">{user?.['Nama Guru']}</p>
                <p>NIP. {user?.NIP || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

