import re

with open('src/pages/KasihIbuAdmin.tsx', 'r') as f:
    content = f.read()

# Add handling for Tukar Poin in admin ranking calculation
admin_calc_replace = r'''    const studentPoints: Record<string, number> = {};
    pointsData.forEach((entry) => {
      if ((kelas === "Semua Kelas" || entry.kelas === kelas)) {
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
      }
    });'''

content = content.replace(
    '''    const studentPoints: Record<string, number> = {};
    pointsData.forEach((entry) => {
      if ((kelas === "Semua Kelas" || entry.kelas === kelas) && HABIT_POINTS[entry.jenis_kebiasaan]) {
        const nisn = entry.nisn;
        if (nisn) {
          studentPoints[nisn] = (studentPoints[nisn] || 0) + HABIT_POINTS[entry.jenis_kebiasaan].points;
        }
      }
    });''',
    admin_calc_replace
)

with open('src/pages/KasihIbuAdmin.tsx', 'w') as f:
    f.write(content)
