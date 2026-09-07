const user = {
    NISN: '3165360290',
    NIS: '2981',
    "Nama Lengkap": 'Muhammad Arkan Oktaviano',
    Kelas: 'Kelas 4'
};
const entry = {
    nisn: '3165360290',
    nama_murid: 'Muhammad Arkan Oktaviano',
    kelas: 'Kelas 4'
};

const userNama = user?.Nama_Murid || user?.name || user?.['Nama Lengkap'];
const isCurrentUser = 
             (entry.nisn && user.NISN && String(entry.nisn).trim() === String(user.NISN).trim()) || 
             (entry.nisn && user.NIS && String(entry.nisn).trim() === String(user.NIS).trim()) || 
             (entry.nisn && user.id && String(entry.nisn).trim() === String(user.id).trim()) ||
             (entry.nama_murid && userNama && String(entry.nama_murid).trim().toLowerCase() === String(userNama).trim().toLowerCase());

console.log("Is Current User:", isCurrentUser);
