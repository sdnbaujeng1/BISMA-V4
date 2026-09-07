import re

with open('src/components/PointRewardCard.tsx', 'r') as f:
    content = f.read()

# Fix current user logic to prefer NISN as the most robust identifier, again
content = content.replace(
    '''          const isCurrentUser = 
            (entry.nisn && user.NISN && String(entry.nisn) === String(user.NISN)) || 
            (entry.nisn && user.NIS && String(entry.nisn) === String(user.NIS)) || 
            (entry.nisn && user.id && String(entry.nisn) === String(user.id)) ||
            (entry.nama_murid && userNama && String(entry.nama_murid).toLowerCase() === String(userNama).toLowerCase());''',
    '''          const isCurrentUser = 
             (entry.nisn && user.NISN && String(entry.nisn).trim() === String(user.NISN).trim()) || 
             (entry.nisn && user.NIS && String(entry.nisn).trim() === String(user.NIS).trim()) || 
             (entry.nisn && user.id && String(entry.nisn).trim() === String(user.id).trim()) ||
             (entry.nama_murid && userNama && String(entry.nama_murid).trim().toLowerCase() === String(userNama).trim().toLowerCase());'''
)

with open('src/components/PointRewardCard.tsx', 'w') as f:
    f.write(content)
