import re

with open('src/components/PointRewardCard.tsx', 'r') as f:
    content = f.read()

# Make sure Tukar Poin updates pointsByUser correctly too
content = content.replace(
    '''          } else if (entry.jenis_kebiasaan.startsWith('Tukar Poin')) {
            // Extract points from string like "Tukar Poin: Buku Tulis (-50)"
            const match = entry.jenis_kebiasaan.match(/\(-(\d+)\)/);
            if (match) {
              points = -parseInt(match[1], 10);
              if (isCurrentUser) {
                currentStudentBreakdown['Tukar Poin'] += points;
              }
            }
          }''',
    '''          } else if (entry.jenis_kebiasaan.startsWith('Tukar Poin')) {
            // Extract points from string like "Tukar Poin: Buku Tulis (-50)"
            const match = entry.jenis_kebiasaan.match(/\(-(\d+)\)/);
            if (match) {
              points = -parseInt(match[1], 10);
              if (isCurrentUser) {
                currentStudentBreakdown['Tukar Poin'] += points;
              }
            }
          }'''
)

with open('src/components/PointRewardCard.tsx', 'w') as f:
    f.write(content)
