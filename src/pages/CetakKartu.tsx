import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useSchoolIdentity } from '../hooks/useSchoolIdentity';
import { Search, Printer, CheckCircle2, ChevronDown, Filter, User, Eye, Sparkles } from 'lucide-react';
import QRCode from 'react-qr-code';

export default function CetakKartu() {
  const schoolIdentity = useSchoolIdentity();
  const [muridList, setMuridList] = useState<any[]>([]);
  const [filteredMurid, setFilteredMurid] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMurid, setSelectedMurid] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [kelasFilter, setKelasFilter] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMurid();
  }, []);

  const fetchMurid = async () => {
    try {
      const { data, error } = await supabase
        .from('murid')
        .select('"Nama Lengkap", "NISN", "NIS", "Kelas", "Tanggal Lahir (YYYY-MM-DD)", "Jenis Kelamin (L/P)"')
        .order('"Kelas"', { ascending: true })
        .order('"Nama Lengkap"', { ascending: true });

      if (error) throw error;
      const dataWithId = (data || []).map((m: any, i: number) => ({ ...m, id: m.NISN || m.NIS || `temp-${i}` }));
      setMuridList(dataWithId);
      setFilteredMurid(dataWithId);
      if (dataWithId.length > 0) {
        setSelectedMurid(new Set([dataWithId[0].id]));
        setPreviewId(dataWithId[0].id);
      }
    } catch (err) {
      console.error('Error fetching murid:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = muridList;
    if (search) {
      filtered = filtered.filter(m => 
        m['Nama Lengkap']?.toLowerCase().includes(search.toLowerCase()) ||
        m['NISN']?.includes(search) ||
        m['NIS']?.includes(search)
      );
    }
    if (kelasFilter) {
      filtered = filtered.filter(m => m['Kelas'] === kelasFilter);
    }
    setFilteredMurid(filtered);
  }, [search, kelasFilter, muridList]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedMurid);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
      setPreviewId(id);
    }
    setSelectedMurid(newSelected);
  };

  const selectAll = () => {
    if (selectedMurid.size === filteredMurid.length) {
      setSelectedMurid(new Set());
    } else {
      setSelectedMurid(new Set(filteredMurid.map(m => m.id)));
      if (filteredMurid.length > 0) {
        setPreviewId(filteredMurid[0].id);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const uniqueClasses = Array.from(new Set(muridList.map(m => m['Kelas']))).filter(Boolean).sort();

  const formatTTL = (m: any) => {
    const tgl = m['Tanggal Lahir (YYYY-MM-DD)'];
    const tempat = m['Tempat Lahir'] || m['TempatLahir'] || '';
    if (tempat && tgl) return `${tempat}, ${tgl}`;
    if (tgl) return tgl;
    if (tempat) return tempat;
    return '-';
  };

  const previewMurid = muridList.find(m => m.id === previewId) || (muridList.length > 0 ? muridList[0] : null);

  return (
    <div className="max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            Cetak Kartu Pelajar
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Format cetak tajam, bersih, solid tidak transparan, dengan teks tebal (bold) untuk Nama, Kelas, dan TTL.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            disabled={selectedMurid.size === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
          >
            <Printer className="w-5 h-5" />
            Cetak Kartu ({selectedMurid.size})
          </button>
        </div>
      </div>

      {/* Live Preview Card Section (On Screen) */}
      {previewMurid && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 mb-8 print:hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-700 gap-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                <Eye className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Pratinjau Hasil Cetak Kartu</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Menampilkan kartu siswa: <span className="font-semibold text-blue-600 dark:text-blue-400">{previewMurid['Nama Lengkap']}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <Sparkles className="w-4 h-4" />
              Solid Background & Teks Tebal (Bold) Aktif
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-8 py-2">
            {/* Front Card Preview */}
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bagian Depan</span>
              <CardFront murid={previewMurid} schoolIdentity={schoolIdentity} formatTTL={formatTTL} />
            </div>

            {/* Back Card Preview */}
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bagian Belakang</span>
              <CardBack murid={previewMurid} schoolIdentity={schoolIdentity} />
            </div>
          </div>
        </div>
      )}

      {/* Filter and Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden mb-8 print:hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari nama, NISN, atau NIS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div className="relative md:w-56">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <select
              value={kelasFilter}
              onChange={(e) => setKelasFilter(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none dark:bg-slate-700 dark:text-white"
            >
              <option value="">Semua Kelas</option>
              {uniqueClasses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <th className="p-4 w-16 text-center">
                  <input
                    type="checkbox"
                    checked={selectedMurid.size === filteredMurid.length && filteredMurid.length > 0}
                    onChange={selectAll}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="p-4 font-semibold">Nama Siswa</th>
                <th className="p-4 font-semibold">NISN / NIS</th>
                <th className="p-4 font-semibold">Kelas</th>
                <th className="p-4 font-semibold text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Memuat data murid...</td>
                </tr>
              ) : filteredMurid.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">Tidak ada data siswa yang cocok.</td>
                </tr>
              ) : (
                filteredMurid.map((murid) => (
                  <tr 
                    key={murid.id} 
                    className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${selectedMurid.has(murid.id) ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}
                  >
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedMurid.has(murid.id)}
                        onChange={() => toggleSelect(murid.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-4 font-medium text-slate-800 dark:text-slate-200">
                      <div className="font-bold text-slate-900 dark:text-white">{murid['Nama Lengkap']}</div>
                      <div className="text-xs text-slate-400">{formatTTL(murid)}</div>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 text-sm">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">{murid['NISN'] || '-'}</div>
                      <div className="text-xs text-slate-400">NIS: {murid['NIS'] || '-'}</div>
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300 font-semibold">{murid['Kelas']}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setPreviewId(murid.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300 font-medium transition-colors"
                      >
                        Pratinjau
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Area: Optimized for High Resolution, Sharp Borders, Solid Backgrounds, and Bold Fonts */}
      <div className="hidden print:block" ref={printRef}>
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { 
              margin: 8mm; 
              size: A4 portrait; 
            }
            body { 
              margin: 0; 
              padding: 0;
              background-color: #ffffff !important;
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
              color-adjust: exact !important; 
            }
            .print-card-wrapper {
              page-break-inside: avoid;
              break-inside: avoid;
              margin-bottom: 16px;
              margin-right: 16px;
              display: inline-flex;
            }
          }
        `}} />
        
        <div className="print:block">
          {muridList.filter(m => selectedMurid.has(m.id)).map(murid => (
            <div key={murid.id} className="print-card-wrapper flex gap-4 items-center">
              <CardFront murid={murid} schoolIdentity={schoolIdentity} formatTTL={formatTTL} />
              <CardBack murid={murid} schoolIdentity={schoolIdentity} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Sub-Component: Bagian Depan Kartu
function CardFront({ murid, schoolIdentity, formatTTL }: { murid: any, schoolIdentity: any, formatTTL: (m: any) => string }) {
  return (
    <div 
      style={{ 
        width: '250px', 
        height: '396px', 
        position: 'relative', 
        overflow: 'hidden', 
        borderRadius: '12px', 
        border: '1.5px solid #cbd5e1', 
        backgroundColor: '#ffffff', 
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxSizing: 'border-box',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Top Header Background Shapes */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '170px', background: 'linear-gradient(135deg, #0284c7, #1d4ed8)', borderBottomLeftRadius: '50% 25%', borderBottomRightRadius: '50% 15%', zIndex: 1 }} />
      <div style={{ position: 'absolute', top: '148px', left: '-30px', right: '-10px', height: '48px', background: '#38bdf8', opacity: 0.9, borderBottomLeftRadius: '50% 100%', borderBottomRightRadius: '50% 100%', transform: 'rotate(-8deg)', zIndex: 2 }} />
      
      {/* Bottom Decorative Trim Shapes (Kept low so they do not overlap text) */}
      <div style={{ position: 'absolute', bottom: '-45px', left: '-30px', width: '110px', height: '110px', background: '#22c55e', borderRadius: '50%', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: '-55px', left: '60px', width: '110px', height: '110px', background: '#fbbf24', borderRadius: '50%', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: '-45px', right: '-35px', width: '110px', height: '110px', background: '#ec4899', borderRadius: '50%', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: '-40px', right: '25px', width: '90px', height: '90px', background: '#f97316', borderRadius: '50%', zIndex: 3 }} />

      {/* Main Content Layout */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%' }}>
        
        {/* Header Content */}
        <div style={{ textAlign: 'center', color: '#ffffff', paddingTop: '14px', paddingLeft: '8px', paddingRight: '8px' }}>
          <div style={{ background: '#ffffff', padding: '3px', borderRadius: '50%', marginBottom: '4px', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
            <img 
              src={schoolIdentity.schoolLogo || "https://upload.wikimedia.org/wikipedia/commons/9/9e/Tut_Wuri_Handayani.svg"} 
              alt="Logo Sekolah" 
              style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} 
            />
          </div>
          <h1 style={{ fontSize: '14px', fontWeight: '900', margin: '0', textTransform: 'uppercase', letterSpacing: '0.4px', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
            {schoolIdentity.schoolName || "SDN BAUJENG I BEJI"}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', margin: '2px 0 3px' }}>
            <div style={{ height: '1.5px', width: '22px', background: 'rgba(255,255,255,0.85)' }} />
            <div style={{ fontSize: '7.5px', letterSpacing: '2px', fontWeight: '900', color: '#ffffff' }}>BERMUTU</div>
            <div style={{ height: '1.5px', width: '22px', background: 'rgba(255,255,255,0.85)' }} />
          </div>
          <p style={{ fontSize: '6.5px', margin: 0, fontWeight: '600', opacity: 0.95, letterSpacing: '0.2px' }}>
            {schoolIdentity.sloganText || "Beriman, Ramah, Mandiri, Unggul dan Tangguh"}
          </p>
        </div>

        {/* Photo Area */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
          <div style={{ width: '72px', height: '72px', backgroundColor: '#f1f5f9', borderRadius: '50%', border: '3px solid #ffffff', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.15)', position: 'relative' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '46px', height: '46px', color: '#94a3b8', marginBottom: '-4px' }}>
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '3px', fontSize: '6.5px', fontWeight: '800', color: '#475569', letterSpacing: '1px' }}>
          FOTO SISWA
        </div>

        {/* Student Data Box (SOLID WHITE BACKGROUND - TIDAK BENING, SANGAT BERSIH & TEBAL/BOLD) */}
        <div 
          style={{ 
            margin: '0 12px', 
            marginTop: 'auto', 
            marginBottom: '26px',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '8px 10px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
            border: '1.5px solid #cbd5e1',
            position: 'relative',
            zIndex: 10
          }}
        >
          {/* NISN & NIS Header with Bold Highlights */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', marginBottom: '5px' }}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <span style={{ color: '#1e40af', fontWeight: '800' }}>NISN :</span>
              <span style={{ color: '#000000', fontWeight: '900', borderBottom: '1.5px solid #94a3b8', paddingBottom: '1px', minWidth: '45px' }}>
                {murid['NISN'] || '-'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <span style={{ color: '#1e40af', fontWeight: '800' }}>NIS :</span>
              <span style={{ color: '#000000', fontWeight: '900', borderBottom: '1.5px solid #94a3b8', paddingBottom: '1px', minWidth: '38px' }}>
                {murid['NIS'] || '-'}
              </span>
            </div>
          </div>
          
          {/* Student Name: Extra Bold, Solid Black, Crystal Clear */}
          <div 
            style={{ 
              fontSize: '13px', 
              fontWeight: '900', 
              textAlign: 'center', 
              margin: '3px 0 6px 0', 
              textTransform: 'uppercase', 
              color: '#000000', 
              borderBottom: '1.5px solid #cbd5e1', 
              paddingBottom: '5px',
              letterSpacing: '0.3px',
              lineHeight: '1.25'
            }}
          >
            {murid['Nama Lengkap']}
          </div>
          
          {/* Detailed Info Table: Bold font for Kelas and Tempat Tanggal Lahir */}
          <table style={{ width: '100%', fontSize: '8.5px', color: '#000000', lineHeight: '1.45', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '40%', padding: '2px 0', fontWeight: 'bold', color: '#1e293b' }}>Kelas</td>
                <td style={{ width: '5%', fontWeight: 'bold', color: '#000000' }}>:</td>
                <td style={{ fontWeight: '900', color: '#000000', fontSize: '9.5px', borderBottom: '1px solid #f1f5f9' }}>
                  {murid['Kelas'] || '-'}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '2px 0', fontWeight: 'bold', color: '#1e293b' }}>Tempat, Tgl Lahir</td>
                <td style={{ fontWeight: 'bold', color: '#000000' }}>:</td>
                <td style={{ fontWeight: '900', color: '#000000', fontSize: '8.5px', borderBottom: '1px solid #f1f5f9' }}>
                  {formatTTL(murid)}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '2px 0', fontWeight: 'bold', color: '#1e293b' }}>Jenis Kelamin</td>
                <td style={{ fontWeight: 'bold', color: '#000000' }}>:</td>
                <td style={{ fontWeight: '800', color: '#000000', fontSize: '8.5px' }}>
                  {murid['Jenis Kelamin (L/P)'] === 'L' ? 'Laki-laki (L)' : murid['Jenis Kelamin (L/P)'] === 'P' ? 'Perempuan (P)' : (murid['Jenis Kelamin (L/P)'] || '-')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Motto Text with High Contrast Halo */}
        <div 
          style={{ 
            position: 'absolute', 
            bottom: '7px', 
            left: 0, 
            right: 0, 
            textAlign: 'center', 
            fontSize: '6.5px', 
            fontWeight: '900', 
            color: '#1e40af', 
            letterSpacing: '0.8px',
            textShadow: '0 0 3px #ffffff, 0 0 5px #ffffff',
            lineHeight: '1.2',
            zIndex: 15
          }}
        >
          BELAJAR &bull; BERKARAKTER &bull; MERAIH MASA DEPAN
        </div>
      </div>
    </div>
  );
}

// Sub-Component: Bagian Belakang Kartu
function CardBack({ murid, schoolIdentity }: { murid: any, schoolIdentity: any }) {
  return (
    <div 
      style={{ 
        width: '250px', 
        height: '396px', 
        position: 'relative', 
        overflow: 'hidden', 
        borderRadius: '12px', 
        border: '1.5px solid #cbd5e1', 
        backgroundColor: '#ffffff', 
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxSizing: 'border-box',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Top Header Shapes */}
      <div style={{ position: 'absolute', top: '-45px', left: '-40px', width: '120px', height: '120px', background: '#22c55e', borderRadius: '50%', zIndex: 1 }} />
      <div style={{ position: 'absolute', top: '-60px', left: '40px', width: '140px', height: '140px', background: '#fbbf24', borderRadius: '50%', zIndex: 1 }} />
      <div style={{ position: 'absolute', top: '-35px', right: '-30px', width: '120px', height: '120px', background: '#ec4899', borderRadius: '50%', zIndex: 1 }} />

      {/* Bottom Header Shapes */}
      <div style={{ position: 'absolute', bottom: '-45px', left: '-30px', right: '-30px', height: '100px', background: 'linear-gradient(135deg, #0284c7, #1d4ed8)', borderTopLeftRadius: '50% 100%', borderTopRightRadius: '50% 100%', zIndex: 1 }} />
      <div style={{ position: 'absolute', bottom: '-25px', left: '-10px', width: '90px', height: '90px', background: '#22c55e', borderRadius: '50%', zIndex: 2 }} />
      <div style={{ position: 'absolute', bottom: '-35px', right: '-10px', width: '110px', height: '110px', background: '#ec4899', borderRadius: '50%', zIndex: 2 }} />
      <div style={{ position: 'absolute', bottom: '-45px', left: '60px', width: '110px', height: '110px', background: '#fbbf24', borderRadius: '50%', zIndex: 2 }} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', padding: '16px', paddingTop: '36px' }}>
        
        {/* Kontak Sekolah Header Pill */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <span style={{ background: '#1d4ed8', color: '#ffffff', padding: '4px 18px', borderRadius: '16px', fontSize: '9px', fontWeight: '900', letterSpacing: '0.4px', boxShadow: '0 2px 4px rgba(29, 78, 216, 0.3)' }}>
            Kontak Sekolah
          </span>
        </div>

        {/* Contact Info */}
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', padding: '6px 8px', marginBottom: '10px', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', fontSize: '7.5px', color: '#0f172a', lineHeight: '1.4' }}>
            <tbody>
              <tr>
                <td style={{ width: '18px', verticalAlign: 'top', paddingTop: '2px', color: '#1d4ed8', textAlign: 'center' }}>
                  <User style={{ width: '11px', height: '11px', margin: '0 auto' }} />
                </td>
                <td style={{ fontWeight: '900', paddingBottom: '3px', fontSize: '8.5px', color: '#000000' }}>
                  {schoolIdentity.schoolName || "SDN BAUJENG I BEJI"}
                </td>
              </tr>
              <tr>
                <td style={{ verticalAlign: 'top', paddingTop: '2px', color: '#1d4ed8', textAlign: 'center' }}>
                  <MapPinIcon />
                </td>
                <td style={{ paddingBottom: '3px', fontWeight: '600', color: '#334155' }}>
                  Jl. Balai Desa Baujeng No. 01 Desa Baujeng, Kecamatan Beji, Kabupaten Pasuruan
                </td>
              </tr>
              <tr>
                <td style={{ verticalAlign: 'top', paddingTop: '2px', color: '#1d4ed8', textAlign: 'center' }}>
                  <MailIcon />
                </td>
                <td style={{ paddingBottom: '3px', fontWeight: '600', color: '#334155' }}>
                  sdn.baujeng1beji@gmail.com
                </td>
              </tr>
              <tr>
                <td style={{ verticalAlign: 'top', paddingTop: '2px', color: '#1d4ed8', textAlign: 'center' }}>
                  <GlobeIcon />
                </td>
                <td style={{ fontWeight: '700', color: '#334155' }}>Kode Pos 67154</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* QR Code Section with Solid Crisp White Plate */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ background: '#ffffff', padding: '6px', border: '2px solid #93c5fd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <QRCode value={murid['NISN'] || murid['NIS'] || "INVALID"} size={68} />
          </div>
          <div style={{ fontSize: '7px', fontWeight: '900', color: '#1d4ed8', marginTop: '4px', textAlign: 'center', letterSpacing: '0.4px' }}>
            SCAN UNTUK INFORMASI SISWA
          </div>
        </div>

        {/* Rules Box: Clean solid box */}
        <div style={{ background: '#eff6ff', borderRadius: '8px', padding: '6px 10px', fontSize: '6.5px', color: '#0f172a', marginBottom: '10px', border: '1px solid #bfdbfe' }}>
          <ol style={{ margin: 0, paddingLeft: '12px', lineHeight: '1.45', fontWeight: '600' }}>
            <li style={{ marginBottom: '2px' }}>Kartu ini milik siswa dan tidak dapat dipindahtangankan.</li>
            <li style={{ marginBottom: '2px' }}>Harap menjaga dan menggunakan kartu ini dengan baik.</li>
            <li>Jika kartu hilang, segera lapor ke pihak sekolah.</li>
          </ol>
        </div>

        {/* Signature Box */}
        <div style={{ textAlign: 'right', fontSize: '7.5px', marginTop: 'auto', marginBottom: '14px', paddingRight: '12px' }}>
          <div style={{ marginBottom: '24px', fontWeight: '700', color: '#000000' }}>Kepala Sekolah</div>
          <div style={{ fontWeight: '900', color: '#000000', borderBottom: '1.5px solid #000000', display: 'inline-block', paddingBottom: '2px', minWidth: '95px', textAlign: 'center' }}>
            {schoolIdentity.headmasterName || "Akhmad Nasor, S.Pd., M.Pd."}
          </div>
        </div>

      </div>
    </div>
  );
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '11px', height: '11px', margin: '0 auto' }}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '11px', height: '11px', margin: '0 auto' }}>
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '11px', height: '11px', margin: '0 auto' }}>
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.09 13.36 4 12.69 4 12s.09-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2s.07-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.17.64.26 1.31.26 2s-.09 1.36-.26 2h-3.38z"/>
    </svg>
  );
}
