sed -i 's/LogOut, CalendarCheck/Bell, LogOut, CalendarCheck/g' src/pages/MainDashboard.tsx
sed -i '/<div className="flex items-center gap-3">/a \
            {user?.role !== "tendik" && stats?.todaysScheduleBoxes?.some((sch: any) => !sch.status) && (\
              <div className="relative group cursor-pointer">\
                <button onClick={() => onNavigate("jurnal")} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors relative">\
                  <Bell className="w-5 h-5 animate-pulse" />\
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>\
                </button>\
                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-xs rounded-lg shadow-xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">\
                  <p className="font-bold mb-1 text-red-500">Pemberitahuan</p>\
                  <p>Anda memiliki jadwal hari ini yang jurnalnya belum diisi.</p>\
                </div>\
              </div>\
            )}' src/pages/MainDashboard.tsx
