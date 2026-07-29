sed -i '/{activeTab === "validasi" && (/i \
      {activeTab === "analisis" && (\
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col mb-8">\
          <div className="flex items-center justify-between mb-6">\
            <div className="flex items-center gap-3">\
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">\
                <BarChart3 className="w-6 h-6" />\
              </div>\
              <div>\
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Analisa Perolehan Poin</h2>\
                <p className="text-sm text-slate-500 dark:text-slate-400">Total poin yang dikumpulkan per kelas (Klik 2x pada batang grafik untuk melihat Top 10 Siswa)</p>\
              </div>\
            </div>\
          </div>\
          <div className="flex-1 min-h-[300px]">\
            {analysisLoading ? (\
              <div className="flex justify-center items-center h-full"><div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div></div>\
            ) : chartData.length > 0 ? (\
              <ResponsiveContainer width="100%" height={300}>\
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>\
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />\
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b" }} />\
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b" }} />\
                  <Tooltip cursor={{ fill: "rgba(236, 72, 153, 0.1)" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />\
                  <Bar dataKey="total" fill="#ec4899" radius={[6, 6, 0, 0]} onClick={handleBarClick}>\
                    {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#ec4899" : "#db2777"} className="cursor-pointer" />))}\
                  </Bar>\
                </BarChart>\
              </ResponsiveContainer>\
            ) : (\
              <div className="flex flex-col items-center justify-center h-full text-slate-400">\
                <BarChart3 className="w-12 h-12 mb-2 opacity-50" />\
                <p>Belum ada data poin siswa</p>\
              </div>\
            )}\
          </div>\
        </div>\
      )}\
' src/pages/KasihIbuGuru.tsx
