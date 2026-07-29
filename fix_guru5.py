import re

with open('src/pages/KasihIbuGuru_clean.tsx', 'r') as f:
    code = f.read()

# Add missing braces for analisis
code = re.sub(
    r'</div>\s*</div>\s*</div>\s*{activeTab === "peringkat" && \(',
    r'</div>\n            )}\n          </div>\n        </div>\n      )}\n\n      {activeTab === "peringkat" && (',
    code
)

# Add missing braces for peringkat
code = re.sub(
    r'</div>\s*</div>\s*</div>\s*{activeTab === "validasi" && \(',
    r'</div>\n            )}\n          </div>\n        </div>\n      )}\n\n      {activeTab === "validasi" && (',
    code
)

with open('src/pages/KasihIbuGuru.tsx', 'w') as f:
    f.write(code)
