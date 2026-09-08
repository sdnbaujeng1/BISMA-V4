import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useSchoolIdentity } from '../hooks/useSchoolIdentity';
import { Search, Printer, CheckCircle2, ChevronDown, Filter, User } from 'lucide-react';
import QRCode from 'react-qr-code';

export default function CetakKartu() {
  const schoolIdentity = useSchoolIdentity();
  const [muridList, setMuridList] = useState<any[]>([]);
  const [filteredMurid, setFilteredMurid] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMurid, setSelectedMurid] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [kelasFilter, setKelasFilter] = useState('');
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
    }
    setSelectedMurid(newSelected);
  };

  const selectAll = () => {
    if (selectedMurid.size === filteredMurid.length) {
      setSelectedMurid(new Set());
    } else {
      setSelectedMurid(new Set(filteredMurid.map(m => m.id)));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const uniqueClasses = Array.from(new Set(muridList.map(m => m['Kelas']))).filter(Boolean).sort();

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Cetak Kartu Pelajar</h2>
          <p className="text-slate-500 dark:text-slate-400">Pilih siswa untuk mencetak kartu identitas ber-QR code</p>
        </div>
        <button
          onClick={handlePrint}
          disabled={selectedMurid.size === 0}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-md"
        >
          <Printer className="w-5 h-5" />
          Cetak Kartu ({selectedMurid.size})
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden mb-8 print:hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari nama, NISN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div className="relative md:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <select
              value={kelasFilter}
              onChange={(e) => setKelasFilter(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none dark:bg-slate-700 dark:text-white"
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
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="p-4 font-semibold">Nama Siswa</th>
                <th className="p-4 font-semibold">NISN / NIS</th>
                <th className="p-4 font-semibold">Kelas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">Memuat data...</td>
                </tr>
              ) : filteredMurid.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">Tidak ada data siswa ditemukan.</td>
                </tr>
              ) : (
                filteredMurid.map((murid) => (
                  <tr key={murid.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedMurid.has(murid.id)}
                        onChange={() => toggleSelect(murid.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{murid['Nama Lengkap']}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">
                      <div>{murid['NISN'] || '-'}</div>
                      <div className="text-xs text-slate-400">{murid['NIS'] || '-'}</div>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{murid['Kelas']}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Area */}
      <div className="hidden print:block" ref={printRef}>
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page { margin: 0; size: A4 portrait; }
            body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-page { 
              display: grid; 
              grid-template-columns: repeat(2, 1fr); 
              gap: 1rem; 
              padding: 1rem; 
              page-break-after: always;
            }
          }
        `}} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 print:block print:gap-0">
          {muridList.filter(m => selectedMurid.has(m.id)).map(murid => (
            <div key={murid.id} className="flex gap-4 items-center print:inline-flex print:m-4 print:page-break-inside-avoid">
              
              {/* Bagian Depan */}
              <div style={{ width: '250px', height: '396px', position: 'relative', overflow: 'hidden', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#fff', fontFamily: 'sans-serif' }}>
                {/* Background Shapes */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '170px', background: 'linear-gradient(135deg, #0ea5e9, #1d4ed8)', borderBottomLeftRadius: '50% 25%', borderBottomRightRadius: '50% 15%' }} />
                <div style={{ position: 'absolute', top: '150px', left: '-30px', right: '-10px', height: '50px', background: '#38bdf8', opacity: 0.9, borderBottomLeftRadius: '50% 100%', borderBottomRightRadius: '50% 100%', transform: 'rotate(-8deg)' }} />
                
                {/* Bottom Shapes */}
                <div style={{ position: 'absolute', bottom: '-20px', left: '-30px', width: '120px', height: '120px', background: '#22c55e', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '-40px', left: '65px', width: '120px', height: '120px', background: '#fbbf24', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '-20px', right: '-40px', width: '120px', height: '120px', background: '#ec4899', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '-10px', right: '10px', width: '80px', height: '80px', background: '#f97316', borderRadius: '50%' }} />

                <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  
                  {/* Header */}
                  <div style={{ textAlign: 'center', color: 'white', paddingTop: '16px' }}>
                    <div style={{ background: 'white', padding: '4px', borderRadius: '50%', marginBottom: '4px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                      <img src={schoolIdentity.schoolLogo || "https://upload.wikimedia.org/wikipedia/commons/9/9e/Tut_Wuri_Handayani.svg"} alt="Logo" style={{ maxHeight: '100%', maxWidth: '100%' }} />
                    </div>
                    <h1 style={{ fontSize: '15px', fontWeight: '900', margin: '0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{schoolIdentity.schoolName || "SDN BAUJENG I BEJI"}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', margin: '2px 0 4px' }}>
                      <div style={{ height: '1px', width: '20px', background: 'rgba(255,255,255,0.7)' }} />
                      <div style={{ fontSize: '7px', letterSpacing: '2px', fontWeight: 'bold' }}>BERMUTU</div>
                      <div style={{ height: '1px', width: '20px', background: 'rgba(255,255,255,0.7)' }} />
                    </div>
                    <p style={{ fontSize: '6px', margin: 0, opacity: 0.95 }}>{schoolIdentity.sloganText || "Beriman, Ramah, Mandiri, Unggul dan Tangguh"}</p>
                  </div>

                  {/* Photo Area */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                    <div style={{ width: '74px', height: '74px', backgroundColor: '#e2e8f0', borderRadius: '50%', border: '3px solid white', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', position: 'relative' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ width: '45px', height: '45px', color: '#94a3b8', marginBottom: '-5px' }}>
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '4px', fontSize: '6px', fontWeight: 'bold', color: '#64748b', letterSpacing: '1px' }}>FOTO SISWA</div>

                  {/* Info Area */}
                  <div style={{ padding: '0 16px', marginTop: 'auto', marginBottom: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'bold', color: '#1d4ed8', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                         <span>NISN :</span>
                         <span style={{ color: '#0f172a', fontWeight: 'normal', borderBottom: '1px solid #cbd5e1', paddingBottom: '1px', minWidth: '45px' }}>{murid['NISN'] || '-'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                         <span>NIS :</span>
                         <span style={{ color: '#0f172a', fontWeight: 'normal', borderBottom: '1px solid #cbd5e1', paddingBottom: '1px', minWidth: '40px' }}>{murid['NIS'] || '-'}</span>
                      </div>
                    </div>
                    
                    <h2 style={{ fontSize: '14px', fontWeight: '900', textAlign: 'center', margin: '8px 0', textTransform: 'uppercase', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' }}>{murid['Nama Lengkap']}</h2>
                    
                    <table style={{ width: '100%', fontSize: '8px', color: '#1e293b', lineHeight: '1.4' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '40%', padding: '2px 0' }}>Kelas</td>
                          <td style={{ width: '5%' }}>:</td>
                          <td style={{ fontWeight: '500', borderBottom: '1px solid #e2e8f0' }}>{murid['Kelas']}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '2px 0' }}>Tempat, Tgl Lahir</td>
                          <td>:</td>
                          <td style={{ fontWeight: '500', borderBottom: '1px solid #e2e8f0' }}>- , {murid['Tanggal Lahir (YYYY-MM-DD)'] || '-'}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '2px 0' }}>Jenis Kelamin</td>
                          <td>:</td>
                          <td style={{ fontWeight: '500', borderBottom: '1px solid #e2e8f0' }}>{murid['Jenis Kelamin (L/P)'] || '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Footer Text */}
                  <div style={{ position: 'absolute', bottom: '12px', left: 0, right: 0, textAlign: 'center', fontSize: '7px', fontWeight: 'bold', color: '#1d4ed8', lineHeight: '1.3' }}>
                    BELAJAR<br/>BERKARAKTER<br/>MERAIH MASA DEPAN
                  </div>
                </div>
              </div>

              {/* Bagian Belakang */}
              <div style={{ width: '250px', height: '396px', position: 'relative', overflow: 'hidden', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#fff', fontFamily: 'sans-serif' }}>
                {/* Top Shapes */}
                <div style={{ position: 'absolute', top: '-40px', left: '-40px', width: '120px', height: '120px', background: '#22c55e', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', top: '-60px', left: '40px', width: '140px', height: '140px', background: '#fbbf24', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', background: '#ec4899', borderRadius: '50%' }} />

                {/* Bottom Shapes */}
                <div style={{ position: 'absolute', bottom: '-40px', left: '-30px', right: '-30px', height: '100px', background: 'linear-gradient(135deg, #0ea5e9, #1d4ed8)', borderTopLeftRadius: '50% 100%', borderTopRightRadius: '50% 100%' }} />
                <div style={{ position: 'absolute', bottom: '-20px', left: '-10px', width: '90px', height: '90px', background: '#22c55e', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '-30px', right: '-10px', width: '110px', height: '110px', background: '#ec4899', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '-40px', left: '60px', width: '110px', height: '110px', background: '#fbbf24', borderRadius: '50%' }} />

                <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', padding: '16px', paddingTop: '45px' }}>
                  
                  {/* Kontak */}
                  <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <span style={{ background: '#1d4ed8', color: 'white', padding: '4px 16px', borderRadius: '16px', fontSize: '9px', fontWeight: 'bold' }}>Kontak Sekolah</span>
                  </div>
                  <table style={{ width: '100%', fontSize: '7px', color: '#1e293b', marginBottom: '16px' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '20px', verticalAlign: 'top', paddingTop: '2px', color: '#1d4ed8', textAlign: 'center' }}><User className="w-3 h-3 mx-auto" /></td>
                        <td style={{ fontWeight: 'bold', paddingBottom: '6px', fontSize: '8px' }}>{schoolIdentity.schoolName || "SDN Baujeng I Beji"}</td>
                      </tr>
                      <tr>
                        <td style={{ verticalAlign: 'top', paddingTop: '2px', color: '#1d4ed8', textAlign: 'center' }}><MapPinIcon /></td>
                        <td style={{ paddingBottom: '6px' }}>Jl. Balai Desa Baujeng No. 01 Desa Baujeng, Kecamatan Beji, Kabupaten Pasuruan</td>
                      </tr>
                      <tr>
                        <td style={{ verticalAlign: 'top', paddingTop: '2px', color: '#1d4ed8', textAlign: 'center' }}><MailIcon /></td>
                        <td style={{ paddingBottom: '6px' }}>sdn.baujeng1beji@gmail.com</td>
                      </tr>
                      <tr>
                        <td style={{ verticalAlign: 'top', paddingTop: '2px', color: '#1d4ed8', textAlign: 'center' }}><GlobeIcon /></td>
                        <td>Kode Pos 67154</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* QR Code */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ background: 'white', padding: '6px', border: '2px solid #93c5fd', borderRadius: '8px' }}>
                      <QRCode value={murid['NISN'] || murid['NIS'] || "INVALID"} size={70} />
                    </div>
                    <div style={{ fontSize: '7px', fontWeight: 'bold', color: '#1d4ed8', marginTop: '6px', textAlign: 'center' }}>
                      SCAN UNTUK INFORMASI<br/>SISWA
                    </div>
                  </div>

                  {/* Rules */}
                  <div style={{ background: '#eff6ff', borderRadius: '8px', padding: '8px 12px', fontSize: '6.5px', color: '#0f172a', marginBottom: '12px' }}>
                    <ol style={{ margin: 0, paddingLeft: '10px', lineHeight: '1.4' }}>
                      <li style={{ marginBottom: '2px' }}>Kartu ini milik siswa dan tidak dapat dipindahtangankan.</li>
                      <li style={{ marginBottom: '2px' }}>Harap menjaga dan menggunakan kartu ini dengan baik.</li>
                      <li>Jika kartu hilang, segera lapor ke pihak sekolah.</li>
                    </ol>
                  </div>

                  {/* Signature */}
                  <div style={{ textAlign: 'right', fontSize: '7px', marginTop: 'auto', marginBottom: '25px', paddingRight: '10px' }}>
                    <div style={{ marginBottom: '30px' }}>Kepala Sekolah</div>
                    <div style={{ fontWeight: 'bold', borderBottom: '1px solid black', display: 'inline-block', paddingBottom: '2px', minWidth: '80px', textAlign: 'center' }}>
                      {schoolIdentity.headmasterName || "Akhmad Nasor, S.Pd., M.Pd."}
                    </div>
                  </div>

                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '12px', height: '12px', margin: '0 auto' }}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  );
}
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '12px', height: '12px', margin: '0 auto' }}>
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '12px', height: '12px', margin: '0 auto' }}>
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.09 13.36 4 12.69 4 12s.09-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2s.07-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.17.64.26 1.31.26 2s-.09 1.36-.26 2h-3.38z"/>
    </svg>
  );
}
