import re

with open('server.ts', 'r') as f:
    content = f.read()

# Fix 1: api/kasih-ibu
content = content.replace(
    "const data = allData;\n      if (error) throw error;",
    "const data = allData;"
)

# Fix 2: Are there other places? Let's check api/bank-sampah
content = content.replace(
    "const data = allData;\n    if (error) throw error;",
    "const data = allData;"
)

with open('server.ts', 'w') as f:
    f.write(content)
