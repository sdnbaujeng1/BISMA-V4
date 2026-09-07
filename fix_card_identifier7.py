import re

with open('src/components/PointRewardCard.tsx', 'r') as f:
    content = f.read()

# Make the identifier logic robust
content = content.replace(
    '''          const studentIdentifier = isCurrentUser ? (user.NISN || user.NIS || user.id || userNama) : (entry.nisn || entry.nama_murid || 'unknown');''',
    '''          // Always group points strictly by entry.nisn if available, to match how the admin page groups them.
          // This ensures the student's rank calculation uses the same ID grouping as everyone else.
          const studentIdentifier = entry.nisn || entry.nama_murid || 'unknown';'''
)

with open('src/components/PointRewardCard.tsx', 'w') as f:
    f.write(content)
