import re

with open('src/pages/KasihIbuGuru.tsx', 'r') as f:
    code = f.read()

# Fix the duplicate )} around line 389
code = re.sub(r'}\)\s*}\)\s*}\)', '})', code)
code = re.sub(r'\s*}\)\s*</div>\s*</div>\s*}\)\s*}\)', '\n            )}\n          </div>\n        </div>\n      )}', code)

# Fix line 440
code = code.replace('{activeTab === "validasi" {activeTab === "validasi" && ({activeTab === "validasi" && ( (', '{activeTab === "validasi" && (')

with open('src/pages/KasihIbuGuru.tsx', 'w') as f:
    f.write(code)
