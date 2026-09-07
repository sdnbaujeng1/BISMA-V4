import re

with open('src/components/PointRewardCard.tsx', 'r') as f:
    content = f.read()

# Fix order of totalMyPoints calculation so it happens BEFORE we use it
content = content.replace(
    '''        // Calculate rank
        const currentUserId = String(user.NISN || user.NIS || user.id || userNama);
        // Force the current user into pointsByUser if they have points, even if they had no transactions (this shouldn't happen but just in case)
        if (totalMyPoints > 0 && !pointsByUser[currentUserId]) {
            pointsByUser[currentUserId] = totalMyPoints;
        }

        const sortedScores = Object.entries(pointsByUser)
          .map(([nis, score]) => ({ nis, score }))
          .sort((a, b) => b.score - a.score);
        const rankIndex = sortedScores.findIndex(s => s.nis === currentUserId);
        
        // Calculate total points from breakdown to ensure accuracy even if NIS/NISN mismatch
        const totalMyPoints = Object.values(currentStudentBreakdown).reduce((sum, pts) => sum + pts, 0);''',
    '''        // Calculate total points from breakdown to ensure accuracy even if NIS/NISN mismatch
        const totalMyPoints = Object.values(currentStudentBreakdown).reduce((sum, pts) => sum + pts, 0);

        // Calculate rank
        const currentUserId = String(user.NISN || user.NIS || user.id || userNama);
        // Force the current user into pointsByUser if they have points, even if they had no transactions
        if (totalMyPoints > 0 && !pointsByUser[currentUserId]) {
            pointsByUser[currentUserId] = totalMyPoints;
        }

        const sortedScores = Object.entries(pointsByUser)
          .map(([nis, score]) => ({ nis, score }))
          .sort((a, b) => b.score - a.score);
        const rankIndex = sortedScores.findIndex(s => s.nis === currentUserId);'''
)

with open('src/components/PointRewardCard.tsx', 'w') as f:
    f.write(content)
