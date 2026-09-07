import re
with open('src/pages/PublicDashboard.tsx', 'r') as f:
    content = f.read()

replacement = r'''<h3 className="text-lg font-bold mb-1 drop-shadow-md">Informasi Terkini - <span className="font-normal italic text-blue-100">Beriman, Ramah, Mandiri, Unggul dan Tangguh</span></h3>'''

new_content = re.sub(
    r'<h3 className="text-lg font-bold mb-1 drop-shadow-md">Informasi Terkini</h3>',
    replacement,
    content,
    flags=re.DOTALL
)

with open('src/pages/PublicDashboard.tsx', 'w') as f:
    f.write(new_content)
