import re

with open('src/components/BankSampahSummaryCard.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    ".eq('siswa', nama);",
    ".ilike('siswa', nama);"
)

with open('src/components/BankSampahSummaryCard.tsx', 'w') as f:
    f.write(content)
