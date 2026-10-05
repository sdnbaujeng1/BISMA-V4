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
  const [schoolContact, setSchoolContact] = useState<{
    schoolName: string;
    address: string;
    email: string;
    kodePos: string;
    web_url: string;
    youtube_url: string;
    ig_url: string;
  }>({
    schoolName: "SDN BAUJENG I BEJI",
    address: "Jl. Balai Desa Baujeng No. 01 Desa Baujeng, Kecamatan Beji, Kabupaten Pasuruan",
    email: "sdn.baujeng1beji@gmail.com",
    kodePos: "67154",
    web_url: "www.sdnbaujeng1.sch.id",
    youtube_url: "youtube.com/@sdnbaujeng1",
    ig_url: "@sdnbaujeng1",
  });

  useEffect(() => {
    fetchMurid();
    fetchContact();
  }, []);

  const fetchContact = async () => {
    try {
      const res = await fetch('/api/helpdesk-config');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          
          let cleanWeb = "www.sdnbaujeng1.sch.id";
          if (d.web_url) {
            cleanWeb = d.web_url.replace(/^https?:\/\//, '').replace(/\/$/, '');
          }

          let cleanYt = "youtube.com/@sdnbaujeng1";
          if (d.youtube_url) {
            if (d.youtube_url.includes('youtube.com/@')) {
              cleanYt = d.youtube_url.replace(/^https?:\/\//, '').replace(/\/$/, '');
            } else if (d.youtube_url.includes('youtu.be/')) {
              cleanYt = "youtube.com/@sdnbaujeng1";
            } else if (d.youtube_url.includes('youtube.com/')) {
              cleanYt = d.youtube_url.replace(/^https?:\/\//, '').replace(/\/$/, '');
            } else {
              cleanYt = d.youtube_url;
            }
          }

          let cleanIg = "@sdnbaujeng1";
          if (d.ig_url) {
            if (d.ig_url.includes('instagram.com/')) {
              const handle = d.ig_url.split('instagram.com/')[1].replace(/\/$/, '');
              cleanIg = handle ? (handle.startsWith('@') ? handle : `@${handle}`) : "@sdnbaujeng1";
            } else if (d.ig_url.startsWith('@')) {
              cleanIg = d.ig_url;
            } else {
              cleanIg = `@${d.ig_url}`;
            }
          }

          setSchoolContact(prev => ({
            ...prev,
            email: d.email || prev.email,
            address: d.location && !d.location.includes("SDN Baujeng I Beji") ? d.location : prev.address,
            web_url: cleanWeb,
            youtube_url: cleanYt,
            ig_url: cleanIg,
          }));
        }
      }
    } catch (e) {
      console.error("Failed to fetch helpdesk config for student card", e);
    }
  };

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
              <CardBack murid={previewMurid} schoolIdentity={schoolIdentity} schoolContact={schoolContact} />
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
              <CardBack murid={murid} schoolIdentity={schoolIdentity} schoolContact={schoolContact} />
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
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '26mm', background: 'linear-gradient(140deg, #0284c7, #1d4ed8)', borderBottomLeftRadius: '50% 25%', borderBottomRightRadius: '50% 15%', zIndex: 1 }} />
      <div style={{ position: 'absolute', top: '22mm', left: '-10mm', right: '-10mm', height: '7mm', background: '#38bdf8', opacity: 0.9, borderBottomLeftRadius: '50% 100%', borderBottomRightRadius: '50% 100%', transform: 'rotate(-6deg)', zIndex: 2 }} />
      
      {/* Bottom Decorative Trim Shapes */}
      <div style={{ position: 'absolute', bottom: '-8mm', left: '-6mm', width: '22mm', height: '22mm', background: '#22c55e', borderRadius: '50%', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: '-10mm', left: '12mm', width: '22mm', height: '22mm', background: '#fbbf24', borderRadius: '50%', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: '-8mm', right: '-7mm', width: '22mm', height: '22mm', background: '#ec4899', borderRadius: '50%', zIndex: 3 }} />
      <div style={{ position: 'absolute', bottom: '-7mm', right: '5mm', width: '18mm', height: '18mm', background: '#f97316', borderRadius: '50%', zIndex: 3 }} />

      {/* Main Content Layout */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
        
        {/* Header Content */}
        <div style={{ textAlign: 'center', color: '#ffffff', paddingTop: '1.6mm', paddingLeft: '2mm', paddingRight: '2mm' }}>
          <div style={{ background: '#ffffff', padding: '1.5px', borderRadius: '50%', marginBottom: '1.2px', width: '21px', height: '21px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
            <img 
              src={schoolIdentity.schoolLogo || "https://lh3.googleusercontent.com/d/1VSxiSJ43i0sOp-hjn2QaqlFPqRl3A5AL"} 
              alt={schoolIdentity.schoolName || "Logo"} 
              style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} 
            />
          </div>
          <h1 style={{ fontSize: '8.8px', fontWeight: '900', margin: '0', textTransform: 'uppercase', letterSpacing: '0.2px', textShadow: '0 1px 2px rgba(0,0,0,0.4)', lineHeight: '1.15' }}>
            {schoolIdentity.schoolName || "SDN BAUJENG I BEJI"}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3.5px', margin: '1px 0' }}>
            <svg viewBox="0 0 24 24" fill="#fbbf24" style={{ width: '8.5px', height: '8.5px', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))' }}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span style={{ fontSize: '6.8px', letterSpacing: '1.2px', fontWeight: '900', color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
              BERMUTU
            </span>
            <svg viewBox="0 0 24 24" fill="#fbbf24" style={{ width: '8.5px', height: '8.5px', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))' }}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <p style={{ fontSize: '5.2px', margin: 0, fontWeight: '700', color: '#ffffff', letterSpacing: '0.12px', lineHeight: '1.2', textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}>
            💡 Beriman, Ramah, Mandiri, Unggul dan Tangguh 💡
          </p>
        </div>

        {/* Frame Kotak Foto Pas Foto 3x4 cm di Spase Kosong */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.2mm' }}>
          <div 
            style={{ 
              width: '22mm', 
              height: '29.3mm', 
              backgroundColor: '#f8fafc', 
              borderRadius: '3.5px', 
              border: '1.2px dashed #94a3b8', 
              boxShadow: '0 2px 4px rgba(0,0,0,0.06)', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '2px',
              boxSizing: 'border-box'
            }}
          >
            {/* Icon Foto Siswa */}
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '15px', height: '15px' }}>
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            {/* Keterangan Ukuran Foto di Bawah Icon Foto */}
            <div style={{ fontSize: '4.8px', fontWeight: '800', color: '#475569', letterSpacing: '0.3px', textTransform: 'uppercase', textAlign: 'center', lineHeight: '1.2' }}>
              FOTO SISWA
            </div>
            <div style={{ fontSize: '4.4px', fontWeight: '700', color: '#64748b', letterSpacing: '0.2px', textAlign: 'center', marginTop: '0.5px' }}>
              Ukuran 3 x 4 cm
            </div>
          </div>
        </div>

        {/* Student Info Box - Tepat 18px dari frame foto */}
        <div 
          style={{ 
            margin: '18px 3mm 0 3mm', 
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            padding: '3px 5px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            border: '1.2px solid #cbd5e1',
            position: 'relative',
            zIndex: 10
          }}
        >
          {/* NISN & NIS Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '6.8px', marginBottom: '2px', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px' }}>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              <span style={{ color: '#1d4ed8', fontWeight: '900' }}>NISN :</span>
              <span style={{ color: '#000000', fontWeight: '900', borderBottom: '1px solid #000000', paddingBottom: '0.2px' }}>
                {murid['NISN'] || '-'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
              <span style={{ color: '#1d4ed8', fontWeight: '900' }}>NIS :</span>
              <span style={{ color: '#000000', fontWeight: '900', borderBottom: '1px solid #000000', paddingBottom: '0.2px' }}>
                {murid['NIS'] || '-'}
              </span>
            </div>
          </div>
          
          {/* Student Full Name: Centered, Bold Black */}
          <div 
            style={{ 
              fontSize: isNamaPanjang ? '8px' : '9px', 
              fontWeight: '900', 
              textAlign: 'center', 
              margin: '1.5px 0', 
              textTransform: 'uppercase', 
              color: '#000000', 
              letterSpacing: '0.15px',
              lineHeight: '1.2',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '2px'
            }}
          >
            {namaSiswa}
          </div>

          {/* Detailed Info Table */}
          <table style={{ width: '100%', fontSize: '6.2px', color: '#000000', lineHeight: '1.3', borderCollapse: 'collapse', marginTop: '1px' }}>
            <tbody>
              <tr>
                <td style={{ width: '38%', padding: '0.8px 0', fontWeight: '800', color: '#000000' }}>Kelas</td>
                <td style={{ width: '5%', fontWeight: '900', color: '#000000' }}>:</td>
                <td style={{ fontWeight: '900', color: '#000000', fontSize: '6.8px' }}>
                  {murid['Kelas'] || '-'}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '0.8px 0', fontWeight: '800', color: '#000000' }}>Tempat, Tgl Lahir</td>
                <td style={{ fontWeight: '900', color: '#000000' }}>:</td>
                <td style={{ fontWeight: '800', color: '#000000', fontSize: '6.2px' }}>
                  {formatTTL(murid)}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '0.8px 0', fontWeight: '800', color: '#000000' }}>Jenis Kelamin</td>
                <td style={{ fontWeight: '900', color: '#000000' }}>:</td>
                <td style={{ fontWeight: '800', color: '#000000', fontSize: '6.2px' }}>
                  {murid['Jenis Kelamin (L/P)'] === 'L' ? 'Laki-laki (L)' : murid['Jenis Kelamin (L/P)'] === 'P' ? 'Perempuan (P)' : (murid['Jenis Kelamin (L/P)'] || '-')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Motto Text */}
        <div 
          style={{ 
            marginTop: 'auto', 
            marginBottom: '2mm', 
            textAlign: 'center', 
            fontSize: '4.6px', 
            fontWeight: '900', 
            color: '#1e40af', 
            letterSpacing: '0.3px',
            textShadow: '0 0 2.5px #ffffff, 0 0 5px #ffffff',
            lineHeight: '1.2',
            zIndex: 15,
            textTransform: 'uppercase'
          }}
        >
          BERIMAN, RAMAH, MANDIRI, UNGGUL DAN TANGGUH
        </div>
      </div>
    </div>
  );
}

