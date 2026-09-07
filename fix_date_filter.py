import re

with open('src/pages/KasihIbuAdmin.tsx', 'r') as f:
    content = f.read()

# 1. Add selectedDate state
content = content.replace(
    "const [selectedMonth, setSelectedMonth] = useState('');",
    "const [selectedMonth, setSelectedMonth] = useState('');\n  const [selectedDate, setSelectedDate] = useState('');"
)

# 2. Fix the dependency array and fetchReports call
content = content.replace(
    "if (selectedMonth) url.searchParams.append('month', selectedMonth);",
    "if (selectedDate) url.searchParams.append('tanggal', selectedDate);"
)

content = content.replace(
    "}, [selectedClass, selectedMonth]);",
    "}, [selectedClass, selectedMonth, selectedDate]);"
)

# 3. Fix the Validasi tab input
validasi_old = '''        <div className="flex flex-col sm:flex-row gap-3">
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-700 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none font-medium"
          >
            <option>Kelas 1</option>
            <option>Kelas 2</option>
            <option>Kelas 3</option>
            <option>Kelas 4</option>
            <option>Kelas 5</option>
            <option>Kelas 6</option>
          </select>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-700 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none font-medium"
          />
        </div>'''

validasi_new = '''        <div className="flex flex-col sm:flex-row gap-3">
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-700 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none font-medium"
          >
            <option>Kelas 1</option>
            <option>Kelas 2</option>
            <option>Kelas 3</option>
            <option>Kelas 4</option>
            <option>Kelas 5</option>
            <option>Kelas 6</option>
          </select>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-700 dark:text-white focus:ring-2 focus:ring-pink-500 outline-none font-medium"
          />
        </div>'''

content = content.replace(validasi_old, validasi_new)

with open('src/pages/KasihIbuAdmin.tsx', 'w') as f:
    f.write(content)
