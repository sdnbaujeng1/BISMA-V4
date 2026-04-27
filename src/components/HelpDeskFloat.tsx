import React, { useState, useEffect } from 'react';
import { HelpCircle, MessageCircle, Mail, ShieldAlert, Youtube, MapPin, MessageSquarePlus, X, Star, CheckCircle2, Instagram, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function HelpDeskFloat() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'disclaimer' | 'testimoni' | 'testimoniSuccess' | 'location' | null>(null);
  
  const [config, setConfig] = useState({
    wa_number: '625749662221',
    wa_message: 'hallo mohon bantuan dalam akses BISMA dengan kendala ........',
    email: 'akhmadnasor@gmail.com',
    disclaimer: 'Keamanan dan Privasi Anak adalah prioritas utama kami di SDN Baujeng I Beji. Aplikasi BISMA mematuhi standar perlindungan data anak, memastikan informasi pribadi, nilai, dan lokasi tidak dibagikan kepada pihak ketiga manapun tanpa izin eksplisit dari orang tua/wali materi.',
    youtube_url: 'https://youtube.com/',
    location: 'SDN Baujeng I Beji',
    ig_url: 'https://www.instagram.com/sdnbaujeng1/',
    web_url: 'https://www.sdnbaujeng1.sch.id/',
    map_embed_url: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1419!2d112.735817!3d-7.623635!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd7c490a2c53f81%3A0xc6ad50bd669ecb9b!2sSDN%20Baujeng%201!5e0!3m2!1sid!2sid!4v1714000000000!5m2!1sid!2sid'
  });

  const [testimoniData, setTestimoniData] = useState({
    nama: '',
    lembaga: '',
    fitur: 'Dashboard Publik',
    testimoni: '',
    rating: 5
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/helpdesk-config');
        if (res.ok) {
          const resData = await res.json();
          if (resData.success && resData.data) {
            setConfig(prev => ({
              ...prev,
              ...resData.data
            }));
            return;
          }
        }
      } catch (e) {
        console.error("Failed to fetch helpdesk config", e);
      }

      // Fallback
      try {
        const stored = localStorage.getItem('helpdesk_config');
        if (stored) {
          setConfig(prev => ({ ...prev, ...JSON.parse(stored) }));
        }
      } catch (e) {}
    };
    
    fetchConfig();

    const handleStorage = () => {
      try {
        const stored = localStorage.getItem('helpdesk_config');
        if (stored) {
          setConfig(prev => ({ ...prev, ...JSON.parse(stored) }));
        }
      } catch (e) {}
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleWA = () => {
    // Format number assuming it might have 0 in front
    const num = config.wa_number.startsWith('0') ? '62' + config.wa_number.substring(1) : config.wa_number;
    const url = `https://api.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(config.wa_message)}`;
    
    // Create an invisible link to navigate securely out of iframe constraints if needed
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleEmail = () => {
    const url = `mailto:${config.email}?subject=Konfirmasi BISMA`;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_top';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const submitTestimoni = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/testimoni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testimoniData)
      });
      if (response.ok) {
        setActiveModal('testimoniSuccess');
      } else {
        alert('Gagal mengirim testimoni');
      }
    } catch (e) {
      alert('Terjadi kesalahan jaringan');
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex items-end justify-end">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-16 right-0 mb-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 w-72 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-4">
                <h3 className="text-white font-bold text-lg">Pusat Bantuan</h3>
                <p className="text-teal-50 text-xs">Pilih layanan yang Anda butuhkan</p>
              </div>
              <div className="p-2 space-y-1">
                <a href={`https://api.whatsapp.com/send?phone=${config.wa_number.startsWith('0') ? '62' + config.wa_number.substring(1) : config.wa_number}&text=${encodeURIComponent(config.wa_message)}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-left group">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-700 dark:text-slate-200 text-sm group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Bantuan WhatsApp</div>
                    <div className="text-xs text-slate-500">Hubungi admin via chat</div>
                  </div>
                </a>

                <a href={`mailto:${config.email}?subject=Konfirmasi BISMA`} target="_top" className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-left group">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-700 dark:text-slate-200 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Email Konfirmasi</div>
                    <div className="text-xs text-slate-500">{config.email}</div>
                  </div>
                </a>

                <button onClick={() => { setActiveModal('disclaimer'); setIsOpen(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-left group">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-700 dark:text-slate-200 text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Keamanan Anak</div>
                    <div className="text-xs text-slate-500">Disclaimer & Privasi</div>
                  </div>
                </button>

                <a href={config.youtube_url} target="_blank" rel="noreferrer" className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-left group">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <Youtube className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-700 dark:text-slate-200 text-sm group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">Panduan Pengguna</div>
                    <div className="text-xs text-slate-500">Video tutorial BISMA</div>
                  </div>
                </a>

                <button onClick={() => { setActiveModal('location'); setIsOpen(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-left group">
                  <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-700 dark:text-slate-200 text-sm group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Lokasi</div>
                    <div className="text-xs text-slate-500">{config.location}</div>
                  </div>
                </button>

                <a href={config.ig_url ?? 'https://www.instagram.com/sdnbaujeng1/'} target="_blank" rel="noreferrer" className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-left group">
                  <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-700 dark:text-slate-200 text-sm group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">Instagram</div>
                    <div className="text-xs text-slate-500">Ikuti kami di Instagram</div>
                  </div>
                </a>

                <a href={config.web_url ?? 'https://www.sdnbaujeng1.sch.id/'} target="_blank" rel="noreferrer" className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-left group">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-700 dark:text-slate-200 text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Website Resmi</div>
                    <div className="text-xs text-slate-500">Kunjungi website sekolah</div>
                  </div>
                </a>

                <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>

                <button onClick={() => { setActiveModal('testimoni'); setIsOpen(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-left group">
                  <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <MessageSquarePlus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-700 dark:text-slate-200 text-sm group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">Saran & Testimoni</div>
                    <div className="text-xs text-slate-500">Beri masukan untuk BISMA</div>
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${isOpen ? 'bg-slate-800 text-white rotate-90' : 'bg-teal-500 text-white hover:bg-teal-600 hover:scale-105'} z-50 relative`}
        >
          {isOpen ? <X className="w-6 h-6" /> : <HelpCircle className="w-7 h-7" />}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-teal-500 border-2 border-white dark:border-slate-800"></span>
            </span>
          )}
        </button>
      </div>

      {/* Modal Location */}
      {activeModal === 'location' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl p-6 relative">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-full transition-colors z-10">
              <X className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Lokasi Sekolah</h2>
              <p className="text-slate-500 mb-6">{config.location}</p>
              
              <div className="w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900">
                {config.map_embed_url ? (
                  <iframe 
                    src={config.map_embed_url} 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <MapPin className="w-12 h-12 mb-2 opacity-50" />
                    <p>Peta belum dikonfigurasi</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Disclaimer */}
      {activeModal === 'disclaimer' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mb-6">
                <ShieldAlert className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Disclaimer Keamanan Anak</h2>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-2xl border border-purple-100 dark:border-purple-800 text-slate-700 dark:text-slate-300 text-sm leading-relaxed text-left">
                {config.disclaimer}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Testimoni */}
      {activeModal === 'testimoni' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg p-6 relative">
            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                <MessageSquarePlus className="text-teal-500 w-8 h-8" />
                Saran & Testimoni
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Berikan masukan Anda untuk pengembangan BISMA ke depan.</p>
            </div>
            
            <form onSubmit={submitTestimoni} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
                <input required type="text" value={testimoniData.nama} onChange={e => setTestimoniData({...testimoniData, nama: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Asal Lembaga / Sekolah</label>
                <input required type="text" value={testimoniData.lembaga} onChange={e => setTestimoniData({...testimoniData, lembaga: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Fitur yang Dinilai</label>
                <select value={testimoniData.fitur} onChange={e => setTestimoniData({...testimoniData, fitur: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-slate-800 dark:text-white">
                  <option value="Dashboard Publik">Dashboard Publik</option>
                  <option value="Aplikasi Guru">Aplikasi Guru</option>
                  <option value="Tabungan Sampah / Kasih Ibu">Tabungan Sampah / Kasih Ibu</option>
                  <option value="Presensi QR / Geofencing">Presensi QR / Geofencing</option>
                  <option value="Monitoring Kepsek">Monitoring Kepala Sekolah</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Testimoni / Kesan</label>
                <textarea required rows={4} value={testimoniData.testimoni} onChange={e => setTestimoniData({...testimoniData, testimoni: e.target.value})} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-slate-800 dark:text-white resize-none"></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Peringkat (Rating)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} 
                      type="button" 
                      onClick={() => setTestimoniData({...testimoniData, rating: star})}
                      className={`p-1 transition-transform ${star <= testimoniData.rating ? 'text-yellow-400 scale-110' : 'text-slate-300 dark:text-slate-600'}`}
                    >
                      <Star className="w-8 h-8 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
              
              <button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 mt-4 rounded-xl shadow-lg transition-all">
                Kirim Testimoni
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal Success Testimoni */}
      {activeModal === 'testimoniSuccess' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 to-emerald-500"></div>
            <div className="w-20 h-20 bg-teal-100 dark:bg-teal-900/30 text-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Terima Kasih!</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
              Saran dan testimoni dari <span className="font-bold text-teal-600 dark:text-teal-400">{testimoniData.nama}</span> asal <span className="font-bold text-teal-600 dark:text-teal-400">{testimoniData.lembaga}</span> telah kami terima.
            </p>
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl mb-6 text-left">
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < testimoniData.rating ? 'text-yellow-400 fill-current' : 'text-slate-300'}`} />
                ))}
              </div>
              <p className="text-sm italic text-slate-600 dark:text-slate-300">"{testimoniData.testimoni}"</p>
            </div>
            <button onClick={() => { setActiveModal(null); setTestimoniData({...testimoniData, testimoni: ''}); }} className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all">
              Tutup
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
}
