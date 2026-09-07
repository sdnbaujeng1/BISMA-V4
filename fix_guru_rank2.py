import re

with open('src/pages/KasihIbuGuru.tsx', 'r') as f:
    content = f.read()

# Make sure we didn't miss it
print(content.find('if (HABIT_POINTS[entry.jenis_kebiasaan]) {'))

