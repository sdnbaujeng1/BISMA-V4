import re

with open('src/pages/PublicDashboard.tsx', 'r') as f:
    content = f.read()

# Replace margin below Informasi Terkini
content = content.replace('<div className="mb-1">\n              <div className="bg-gradient-to-br from-blue-600 to-indigo-700', '<div className="mb-[1px]">\n              <div className="bg-gradient-to-br from-blue-600 to-indigo-700')

# Replace margin below Stats Grid
content = content.replace('<div className="grid grid-cols-3 gap-2 md:gap-4 mb-1">', '<div className="grid grid-cols-3 gap-2 md:gap-4 mb-[1px]">')

# Replace margin below Progres KBM
content = content.replace('w-full mb-1 relative overflow-hidden group">', 'w-full mb-[1px] relative overflow-hidden group">')

# Replace margin above Class Breakdown Section
content = content.replace('<div className="flex items-center gap-3 mt-1">', '<div className="flex items-center gap-3 mt-[1px]">')

with open('src/pages/PublicDashboard.tsx', 'w') as f:
    f.write(content)
