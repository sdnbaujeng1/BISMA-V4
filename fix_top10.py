import re

with open('src/pages/KasihIbuAdmin.tsx', 'r') as f:
    content = f.read()

# Make sure we sort properly and only show top 10
content = content.replace(
    '''    const sortedStudents = Object.keys(studentPoints)
      .map((nisn) => {
        const userData = uMap[nisn] as any;
        return {
          nisn,
          name: userData ? userData.nama : `NISN: ${nisn}`,
          nis: userData ? userData.nis : '-',
          points: studentPoints[nisn],
        };
      })
      .sort((a, b) => b.points - a.points);''',
    '''    const sortedStudents = Object.keys(studentPoints)
      .map((nisn) => {
        const userData = uMap[nisn] as any;
        return {
          nisn,
          name: userData ? userData.nama : `NISN: ${nisn}`,
          nis: userData ? userData.nis : '-',
          points: studentPoints[nisn],
        };
      })
      .sort((a, b) => b.points - a.points)
      .slice(0, 10); // Only keep top 10'''
)

with open('src/pages/KasihIbuAdmin.tsx', 'w') as f:
    f.write(content)
