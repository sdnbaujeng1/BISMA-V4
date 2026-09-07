import re

with open('src/pages/KasihIbuAdmin.tsx', 'r') as f:
    content = f.read()

tabs_old = '''      <div className="flex gap-2 mb-8 border-b border-slate-200 dark:border-slate-700 overflow-x-auto pb-1 scrollbar-hide">
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

tabs_new = '''      <div className="flex flex-wrap gap-3 mb-8">
        <button 
          onClick={() => setActiveTab("konfigurasi")} 
          className={`px-4 py-2.5 font-semibold text-sm whitespace-nowrap rounded-xl transition-all flex items-center gap-2 border ${
            activeTab === "konfigurasi" 
              ? "bg-pink-600 text-white border-pink-600 shadow-md shadow-pink-500/20" 
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
          }`}
        >
          <Settings className="w-4 h-4" />
          Konfigurasi
        </button>
        <button 
          onClick={() => setActiveTab("validasi")} 
          className={`px-4 py-2.5 font-semibold text-sm whitespace-nowrap rounded-xl transition-all flex items-center gap-2 border ${
            activeTab === "validasi" 
              ? "bg-pink-600 text-white border-pink-600 shadow-md shadow-pink-500/20" 
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Validasi
        </button>
        <button 
          onClick={() => setActiveTab("analisis")} 
          className={`px-4 py-2.5 font-semibold text-sm whitespace-nowrap rounded-xl transition-all flex items-center gap-2 border ${
            activeTab === "analisis" 
              ? "bg-pink-600 text-white border-pink-600 shadow-md shadow-pink-500/20" 
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Analisis Perolehan per Kelas
        </button>
        <button 
          onClick={() => setActiveTab("peringkat")} 
          className={`px-4 py-2.5 font-semibold text-sm whitespace-nowrap rounded-xl transition-all flex items-center gap-2 border ${
            activeTab === "peringkat" 
              ? "bg-pink-600 text-white border-pink-600 shadow-md shadow-pink-500/20" 
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
          }`}
        >
          <Trophy className="w-4 h-4" />
          Peringkat 10 Besar
        </button>
      </div>'''

content = content.replace(tabs_old, tabs_new)

with open('src/pages/KasihIbuAdmin.tsx', 'w') as f:
    f.write(content)
