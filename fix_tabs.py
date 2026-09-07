import re

with open('src/pages/KasihIbuAdmin.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "import { ArrowLeft, Heart, CheckCircle, XCircle, Clock, Gift, X, BarChart3, Users, Trophy, Save } from 'lucide-react';",
    "import { ArrowLeft, Heart, CheckCircle, XCircle, Clock, Gift, X, BarChart3, Users, Trophy, Save, Settings } from 'lucide-react';"
)

tabs_old = '''      <div className="flex gap-2 mb-8 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        <button onClick={() => setActiveTab("konfigurasi")} className={`px-4 py-2 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === "konfigurasi" ? "border-pink-600 text-pink-600 dark:text-pink-400" : "border-transparent text-slate-500 hover:text-slate-700"}`}>Konfigurasi</button>
        <button onClick={() => setActiveTab("validasi")} className={`px-4 py-2 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === "validasi" ? "border-pink-600 text-pink-600 dark:text-pink-400" : "border-transparent text-slate-500 hover:text-slate-700"}`}>Validasi</button>

        <button onClick={() => setActiveTab("analisis")} className={`px-4 py-2 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === "analisis" ? "border-pink-600 text-pink-600 dark:text-pink-400" : "border-transparent text-slate-500 hover:text-slate-700"}`}>Analisis Perolehan per Kelas</button>
        <button onClick={() => setActiveTab("peringkat")} className={`px-4 py-2 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === "peringkat" ? "border-pink-600 text-pink-600 dark:text-pink-400" : "border-transparent text-slate-500 hover:text-slate-700"}`}>Peringkat 10 Besar</button>
      </div>'''

tabs_new = '''      <div className="flex gap-2 mb-8 border-b border-slate-200 dark:border-slate-700 overflow-x-auto pb-1 scrollbar-hide">
        <button onClick={() => setActiveTab("konfigurasi")} className={`px-4 py-3 font-bold text-sm whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${activeTab === "konfigurasi" ? "border-pink-600 text-pink-600 dark:text-pink-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"}`}>
          <Settings className="w-4 h-4" />
          Konfigurasi
        </button>
        <button onClick={() => setActiveTab("validasi")} className={`px-4 py-3 font-bold text-sm whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${activeTab === "validasi" ? "border-pink-600 text-pink-600 dark:text-pink-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"}`}>
          <CheckCircle className="w-4 h-4" />
          Validasi
        </button>

        <button onClick={() => setActiveTab("analisis")} className={`px-4 py-3 font-bold text-sm whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${activeTab === "analisis" ? "border-pink-600 text-pink-600 dark:text-pink-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"}`}>
          <BarChart3 className="w-4 h-4" />
          Analisis Perolehan per Kelas
        </button>
        <button onClick={() => setActiveTab("peringkat")} className={`px-4 py-3 font-bold text-sm whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${activeTab === "peringkat" ? "border-pink-600 text-pink-600 dark:text-pink-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"}`}>
          <Trophy className="w-4 h-4" />
          Peringkat 10 Besar
        </button>
      </div>'''

content = content.replace(tabs_old, tabs_new)

with open('src/pages/KasihIbuAdmin.tsx', 'w') as f:
    f.write(content)