// Sub-Component: Bagian Belakang Kartu (Ukuran Standar ID Card: 55 × 90 mm)
function CardBack({ murid, schoolIdentity, schoolContact }: { murid: any, schoolIdentity: any, schoolContact: any }) {
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
      {/* Top Colorful Circles */}
      <div style={{ position: 'absolute', top: '-8mm', left: '-6mm', width: '24mm', height: '24mm', background: '#22c55e', borderRadius: '50%', zIndex: 1 }} />
      <div style={{ position: 'absolute', top: '-11mm', left: '10mm', width: '28mm', height: '28mm', background: '#fbbf24', borderRadius: '50%', zIndex: 1 }} />
      <div style={{ position: 'absolute', top: '-6mm', right: '-5mm', width: '24mm', height: '24mm', background: '#ec4899', borderRadius: '50%', zIndex: 1 }} />

      {/* Bottom Colorful Circles */}
      <div style={{ position: 'absolute', bottom: '-8mm', left: '-6mm', width: '24mm', height: '24mm', background: '#22c55e', borderRadius: '50%', zIndex: 1 }} />
      <div style={{ position: 'absolute', bottom: '-10mm', left: '12mm', width: '26mm', height: '26mm', background: '#fbbf24', borderRadius: '50%', zIndex: 1 }} />
      <div style={{ position: 'absolute', bottom: '-8mm', right: '-6mm', width: '24mm', height: '24mm', background: '#ec4899', borderRadius: '50%', zIndex: 1 }} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', padding: '1.8mm 3mm', boxSizing: 'border-box' }}>
        
        {/* Kontak Sekolah Header Pill */}
        <div style={{ textAlign: 'center', marginBottom: '1.5mm', marginTop: '0.2mm' }}>
          <span style={{ background: '#1d4ed8', color: '#ffffff', padding: '1.8px 12px', borderRadius: '12px', fontSize: '6.2px', fontWeight: '900', letterSpacing: '0.4px', boxShadow: '0 1px 3px rgba(29, 78, 216, 0.3)' }}>
            Kontak Sekolah
          </span>
        </div>

        {/* Contact Info Card */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '6px', padding: '2.5px 4.5px', marginBottom: '1.8mm', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', fontSize: '4.9px', color: '#000000', lineHeight: '1.3', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '13px', verticalAlign: 'middle', padding: '0.6px 0', textAlign: 'center' }}>
                  <UserOutlineIcon />
                </td>
                <td style={{ fontWeight: '900', padding: '0.6px 0 0.6px 2.5px', fontSize: '5.8px', color: '#000000' }}>
                  {schoolIdentity.schoolName || schoolContact?.schoolName || "SDN BAUJENG I BEJI"}
                </td>
              </tr>
              <tr>
                <td style={{ verticalAlign: 'middle', padding: '0.6px 0', textAlign: 'center' }}>
                  <MapPinIcon />
                </td>
                <td style={{ padding: '0.6px 0 0.6px 2.5px', fontWeight: '600', color: '#000000' }}>
                  {schoolContact?.address || "Jl. Balai Desa Baujeng No. 01 Desa Baujeng, Kecamatan Beji, Kabupaten Pasuruan"}
                </td>
              </tr>
              <tr>
                <td style={{ verticalAlign: 'middle', padding: '0.6px 0', textAlign: 'center' }}>
                  <GlobeIcon />
                </td>
                <td style={{ padding: '0.6px 0 0.6px 2.5px', fontWeight: '700', color: '#000000' }}>
                  {schoolContact?.web_url || "www.sdnbaujeng1.sch.id"}
                </td>
              </tr>
              <tr>
                <td style={{ verticalAlign: 'middle', padding: '0.6px 0', textAlign: 'center' }}>
                  <YoutubeIcon />
                </td>
                <td style={{ padding: '0.6px 0 0.6px 2.5px', fontWeight: '700', color: '#000000' }}>
                  {schoolContact?.youtube_url || "youtube.com/@sdnbaujeng1"}
                </td>
              </tr>
              <tr>
                <td style={{ verticalAlign: 'middle', padding: '0.6px 0', textAlign: 'center' }}>
                  <InstagramIcon />
                </td>
                <td style={{ padding: '0.6px 0 0.6px 2.5px', fontWeight: '700', color: '#000000' }}>
                  {schoolContact?.ig_url || "@sdnbaujeng1"}
                </td>
              </tr>
              <tr>
                <td style={{ verticalAlign: 'middle', padding: '0.6px 0', textAlign: 'center' }}>
                  <MailIcon />
                </td>
                <td style={{ padding: '0.6px 0 0.6px 2.5px', fontWeight: '600', color: '#000000' }}>
                  sdnbaujeng01@gmail.com
                </td>
              </tr>
              <tr>
                <td style={{ verticalAlign: 'middle', padding: '0.6px 0', textAlign: 'center' }}>
                  <PostalIcon />
                </td>
                <td style={{ padding: '0.6px 0 0.6px 2.5px', fontWeight: '700', color: '#000000' }}>
                  Kode Pos {schoolContact?.kodePos || "67154"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* QR Code Section - Ukuran 2x Lebih Besar dengan Tulisan 'SCAN DISINI' */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.8mm' }}>
          <div style={{ background: '#ffffff', padding: '3.5px', border: '1.5px solid #3b82f6', borderRadius: '6px', boxShadow: '0 2px 5px rgba(59, 130, 246, 0.15)' }}>
            <QRCode value={murid['NISN'] || murid['NIS'] || "INVALID"} size={80} />
          </div>
          <div style={{ fontSize: '6.2px', fontWeight: '900', color: '#1d4ed8', marginTop: '2px', textAlign: 'center', letterSpacing: '0.7px', textTransform: 'uppercase' }}>
            SCAN DISINI
          </div>
        </div>

        {/* Rules Box */}
        <div style={{ background: '#eff6ff', borderRadius: '4px', padding: '2px 4px', fontSize: '4.2px', color: '#1e293b', border: '1px solid #bfdbfe', textAlign: 'center', lineHeight: '1.3', fontWeight: '600' }}>
          <div>Kartu ini milik siswa dan tidak dapat dipindahtangankan.</div>
          <div>Harap menjaga dan menggunakan kartu ini dengan baik.</div>
          <div>Jika kartu hilang, segera lapor ke pihak sekolah.</div>
        </div>

        {/* Signature Box */}
        <div style={{ textAlign: 'right', fontSize: '5.6px', marginTop: 'auto', marginBottom: '1.2mm', paddingRight: '2mm', position: 'relative', zIndex: 10 }}>
          <div style={{ marginBottom: '9px', fontWeight: '700', color: '#000000', fontSize: '5.2px' }}>Kepala Sekolah</div>
          <div style={{ fontWeight: '900', color: '#000000', borderBottom: '1.2px solid #000000', display: 'inline-block', paddingBottom: '0.5px', minWidth: '65px', textAlign: 'center', fontSize: '6.2px' }}>
            {schoolIdentity.headmasterName || "AKHMAD NASOR, S.Pd"}
          </div>
          {schoolIdentity.headmasterNIP && schoolIdentity.headmasterNIP !== '-' && (
            <div style={{ fontSize: '4.6px', color: '#000000', fontWeight: '700', marginTop: '1px' }}>
              NIP. {schoolIdentity.headmasterNIP}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UserOutlineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '10px', height: '10px', margin: '0 auto', display: 'block' }}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '10px', height: '10px', margin: '0 auto', display: 'block' }}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '10px', height: '10px', margin: '0 auto', display: 'block' }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="#dc2626" style={{ width: '10px', height: '10px', margin: '0 auto', display: 'block' }}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#e1306c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '10px', height: '10px', margin: '0 auto', display: 'block' }}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '10px', height: '10px', margin: '0 auto', display: 'block' }}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function PostalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '10px', height: '10px', margin: '0 auto', display: 'block' }}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}
