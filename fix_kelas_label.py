import re

with open('src/components/PointRewardCard.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'Peringkat {studentRank} dari {totalStudents} di Kelas {user.Kelas}',
    'Peringkat {studentRank} dari {totalStudents} di {user.Kelas?.startsWith("Kelas") ? user.Kelas : `Kelas ${user.Kelas}`}'
)

with open('src/components/PointRewardCard.tsx', 'w') as f:
    f.write(content)
