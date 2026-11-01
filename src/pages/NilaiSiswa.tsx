import { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Printer, FileText, Calendar } from 'lucide-react';
import { safeStorage } from '../lib/storage';
import { useSchoolIdentity } from '../hooks/useSchoolIdentity';
import RaportStsModal, {
  getCurriculumSubjectsByKelas,
  SUBJECT_ALIASES,
} from '../components/RaportStsModal';

export default function NilaiSiswa({ user, onBack }: { user: any, onBack: () => void }) {
  const schoolIdentity = useSchoolIdentity();
  const [nilaiData, setNilaiData] = useState<any>({});
  const [jumlahUlangan, setJumlahUlangan] = useState(3);
  const [tahunAktif, setTahunAktif] = useState('2024/2025');
  const [bobotHarian, setBobotHarian] = useState(50);
  const [bobotSts, setBobotSts] = useState(25);
  const [bobotAsas, setBobotAsas] = useState(25);
  const [loading, setLoading] = useState(true);
  const [semester, setSemester] = useState('1');
  const [showRaportModal, setShowRaportModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/pengaturan');
        const result = await res.json();
        if (result.success && result.data) {
          const d = result.data;
          if (d.jumlahUlangan) setJumlahUlangan(parseInt(d.jumlahUlangan, 10) || 3);
          const resolvedYear = d.nilaiTahunAktif || d.tahunAjaran || d.tahunPelajaranAktif || d.bisma_academicYear;
          if (resolvedYear) setTahunAktif(resolvedYear);
          const resolvedSem = d.nilaiSemesterAktif || d.semester || d.semesterAktif || '';
          if (resolvedSem) {
            setSemester(String(resolvedSem).toLowerCase().includes('genap') || resolvedSem === '2' ? '2' : '1');
          }
          if (d.nilaiBobotHarian) setBobotHarian(Number(d.nilaiBobotHarian) || 50);
          if (d.nilaiBobotSts) setBobotSts(Number(d.nilaiBobotSts) || 25);
          if (d.nilaiBobotAsas) setBobotAsas(Number(d.nilaiBobotAsas) || 25);
        } else {
          const stored = safeStorage.getItem('school_identity_data');
          if (stored) {
            const data = JSON.parse(stored);
            if (data.jumlahUlangan) setJumlahUlangan(parseInt(data.jumlahUlangan, 10) || 3);
            if (data.tahunAjaran) setTahunAktif(data.tahunAjaran);
            if (data.semester) {
              setSemester(String(data.semester).toLowerCase().includes('genap') || data.semester === '2' ? '2' : '1');
            }
          }
        }

        // Fetch student's grades
        let allNilai: Record<string, any> = {};
        if (result.success && result.data && result.data.all_student_nilai) {
          try {
            allNilai = JSON.parse(result.data.all_student_nilai);
          } catch (e) {}
        }
        
        const myNilai = allNilai[user?.NISN] || {};
        setNilaiData(myNilai);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.addEventListener('school-identity-update', fetchData);
    return () => window.removeEventListener('school-identity-update', fetchData);
  }, [user]);

  const curriculumForStudent = getCurriculumSubjectsByKelas(user?.Kelas || '');
  const mapelList = curriculumForStudent.all;

  const getSubjectGradeData = (canonicalMapel: string) => {
    const aliases = SUBJECT_ALIASES[canonicalMapel] || [canonicalMapel];
    for (const alias of aliases) {
      const foundKey = Object.keys(nilaiData).find(
        (k) => k !== '_catatan' && k.trim().toLowerCase() === alias.trim().toLowerCase()
      );
      if (foundKey && nilaiData[foundKey]) {
        return nilaiData[foundKey];
      }
    }
    return {};
  };

  const computeDisplayNA = (data: any) => {
    if (data.na !== undefined && data.na !== '' && data.na !== null) return data.na;
    const h1 = Array.isArray(data.harian1) ? data.harian1 : [];
    const h2 = Array.isArray(data.harian2) ? data.harian2 : [];
    const allH = [...h1, ...h2]
      .map((v) => (v !== '' && v !== null && v !== undefined ? Number(v) : NaN))
      .filter((n) => !isNaN(n));
    const sts = data.sts !== '' && data.sts !== undefined && data.sts !== null ? Number(data.sts) : NaN;
    const asas = data.asas !== '' && data.asas !== undefined && data.asas !== null ? Number(data.asas) : NaN;
    if (allH.length === 0 && isNaN(sts) && isNaN(asas)) return '-';
    const rerata = allH.length > 0 ? allH.reduce((a, b) => a + b, 0) / allH.length : 0;
    const valSts = !isNaN(sts) ? sts : 0;
    const valAsas = !isNaN(asas) ? asas : 0;
    return Math.round(
      rerata * (bobotHarian / 100) + valSts * (bobotSts / 100) + valAsas * (bobotAsas / 100)
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3.5">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-300">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            {(schoolIdentity.nilaiLogoMode || 'both') !== 'sekolah' && (
              <img
                src={schoolIdentity.nilaiLogoKabupaten || schoolIdentity.logoKabupaten || '/assets/logo-kab-pasuruan.png'}
                alt="Logo Kabupaten"
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://upload.wikimedia.org/wikipedia/commons/9/9a/Lambang_Kabupaten_Pasuruan.png';
                }}
              />
            )}
            {(schoolIdentity.nilaiLogoMode || 'both') !== 'kabupaten' && (schoolIdentity.nilaiLogoSekolah || schoolIdentity.schoolLogo) && (
              <img
                src={schoolIdentity.nilaiLogoSekolah || schoolIdentity.schoolLogo}
                alt="Logo Sekolah"
                className="w-10 h-10 object-contain"
              />
            )}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white leading-tight">
                Nilai Akademik — {schoolIdentity.schoolName || 'SDN BAUJENG I BEJI'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Tahun Pelajaran Aktif: <strong className="text-indigo-600 dark:text-indigo-400">{tahunAktif}</strong> • Rekapitulasi nilai ulangan dan ujian
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
            <Calendar className="w-3.5 h-3.5" />
            TA {tahunAktif}
          </span>

          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1">Semester 1 (Ganjil)</option>
            <option value="2">Semester 2 (Genap)</option>
          </select>

          <button
            onClick={() => setShowRaportModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Raport STS (A4)</span>
          </button>
        </div>
      </div>

      {/* Banner Cetak Raport STS SD */}
      <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">
              Raport Asesmen Sumatif Tengah Semester (STS) - Format A4 SD ({tahunAktif})
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lihat pratinjau dan cetak lembar laporan hasil belajar tengah semester resmi ukuran A4 • Pengesahan {(schoolIdentity.jabatanKepalaSekolah || `Kepala ${schoolIdentity.schoolName || 'SDN BAUJENG I BEJI'}`).replace(/Kepala\s+UPT\s+Satuan\s+Pendidikan/gi, 'Kepala')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowRaportModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm shrink-0 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Buka & Cetak Raport STS</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-center w-12">No</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 min-w-[200px]">Mata Pelajaran</th>
                <th colSpan={jumlahUlangan} className="px-4 py-2 border-r border-slate-200 dark:border-slate-700 text-center border-b">Nilai Harian</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-center bg-fuchsia-50 dark:bg-fuchsia-900/20 w-20">STS</th>
                <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 text-center bg-fuchsia-50 dark:bg-fuchsia-900/20 w-20">ASAS</th>
                <th rowSpan={2} className="px-4 py-3 text-center bg-slate-100 dark:bg-slate-800 w-24 font-bold">Nilai Akhir</th>
              </tr>
              <tr>
                {Array.from({ length: jumlahUlangan }).map((_, i) => (
                  <th key={`h-${i}`} className="px-2 py-2 border-r border-slate-200 dark:border-slate-700 text-center w-16">{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5 + jumlahUlangan} className="px-4 py-8 text-center text-slate-500">Memuat data nilai...</td>
                </tr>
              ) : mapelList.length === 0 ? (
                <tr>
                  <td colSpan={5 + jumlahUlangan} className="px-4 py-8 text-center text-slate-500">Belum ada data nilai.</td>
                </tr>
              ) : (
                mapelList.map((mapel, idx) => {
                  const data = getSubjectGradeData(mapel);
                  const harian = semester === '1' ? (data.harian1 || []) : (data.harian2 || []);
                  
                  return (
                    <tr key={mapel} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-700/50 text-center">{idx + 1}</td>
                      <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-700/50 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-slate-400" />
                        {mapel}
                      </td>
                      
                      {Array.from({ length: jumlahUlangan }).map((_, i) => (
                        <td key={`val-h-${i}`} className="px-2 py-3 border-r border-slate-100 dark:border-slate-700/50 text-center text-slate-600 dark:text-slate-300">
                          {harian[i] !== undefined && harian[i] !== '' ? harian[i] : '-'}
                        </td>
                      ))}
                      
                      <td className="px-2 py-3 border-r border-slate-100 dark:border-slate-700/50 text-center bg-fuchsia-50/50 dark:bg-fuchsia-900/10 font-medium text-fuchsia-700 dark:text-fuchsia-300">
                        {data.sts !== undefined && data.sts !== '' ? data.sts : '-'}
                      </td>

                      <td className="px-2 py-3 border-r border-slate-100 dark:border-slate-700/50 text-center bg-fuchsia-50/50 dark:bg-fuchsia-900/10 font-medium text-fuchsia-700 dark:text-fuchsia-300">
                        {data.asas !== undefined && data.asas !== '' ? data.asas : '-'}
                      </td>

                      <td className="px-4 py-3 text-center bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-800 dark:text-white">
                        {computeDisplayNA(data)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RaportStsModal
        isOpen={showRaportModal}
        onClose={() => setShowRaportModal(false)}
        role="siswa"
        currentUser={user}
        initialKelas={user?.Kelas || ''}
        initialSemester={semester}
        initialStudentNisn={user?.NISN || null}
        jumlahUlangan={jumlahUlangan}
      />
    </div>
  );
}

