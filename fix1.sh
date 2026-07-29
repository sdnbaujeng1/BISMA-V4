sed -i '1409,1418c\
              <div className="flex gap-4">\
                <input\
                  type="text"\
                  value={loginBgUrl}\
                  onChange={(e) => setLoginBgUrl(e.target.value)}\
                  placeholder="https://..."\
                  className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"\
                />\
                <button\
                  onClick={handleSaveBackground}\
                  disabled={loading}\
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2"\
                >\
                  <Save className="w-4 h-4" /> Simpan\
                </button>\
              </div>' src/pages/AdminDashboard.tsx
