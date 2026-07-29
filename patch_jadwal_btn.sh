sed -i '/<Upload className="w-4 h-4" \/> Import CSV/!b;n;a\
              <button\
                onClick={handleExportData}\
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-sm transition-all text-sm"\
              >\
                <Download className="w-4 h-4" /> Export Data\
              </button>' src/pages/AdminDashboard.tsx
