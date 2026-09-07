const fs = require('fs');
let content = fs.readFileSync('src/pages/PublicDashboard.tsx', 'utf8');

content = content.replace(
  /\{\/\* Total Siswa \*\/\}.*?\{\/\* Class Breakdown Section \*\/\}/s,
`{/* Total Siswa */}
              <button 
                onDoubleClick={() => setShowTotalSiswaModal(true)}
                className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center h-40 md:h-48 relative overflow-hidden group hover:shadow-md transition-shadow"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-12 h-12 text-blue-500 dark:text-blue-400" />
                </div>
                <div className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white mb-1">
                  {data.totalStudents || 0}
                </div>
                <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Siswa</p>
              </button>

              {/* Total JP */}
              <button 
                onDoubleClick={() => setShowTotalJPModal(true)}
                className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center h-40 md:h-48 relative overflow-hidden group hover:shadow-md transition-shadow"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-12 h-12 text-emerald-500 dark:text-emerald-400" />
                </div>
                <div className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white mb-1">
                  {data.totalJP || 0}
                </div>
                <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total JP</p>
              </button>

              {/* Progres KBM */}
              <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center h-40 md:h-48 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-purple-600"></div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle2 className="w-12 h-12 text-purple-500 dark:text-purple-400" />
                </div>
                <div className="w-full flex justify-between items-baseline mb-1">
                  <span className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">{data.completedKBM || 0}</span>
                  <span className="text-sm md:text-base text-slate-400 font-medium">/ {data.totalScheduled || 0} JP</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 mb-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-full rounded-full transition-all duration-500" style={{ width: \`\${data.percentage || 0}%\` }}></div>
                </div>
                <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Progres KBM</p>
              </div>

              {/* Ketidakhadiran */}
              <button 
                onDoubleClick={() => setShowAbsentModal(true)}
                className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center h-40 md:h-48 relative overflow-hidden group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600"></div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-2xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  <AlertCircle className="w-12 h-12 text-orange-500 dark:text-orange-400" />
                </div>
                <div className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white mb-1">
                  {data.absentStudents?.length || 0}
                </div>
                <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Absen Siswa</p>
              </button>
            </div>

            {/* Class Breakdown Section */}`);

fs.writeFileSync('src/pages/PublicDashboard.tsx', content);
