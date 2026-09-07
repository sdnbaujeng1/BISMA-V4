import re

with open('src/components/PointRewardCard.tsx', 'r') as f:
    content = f.read()

# Fix current user logic to prefer NISN as the most robust identifier
content = content.replace(
    '''        const currentUserId = String(user.NISN || user.NIS || user.id || userNama);''',
    '''        const currentUserId = String(user.NISN || user.NIS || user.id || userNama);
        // Force the current user into pointsByUser if they have points, even if they had no transactions (this shouldn't happen but just in case)
        if (totalMyPoints > 0 && !pointsByUser[currentUserId]) {
            pointsByUser[currentUserId] = totalMyPoints;
        }'''
)

with open('src/components/PointRewardCard.tsx', 'w') as f:
    f.write(content)
