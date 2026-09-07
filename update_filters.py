import re

with open('src/pages/KasihIbuAdmin.tsx', 'r') as f:
    content = f.read()

# Analisis tab
analisis_old = '''          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Analisa Perolehan Poin</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total poin yang dikumpulkan per kelas (Klik 2x pada batang grafik untuk melihat Top 10 Siswa)</p>
              </div>
            </div>
          </div>'''

analisis_new = '''          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Analisa Perolehan Poin</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total poin yang dikumpulkan per kelas (Klik 2x pada batang grafik untuk melihat Top 10 Siswa)</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-700 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none font-medium"
              />
            </div>
          </div>'''

content = content.replace(analisis_old, analisis_new)


# Peringkat tab
peringkat_old = '''            <select
              value={selectedTopClass}
              onChange={(e) => setSelectedTopClass(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 outline-none min-w-[150px] text-slate-700 dark:text-white"
            >
              <option value="Semua Kelas">Semua Kelas</option>
              {chartData.map((d) => (<option key={d.name} value={d.name}>{d.name}</option>))}
            </select>'''

peringkat_new = '''            <div className="flex items-center gap-3">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-700 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none font-medium"
              />
              <select
                value={selectedTopClass}
                onChange={(e) => setSelectedTopClass(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 outline-none min-w-[150px] text-slate-700 dark:text-white"
              >
                <option value="Semua Kelas">Semua Kelas</option>
                {chartData.map((d) => (<option key={d.name} value={d.name}>{d.name}</option>))}
              </select>
            </div>'''

content = content.replace(peringkat_old, peringkat_new)

with open('src/pages/KasihIbuAdmin.tsx', 'w') as f:
    f.write(content)
