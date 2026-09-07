import re

with open('src/components/PointRewardCard.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '''        // Calculate rank
        const currentUserId = String(user.NISN || user.NIS || user.id || userNama);''',
    '''        // Calculate rank - we must find the exact key the current user is grouped under in pointsByUser
        // Because entries might use NISN but user might just have NIS, or vice versa.
        // The most accurate way is to look at our own data loop. If we had transactions, 
        // they were grouped under `entry.nisn || entry.nama_murid`.
        // If we didn't have any, we just use our NISN.
        const currentUserId = String(user.NISN || user.NIS || user.id || userNama);'''
)

with open('src/components/PointRewardCard.tsx', 'w') as f:
    f.write(content)
