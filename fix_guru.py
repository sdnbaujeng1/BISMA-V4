import re

with open('src/pages/KasihIbuGuru.tsx', 'r') as f:
    code = f.read()

code = code.replace('}</>', '')
code = code.replace('      )}\n      )}', '      )}')
code = code.replace('{/* Modal Tukar Poin', ')}\n      {/* Modal Tukar Poin')

with open('src/pages/KasihIbuGuru.tsx', 'w') as f:
    f.write(code)
