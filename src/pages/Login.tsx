import React, { useState } from 'react';
import { User, Shield, GraduationCap, Briefcase, Monitor } from 'lucide-react';
import { useSchoolIdentity } from '../hooks/useSchoolIdentity';
import { motion } from 'motion/react';
import HelpDeskFloat from '../components/HelpDeskFloat';

export default function Login({ onLogin, onNavigate }: { onLogin: (user: any) => void, onNavigate: (page: string) => void }) {
  const [nip, setNip] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('guru');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const schoolIdentity = useSchoolIdentity();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nip, password, role })
      });
      const data = await res.json();
      if (data.success) {
        onLogin({ ...data.user, TargetJP: data.targetJP, schedule: data.schedule, role });
      } else {
        setError(data.message || 'Login gagal');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'guru', label: 'Guru', icon: User, gradient: 'from-blue-400 to-blue-600', shadow: 'shadow-blue-500/40' },
    { id: 'tendik', label: 'Tendik', icon: Briefcase, gradient: 'from-orange-400 to-orange-600', shadow: 'shadow-orange-500/40' },
    { id: 'siswa', label: 'Siswa', icon: GraduationCap, gradient: 'from-purple-400 to-purple-600', shadow: 'shadow-purple-500/40' },
    { id: 'admin', label: 'Admin', icon: Shield, gradient: 'from-red-400 to-red-600', shadow: 'shadow-red-500/40' },
    { id: 'monitoring', label: 'Monitor', icon: Monitor, gradient: 'from-teal-400 to-teal-600', shadow: 'shadow-teal-500/40' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-slate-900 transition-colors">
      <motion.main 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-xl z-10"
      >
        <div className="text-center mb-6">
          <img src={schoolIdentity.schoolLogo} alt="Logo" className="mx-auto h-28 w-auto mb-4 drop-shadow-xl hover:scale-105 transition-transform duration-300" />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">LOGIN BISMA</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">{schoolIdentity.schoolName}</p>
        </div>
        
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-2xl p-8 shadow-xl border border-green-100 dark:border-slate-700">
          <div className="grid grid-cols-5 gap-2 mb-6">
            {roles.map(r => (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-transparent transition-all duration-300 group ${
                  role === r.id 
                    ? `bg-slate-50 dark:bg-slate-800 shadow-md scale-105` 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-105'
                }`}
              >
                <div className={`p-3 rounded-xl mb-2 transition-all duration-300 group-hover:scale-110 ${role === r.id ? `bg-gradient-to-br ${r.gradient} ${r.shadow} shadow-lg ring-1 ring-white/20 dark:ring-white/10` : 'bg-slate-100 dark:bg-slate-700 shadow-inner'} relative overflow-hidden`}>
                  {role === r.id && <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-white/60 opacity-50"></div>}
                  <r.icon className={`w-6 h-6 relative z-10 transition-transform duration-300 group-hover:rotate-12 ${role === r.id ? 'text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)]' : 'text-slate-500 dark:text-slate-400'}`} strokeWidth={role === r.id ? 2.5 : 2} />
                </div>
                <span className={`text-[11px] font-bold transition-colors ${role === r.id ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{r.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {role === 'admin' || role === 'monitoring' ? 'Username' : role === 'siswa' ? 'NIS' : 'NIP'}
              </label>
              <input 
                type="text" 
                value={nip}
                onChange={e => setNip(e.target.value)}
                placeholder={`Masukkan ${role === 'admin' || role === 'monitoring' ? 'Username' : role === 'siswa' ? 'NIS' : 'NIP'}`} 
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-slate-700 dark:text-white transition-colors" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Masukkan Password" 
                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-slate-700 dark:text-white transition-colors" 
                required 
              />
            </div>
            {error && <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/30 p-2 rounded-lg">{error}</div>}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-green-200 dark:shadow-none"
            >
              {loading ? 'Memuat...' : 'Login'}
            </button>
          </form>
          <button 
            onClick={() => onNavigate('public')}
            className="w-full mt-6 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </motion.main>
      <footer className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400 z-10">© Tim IT {schoolIdentity.schoolName}</footer>
      <HelpDeskFloat />
    </div>
  );
}
