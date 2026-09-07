import re

with open('src/pages/KasihIbuGuru.tsx', 'r') as f:
    content = f.read()

# Add handling for Tukar Poin in guru ranking calculation
content = content.replace(
    '''    const studentPoints: Record<string, number> = {};
    pointsData.forEach((entry) => {
      if (HABIT_POINTS[entry.jenis_kebiasaan]) {
        const nisn = entry.nisn;
        if (nisn) {
          studentPoints[nisn] = (studentPoints[nisn] || 0) + HABIT_POINTS[entry.jenis_kebiasaan].points;
        }
      }
    });''',
    '''    const studentPoints: Record<string, number> = {};
    pointsData.forEach((entry) => {
      const nisn = entry.nisn;
      if (nisn) {
        if (HABIT_POINTS[entry.jenis_kebiasaan]) {
           studentPoints[nisn] = (studentPoints[nisn] || 0) + HABIT_POINTS[entry.jenis_kebiasaan].points;
        } else if (entry.jenis_kebiasaan.startsWith('Tukar Poin')) {
           const match = entry.jenis_kebiasaan.match(/\(-(\d+)\)/);
           if (match) {
             studentPoints[nisn] = (studentPoints[nisn] || 0) - parseInt(match[1], 10);
           }
        }
      }
    });'''
)

with open('src/pages/KasihIbuGuru.tsx', 'w') as f:
    f.write(content)
