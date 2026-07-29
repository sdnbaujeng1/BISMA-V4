sed -i '/{activeTab === "validasi" && (/i \
      {activeTab === "peringkat" && (\
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-8">\
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">\
            <div className="flex items-center gap-3">\
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">\
                <Trophy className="w-6 h-6" />\
              </div>\
              <div>\
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Peringkat 10 Besar</h2>\
                <p className="text-sm text-slate-500 dark:text-slate-400">Siswa dengan poin terbanyak</p>\
              </div>\
            </div>\
            <select\
              value={selectedTopClass}\
              onChange={(e) => setSelectedTopClass(e.target.value)}\
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-amber-500 outline-none min-w-[150px] text-slate-700 dark:text-white"\
            >\
              <option value="Semua Kelas">Semua Kelas</option>\
              {chartData.map((d) => (<option key={d.name} value={d.name}>{d.name}</option>))}\
            </select>\
          </div>\
          <div className="space-y-3">\
            {topStudents.length > 0 ? (\
              topStudents.map((student, index) => (\
                <div key={student.nisn} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">\
                  <div className="flex items-center gap-4">\
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${index === 0 ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" : index === 1 ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300" : index === 2 ? "bg-amber-100/50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-500" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>{index + 1}</div>\
                    <div>\
                      <h4 className="font-bold text-slate-800 dark:text-white">{student.name}</h4>\
                      <p className="text-xs text-slate-500 dark:text-slate-400">NISN: {student.nisn}</p>\
                    </div>\
                  </div>\
                  <div className="font-bold text-pink-600 dark:text-pink-400 text-lg">\
                    {student.points} <span className="text-sm font-medium text-slate-500">Poin</span>\
                  </div>\
                </div>\
              ))\
            ) : (\
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">\
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />\
                <p>Belum ada data peringkat untuk {selectedTopClass}</p>\
              </div>\
            )}\
          </div>\
        </div>\
      )}\
' src/pages/KasihIbuGuru.tsx
