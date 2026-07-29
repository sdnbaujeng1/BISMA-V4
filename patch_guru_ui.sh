sed -i '/<\/header>/a \
      <div className="flex gap-2 mb-8 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">\
        <button onClick={() => setActiveTab("validasi")} className={`px-4 py-2 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === "validasi" ? "border-pink-600 text-pink-600 dark:text-pink-400" : "border-transparent text-slate-500 hover:text-slate-700"}`}>Validasi</button>\
        <button onClick={() => setActiveTab("analisis")} className={`px-4 py-2 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === "analisis" ? "border-pink-600 text-pink-600 dark:text-pink-400" : "border-transparent text-slate-500 hover:text-slate-700"}`}>Analisis Perolehan per Kelas</button>\
        <button onClick={() => setActiveTab("peringkat")} className={`px-4 py-2 font-bold text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === "peringkat" ? "border-pink-600 text-pink-600 dark:text-pink-400" : "border-transparent text-slate-500 hover:text-slate-700"}`}>Peringkat 10 Besar</button>\
      </div>\
      \
      {activeTab === "validasi" && (' src/pages/KasihIbuGuru.tsx
