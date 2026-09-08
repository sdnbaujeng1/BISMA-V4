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
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
    }
    const originalTitle = document.title;
    document.title = `Kartu_Pelajar_${(schoolIdentity.appName || 'BISMA')}_${(schoolIdentity.schoolName || 'SDN_Baujeng_1').replace(/[^a-zA-Z0-9]/g, '_')}`;

    // Request animation frame so browser renders clean light theme before print dialog
    requestAnimationFrame(() => {
      window.print();
      const restore = () => {
        if (isDark) {
          document.documentElement.classList.add('dark');
        }
        document.title = originalTitle;
        window.removeEventListener('afterprint', restore);
      };
      window.addEventListener('afterprint', restore);
      setTimeout(restore, 1500);
    });
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
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            {schoolIdentity.schoolLogo && (
              <img 
                src={schoolIdentity.schoolLogo} 
                alt="Logo" 
                className="w-8 h-8 object-contain rounded-full bg-white p-0.5 border border-slate-200 shadow-sm" 
              />
            )}
            Cetak Kartu Pelajar {schoolIdentity.appName ? `- ${schoolIdentity.appName}` : ''}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {schoolIdentity.schoolName} &bull; Ukuran Standar ID Card: <span className="font-bold text-blue-600 dark:text-blue-400">9,0 × 5,5 cm (90 × 55 mm)</span>. Format cetak bersih latar putih murni tanpa lapisan abu-abu/hitam.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            disabled={selectedMurid.size === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
          >
            <Printer className="w-5 h-5" />
            Cetak / Simpan PDF ({selectedMurid.size})
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
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Pratinjau Hasil Cetak Kartu (Ukuran 9,0 × 5,5 cm)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Siswa: <span className="font-semibold text-blue-600 dark:text-blue-400">{previewMurid['Nama Lengkap']}</span> &bull; Kelas: <span className="font-bold text-slate-700 dark:text-slate-300">{previewMurid['Kelas']}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <Sparkles className="w-4 h-4" />
              Presisi 90 × 55 mm & Bebas Lapisan Hitam
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-8 py-2">
            {/* Front Card Preview */}
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bagian Depan (55 × 90 mm)</span>
              <CardFront murid={previewMurid} schoolIdentity={schoolIdentity} formatTTL={formatTTL} />
            </div>

            {/* Back Card Preview */}
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bagian Belakang (55 × 90 mm)</span>
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

      {/* Print Area: Clean White Background, Zero Shadow, Zero Dark Layers */}
      <div className="hidden print:block print:w-full print:bg-white" ref={printRef} id="printable-cards-area">
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { 
              margin: 8mm; 
              size: A4 portrait; 
            }
            html, 
            body { 
              margin: 0 !important; 
              padding: 0 !important;
              background: #ffffff !important;
              background-color: #ffffff !important;
              color: #000000 !important;
              overflow: visible !important;
              height: auto !important;
              min-height: 0 !important;
              max-height: none !important;
              box-shadow: none !important;
              border: none !important;
            }
            /* Hide all other DOM elements from print output */
            body * {
              visibility: hidden;
            }
            #printable-cards-area, #printable-cards-area * {
              visibility: visible !important;
            }
            #printable-cards-area {
              display: block !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              background: #ffffff !important;
              background-color: #ffffff !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
            }
            .print-card-grid {
              display: flex !important;
              flex-wrap: wrap !important;
              gap: 6mm !important;
              background: #ffffff !important;
              background-color: #ffffff !important;
              align-items: flex-start !important;
              box-shadow: none !important;
            }
            .print-card-wrapper {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              margin-bottom: 6mm !important;
              display: inline-flex !important;
              flex-direction: row !important;
              gap: 6mm !important;
              align-items: center !important;
              background: #ffffff !important;
              background-color: #ffffff !important;
              box-shadow: none !important;
            }
            .id-card-element {
              width: 55mm !important;
              height: 90mm !important;
              min-width: 55mm !important;
              max-width: 55mm !important;
              min-height: 90mm !important;
              max-height: 90mm !important;
              box-sizing: border-box !important;
              box-shadow: none !important;
              border: 1px solid #cbd5e1 !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              background-color: #ffffff !important;
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
            }
            .id-card-element * {
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
              box-shadow: none !important;
              text-shadow: none !important;
            }
          }
        `}} />
        
        <div className="print-card-grid">
          {muridList.filter(m => selectedMurid.has(m.id)).map(murid => (
            <div key={murid.id} className="print-card-wrapper">
              <CardFront murid={murid} schoolIdentity={schoolIdentity} formatTTL={formatTTL} />
              <CardBack murid={murid} schoolIdentity={schoolIdentity} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Sub-Component: Bagian Depan Kartu (Ukuran Standar ID Card: 55 × 90 mm)
function CardFront({ murid, schoolIdentity, formatTTL }: { murid: any, schoolIdentity: any, formatTTL: (m: any) => string }) {
  const namaSiswa = murid['Nama Lengkap'] || '-';
  const isNamaPanjang = namaSiswa.length > 20;

  return (
    <div 
      className="id-card-element rounded-xl"
      style={{ 
        width: '55mm', 
        height: '90mm', 
        minWidth: '55mm',
        maxWidth: '55mm',
        minHeight: '90mm',
        maxHeight: '90mm',
        position: 'relative', 
        overflow: 'hidden', 
        borderRadius: '3.5mm', 
        border: '1.2px solid #cbd5e1', 
        backgroundColor: '#ffffff', 
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxSizing: 'border-box',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)'
      }}
    >
      {/* Top Header Background Shapes */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '33mm', background: 'linear-gradient(140deg, #0284c7, #1d4ed8)', borderBottomLeftRadius: '50% 25%', borderBottomRightRadius: '50% 15%', zIndex: 1 }} />
      <div style={{ position: 'absolute', top: '28mm', left: '-10mm', right: '-10mm', height: '9mm', background: '#38bdf8', opacity: 0.9, borderBottomLeftRadius: '50% 100%', borderBottomRightRadius: '50% 100%', transform: 'rotate(-7deg)', zIndex: 2 }} />
      
      {/* Bottom Decorative Trim Shapes */}
      <div style={{ position: 'absolute', bottom: '-8mm', left: '-6mm', width: '22mm', height: '22mm', background: '#22c55e', borderRadius: '50%', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: '-10mm', left: '12mm', width: '22mm', height: '22mm', background: '#fbbf24', borderRadius: '50%', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: '-8mm', right: '-7mm', width: '22mm', height: '22mm', background: '#ec4899', borderRadius: '50%', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: '-7mm', right: '5mm', width: '18mm', height: '18mm', background: '#f97316', borderRadius: '50%', zIndex: 3 }} />

      {/* Main Content Layout */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
        
        {/* Header Content */}
        <div style={{ textAlign: 'center', color: '#ffffff', paddingTop: '2.5mm', paddingLeft: '2mm', paddingRight: '2mm' }}>
          <div style={{ background: '#ffffff', padding: '1.5px', borderRadius: '50%', marginBottom: '2px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
            <img 
              src={schoolIdentity.schoolLogo || "https://lh3.googleusercontent.com/d/1VSxiSJ43i0sOp-hjn2QaqlFPqRl3A5AL"} 
              alt={schoolIdentity.schoolName || "Logo"} 
              style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} 
            />
          </div>
          <h1 style={{ fontSize: '9px', fontWeight: '900', margin: '0', textTransform: 'uppercase', letterSpacing: '0.2px', textShadow: '0 1px 2px rgba(0,0,0,0.4)', lineHeight: '1.15' }}>
            {schoolIdentity.schoolName || "SDN BAUJENG I BEJI"}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', margin: '1px 0 1px' }}>
            <div style={{ height: '0.8px', width: '12px', background: 'rgba(255,255,255,0.85)' }} />
            <div style={{ fontSize: '5.2px', letterSpacing: '1.2px', fontWeight: '900', color: '#ffffff' }}>
              {schoolIdentity.appName ? `${schoolIdentity.appName} • ` : ''}BERMUTU
            </div>
            <div style={{ height: '0.8px', width: '12px', background: 'rgba(255,255,255,0.85)' }} />
          </div>
          <p style={{ fontSize: '4.5px', margin: 0, fontWeight: '600', opacity: 0.95, letterSpacing: '0.1px', lineHeight: '1.1' }}>
            {schoolIdentity.sloganText || "Beriman, Ramah, Mandiri, Unggul dan Tangguh"}
          </p>
        </div>

        {/* Photo Area */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5mm' }}>
          <div style={{ width: '42px', height: '42px', backgroundColor: '#f8fafc', borderRadius: '50%', border: '2.5px solid #ffffff', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.18)', position: 'relative' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ width: '28px', height: '28px', color: '#94a3b8', marginBottom: '-3px' }}>
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        </div>

        {/* TAMPILAN NAMA TEPAT DI BAWAH FOTO SISWA */}
        <div style={{ textAlign: 'center', marginTop: '2px', padding: '0 2mm' }}>
          <h2 
            style={{ 
              fontSize: isNamaPanjang ? '8.5px' : '9.8px', 
              fontWeight: '900', 
              textTransform: 'uppercase', 
              color: '#0f172a', 
              letterSpacing: '0.15px', 
              lineHeight: '1.2', 
              margin: '0 0 2px 0',
              wordBreak: 'break-word',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {namaSiswa}
          </h2>
          
          {/* Elegant Pill Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', color: '#ffffff', fontSize: '5.2px', fontWeight: '900', letterSpacing: '0.8px', padding: '1.2px 8px', borderRadius: '10px', boxShadow: '0 1px 2px rgba(29, 78, 216, 0.25)', textTransform: 'uppercase' }}>
            KARTU PELAJAR {schoolIdentity.appName || "BISMA"}
          </div>
        </div>

        {/* Student Data Box (Di Tengah, Seimbang & Proporsional) */}
        <div 
          style={{ 
            margin: '2mm 3mm 0 3mm', 
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            padding: '3.5px 5.5px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            border: '1.2px solid #cbd5e1',
            position: 'relative',
            zIndex: 10
          }}
        >
          {/* NISN & NIS Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7.2px', marginBottom: '2.5px', borderBottom: '1px solid #f1f5f9', paddingBottom: '2px' }}>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              <span style={{ color: '#1e40af', fontWeight: '900' }}>NISN :</span>
              <span style={{ color: '#000000', fontWeight: '900' }}>
                {murid['NISN'] || '-'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              <span style={{ color: '#1e40af', fontWeight: '900' }}>NIS :</span>
              <span style={{ color: '#000000', fontWeight: '900' }}>
                {murid['NIS'] || '-'}
              </span>
            </div>
          </div>
          
          {/* Detailed Info Table */}
          <table style={{ width: '100%', fontSize: '6.8px', color: '#000000', lineHeight: '1.35', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '38%', padding: '1px 0', fontWeight: '800', color: '#334155' }}>Kelas</td>
                <td style={{ width: '5%', fontWeight: '900', color: '#000000' }}>:</td>
                <td style={{ fontWeight: '900', color: '#0f172a', fontSize: '7.5px' }}>
                  {murid['Kelas'] || '-'}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '1px 0', fontWeight: '800', color: '#334155' }}>Tempat, Tgl Lahir</td>
                <td style={{ fontWeight: '900', color: '#000000' }}>:</td>
                <td style={{ fontWeight: '800', color: '#0f172a', fontSize: '6.8px' }}>
                  {formatTTL(murid)}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '1px 0', fontWeight: '800', color: '#334155' }}>Jenis Kelamin</td>
                <td style={{ fontWeight: '900', color: '#000000' }}>:</td>
                <td style={{ fontWeight: '800', color: '#0f172a', fontSize: '6.8px' }}>
                  {murid['Jenis Kelamin (L/P)'] === 'L' ? 'Laki-laki (L)' : murid['Jenis Kelamin (L/P)'] === 'P' ? 'Perempuan (P)' : (murid['Jenis Kelamin (L/P)'] || '-')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Motto Text with High Contrast Halo */}
        <div 
          style={{ 
            marginTop: 'auto', 
            marginBottom: '2mm', 
            textAlign: 'center', 
            fontSize: '4.8px', 
            fontWeight: '900', 
            color: '#1e40af', 
            letterSpacing: '0.4px',
            textShadow: '0 0 2px #ffffff, 0 0 4px #ffffff',
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

// Sub-Component: Bagian Belakang Kartu (Ukuran Standar ID Card: 55 × 90 mm)
function CardBack({ murid, schoolIdentity }: { murid: any, schoolIdentity: any }) {
  return (
    <div 
      className="id-card-element rounded-xl"
      style={{ 
        width: '55mm', 
        height: '90mm', 
        minWidth: '55mm',
        maxWidth: '55mm',
        minHeight: '90mm',
        maxHeight: '90mm',
        position: 'relative', 
        overflow: 'hidden', 
        borderRadius: '3.5mm', 
        border: '1.2px solid #cbd5e1', 
        backgroundColor: '#ffffff', 
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxSizing: 'border-box',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)'
      }}
    >
      {/* Top Header Shapes */}
      <div style={{ position: 'absolute', top: '-8mm', left: '-6mm', width: '24mm', height: '24mm', background: '#22c55e', borderRadius: '50%', zIndex: 1 }} />
      <div style={{ position: 'absolute', top: '-11mm', left: '10mm', width: '28mm', height: '28mm', background: '#fbbf24', borderRadius: '50%', zIndex: 1 }} />
      <div style={{ position: 'absolute', top: '-6mm', right: '-5mm', width: '24mm', height: '24mm', background: '#ec4899', borderRadius: '50%', zIndex: 1 }} />

      {/* Bottom Header Shapes */}
      <div style={{ position: 'absolute', bottom: '-8mm', left: '-5mm', right: '-5mm', height: '22mm', background: 'linear-gradient(135deg, #0284c7, #1d4ed8)', borderTopLeftRadius: '50% 100%', borderTopRightRadius: '50% 100%', zIndex: 1 }} />
      <div style={{ position: 'absolute', bottom: '-4mm', left: '-2mm', width: '18mm', height: '18mm', background: '#22c55e', borderRadius: '50%', zIndex: 2 }} />
      <div style={{ position: 'absolute', bottom: '-6mm', right: '-2mm', width: '22mm', height: '22mm', background: '#ec4899', borderRadius: '50%', zIndex: 2 }} />
      <div style={{ position: 'absolute', bottom: '-8mm', left: '12mm', width: '22mm', height: '22mm', background: '#fbbf24', borderRadius: '50%', zIndex: 2 }} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', padding: '2.5mm 3mm', boxSizing: 'border-box' }}>
        
        {/* Kontak Sekolah Header Pill */}
        <div style={{ textAlign: 'center', marginBottom: '2.5px' }}>
          <span style={{ background: '#1d4ed8', color: '#ffffff', padding: '2px 10px', borderRadius: '10px', fontSize: '6.8px', fontWeight: '900', letterSpacing: '0.3px', boxShadow: '0 1px 3px rgba(29, 78, 216, 0.3)' }}>
            Kontak {schoolIdentity.appName || "Sekolah"}
          </span>
        </div>

        {/* Contact Info */}
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.96)', borderRadius: '5px', padding: '3px 5px', marginBottom: '3px', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', fontSize: '6px', color: '#0f172a', lineHeight: '1.3' }}>
            <tbody>
              <tr>
                <td style={{ width: '14px', verticalAlign: 'top', paddingTop: '1px', color: '#1d4ed8', textAlign: 'center' }}>
                  <div style={{ width: '11px', height: '11px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', border: '0.5px solid #cbd5e1' }}>
                    <img 
                      src={schoolIdentity.schoolLogo || "https://lh3.googleusercontent.com/d/1VSxiSJ43i0sOp-hjn2QaqlFPqRl3A5AL"} 
                      alt="Logo" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    />
                  </div>
                </td>
                <td style={{ fontWeight: '900', paddingBottom: '1px', fontSize: '6.8px', color: '#000000' }}>
                  {schoolIdentity.schoolName || "SDN BAUJENG I BEJI"}
                </td>
              </tr>
              <tr>
                <td style={{ verticalAlign: 'top', paddingTop: '1px', color: '#1d4ed8', textAlign: 'center' }}>
                  <MapPinIcon />
                </td>
                <td style={{ paddingBottom: '1px', fontWeight: '600', color: '#334155' }}>
                  Jl. Balai Desa Baujeng No. 01 Beji, Pasuruan
                </td>
              </tr>
              <tr>
                <td style={{ verticalAlign: 'top', paddingTop: '1px', color: '#1d4ed8', textAlign: 'center' }}>
                  <MailIcon />
                </td>
                <td style={{ paddingBottom: '1px', fontWeight: '600', color: '#334155' }}>
                  sdn.baujeng1beji@gmail.com
                </td>
              </tr>
              <tr>
                <td style={{ verticalAlign: 'top', paddingTop: '1px', color: '#1d4ed8', textAlign: 'center' }}>
                  <GlobeIcon />
                </td>
                <td style={{ fontWeight: '700', color: '#334155' }}>Kode Pos 67154</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* QR Code Section with Solid Crisp White Plate */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '3px' }}>
          <div style={{ background: '#ffffff', padding: '3px', border: '1.5px solid #93c5fd', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <QRCode value={murid['NISN'] || murid['NIS'] || "INVALID"} size={48} />
          </div>
          <div style={{ fontSize: '5.2px', fontWeight: '900', color: '#1d4ed8', marginTop: '2px', textAlign: 'center', letterSpacing: '0.3px' }}>
            SCAN UNTUK PRESENSI & INFORMASI SISWA
          </div>
        </div>

        {/* Rules Box: Clean solid box */}
        <div style={{ background: '#eff6ff', borderRadius: '5px', padding: '3px 5px', fontSize: '4.8px', color: '#0f172a', marginBottom: '2.5px', border: '1px solid #bfdbfe' }}>
          <ol style={{ margin: 0, paddingLeft: '10px', lineHeight: '1.35', fontWeight: '600' }}>
            <li>Kartu ini milik siswa dan tidak dapat dipindahtangankan.</li>
            <li>Harap menjaga dan menggunakan kartu ini dengan baik.</li>
            <li>Jika kartu hilang, segera lapor ke pihak sekolah.</li>
          </ol>
        </div>

        {/* Signature Box */}
        <div style={{ textAlign: 'right', fontSize: '6px', marginTop: 'auto', marginBottom: '1.5mm', paddingRight: '2mm' }}>
          <div style={{ marginBottom: '12px', fontWeight: '700', color: '#000000' }}>Kepala Sekolah</div>
          <div style={{ fontWeight: '900', color: '#000000', borderBottom: '1.2px solid #000000', display: 'inline-block', paddingBottom: '1px', minWidth: '70px', textAlign: 'center', fontSize: '6.8px' }}>
            {schoolIdentity.headmasterName || "AKHMAD NASOR, S.Pd"}
          </div>
          {schoolIdentity.headmasterNIP && schoolIdentity.headmasterNIP !== '-' && (
            <div style={{ fontSize: '5.2px', color: '#000000', fontWeight: '700', marginTop: '1px' }}>
              NIP. {schoolIdentity.headmasterNIP}
            </div>
          )}
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
