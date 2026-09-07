import re

with open('src/components/PointRewardCard.tsx', 'r') as f:
    content = f.read()

# Fix student identifier to match properly with currentUserId
content = content.replace(
    "const studentIdentifier = entry.nisn || entry.nama_murid || 'unknown';",
    "const studentIdentifier = isCurrentUser ? (user.NISN || user.NIS || user.id || userNama) : (entry.nisn || entry.nama_murid || 'unknown');"
)

with open('src/components/PointRewardCard.tsx', 'w') as f:
    f.write(content)
