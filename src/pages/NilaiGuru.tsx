import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Save, Printer, Users, User, Calendar, Award, BookOpen, LayoutGrid, Edit3, MessageSquareText, Sparkles, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { safeStorage } from '../lib/storage';
import { useSchoolIdentity } from '../hooks/useSchoolIdentity';
import RaportStsModal, {
  StudentCatatanEntry,
  DEFAULT_CATATAN_STANDAR,
  CATATAN_DEFAULT_PRESETS,
  getCurriculumSubjectsByKelas,
} from '../components/RaportStsModal';

function normalizeKelasName(k: string): string {
  const clean = (k || '').trim();
  if (!clean) return '';
  if (/^[1-6]$/.test(clean)) return `Kelas ${clean}`;
  const m = clean.match(/kelas\s*([1-6])/i);
  if (m) return `Kelas ${m[1]}`;
  return clean;
}

export default function NilaiGuru({ user, onNavigate }: { user: any, onNavigate: (page: string) => void }) {
  const schoolIdentity = useSchoolIdentity();
  const [mapel, setMapel] = useState('');
  const [kelas, setKelas] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [nilaiData, setNilaiData] = useState<any>({});
  const [allNilaiGlobal, setAllNilaiGlobal] = useState<Record<string, any>>({});
  const [jumlahUlangan, setJumlahUlangan] = useState(3);
  const [tahunAktif, setTahunAktif] = useState('2024/2025');
  const [bobotHarian, setBobotHarian] = useState(50);
  const [bobotSts, setBobotSts] = useState(25);
  const [bobotAsas, setBobotAsas] = useState(25);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [semester, setSemester] = useState('1');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [showRaportModal, setShowRaportModal] = useState(false);
  const [raportStudentNisn, setRaportStudentNisn] = useState<string | null>(null);

  const [mapelList, setMapelList] = useState<string[]>([]);
  const [kelasList, setKelasList] = useState<string[]>([]);
  const [fullMapping, setFullMapping] = useState<any[]>([]);
  const [waliKelasMapping, setWaliKelasMapping] = useState<Record<string, { nip: string; nama: string }>>({});
  const [viewMode, setViewMode] = useState<'input' | 'leger_wali'>('input');

  // Catatan Siswa (Default & Manual untuk masing-masing siswa)
  const [defaultCatatan, setDefaultCatatan] = useState<string>(DEFAULT_CATATAN_STANDAR);
  const [catatanSiswaMap, setCatatanSiswaMap] = useState<Record<string, StudentCatatanEntry>>({});
  const [savingCatatanOnly, setSavingCatatanOnly] = useState(false);

  // Detect if the logged-in teacher is a Wali Kelas and which class they manage
  const detectedWaliKelas = useMemo(() => {
    // 1. Direct property on user object from login
    const directWali = user?.waliKelas || user?.wali_kelas;
    if (directWali && directWali !== 'Ekstrakurikuler') {
      return normalizeKelasName(directWali);
    }

    // 2. Match against wali_kelas_mapping from /api/pengaturan
    const uNip = String(user?.NIP || user?.nip || '').trim();
    const uNama = String(user?.['Nama Guru'] || user?.nama_guru || user?.name || '').trim().toLowerCase();

    for (const [klsKey, info] of Object.entries(waliKelasMapping)) {
      if (!info) continue;
      if (uNip && info.nip && String(info.nip).trim() === uNip) {
        return normalizeKelasName(klsKey);
      }
      if (uNama && info.nama && String(info.nama).trim().toLowerCase() === uNama) {
        return normalizeKelasName(klsKey);
      }
    }

    // 3. Fallback: If SD homeroom teacher teaches core subjects (Matematika & Bahasa Indonesia) in a single class
    if (fullMapping.length > 0) {
      const uniqueKlsInSchedule = Array.from(new Set(fullMapping.map((item: any) => item.kelas))).filter(Boolean) as string[];
      const mapelsInSchedule = fullMapping.map((item: any) => String(item.mapel || '').toLowerCase());
      const teachesCoreSD =
        mapelsInSchedule.some((m) => m.includes('matematika') || m.includes('bahasa indonesia')) &&
        mapelsInSchedule.some((m) => m.includes('pancasila') || m.includes('ipas') || m.includes('seni'));
      if (uniqueKlsInSchedule.length === 1 && teachesCoreSD) {
        const candidateClass = normalizeKelasName(uniqueKlsInSchedule[0]);
        const existingWali = waliKelasMapping[candidateClass];
        // Only fallback if no other teacher is explicitly assigned to that class
        if (!existingWali || !existingWali.nama) {
          return candidateClass;
        }
      }
    }

    return '';
  }, [user, waliKelasMapping, fullMapping]);

  const isWaliKelas = Boolean(detectedWaliKelas);

  const activeCurriculum = useMemo(
    () => getCurriculumSubjectsByKelas(kelas || detectedWaliKelas || 'Kelas 5'),
    [kelas, detectedWaliKelas]
  );
  const SD_ALL_SUBJECTS = activeCurriculum.definitions;

  useEffect(() => {
    // Fetch settings for jumlahUlangan, tahunAktif, semesterAktif, bobot nilai, wali_kelas_mapping
    const fetchSettings = async () => {
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
          if (d.nilaiCatatanDefault) setDefaultCatatan(d.nilaiCatatanDefault);
          if (d.wali_kelas_mapping) {
            try {
              const parsed = typeof d.wali_kelas_mapping === 'string' ? JSON.parse(d.wali_kelas_mapping) : d.wali_kelas_mapping;
              if (parsed && typeof parsed === 'object') {
                setWaliKelasMapping(parsed);
              }
            } catch (e) {}
          }
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
      } catch (e) {
        console.error(e);
      }
    };
    fetchSettings();
    window.addEventListener('school-identity-update', fetchSettings);
    return () => window.removeEventListener('school-identity-update', fetchSettings);
  }, []);

  // Auto-select Wali Kelas homeroom class when detected
  useEffect(() => {
    if (detectedWaliKelas && !kelas) {
      setKelas(detectedWaliKelas);
    }
  }, [detectedWaliKelas]);

  useEffect(() => {
    // Fetch mapping from jadwal_real
    const fetchMapping = async () => {
      try {
        const guruName = user?.['Nama Guru'] || user?.nama_guru || user?.name || '';
        const url = user?.role === 'admin' ? '/api/jadwal' : `/api/jadwal?guru=${encodeURIComponent(guruName)}`;
        const res = await fetch(url);
        const result = await res.json();
        
        let uniqueKelas: string[] = [];
        let uniqueMapel: string[] = [];

        if (result.success && result.data && result.data.length > 0) {
          setFullMapping(result.data);
          uniqueMapel = Array.from(new Set(result.data.map((item: any) => item.mapel))).filter(Boolean) as string[];
          uniqueKelas = Array.from(new Set(result.data.map((item: any) => item.kelas))).filter(Boolean) as string[];
        }

        // If no classes found in jadwal, fetch from murid table
        if (uniqueKelas.length === 0) {
          const { data: muridData } = await supabase.from('murid').select('"Kelas"');
          if (muridData) {
            uniqueKelas = Array.from(new Set(muridData.map(m => m.Kelas))).filter(Boolean) as string[];
          }
        }

        if (detectedWaliKelas && !uniqueKelas.includes(detectedWaliKelas)) {
          uniqueKelas.push(detectedWaliKelas);
        }
        
        // Sort them
        uniqueMapel.sort();
        uniqueKelas.sort();
        
        const userMengajar = user?.Mengajar || user?.mengajar;
        setMapelList(uniqueMapel.length > 0 ? uniqueMapel : (userMengajar ? userMengajar.split(',').map((m: string) => m.trim()) : ['Matematika', 'Bahasa Indonesia', 'IPAS', 'Pendidikan Pancasila']));
        setKelasList(uniqueKelas);
      } catch (e) {
        console.error("Error fetching mapping:", e);
        const userMengajar = user?.Mengajar || user?.mengajar;
        setMapelList(userMengajar ? userMengajar.split(',').map((m: string) => m.trim()) : ['Matematika', 'Bahasa Indonesia', 'IPAS', 'Pendidikan Pancasila']);
        
        // Final fallback
        const { data: muridData } = await supabase.from('murid').select('"Kelas"');
        if (muridData) {
          const uniqueKelas = Array.from(new Set(muridData.map(m => m.Kelas))).filter(Boolean) as string[];
          uniqueKelas.sort();
          setKelasList(uniqueKelas);
        } else {
          setKelasList([]);
        }
      }
    };
    
    if (user?.role === 'admin' || user?.['Nama Guru'] || user?.nama_guru || user?.name) {
      fetchMapping();
    }
  }, [user, detectedWaliKelas]);

  useEffect(() => {
    const classCurriculumSubjects = getCurriculumSubjectsByKelas(
      kelas || detectedWaliKelas || 'Kelas 5'
    ).all;

    if (kelas && fullMapping.length > 0) {
      const filteredMapel = Array.from(new Set(fullMapping.filter(item => item.kelas === kelas).map(item => item.mapel))).filter(Boolean) as string[];
      // If teacher is Wali Kelas of this class, ensure all SD curriculum subjects for this Fase are available in order
      if (isWaliKelas && normalizeKelasName(kelas) === detectedWaliKelas) {
        const extra = filteredMapel.filter(
          (m) => !classCurriculumSubjects.some((c) => c.toLowerCase() === m.toLowerCase())
        );
        setMapelList([...classCurriculumSubjects, ...extra]);
      } else if (filteredMapel.length > 0) {
        filteredMapel.sort();
        setMapelList(filteredMapel);
        if (!filteredMapel.includes(mapel)) {
          setMapel('');
        }
      } else {
        setMapelList(classCurriculumSubjects);
      }
    } else if (kelas && isWaliKelas && normalizeKelasName(kelas) === detectedWaliKelas) {
      setMapelList(classCurriculumSubjects);
    } else if (!kelas && fullMapping.length > 0) {
      const uniqueMapel = Array.from(new Set(fullMapping.map((item: any) => item.mapel))).filter(Boolean) as string[];
      uniqueMapel.sort();
      setMapelList(uniqueMapel);
    }
  }, [kelas, fullMapping, isWaliKelas, detectedWaliKelas]);

  // Fetch students & global grades whenever `kelas` is selected (even before `mapel` is chosen, so Wali Kelas can view Leger & Print All Subjects immediately)
  useEffect(() => {
    if (kelas) {
      fetchStudentsAndNilai();
    }
  }, [kelas, mapel]);

  const fetchStudentsAndNilai = async () => {
    setLoading(true);
    try {
      // Fetch students
      const resStudents = await fetch('/api/murid');
      const resultStudents = await resStudents.json();
      let filteredStudents: any[] = [];
      if (resultStudents.success && Array.isArray(resultStudents.data)) {
        filteredStudents = resultStudents.data
          .filter((s: any) => normalizeKelasName(s.Kelas) === normalizeKelasName(kelas))
          .sort((a: any, b: any) => (a['Nama Lengkap'] || '').localeCompare(b['Nama Lengkap'] || ''));
        setStudents(filteredStudents);
      }

      // Fetch nilai data from API
      const resPengaturan = await fetch('/api/pengaturan');
      const resultPengaturan = await resPengaturan.json();
      
      let allNilai: Record<string, any> = {};
      if (resultPengaturan.success && resultPengaturan.data && resultPengaturan.data.all_student_nilai) {
        try {
          allNilai = JSON.parse(resultPengaturan.data.all_student_nilai);
        } catch (e) {}
      }
      setAllNilaiGlobal(allNilai);

      // Load catatan_raport_siswa & nilaiCatatanDefault
      if (resultPengaturan.success && resultPengaturan.data) {
        const d = resultPengaturan.data;
        if (d.nilaiCatatanDefault) {
          setDefaultCatatan(d.nilaiCatatanDefault);
        }
        let loadedCatatan: Record<string, StudentCatatanEntry> = {};
        if (d.catatan_raport_siswa) {
          try {
            const parsedCat =
              typeof d.catatan_raport_siswa === 'string'
                ? JSON.parse(d.catatan_raport_siswa)
                : d.catatan_raport_siswa;
            if (parsedCat && typeof parsedCat === 'object') {
              loadedCatatan = { ...parsedCat };
            }
          } catch (e) {}
        }
        Object.keys(allNilai).forEach((nisnKey) => {
          if (allNilai[nisnKey]?._catatan && !loadedCatatan[nisnKey]) {
            loadedCatatan[nisnKey] = allNilai[nisnKey]._catatan;
          }
        });
        setCatatanSiswaMap(loadedCatatan);
      }

      // Extract current class/mapel data if mapel is selected
      if (mapel) {
        const currentNilaiData: any = {};
        filteredStudents.forEach((student: any) => {
          const nisn = student.NISN;
          if (allNilai[nisn] && allNilai[nisn][mapel]) {
            currentNilaiData[nisn] = allNilai[nisn][mapel];
          }
        });
        setNilaiData(currentNilaiData);
      }

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Helper for Wali Kelas Leger to compute a student's STS Final Score for any subject
  const getStudentSubjectStsScore = (nisn: string, subjectMeta: { canonical: string; aliases: string[] }): number | null => {
    const studentGrades = { ...(allNilaiGlobal[nisn] || {}) };
    if (mapel && nilaiData[nisn]) {
      studentGrades[mapel] = nilaiData[nisn];
    }

    let rawData: any = null;
    for (const alias of subjectMeta.aliases) {
      const foundKey = Object.keys(studentGrades).find(
        (k) => k.trim().toLowerCase() === alias.trim().toLowerCase()
      );
      if (foundKey && studentGrades[foundKey]) {
        rawData = studentGrades[foundKey];
        break;
      }
    }
    if (!rawData) return null;

    const harianKey = semester === '1' ? 'harian1' : 'harian2';
    const harianArr: any[] = Array.isArray(rawData[harianKey]) ? rawData[harianKey] : [];
    const validHarianNums = harianArr
      .slice(0, jumlahUlangan)
      .map((v) => (v !== '' && v !== null && v !== undefined ? Number(v) : NaN))
      .filter((n) => !isNaN(n));

    const rerataHarian =
      validHarianNums.length > 0
        ? Math.round(validHarianNums.reduce((a, b) => a + b, 0) / validHarianNums.length)
        : null;

    const stsVal =
      rawData.sts !== '' && rawData.sts !== null && rawData.sts !== undefined && !isNaN(Number(rawData.sts))
        ? Number(rawData.sts)
        : null;

    if (rerataHarian !== null && stsVal !== null) {
      return Math.round(rerataHarian * 0.5 + stsVal * 0.5);
    } else if (stsVal !== null) {
      return Math.round(stsVal);
    } else if (rerataHarian !== null) {
      return rerataHarian;
    }
    return null;
  };

  const handleNilaiChange = (nisn: string, type: string, index: number | null, value: string) => {
    const numValue = value === '' ? '' : Number(value);
    setNilaiData((prev: any) => {
      const studentData = prev[nisn] || { harian1: [], sts: '', harian2: [], asas: '' };
      
      if (type === 'harian1') {
        const newHarian1 = [...(studentData.harian1 || [])];
        newHarian1[index!] = numValue;
        return { ...prev, [nisn]: { ...studentData, harian1: newHarian1 } };
      } else if (type === 'harian2') {
        const newHarian2 = [...(studentData.harian2 || [])];
        newHarian2[index!] = numValue;
        return { ...prev, [nisn]: { ...studentData, harian2: newHarian2 } };
      } else if (type === 'sts') {
        return { ...prev, [nisn]: { ...studentData, sts: numValue } };
      } else if (type === 'asas') {
        return { ...prev, [nisn]: { ...studentData, asas: numValue } };
      }
      return prev;
    });
  };

  const calculateNA = (nisn: string) => {
    const data = nilaiData[nisn];
    if (!data) return 0;

    const harian1 = data.harian1 || [];
    const harian2 = data.harian2 || [];
    const allHarian = [...harian1, ...harian2].filter(n => typeof n === 'number' && !isNaN(n));
    
    const rerata = allHarian.length > 0 ? allHarian.reduce((a, b) => a + b, 0) / allHarian.length : 0;
    const sts = typeof data.sts === 'number' ? data.sts : 0;
    const asas = typeof data.asas === 'number' ? data.asas : 0;

    const na =
      (rerata * (bobotHarian / 100)) +
      (sts * (bobotSts / 100)) +
      (asas * (bobotAsas / 100));
    return Math.round(na);
  };

  const handlePaste = (e: any, startStudentIdx: number, startColType: 'harian' | 'sts' | 'asas', startColIdx: number = 0) => {
    e.preventDefault();
    const pasteData = e.clipboardData?.getData('text');
    if (!pasteData) return;

    const rows = pasteData.split(/\r?\n/).filter((row: string) => row.trim() !== '');
    
    setNilaiData((prev: any) => {
      const nextData = { ...prev };
      const harianType = semester === '1' ? 'harian1' : 'harian2';

      rows.forEach((row: string, rowOffset: number) => {
        const studentIdx = startStudentIdx + rowOffset;
        if (studentIdx >= students.length) return;

        const student = students[studentIdx];
        const studentData = nextData[student.NISN] ? { ...nextData[student.NISN] } : { harian1: [], sts: '', harian2: [], asas: '' };
        
        const cols = row.split('\t');
        
        let currentColType = startColType;
        let currentColIdx = startColIdx;

        cols.forEach((colData: string) => {
           let val: number | string = colData.replace(',', '.').trim();
           if (val !== '') {
             const mVal = Number(val);
             if (!isNaN(mVal)) val = mVal;
             else val = '';
           }

           if (currentColType === 'harian') {
             const newHarian = [...(studentData[harianType] || [])];
             newHarian[currentColIdx] = val;
             studentData[harianType] = newHarian;
             
             currentColIdx++;
             if (currentColIdx >= jumlahUlangan) {
               currentColType = 'sts';
               currentColIdx = 0;
             }
           } else if (currentColType === 'sts') {
             studentData.sts = val;
             currentColType = 'asas';
           } else if (currentColType === 'asas') {
             studentData.asas = val;
             currentColType = 'done' as any;
           }
        });
        
        nextData[student.NISN] = studentData;
      });

      return nextData;
    });
  };

  // Helper to update a single student's catatan (Default or Manual)
  const handleStudentCatatanChange = (
    nisn: string,
    patch: Partial<StudentCatatanEntry>,
    studentName?: string,
    avgScoreNum?: number | null
  ) => {
    setCatatanSiswaMap((prev) => {
      const current: StudentCatatanEntry = prev[nisn] || {
        mode: 'default',
        text: '',
        defaultPreset: 'standar',
      };
      const nextMode = patch.mode ?? current.mode;
      const nextPreset = patch.defaultPreset ?? current.defaultPreset ?? 'standar';
      let nextText = patch.text !== undefined ? patch.text : current.text;

      // If switching to manual and manual text is empty, pre-fill with current resolved default text
      if (nextMode === 'manual' && !nextText.trim() && patch.text === undefined) {
        const presetHelper = CATATAN_DEFAULT_PRESETS[nextPreset] || CATATAN_DEFAULT_PRESETS.standar;
        nextText = presetHelper.getText(studentName || '', avgScoreNum ?? null, defaultCatatan);
      }

      return {
        ...prev,
        [nisn]: {
          mode: nextMode,
          text: nextText,
          defaultPreset: nextPreset,
        },
      };
    });
  };

  // Resolve what note is currently active for a student
  const getResolvedStudentCatatan = (
    nisn: string,
    studentName: string,
    avgScoreNum: number | null
  ): { entry: StudentCatatanEntry; resolvedDefault: string; finalNote: string } => {
    const entry: StudentCatatanEntry = catatanSiswaMap[nisn] || {
      mode: 'default',
      text: '',
      defaultPreset: 'standar',
    };
    const presetKey = entry.defaultPreset || 'standar';
    const presetObj = CATATAN_DEFAULT_PRESETS[presetKey] || CATATAN_DEFAULT_PRESETS.standar;
    const resolvedDefault = presetObj.getText(studentName, avgScoreNum, defaultCatatan);
    const finalNote =
      entry.mode === 'manual' && entry.text.trim() !== '' ? entry.text : resolvedDefault;
    return { entry, resolvedDefault, finalNote };
  };

  // Save Catatan Siswa (Default & Manual) even when no mapel is selected (e.g. Leger Wali Kelas mode)
  const handleSaveCatatanOnly = async () => {
    setSavingCatatanOnly(true);
    try {
      const resPengaturan = await fetch('/api/pengaturan');
      const resultPengaturan = await resPengaturan.json();
      let allNilai: Record<string, any> = {};
      let existingCatatan: Record<string, StudentCatatanEntry> = {};

      if (resultPengaturan.success && resultPengaturan.data) {
        if (resultPengaturan.data.all_student_nilai) {
          try {
            allNilai = JSON.parse(resultPengaturan.data.all_student_nilai);
          } catch (e) {}
        }
        if (resultPengaturan.data.catatan_raport_siswa) {
          try {
            existingCatatan = JSON.parse(resultPengaturan.data.catatan_raport_siswa);
          } catch (e) {}
        }
      }

      const mergedCatatan = { ...existingCatatan, ...catatanSiswaMap };
      students.forEach((student) => {
        const nisn = student.NISN;
        const entry = mergedCatatan[nisn] || {
          mode: 'default',
          text: '',
          defaultPreset: 'standar',
        };
        mergedCatatan[nisn] = entry;
        if (!allNilai[nisn]) allNilai[nisn] = {};
        allNilai[nisn]._catatan = entry;
      });

      const saveRes = await fetch('/api/pengaturan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nilaiCatatanDefault: defaultCatatan,
          catatan_raport_siswa: JSON.stringify(mergedCatatan),
          all_student_nilai: JSON.stringify(allNilai),
        }),
      });
      const saveResult = await saveRes.json();
      if (saveResult.success) {
        setAllNilaiGlobal(allNilai);
        setCatatanSiswaMap(mergedCatatan);
        setToast({
          message: 'Catatan Default & Manual masing-masing siswa berhasil disimpan!',
          type: 'success',
        });
      } else {
        throw new Error(saveResult.message || 'Gagal menyimpan catatan');
      }
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setToast({ message: 'Gagal menyimpan catatan siswa', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSavingCatatanOnly(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Fetch current allNilai & catatan_raport_siswa from API
      const resPengaturan = await fetch('/api/pengaturan');
      const resultPengaturan = await resPengaturan.json();
      let allNilai: any = {};
      let existingCatatan: Record<string, StudentCatatanEntry> = {};
      if (resultPengaturan.success && resultPengaturan.data) {
        if (resultPengaturan.data.all_student_nilai) {
          try {
            allNilai = JSON.parse(resultPengaturan.data.all_student_nilai);
          } catch (e) {}
        }
        if (resultPengaturan.data.catatan_raport_siswa) {
          try {
            existingCatatan = JSON.parse(resultPengaturan.data.catatan_raport_siswa);
          } catch (e) {}
        }
      }

      const mergedCatatan = { ...existingCatatan, ...catatanSiswaMap };

      // Update with new data (grades + per-student catatan)
      students.forEach(student => {
        const nisn = student.NISN;
        if (!allNilai[nisn]) allNilai[nisn] = {};
        if (mapel) {
          allNilai[nisn][mapel] = {
            ...nilaiData[nisn],
            na: calculateNA(nisn)
          };
        }
        const catEntry = mergedCatatan[nisn] || {
          mode: 'default',
          text: '',
          defaultPreset: 'standar',
        };
        mergedCatatan[nisn] = catEntry;
        allNilai[nisn]._catatan = catEntry;
      });
      
      // Save back to API
      const saveRes = await fetch('/api/pengaturan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          all_student_nilai: JSON.stringify(allNilai),
          catatan_raport_siswa: JSON.stringify(mergedCatatan),
          nilaiCatatanDefault: defaultCatatan,
        })
      });
      
      const saveResult = await saveRes.json();
      if (saveResult.success) {
        setAllNilaiGlobal(allNilai);
        setCatatanSiswaMap(mergedCatatan);
        setToast({ message: 'Data nilai & catatan siswa berhasil disimpan', type: 'success' });
      } else {
        throw new Error(saveResult.message || 'Failed to save');
      }
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setToast({ message: 'Gagal menyimpan data', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg text-sm font-medium text-white ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} flex items-center gap-2 animate-in slide-in-from-top-4`}>
          {toast.message}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('main')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-600 dark:text-slate-300">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              {(schoolIdentity.nilaiLogoMode || 'both') !== 'sekolah' && (
                <img
                  src={schoolIdentity.nilaiLogoKabupaten || schoolIdentity.logoKabupaten || '/assets/logo-kab-pasuruan.png'}
                  alt="Logo Kabupaten"
                  className="w-8 h-8 object-contain hidden sm:block"
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
                  className="w-8 h-8 object-contain"
                />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-white leading-tight">
                    Input Nilai & Raport STS — {schoolIdentity.schoolName || 'SDN BAUJENG I BEJI'}
                  </h1>
                  {isWaliKelas && (
                    <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                      <Award className="w-3 h-3" />
                      Wali {detectedWaliKelas}
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-semibold text-fuchsia-600 dark:text-fuchsia-400">
                  Tahun Pelajaran Aktif: {tahunAktif} • Semester {semester === '1' ? 'I (Ganjil)' : 'II (Genap)'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setRaportStudentNisn(null);
                setShowRaportModal(true);
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer"
              title="Cetak Raport Asesmen Sumatif Tengah Semester (STS) Format A4"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isWaliKelas ? `Cetak Raport Wali Kelas (${detectedWaliKelas}) - A4` : 'Cetak Raport STS (A4)'}
              </span>
              <span className="sm:hidden">Raport A4</span>
            </button>
            <button 
              onClick={handleSave}
              disabled={saving || !kelas || !mapel}
              className="flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{saving ? 'Menyimpan...' : 'Simpan Nilai'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Identity & Active Year Banner from Admin Config */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-2 shrink-0">
              {(schoolIdentity.nilaiLogoMode || 'both') !== 'sekolah' && (
                <img
                  src={schoolIdentity.nilaiLogoKabupaten || schoolIdentity.logoKabupaten || '/assets/logo-kab-pasuruan.png'}
                  alt="Logo Daerah"
                  className="w-11 h-11 object-contain"
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
                  className="w-11 h-11 object-contain"
                />
              )}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">
                {schoolIdentity.schoolName || 'SDN BAUJENG I BEJI'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pengesahan Raport: <strong className="text-slate-700 dark:text-slate-200">{(schoolIdentity.jabatanKepalaSekolah || `Kepala ${schoolIdentity.schoolName || 'SDN BAUJENG I BEJI'}`).replace(/Kepala\s+UPT\s+Satuan\s+Pendidikan/gi, 'Kepala')}</strong> ({schoolIdentity.headmasterName})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isWaliKelas && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-extrabold">
                <Award className="w-3.5 h-3.5" />
                Wali Kelas Aktif: {detectedWaliKelas}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
              <Calendar className="w-3.5 h-3.5" />
              Tahun Aktif: {tahunAktif}
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-fuchsia-50 dark:bg-fuchsia-950/60 border border-fuchsia-200 dark:border-fuchsia-800 text-fuchsia-700 dark:text-fuchsia-300 text-xs font-bold">
              {jumlahUlangan} Kolom PH • Bobot {bobotHarian}%/{bobotSts}%/{bobotAsas}%
            </span>
          </div>
        </div>

        {/* Dedicated Wali Kelas Banner & Mode Switcher */}
        {isWaliKelas && (
          <div className="bg-gradient-to-r from-amber-50 via-orange-50/70 to-emerald-50 dark:from-amber-950/40 dark:via-slate-800 dark:to-emerald-950/30 p-5 rounded-2xl border border-amber-200 dark:border-amber-800/70 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-black uppercase tracking-wider">
                  <Award className="w-3.5 h-3.5" />
                  Akses Khusus Guru Wali Kelas ({detectedWaliKelas})
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Print Out Raport Wali Kelas — Seluruh Mata Pelajaran SD ({SD_ALL_SUBJECTS.length} Mapel)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Sebagai <strong>Wali {detectedWaliKelas}</strong>, Anda dapat memantau leger nilai seluruh mata pelajaran serta mencetak Raport STS format A4 lengkap seluruh mata pelajaran (per siswa atau keseluruhan satu kelas) dengan footer kiri resmi:{' '}
                  <code className="px-1.5 py-0.5 rounded bg-white/80 dark:bg-slate-900 font-mono text-[11px] font-bold text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Nama Siswa | {detectedWaliKelas}/NIS | {schoolIdentity.nilaiRaportTagline || 'BERMUTU - Beriman, Ramah, Mandiri, Unggul dan Tangguh'}
                  </code>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setKelas(detectedWaliKelas);
                    setRaportStudentNisn(students[0]?.NISN || 'single');
                    setShowRaportModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-xs font-extrabold shadow-2xs transition-all cursor-pointer"
                >
                  <User className="w-4 h-4 text-amber-600" />
                  <span>Print Out Wali Kelas Per Siswa (Semua Mapel)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setKelas(detectedWaliKelas);
                    setRaportStudentNisn(null);
                    setShowRaportModal(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-700 hover:to-emerald-700 text-white text-xs font-extrabold shadow-md transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Out Wali Kelas Seluruh Siswa ({students.length} Siswa)</span>
                </button>
              </div>
            </div>

            {/* Mode Toggle: Input Per Mapel vs Leger Seluruh Mata Pelajaran */}
            <div className="pt-3 border-t border-amber-200/70 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-xl p-1 bg-white/90 dark:bg-slate-900 border border-amber-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setViewMode('input')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'input'
                      ? 'bg-fuchsia-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Input Nilai Per Mata Pelajaran</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!kelas && detectedWaliKelas) setKelas(detectedWaliKelas);
                    setViewMode('leger_wali');
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'leger_wali'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Leger Wali Kelas (Seluruh Mata Pelajaran)</span>
                </button>
              </div>

              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Klik <strong>Leger Wali Kelas</strong> untuk melihat rekap seluruh mata pelajaran & mencetak raport langsung per siswa.
              </span>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Kelas {isWaliKelas && <span className="text-xs font-bold text-amber-600">(Wali {detectedWaliKelas})</span>}
              </label>
              <select 
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-slate-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-fuchsia-500 outline-none font-semibold"
              >
                <option value="">-- Pilih Kelas --</option>
                {kelasList.map(k => (
                  <option key={k} value={k}>
                    {k} {isWaliKelas && normalizeKelasName(k) === detectedWaliKelas ? '★ (Kelas Perwalian Anda)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mata Pelajaran</label>
              <select 
                value={mapel}
                onChange={(e) => {
                  setMapel(e.target.value);
                  if (e.target.value) setViewMode('input');
                }}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-slate-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-fuchsia-500 outline-none"
              >
                <option value="">-- Pilih Mapel --</option>
                {mapelList.map((m: string) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Semester</label>
              <select 
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5 bg-slate-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-fuchsia-500 outline-none"
              >
                <option value="1">Semester 1 (Ganjil)</option>
                <option value="2">Semester 2 (Genap)</option>
              </select>
            </div>
          </div>

          {/* Quick Raport STS Action Bar */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-fuchsia-50/70 via-indigo-50/50 to-emerald-50/70 dark:from-slate-900/70 dark:to-slate-900/70 p-4 rounded-xl border border-fuchsia-100 dark:border-slate-700">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Printer className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />
                <span>
                  {isWaliKelas
                    ? `Cetak Raport STS Wali Kelas (${kelas || detectedWaliKelas}) — Seluruh Mata Pelajaran Format A4`
                    : 'Cetak Raport Asesmen Sumatif Tengah Semester (STS) — Format A4 SD'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isWaliKelas
                  ? 'Mencetak seluruh mata pelajaran jenjang SD lengkap dengan tanda tangan Wali Kelas dan footer kiri Nama Siswa | Kelas/NIS | Tagline.'
                  : 'Tersedia pilihan cetak raport per siswa maupun cetak keseluruhan siswa dalam 1 kelas sekaligus.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setRaportStudentNisn(students[0]?.NISN || 'single');
                  setShowRaportModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-fuchsia-50 dark:hover:bg-slate-700 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-300 dark:border-fuchsia-700 text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Cetak Per Siswa (A4)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRaportStudentNisn(null);
                  setShowRaportModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Cetak Keseluruhan Siswa (A4)</span>
              </button>
            </div>
          </div>
        </div>

        {/* PANEL KONFIGURASI CATATAN DEFAULT & MANUAL SISWA */}
        {kelas && students.length > 0 && (
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-indigo-200 dark:border-slate-700 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <MessageSquareText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-white">
                    Pemberian Catatan Siswa pada Raport STS (Mode Default & Manual per Siswa)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Anda dapat mengatur <strong>Teks Catatan Default</strong> di bawah ini, lalu memilih mode <strong>Default</strong> atau menuliskan catatan <strong>Manual</strong> secara khusus untuk <strong>masing-masing siswa</strong> pada tabel di bawah.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const nextMap = { ...catatanSiswaMap };
                    students.forEach((s) => {
                      nextMap[s.NISN] = {
                        mode: 'default',
                        text: nextMap[s.NISN]?.text || '',
                        defaultPreset: 'standar',
                      };
                    });
                    setCatatanSiswaMap(nextMap);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Set Semua Siswa: Default Standar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextMap = { ...catatanSiswaMap };
                    students.forEach((s) => {
                      nextMap[s.NISN] = {
                        mode: 'default',
                        text: nextMap[s.NISN]?.text || '',
                        defaultPreset: 'auto_nilai',
                      };
                    });
                    setCatatanSiswaMap(nextMap);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Set Semua: Default Otomatis Capaian</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveCatatanOnly}
                  disabled={savingCatatanOnly}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingCatatanOnly ? 'Menyimpan...' : 'Simpan Catatan Siswa'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              <div className="lg:col-span-9">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                    Teks Catatan Default (Digunakan pada Siswa yang Berstatus Mode "Default Standar")
                  </label>
                  <button
                    type="button"
                    onClick={() => setDefaultCatatan(DEFAULT_CATATAN_STANDAR)}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset Default
                  </button>
                </div>
                <input
                  type="text"
                  value={defaultCatatan}
                  onChange={(e) => setDefaultCatatan(e.target.value)}
                  placeholder="Masukkan catatan default untuk siswa..."
                  className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="lg:col-span-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Mode Default:</span>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                    {students.filter((s) => (catatanSiswaMap[s.NISN]?.mode || 'default') === 'default').length} Siswa
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Mode Manual:</span>
                  <span className="font-extrabold text-fuchsia-600 dark:text-fuchsia-400">
                    {students.filter((s) => catatanSiswaMap[s.NISN]?.mode === 'manual').length} Siswa
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODE LEGER WALI KELAS: SELURUH MATA PELAJARAN */}
        {kelas && (viewMode === 'leger_wali' || (isWaliKelas && !mapel)) && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-amber-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800 border-b border-amber-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span>Leger Nilai STS Seluruh Mata Pelajaran & Catatan Siswa — {kelas}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Rekapitulasi nilai tengah semester seluruh mata pelajaran SD beserta pengaturan <strong>Catatan Default & Manual</strong> untuk masing-masing siswa.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSaveCatatanOnly}
                  disabled={savingCatatanOnly}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingCatatanOnly ? 'Menyimpan...' : 'Simpan Catatan'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRaportStudentNisn(null);
                    setShowRaportModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Semua Siswa ({students.length} Lembar A4)</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-3 py-3 border-r border-slate-200 dark:border-slate-700 text-center w-10">No</th>
                    <th className="px-3 py-3 border-r border-slate-200 dark:border-slate-700 min-w-[180px]">Nama Siswa & NIS</th>
                    {SD_ALL_SUBJECTS.map((subj) => (
                      <th
                        key={subj.canonical}
                        className="px-2 py-3 border-r border-slate-200 dark:border-slate-700 text-center min-w-[54px]"
                        title={subj.canonical}
                      >
                        {subj.short}
                      </th>
                    ))}
                    <th className="px-2.5 py-3 border-r border-slate-200 dark:border-slate-700 text-center bg-amber-50/70 dark:bg-amber-950/30 font-extrabold">
                      Jumlah
                    </th>
                    <th className="px-2.5 py-3 border-r border-slate-200 dark:border-slate-700 text-center bg-indigo-50/70 dark:bg-indigo-950/30 font-extrabold">
                      Rerata
                    </th>
                    <th className="px-3 py-3 border-r border-slate-200 dark:border-slate-700 bg-fuchsia-50/60 dark:bg-fuchsia-950/20 min-w-[290px] font-extrabold">
                      Catatan Siswa (Default / Manual)
                    </th>
                    <th className="px-3 py-3 text-center bg-emerald-50/70 dark:bg-emerald-950/30 min-w-[125px] font-extrabold">
                      Print Out Wali Kelas
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6 + SD_ALL_SUBJECTS.length} className="px-4 py-8 text-center text-slate-500">
                        Memuat leger nilai seluruh mata pelajaran...
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={6 + SD_ALL_SUBJECTS.length} className="px-4 py-8 text-center text-slate-500">
                        Tidak ada data siswa untuk kelas ini.
                      </td>
                    </tr>
                  ) : (
                    students.map((student, idx) => {
                      let sumScore = 0;
                      let countScore = 0;
                      const scores = SD_ALL_SUBJECTS.map((subj) => {
                        const sc = getStudentSubjectStsScore(student.NISN, subj);
                        if (sc !== null && sc > 0) {
                          sumScore += sc;
                          countScore++;
                        }
                        return sc;
                      });
                      const avgScoreNumeric = countScore > 0 ? sumScore / countScore : null;
                      const avgScore = avgScoreNumeric !== null ? avgScoreNumeric.toFixed(1) : '-';
                      const namaSiswa = student['Nama Lengkap'] || 'Siswa';
                      const { entry: catEntry, resolvedDefault } = getResolvedStudentCatatan(
                        student.NISN,
                        namaSiswa,
                        avgScoreNumeric
                      );

                      return (
                        <tr
                          key={student.NISN}
                          className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <td className="px-3 py-2.5 border-r border-slate-100 dark:border-slate-700/50 text-center font-medium">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2.5 border-r border-slate-100 dark:border-slate-700/50">
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {namaSiswa}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {student.Kelas || kelas}/{student.NIS || student.NISN}
                            </div>
                          </td>
                          {scores.map((sc, sIdx) => (
                            <td
                              key={`${student.NISN}-s-${sIdx}`}
                              className={`px-2 py-2.5 border-r border-slate-100 dark:border-slate-700/50 text-center font-semibold ${
                                sc !== null
                                  ? 'text-slate-800 dark:text-slate-200'
                                  : 'text-slate-300 dark:text-slate-600'
                              }`}
                            >
                              {sc !== null ? sc : '-'}
                            </td>
                          ))}
                          <td className="px-2.5 py-2.5 border-r border-slate-100 dark:border-slate-700/50 text-center font-bold bg-amber-50/40 dark:bg-amber-950/10 text-amber-900 dark:text-amber-300">
                            {countScore > 0 ? sumScore : '-'}
                          </td>
                          <td className="px-2.5 py-2.5 border-r border-slate-100 dark:border-slate-700/50 text-center font-extrabold bg-indigo-50/40 dark:bg-indigo-950/10 text-indigo-900 dark:text-indigo-300">
                            {avgScore}
                          </td>
                          {/* Kolom Catatan Default / Manual Masing-Masing Siswa */}
                          <td className="px-2.5 py-2 border-r border-slate-100 dark:border-slate-700/50 align-top">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleStudentCatatanChange(
                                        student.NISN,
                                        { mode: 'default' },
                                        namaSiswa,
                                        avgScoreNumeric
                                      )
                                    }
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                      catEntry.mode === 'default'
                                        ? 'bg-indigo-600 text-white shadow-2xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                    }`}
                                  >
                                    Default
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleStudentCatatanChange(
                                        student.NISN,
                                        { mode: 'manual' },
                                        namaSiswa,
                                        avgScoreNumeric
                                      )
                                    }
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                      catEntry.mode === 'manual'
                                        ? 'bg-fuchsia-600 text-white shadow-2xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                    }`}
                                  >
                                    Manual
                                  </button>
                                </div>

                                {catEntry.mode === 'default' && (
                                  <select
                                    value={catEntry.defaultPreset || 'standar'}
                                    onChange={(e) =>
                                      handleStudentCatatanChange(
                                        student.NISN,
                                        {
                                          mode: 'default',
                                          defaultPreset: e.target.value as StudentCatatanEntry['defaultPreset'],
                                        },
                                        namaSiswa,
                                        avgScoreNumeric
                                      )
                                    }
                                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-slate-800 text-indigo-800 dark:text-indigo-200 outline-none max-w-[160px]"
                                  >
                                    {Object.entries(CATATAN_DEFAULT_PRESETS).map(([k, cfg]) => (
                                      <option key={k} value={k}>
                                        {cfg.label}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>

                              {catEntry.mode === 'default' ? (
                                <div className="text-[10.5px] italic text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 px-2 py-1 rounded border border-slate-200/70 dark:border-slate-700/70 line-clamp-2">
                                  "{resolvedDefault}"
                                </div>
                              ) : (
                                <textarea
                                  rows={2}
                                  value={catEntry.text}
                                  onChange={(e) =>
                                    handleStudentCatatanChange(
                                      student.NISN,
                                      { mode: 'manual', text: e.target.value },
                                      namaSiswa,
                                      avgScoreNumeric
                                    )
                                  }
                                  placeholder={`Ketik catatan manual untuk ${namaSiswa}...`}
                                  className="w-full text-[11px] px-2 py-1 rounded border border-fuchsia-300 dark:border-fuchsia-700 bg-fuchsia-50/30 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-1 focus:ring-fuchsia-500 outline-none"
                                />
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => {
                                setRaportStudentNisn(student.NISN);
                                setShowRaportModal(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                              title={`Cetak Raport STS Lengkap (Semua Mapel) - ${namaSiswa}`}
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Cetak Semua Mapel</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODE INPUT PER MATA PELAJARAN */}
        {kelas && mapel && viewMode === 'input' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th rowSpan={2} className="px-3 py-3 border-r border-slate-200 dark:border-slate-700 text-center w-10">No</th>
                    <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 dark:border-slate-700 min-w-[190px]">Nama Siswa</th>
                    <th colSpan={jumlahUlangan} className="px-4 py-2 border-r border-slate-200 dark:border-slate-700 text-center border-b">Nilai Harian</th>
                    <th rowSpan={2} className="px-3 py-3 border-r border-slate-200 dark:border-slate-700 text-center bg-fuchsia-50 dark:bg-fuchsia-900/20 w-18">STS</th>
                    <th rowSpan={2} className="px-3 py-3 border-r border-slate-200 dark:border-slate-700 text-center bg-fuchsia-50 dark:bg-fuchsia-900/20 w-18">ASAS</th>
                    <th rowSpan={2} className="px-3 py-3 border-r border-slate-200 dark:border-slate-700 text-center bg-slate-100 dark:bg-slate-800 w-20 font-bold">Nilai Akhir</th>
                    <th rowSpan={2} className="px-3 py-3 border-r border-slate-200 dark:border-slate-700 bg-indigo-50/50 dark:bg-indigo-950/20 min-w-[280px] font-bold">
                      Catatan Siswa (Default / Manual)
                    </th>
                    <th rowSpan={2} className="px-3 py-3 text-center bg-emerald-50/70 dark:bg-emerald-950/20 w-24 font-bold">Raport STS</th>
                  </tr>
                  <tr>
                    {Array.from({ length: jumlahUlangan }).map((_, i) => (
                      <th key={`h-${i}`} className="px-2 py-2 border-r border-slate-200 dark:border-slate-700 text-center w-14">{i + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7 + jumlahUlangan} className="px-4 py-8 text-center text-slate-500">Memuat data siswa...</td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={7 + jumlahUlangan} className="px-4 py-8 text-center text-slate-500">Tidak ada data siswa untuk kelas ini.</td>
                    </tr>
                  ) : (
                    students.map((student, idx) => {
                      const harianType = semester === '1' ? 'harian1' : 'harian2';
                      const naScore = calculateNA(student.NISN);
                      const namaSiswa = student['Nama Lengkap'] || 'Siswa';
                      const { entry: catEntry, resolvedDefault } = getResolvedStudentCatatan(
                        student.NISN,
                        namaSiswa,
                        naScore > 0 ? naScore : null
                      );

                      return (
                      <tr key={student.NISN} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-3 py-2 border-r border-slate-100 dark:border-slate-700/50 text-center">{idx + 1}</td>
                        <td className="px-4 py-2 border-r border-slate-100 dark:border-slate-700/50 font-medium text-slate-800 dark:text-slate-200">
                          <div>{namaSiswa}</div>
                          <div className="text-[10px] text-slate-400">{student.NIS || student.NISN}</div>
                        </td>
                        
                        {Array.from({ length: jumlahUlangan }).map((_, i) => (
                          <td key={`val-h-${i}`} className="px-1 py-1 border-r border-slate-100 dark:border-slate-700/50">
                            <input 
                              type="number" 
                              min="0" max="100"
                              value={nilaiData[student.NISN]?.[harianType]?.[i] ?? ''}
                              onChange={(e) => handleNilaiChange(student.NISN, harianType, i, e.target.value)}
                              onPaste={(e) => handlePaste(e, idx, 'harian', i)}
                              className="w-full px-2 py-1.5 text-center bg-transparent border-none focus:ring-2 focus:ring-fuchsia-500 rounded outline-none dark:text-white"
                            />
                          </td>
                        ))}
                        
                        <td className="px-1 py-1 border-r border-slate-100 dark:border-slate-700/50 bg-fuchsia-50/50 dark:bg-fuchsia-900/10">
                          <input 
                            type="number" 
                            min="0" max="100"
                            value={nilaiData[student.NISN]?.sts ?? ''}
                            onChange={(e) => handleNilaiChange(student.NISN, 'sts', null, e.target.value)}
                            onPaste={(e) => handlePaste(e, idx, 'sts', 0)}
                            className="w-full px-2 py-1.5 text-center bg-transparent border-none focus:ring-2 focus:ring-fuchsia-500 rounded outline-none font-medium text-fuchsia-700 dark:text-fuchsia-300"
                          />
                        </td>

                        <td className="px-1 py-1 border-r border-slate-100 dark:border-slate-700/50 bg-fuchsia-50/50 dark:bg-fuchsia-900/10">
                          <input 
                            type="number" 
                            min="0" max="100"
                            value={nilaiData[student.NISN]?.asas ?? ''}
                            onChange={(e) => handleNilaiChange(student.NISN, 'asas', null, e.target.value)}
                            onPaste={(e) => handlePaste(e, idx, 'asas', 0)}
                            className="w-full px-2 py-1.5 text-center bg-transparent border-none focus:ring-2 focus:ring-fuchsia-500 rounded outline-none font-medium text-fuchsia-700 dark:text-fuchsia-300"
                          />
                        </td>

                        <td className="px-3 py-2 border-r border-slate-100 dark:border-slate-700/50 text-center bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-800 dark:text-white">
                          {naScore}
                        </td>

                        {/* Kolom Catatan Default / Manual Masing-Masing Siswa */}
                        <td className="px-2.5 py-2 border-r border-slate-100 dark:border-slate-700/50 align-top">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStudentCatatanChange(
                                      student.NISN,
                                      { mode: 'default' },
                                      namaSiswa,
                                      naScore > 0 ? naScore : null
                                    )
                                  }
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                    catEntry.mode === 'default'
                                      ? 'bg-indigo-600 text-white shadow-2xs'
                                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                  }`}
                                >
                                  Default
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStudentCatatanChange(
                                      student.NISN,
                                      { mode: 'manual' },
                                      namaSiswa,
                                      naScore > 0 ? naScore : null
                                    )
                                  }
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                    catEntry.mode === 'manual'
                                      ? 'bg-fuchsia-600 text-white shadow-2xs'
                                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                  }`}
                                >
                                  Manual
                                </button>
                              </div>

                              {catEntry.mode === 'default' && (
                                <select
                                  value={catEntry.defaultPreset || 'standar'}
                                  onChange={(e) =>
                                    handleStudentCatatanChange(
                                      student.NISN,
                                      {
                                        mode: 'default',
                                        defaultPreset: e.target.value as StudentCatatanEntry['defaultPreset'],
                                      },
                                      namaSiswa,
                                      naScore > 0 ? naScore : null
                                    )
                                  }
                                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-slate-800 text-indigo-800 dark:text-indigo-200 outline-none max-w-[155px]"
                                >
                                  {Object.entries(CATATAN_DEFAULT_PRESETS).map(([k, cfg]) => (
                                    <option key={k} value={k}>
                                      {cfg.label}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>

                            {catEntry.mode === 'default' ? (
                              <div className="text-[10.5px] italic text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 px-2 py-1 rounded border border-slate-200/70 dark:border-slate-700/70 line-clamp-2">
                                "{resolvedDefault}"
                              </div>
                            ) : (
                              <textarea
                                rows={2}
                                value={catEntry.text}
                                onChange={(e) =>
                                  handleStudentCatatanChange(
                                    student.NISN,
                                    { mode: 'manual', text: e.target.value },
                                    namaSiswa,
                                    naScore > 0 ? naScore : null
                                  )
                                }
                                placeholder={`Ketik catatan manual untuk ${namaSiswa}...`}
                                className="w-full text-[11px] px-2 py-1 rounded border border-fuchsia-300 dark:border-fuchsia-700 bg-fuchsia-50/30 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-1 focus:ring-fuchsia-500 outline-none"
                              />
                            )}
                          </div>
                        </td>

                        <td className="px-2 py-1.5 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => {
                              setRaportStudentNisn(student.NISN);
                              setShowRaportModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-colors cursor-pointer"
                            title={`Cetak Raport STS ${namaSiswa}`}
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak</span>
                          </button>
                        </td>
                      </tr>
                    )})
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <RaportStsModal
        isOpen={showRaportModal}
        onClose={() => setShowRaportModal(false)}
        role={user?.role === 'admin' ? 'admin' : 'guru'}
        currentUser={user}
        initialKelas={kelas || detectedWaliKelas}
        initialSemester={semester}
        initialMapel={mapel}
        initialStudentNisn={raportStudentNisn === 'single' ? (students[0]?.NISN || 'single') : raportStudentNisn}
        kelasList={kelasList}
        localNilaiOverride={nilaiData}
        localCatatanSiswa={catatanSiswaMap}
        defaultCatatan={defaultCatatan}
        onUpdateCatatanSiswa={(nextMap, nextDef) => {
          setCatatanSiswaMap(nextMap);
          if (nextDef !== undefined) setDefaultCatatan(nextDef);
        }}
        jumlahUlangan={jumlahUlangan}
        isWaliKelas={isWaliKelas}
        waliKelasKelas={detectedWaliKelas}
      />
    </div>
  );
}

