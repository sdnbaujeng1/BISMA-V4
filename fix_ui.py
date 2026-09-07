import re

with open('src/pages/PublicDashboard.tsx', 'r') as f:
    content = f.read()

# 1. Update the Informasi Terkini card to have the slogan in a separate "marquee" style bar
slogan_replacement = r'''<h3 className="text-lg font-bold mb-1 drop-shadow-md">Informasi Terkini</h3>
                  <div className="w-full bg-black/10 rounded-full py-1.5 px-3 mb-4 overflow-hidden flex items-center shadow-inner border border-white/10">
                    <marquee className="text-blue-100 text-xs sm:text-sm italic font-medium tracking-wide">
                      ✨ Beriman, Ramah, Mandiri, Unggul dan Tangguh ✨
                    </marquee>
                  </div>'''

content = re.sub(
    r'<h3 className="text-lg font-bold mb-1 drop-shadow-md">Informasi Terkini - <span className="font-normal italic text-blue-100">Beriman, Ramah, Mandiri, Unggul dan Tangguh</span></h3>',
    slogan_replacement,
    content
)


# 2. Update the Stats Grid
stats_replacement = r'''{/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 md:gap-6 mb-4">
              {/* Total Siswa */}
              <button 
                onDoubleClick={() => setShowTotalSiswaModal(true)}
                className="bg-white dark:bg-slate-800 p-2 md:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center h-32 md:h-48 relative overflow-hidden group hover:shadow-md transition-shadow"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
                <div className="p-2 md:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl md:rounded-2xl mb-1 md:mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 md:w-12 md:h-12 text-blue-500 dark:text-blue-400" />
                </div>
                <div className="text-lg md:text-4xl font-black text-slate-800 dark:text-white mb-0.5 md:mb-1">
                  {data.totalStudents || 0}
                </div>
                <p className="text-[10px] md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Siswa</p>
              </button>

              {/* Total JP */}
              <button 
                onDoubleClick={() => setShowTotalJPModal(true)}
                className="bg-white dark:bg-slate-800 p-2 md:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center h-32 md:h-48 relative overflow-hidden group hover:shadow-md transition-shadow"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
                <div className="p-2 md:p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl md:rounded-2xl mb-1 md:mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Clock className="w-6 h-6 md:w-12 md:h-12 text-emerald-500 dark:text-emerald-400" />
                </div>
                <div className="text-lg md:text-4xl font-black text-slate-800 dark:text-white mb-0.5 md:mb-1">
                  {data.totalJP || 0}
                </div>
                <p className="text-[10px] md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total JP</p>
              </button>

              {/* Ketidakhadiran */}
              <button 
                onDoubleClick={() => setShowAbsentModal(true)}
                className="bg-white dark:bg-slate-800 p-2 md:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center h-32 md:h-48 relative overflow-hidden group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600"></div>
                <div className="p-2 md:p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl md:rounded-2xl mb-1 md:mb-3 group-hover:scale-110 transition-transform duration-300">
                  <AlertCircle className="w-6 h-6 md:w-12 md:h-12 text-orange-500 dark:text-orange-400" />
                </div>
                <div className="text-lg md:text-4xl font-black text-slate-800 dark:text-white mb-0.5 md:mb-1">
                  {data.absentStudents?.length || 0}
                </div>
                <p className="text-[10px] md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Absen Siswa</p>
              </button>
            </div>

            {/* Progres KBM (Full Width) */}
            <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 w-full mb-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-400 to-purple-600"></div>
              <div className="flex justify-between items-center mb-3 md:mb-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 md:w-7 md:h-7 text-purple-500 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm md:text-lg">Progres KBM Hari Ini</h3>
                    <p className="text-[10px] md:text-xs text-slate-500">Keterisian Jurnal Guru</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white">{data.completedKBM || 0}</span>
                  <span className="text-xs md:text-base text-slate-400 font-medium"> / {data.totalScheduled || 0} JP</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 md:h-4 overflow-hidden shadow-inner">
                <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-full rounded-full transition-all duration-1000 ease-out relative" style={{ width: \`\${data.percentage || 0}%\` }}>
                   <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>
            </div>'''

content = re.sub(
    r'\{\/\* Stats Grid \*\/\}.*?\{\/\* Class Breakdown Section \*\/\}',
    stats_replacement + '\n\n            {/* Class Breakdown Section */}',
    content,
    flags=re.DOTALL
)

with open('src/pages/PublicDashboard.tsx', 'w') as f:
    f.write(content)
