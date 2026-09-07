import re

with open('src/components/PointRewardCard.tsx', 'r') as f:
    content = f.read()

# Fix current user matcher again because the NISN might be missing in auth but present in database or vice versa
content = content.replace(
    '''          const isCurrentUser = 
             (entry.nisn && user.NISN && String(entry.nisn).trim() === String(user.NISN).trim()) || 
             (entry.nisn && user.NIS && String(entry.nisn).trim() === String(user.NIS).trim()) || 
             (entry.nisn && user.id && String(entry.nisn).trim() === String(user.id).trim()) ||
             (entry.nama_murid && userNama && String(entry.nama_murid).trim().toLowerCase() === String(userNama).trim().toLowerCase());''',
    '''          const entryNisnStr = entry.nisn ? String(entry.nisn).trim() : null;
          const userNisnStr = user.NISN ? String(user.NISN).trim() : null;
          const userNisStr = user.NIS ? String(user.NIS).trim() : null;
          const userIdStr = user.id ? String(user.id).trim() : null;
          
          const isCurrentUser = 
             (entryNisnStr && userNisnStr && entryNisnStr === userNisnStr) || 
             (entryNisnStr && userNisStr && entryNisnStr === userNisStr) || 
             (entryNisnStr && userIdStr && entryNisnStr === userIdStr) ||
             (entry.nama_murid && userNama && String(entry.nama_murid).trim().toLowerCase() === String(userNama).trim().toLowerCase());'''
)

with open('src/components/PointRewardCard.tsx', 'w') as f:
    f.write(content)
