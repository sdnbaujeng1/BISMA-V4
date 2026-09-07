import re

with open('src/pages/PublicDashboard.tsx', 'r') as f:
    content = f.read()

# Replace button with div for Total Siswa
total_siswa_original = r'''{/* Total Siswa */}
              <button 
                onDoubleClick={() => setShowTotalSiswaModal(true)}
                className="bg-white dark:bg-slate-800 p-2 md:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center h-32 md:h-48 relative overflow-hidden group hover:shadow-md transition-shadow"
              >'''

total_siswa_new = r'''{/* Total Siswa */}
              <div 
                className="bg-white dark:bg-slate-800 p-2 md:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center text-center h-32 md:h-48 relative overflow-hidden group"
              >'''

content = content.replace(total_siswa_original, total_siswa_new)

# Find the closing </button> right before {/* Total JP */} and change it to </div>
total_jp_index = content.find('{/* Total JP */}')
if total_jp_index != -1:
    before_jp = content[:total_jp_index]
    last_button_index = before_jp.rfind('</button>')
    if last_button_index != -1:
        content = content[:last_button_index] + '</div>\n              ' + content[total_jp_index:]

with open('src/pages/PublicDashboard.tsx', 'w') as f:
    f.write(content)
