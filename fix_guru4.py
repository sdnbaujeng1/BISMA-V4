import re

with open('src/pages/KasihIbuGuru_clean.tsx', 'r') as f:
    code = f.read()

# Add missing braces for analisis
code = code.replace('              </div>\n               \n          </div>\n        </div>\n         \n   \n         \n   \n      {activeTab === "peringkat" && (',
                    '              </div>\n            )}\n          </div>\n        </div>\n      )}\n\n      {activeTab === "peringkat" && (')

# Add missing braces for peringkat
code = code.replace('              </div>\n               \n          </div>\n        </div>\n         \n   \n      {activeTab === "validasi" && (',
                    '              </div>\n            )}\n          </div>\n        </div>\n      )}\n\n      {activeTab === "validasi" && (')

with open('src/pages/KasihIbuGuru_clean2.tsx', 'w') as f:
    f.write(code)
