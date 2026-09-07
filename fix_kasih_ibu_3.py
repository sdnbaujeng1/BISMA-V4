import re

with open('src/components/PointRewardCard.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '''        // Calculate rank - use the actual ID that was matched during the loop
        const currentUserId = actualUsedId;
        // Force the current user into pointsByUser if they have points, even if they had no transactions (this shouldn't happen but just in case)
        if (totalMyPoints > 0 && !pointsByUser[currentUserId]) {
            pointsByUser[currentUserId] = totalMyPoints;
        }''',
    '''        // Calculate total points from breakdown to ensure accuracy even if NIS/NISN mismatch
        const totalMyPoints = Object.values(currentStudentBreakdown).reduce((sum, pts) => sum + pts, 0);

        // Calculate rank - use the actual ID that was matched during the loop
        const currentUserId = actualUsedId;
        // Force the current user into pointsByUser if they have points, even if they had no transactions (this shouldn't happen but just in case)
        if (totalMyPoints !== 0) {
            pointsByUser[currentUserId] = totalMyPoints;
        }'''
)

content = content.replace(
    '''        const rankIndex = sortedScores.findIndex(s => s.nis === currentUserId);
        
        // Calculate total points from breakdown to ensure accuracy even if NIS/NISN mismatch
        const totalMyPoints = Object.values(currentStudentBreakdown).reduce((sum, pts) => sum + pts, 0);''',
    '''        const rankIndex = sortedScores.findIndex(s => s.nis === currentUserId);'''
)

with open('src/components/PointRewardCard.tsx', 'w') as f:
    f.write(content)
