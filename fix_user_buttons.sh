sed -i '2698,2726c\
            <div className="flex flex-wrap gap-2 justify-between mb-4">\
              <input\
                type="text"\
                placeholder="Cari user..."\
                className="flex-1 min-w-[200px] border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-700 dark:text-white"\
              />\
              <div className="flex gap-2">\
                <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleImport} />\
                <button onClick={handleExportTemplate} className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm transition-all"><Download className="w-4 h-4" /> Template</button>\
                <button onClick={() => fileInputRef.current?.click()} className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm transition-all"><Upload className="w-4 h-4" /> Import</button>\
                <button onClick={handleExportData} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm transition-all"><Download className="w-4 h-4" /> Export</button>\
                <button\
                  onClick={() => {\
                    setIsAdding(true);\
                    setIsEditing(false);\
                    setNip("");\
                    setNama("");\
                    setRoles(["Guru"]);\
                    setPassword("baujeng@1");\
                    setJabatan("");\
                    setWaliKelas("");\
                  }}\
                  className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-sm transition-all"\
                >\
                  <Plus className="w-4 h-4" /> Tambah User\
                </button>\
              </div>\
            </div>' src/pages/AdminDashboard.tsx
