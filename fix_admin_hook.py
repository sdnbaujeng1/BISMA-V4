import re

with open('src/pages/AdminDashboard.tsx', 'r') as f:
    content = f.read()

# 1. Add state variables
state_add = r'''  const [sloganText, setSloganText] = useState("✨ Beriman, Ramah, Mandiri, Unggul dan Tangguh ✨");
  const [sloganSpeed, setSloganSpeed] = useState("3");'''

content = content.replace(
    'const [jumlahUlangan, setJumlahUlangan] = useState("3");',
    f'const [jumlahUlangan, setJumlahUlangan] = useState("3");\n{state_add}'
)

# 2. Add to fetchSettings
fetch_add = r'''          if (data.sloganText) setSloganText(data.sloganText);
          if (data.sloganSpeed) setSloganSpeed(data.sloganSpeed);'''

content = content.replace(
    'if (data.wa_message_template) {\n            setWaTemplate(data.wa_message_template);\n          }',
    f'if (data.wa_message_template) {{\n            setWaTemplate(data.wa_message_template);\n          }}\n{fetch_add}'
)
content = content.replace(
    'if (data.wa_message_template) {\n              setWaTemplate(data.wa_message_template);\n            }',
    f'if (data.wa_message_template) {{\n              setWaTemplate(data.wa_message_template);\n            }}\n{fetch_add}'
)

# 3. Add to handleSave data object
save_add = r'''      sloganText,
      sloganSpeed,'''

content = content.replace(
    'wa_message_template: waTemplate,\n    };',
    f'wa_message_template: waTemplate,\n{save_add}\n    }};'
)

# 4. Add UI to the form
ui_add = r'''              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Slogan (Running Text)
                  </label>
                  <input
                    type="text"
                    value={sloganText}
                    onChange={(e) => setSloganText(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-slate-500 outline-none"
                    placeholder="✨ Beriman, Ramah, Mandiri, Unggul dan Tangguh ✨"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Kecepatan Running Text (ScrollAmount)
                  </label>
                  <input
                    type="number"
                    value={sloganSpeed}
                    onChange={(e) => setSloganSpeed(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-slate-500 outline-none"
                    placeholder="Contoh: 3, 5, 10"
                    min="1"
                  />
                </div>
              </div>'''

content = content.replace(
    '<div className="space-y-4">\n              <div>\n                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">\n                  Nama Sekolah Resmi\n                </label>',
    f'<div className="space-y-4">\n{ui_add}\n              <div>\n                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">\n                  Nama Sekolah Resmi\n                </label>'
)

with open('src/pages/AdminDashboard.tsx', 'w') as f:
    f.write(content)
