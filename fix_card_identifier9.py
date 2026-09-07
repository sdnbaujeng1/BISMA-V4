import re

with open('src/components/PointRewardCard.tsx', 'r') as f:
    content = f.read()

# We need to capture what ID was actually used for the current user's transactions
content = content.replace(
    '''        Object.keys(HABIT_POINTS).forEach(habit => {
          currentStudentBreakdown[habit] = 0;
        });
        currentStudentBreakdown['Tukar Poin'] = 0;

        const userNama = user?.Nama_Murid || user?.name || user?.['Nama Lengkap'];''',
    '''        Object.keys(HABIT_POINTS).forEach(habit => {
          currentStudentBreakdown[habit] = 0;
        });
        currentStudentBreakdown['Tukar Poin'] = 0;

        const userNama = user?.Nama_Murid || user?.name || user?.['Nama Lengkap'];
        let actualUsedId = String(user.NISN || user.NIS || user.id || userNama);'''
)

content = content.replace(
    '''        data?.forEach(entry => {
          let points = 0;
          const habitInfo = HABIT_POINTS[entry.jenis_kebiasaan];''',
    '''        data?.forEach(entry => {
          let points = 0;
          const habitInfo = HABIT_POINTS[entry.jenis_kebiasaan];'''
)

content = content.replace(
    '''          // Always group points strictly by entry.nisn if available, to match how the admin page groups them.
          // This ensures the student's rank calculation uses the same ID grouping as everyone else.
          const studentIdentifier = entry.nisn || entry.nama_murid || 'unknown';''',
    '''          // Always group points strictly by entry.nisn if available, to match how the admin page groups them.
          // This ensures the student's rank calculation uses the same ID grouping as everyone else.
          const studentIdentifier = entry.nisn || entry.nama_murid || 'unknown';
          
          if (isCurrentUser) {
             actualUsedId = String(studentIdentifier);
          }'''
)

content = content.replace(
    '''        // Calculate rank - we must find the exact key the current user is grouped under in pointsByUser
        // Because entries might use NISN but user might just have NIS, or vice versa.
        // The most accurate way is to look at our own data loop. If we had transactions, 
        // they were grouped under `entry.nisn || entry.nama_murid`.
        // If we didn't have any, we just use our NISN.
        const currentUserId = String(user.NISN || user.NIS || user.id || userNama);''',
    '''        // Calculate rank - use the actual ID that was matched during the loop
        const currentUserId = actualUsedId;'''
)


with open('src/components/PointRewardCard.tsx', 'w') as f:
    f.write(content)
