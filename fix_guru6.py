import re

with open('src/pages/KasihIbuGuru.tsx', 'r') as f:
    code = f.read()

# Fix analisis
code = re.sub(r'</p>\s*</div>\s*</div>\s*</div>\s*{activeTab === "peringkat"', r'</p>\n              </div>\n            )}\n          </div>\n        </div>\n      )}\n\n      {activeTab === "peringkat"', code)

# Fix peringkat
code = re.sub(r'</p>\s*</div>\s*</div>\s*</div>\s*{activeTab === "validasi"', r'</p>\n              </div>\n            )}\n          </div>\n        </div>\n      )}\n\n      {activeTab === "validasi"', code)

with open('src/pages/KasihIbuGuru.tsx', 'w') as f:
    f.write(code)
