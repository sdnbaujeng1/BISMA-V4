import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  User,
  Users,
  Calendar,
  BookOpen,
  FileText,
  SlidersHorizontal,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  RotateCcw,
  Save,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSchoolIdentity } from '../hooks/useSchoolIdentity';
import { parseKetidakhadiran } from '../lib/ketidakhadiran';

export interface StudentCatatanEntry {
  mode: 'default' | 'manual';
  text: string;
  defaultPreset?: 'standar' | 'auto_nilai' | 'prestasi' | 'motivasi' | 'disiplin';
}

export const DEFAULT_CATATAN_STANDAR =
  'Tetap semangat belajar, tingkatkan terus kedisiplinan, rajin membaca, serta jaga ibadah dan akhlak mulia baik di sekolah maupun di rumah.';

export const CATATAN_DEFAULT_PRESETS: Record<
  NonNullable<StudentCatatanEntry['defaultPreset']>,
  { label: string; getText: (nama: string, avgScore: number | null, globalDefault: string) => string }
> = {
  standar: {
    label: 'Default Standar Sekolah / Kelas',
    getText: (nama, _avg, globalDefault) =>
      (globalDefault || DEFAULT_CATATAN_STANDAR).replace(/\{nama\}/gi, nama || 'Ananda'),
  },
  auto_nilai: {
    label: 'Default Otomatis Sesuai Capaian Nilai',
    getText: (nama, avg) => {
      const displayNama = nama || 'Ananda';
      if (avg !== null && avg >= 90) {
        return `Selamat untuk Ananda ${displayNama}, capaian belajar pada tengah semester ini sangat membanggakan. Pertahankan prestasi, teruslah rendah hati, dan jadilah teladan yang baik bagi teman-teman.`;
      }
      if (avg !== null && avg >= 80) {
        return `Ananda ${displayNama} telah menunjukkan perkembangan belajar yang baik dan aktif di kelas. Terus tingkatkan ketekunan belajar dan rajin membaca agar hasil di akhir semester semakin optimal.`;
      }
      if (avg !== null && avg >= 70) {
        return `Ananda ${displayNama} sudah berusaha dengan cukup baik. Tingkatkan lagi fokus saat pembelajaran di kelas dan perbanyak latihan mengulang materi di rumah.`;
      }
      return `Ananda ${displayNama} memerlukan pendampingan belajar yang lebih rutin baik di sekolah maupun di rumah. Tetap semangat, jangan ragu bertanya kepada guru, dan terus berlatih dengan tekun.`;
    },
  },
  prestasi: {
    label: 'Default Apresiasi & Pertahankan Prestasi',
    getText: (nama) =>
      `Ananda ${nama || ''} memiliki semangat belajar dan sikap yang sangat baik. Pertahankan prestasi yang telah diraih dan terus kembangkan potensi diri secara positif.`.replace(/\s+/g, ' '),
  },
  motivasi: {
    label: 'Default Motivasi & Semangat Belajar',
    getText: (nama) =>
      `Tetap semangat belajar untuk Ananda ${nama || ''}. Tingkatkan keaktifan di dalam kelas, biasakan mengulang pelajaran di rumah, dan percaya diri dalam meraih prestasi terbaik.`.replace(/\s+/g, ' '),
  },
  disiplin: {
    label: 'Default Kedisiplinan & Budi Pekerti',
    getText: (nama) =>
      `Ananda ${nama || ''}, tingkatkan terus kedisiplinan waktu, kerapian, dan tanggung jawab dalam mengerjakan tugas, serta senantiasa jaga ibadah dan sopan santun terhadap guru maupun orang tua.`.replace(/\s+/g, ' '),
  },
};

export interface RaportStsModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'guru' | 'siswa' | 'admin';
  currentUser: any;
  initialKelas?: string;
  initialSemester?: string;
  initialMapel?: string;
  initialStudentNisn?: string | null;
  kelasList?: string[];
  localNilaiOverride?: Record<string, any>; // Current unsaved/saved nilaiData for active mapel in NilaiGuru
  localCatatanSiswa?: Record<string, StudentCatatanEntry>;
  defaultCatatan?: string;
  onUpdateCatatanSiswa?: (
    nextMap: Record<string, StudentCatatanEntry>,
    nextDefault?: string
  ) => void;
  jumlahUlangan?: number;
  isWaliKelas?: boolean;
  waliKelasKelas?: string;
}

function normalizeKelasKey(k: string): string {
  const clean = (k || '').trim();
  if (!clean) return '';
  if (/^[1-6]$/.test(clean)) return `Kelas ${clean}`;
  const match = clean.match(/kelas\s*([1-6])/i);
  if (match) return `Kelas ${match[1]}`;
  return clean;
}

export interface CurriculumSubjectDef {
  canonical: string;
  short: string;
  category: 'umum' | 'mulok';
  aliases: string[];
}

export const SUBJECT_ALIASES: Record<string, string[]> = {
  'Pendidikan Agama dan Budi Pekerti': [
    'Pendidikan Agama dan Budi Pekerti',
    'PAI',
    'Pendidikan Agama',
    'Agama',
    'PABP',
  ],
  'Pendidikan Pancasila': ['Pendidikan Pancasila', 'PPKn', 'PKn', 'Pancasila'],
  'Bahasa Indonesia': ['Bahasa Indonesia', 'B. Indonesia', 'Bahasa Indo', 'BIN'],
  'Matematika': ['Matematika', 'MTK'],
  'IPAS': [
    'IPAS',
    'Ilmu Pengetahuan Alam dan Sosial',
    'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
    'IPA',
    'IPS',
  ],
  'PJOK': [
    'PJOK',
    'Pendidikan Jasmani, Olahraga, dan Kesehatan',
    'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    'Penjaskes',
    'Olahraga',
  ],
  'Seni dan Budaya': [
    'Seni dan Budaya',
    'Seni dan budaya',
    'Seni Budaya',
    'SBdP',
    'Seni Rupa',
    'Seni Musik',
  ],
  'Bahasa Inggris': ['Bahasa Inggris', 'B. Inggris', 'English'],
  'Bahasa Jawa': ['Bahasa Jawa', 'B. Jawa', 'Mulok Bahasa Jawa'],
  'BTQ': [
    'BTQ',
    'Baca Tulis Al-Quran',
    "Baca Tulis Al-Qur'an",
    'Baca Tulis Al Quran',
    'BTA',
  ],
  'Tahfidz': [
    'Tahfidz',
    "Tahfidz Al-Qur'an",
    'Tahfidz Al Quran',
    'Tahfidzul Quran',
    'Hafalan Al-Quran',
    'BTQ',
    'Baca Tulis Al-Quran',
    "Baca Tulis Al-Qur'an",
    'Baca Tulis Al Quran',
    'BTA',
  ],
};

const NON_ACADEMIC_SCHEDULE_ITEMS = new Set([
  'upacara',
  'istirahat',
  'senam',
  'senam & litnum',
  'literasi',
  'istighosah',
  'sableng',
  'kombel',
  'keg. sabtu bersih',
  'ekstra pramuka',
  'pramuka',
]);

export function parseKelasNumber(kelasStr: string): number {
  const raw = (kelasStr || '').toUpperCase().trim();
  const cleaned = raw.replace(/^KELAS\s*/i, '').trim();
  if (cleaned.startsWith('VI') || cleaned.startsWith('6')) return 6;
  if (cleaned.startsWith('IV') || cleaned.startsWith('4')) return 4;
  if (cleaned.startsWith('V') || cleaned.startsWith('5')) return 5;
  if (cleaned.startsWith('III') || cleaned.startsWith('3')) return 3;
  if (cleaned.startsWith('II') || cleaned.startsWith('2')) return 2;
  if (cleaned.startsWith('I') || cleaned.startsWith('1')) return 1;
  const digitMatch = raw.match(/([1-6])/);
  if (digitMatch) return parseInt(digitMatch[1], 10);
  return 5; // Default fallback to Fase C Kelas 5 if unspecified
}

export function detectFaseSD(kelasStr: string): 'Fase A' | 'Fase B' | 'Fase C' {
  const kNum = parseKelasNumber(kelasStr);
  if (kNum >= 5) return 'Fase C';
  if (kNum >= 3) return 'Fase B';
  return 'Fase A';
}

/**
 * Mengembalikan susunan & komposisi Mata Pelajaran Kurikulum Merdeka SD terbaru
 * berdasarkan Fase A (Kelas 1-2), Fase B (Kelas 3-4), Fase C (Kelas 5-6) serta Muatan Lokal (Mulok).
 * - Fase A (Kelas 1-2): Tanpa IPAS (IPAS baru dimulai di Fase B Kelas 3)
 * - Mulok Kelas 1-5: Bahasa Jawa, BTQ
 * - Mulok Kelas 6: Bahasa Jawa, Tahfidz (menggantikan BTQ)
 */
export function getCurriculumSubjectsByKelas(kelasStr: string): {
  fase: 'Fase A' | 'Fase B' | 'Fase C';
  kelasNum: number;
  umum: string[];
  mulok: string[];
  all: string[];
  definitions: CurriculumSubjectDef[];
} {
  const kelasNum = parseKelasNumber(kelasStr);
  const fase = detectFaseSD(kelasStr);

  // Urutan Mapel Umum sesuai Kurikulum Merdeka SD Terbaru
  const umum: string[] =
    fase === 'Fase A'
      ? [
          'Pendidikan Agama dan Budi Pekerti',
          'Pendidikan Pancasila',
          'Bahasa Indonesia',
          'Matematika',
          'PJOK',
          'Seni dan Budaya',
          'Bahasa Inggris',
        ]
      : [
          'Pendidikan Agama dan Budi Pekerti',
          'Pendidikan Pancasila',
          'Bahasa Indonesia',
          'Matematika',
          'IPAS',
          'PJOK',
          'Seni dan Budaya',
          'Bahasa Inggris',
        ];

  // Muatan Lokal (Mulok): BTQ hanya sampai Kelas 5, Kelas 6 diganti dengan Tahfidz
  const mulok: string[] =
    kelasNum === 6 ? ['Bahasa Jawa', 'Tahfidz'] : ['Bahasa Jawa', 'BTQ'];

  const shortLabelMap: Record<string, string> = {
    'Pendidikan Agama dan Budi Pekerti': 'PAI',
    'Pendidikan Pancasila': 'Pancasila',
    'Bahasa Indonesia': 'B. Indo',
    'Matematika': 'MTK',
    'IPAS': 'IPAS',
    'PJOK': 'PJOK',
    'Seni dan Budaya': 'Seni',
    'Bahasa Inggris': 'B. Ingg',
    'Bahasa Jawa': 'B. Jawa',
    'BTQ': 'BTQ',
    'Tahfidz': 'Tahfidz',
  };

  const definitions: CurriculumSubjectDef[] = [
    ...umum.map((canonical) => ({
      canonical,
      short: shortLabelMap[canonical] || canonical,
      category: 'umum' as const,
      aliases: SUBJECT_ALIASES[canonical] || [canonical],
    })),
    ...mulok.map((canonical) => ({
      canonical,
      short: shortLabelMap[canonical] || canonical,
      category: 'mulok' as const,
      aliases: SUBJECT_ALIASES[canonical] || [canonical],
    })),
  ];

  return {
    fase,
    kelasNum,
    umum,
    mulok,
    all: [...umum, ...mulok],
    definitions,
  };
}

function formatKelasSD(kelasStr: string): string {
  const norm = (kelasStr || '').toUpperCase().replace(/^KELAS\s*/i, '').trim();
  const mapRoman: Record<string, string> = {
    '1': 'I (Satu)',
    'I': 'I (Satu)',
    '2': 'II (Dua)',
    'II': 'II (Dua)',
    '3': 'III (Tiga)',
    'III': 'III (Tiga)',
    '4': 'IV (Empat)',
    'IV': 'IV (Empat)',
    '5': 'V (Lima)',
    'V': 'V (Lima)',
    '6': 'VI (Enam)',
    'VI': 'VI (Enam)',
  };
  return mapRoman[norm] || kelasStr || '-';
}

function getPredikat(score: number | null): { huruf: string; label: string } {
  if (score === null || isNaN(score) || score <= 0) return { huruf: '-', label: '-' };
  if (score >= 90) return { huruf: 'A', label: 'Sangat Baik' };
  if (score >= 80) return { huruf: 'B', label: 'Baik' };
  if (score >= 70) return { huruf: 'C', label: 'Cukup' };
  return { huruf: 'D', label: 'Perlu Bimbingan' };
}

export function generateCapaianDeskripsi(
  mapel: string,
  score: number | null,
  namaSiswa?: string
): string {
  const cleanNama = (namaSiswa || '').trim();
  const sapaanAnanda = cleanNama && cleanNama !== '-' ? `Ananda ${cleanNama}` : 'Ananda';

  if (score === null || isNaN(score) || score <= 0) {
    return `Nilai asesmen tengah semester ${sapaanAnanda} pada mata pelajaran ${mapel} belum diinput.`;
  }
  if (score >= 90) {
    return `${sapaanAnanda} menunjukkan penguasaan kompetensi yang sangat baik dalam memahami dan menyelesaikan materi ${mapel} pada tengah semester ini.`;
  }
  if (score >= 80) {
    return `${sapaanAnanda} menunjukkan penguasaan kompetensi yang baik pada materi ${mapel}, serta mampu mengikuti pembelajaran dengan aktif.`;
  }
  if (score >= 70) {
    return `${sapaanAnanda} cukup mampu memahami materi dasar ${mapel}, namun masih memerlukan latihan lebih tekun agar hasil belajar semakin meningkat.`;
  }
  return `${sapaanAnanda} memerlukan bimbingan dan pendampingan lebih lanjut dalam menguasai materi dasar ${mapel}.`;
}

export default function RaportStsModal({
  isOpen,
  onClose,
  role,
  currentUser,
  initialKelas = '',
  initialSemester = '1',
  initialMapel = '',
  initialStudentNisn = null,
  kelasList = [],
  localNilaiOverride,
  localCatatanSiswa,
  defaultCatatan: propDefaultCatatan,
  onUpdateCatatanSiswa,
  jumlahUlangan: propJumlahUlangan = 3,
  isWaliKelas: propIsWaliKelas = false,
  waliKelasKelas = '',
}: RaportStsModalProps) {
  const schoolIdentity = useSchoolIdentity();

  const [selectedKelas, setSelectedKelas] = useState(
    initialKelas || waliKelasKelas || currentUser?.waliKelas || currentUser?.wali_kelas || currentUser?.Kelas || ''
  );
  const [semester, setSemester] = useState(initialSemester || '1');
  const [printMode, setPrintMode] = useState<'single' | 'all'>(
    role === 'siswa' ? 'single' : initialStudentNisn ? 'single' : 'all'
  );
  const [selectedNisn, setSelectedNisn] = useState<string>(initialStudentNisn || currentUser?.NISN || '');
  const [subjectScope, setSubjectScope] = useState<'all' | 'active'>('all');
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  const [students, setStudents] = useState<any[]>([]);
  const [allNilaiGlobal, setAllNilaiGlobal] = useState<Record<string, any>>({});
  const [attendanceByStudent, setAttendanceByStudent] = useState<Record<string, { s: number; i: number; a: number }>>({});
  const [jumlahUlangan, setJumlahUlangan] = useState(propJumlahUlangan);
  const [academicYear, setAcademicYear] = useState('2024/2025');
  const [loading, setLoading] = useState(false);

  // Teacher / Report customization fields
  const [tanggalRaport, setTanggalRaport] = useState(() => {
    return new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  });
  const [tempatRaport, setTempatRaport] = useState('Beji');
  const [waliKelasMap, setWaliKelasMap] = useState<Record<string, { nip: string; nama: string }>>(
    schoolIdentity.waliKelasMapping || {}
  );
  const [waliKelasName, setWaliKelasName] = useState(
    role === 'guru' ? currentUser?.['Nama Guru'] || currentUser?.nama_guru || currentUser?.Nama || '' : ''
  );
  const [waliKelasNip, setWaliKelasNip] = useState(
    role === 'guru' ? currentUser?.NIP || currentUser?.nip || '-' : '-'
  );
  const [raportTagline, setRaportTagline] = useState(
    schoolIdentity.nilaiRaportTagline || 'BERMUTU - Beriman, Ramah, Mandiri, Unggul dan Tangguh'
  );
  const [catatanWaliKelas, setCatatanWaliKelas] = useState(
    propDefaultCatatan || schoolIdentity.nilaiCatatanDefault || DEFAULT_CATATAN_STANDAR
  );
  const [catatanSiswaMap, setCatatanSiswaMap] = useState<Record<string, StudentCatatanEntry>>(
    localCatatanSiswa || {}
  );
  const [savingCatatan, setSavingCatatan] = useState(false);
  const [catatanSavedMsg, setCatatanSavedMsg] = useState('');

  const effectiveIsWaliKelas = useMemo(() => {
    if (propIsWaliKelas) return true;
    if (role !== 'guru') return false;
    const uWali = normalizeKelasKey(currentUser?.waliKelas || currentUser?.wali_kelas || waliKelasKelas || '');
    const normSelected = normalizeKelasKey(selectedKelas);
    if (uWali && (!normSelected || uWali === normSelected)) return true;
    const mapped = waliKelasMap[normSelected];
    if (mapped) {
      const uNip = String(currentUser?.NIP || currentUser?.nip || '').trim();
      const uNama = String(currentUser?.['Nama Guru'] || currentUser?.nama_guru || currentUser?.Nama || '')
        .trim()
        .toLowerCase();
      if (uNip && mapped.nip && String(mapped.nip).trim() === uNip) return true;
      if (uNama && mapped.nama && String(mapped.nama).trim().toLowerCase() === uNama) return true;
    }
    return false;
  }, [propIsWaliKelas, role, currentUser, waliKelasKelas, selectedKelas, waliKelasMap]);

  // Sync props when modal opens
  useEffect(() => {
    if (isOpen) {
      if (role === 'siswa') {
        setSelectedKelas(currentUser?.Kelas || '');
        setSelectedNisn(currentUser?.NISN || '');
        setPrintMode('single');
        setSubjectScope('all');
      } else {
        const targetKls =
          initialKelas || waliKelasKelas || currentUser?.waliKelas || currentUser?.wali_kelas || '';
        if (targetKls) setSelectedKelas(targetKls);
        if (initialStudentNisn) {
          setSelectedNisn(initialStudentNisn);
          setPrintMode('single');
        } else {
          setPrintMode('all');
        }
        // Wali kelas always defaults to printing all subjects
        setSubjectScope('all');
      }
      if (initialSemester) setSemester(initialSemester);
      if (propJumlahUlangan) setJumlahUlangan(propJumlahUlangan);
    }
  }, [isOpen, initialKelas, waliKelasKelas, initialSemester, initialStudentNisn, role, currentUser, propJumlahUlangan]);

  // Auto-resolve Wali Kelas name & NIP whenever selectedKelas, students, or waliKelasMap changes
  useEffect(() => {
    const rawKls =
      role === 'siswa'
        ? students[0]?.Kelas || currentUser?.Kelas || selectedKelas || ''
        : selectedKelas;
    const normClass = normalizeKelasKey(rawKls);
    const mapped = normClass ? waliKelasMap[normClass] : undefined;
    if (mapped && mapped.nama) {
      setWaliKelasName(mapped.nama);
      setWaliKelasNip(mapped.nip || '-');
    } else if (role === 'guru' && currentUser) {
      setWaliKelasName(currentUser?.['Nama Guru'] || currentUser?.nama_guru || currentUser?.Nama || '');
      setWaliKelasNip(currentUser?.NIP || currentUser?.nip || '-');
    }
  }, [selectedKelas, students, waliKelasMap, role, currentUser]);

  // Load settings, students, grades, and attendance when modal opens or class changes
  useEffect(() => {
    if (!isOpen) return;

    const loadAllData = async () => {
      setLoading(true);
      try {
        // 1. Fetch global settings & all_student_nilai
        const resPengaturan = await fetch('/api/pengaturan');
        const resultPengaturan = await resPengaturan.json();
        let parsedNilai: Record<string, any> = {};
        let resolvedWaliMap: Record<string, { nip: string; nama: string }> = {};

        if (resultPengaturan.success && resultPengaturan.data) {
          const d = resultPengaturan.data;
          if (d.jumlahUlangan) setJumlahUlangan(parseInt(d.jumlahUlangan));
          const resolvedYear =
            d.nilaiTahunAktif ||
            d.tahunAjaran ||
            d.tahunPelajaranAktif ||
            d.bisma_academicYear ||
            d.academicYear ||
            d.tahun_ajaran;
          if (resolvedYear) {
            setAcademicYear(resolvedYear);
          }
          if (d.nilaiTempatRaport) {
            setTempatRaport(d.nilaiTempatRaport);
          }
          if (d.nilaiTanggalRaport) {
            setTanggalRaport(d.nilaiTanggalRaport);
          }
          const resolvedTagline =
            d.nilaiRaportTagline ||
            d.raportTagline ||
            (d.sloganText ? String(d.sloganText).replace(/✨/g, '').trim() : '');
          if (resolvedTagline) {
            setRaportTagline(resolvedTagline);
          }
          if (d.nilaiCatatanDefault) {
            setCatatanWaliKelas(d.nilaiCatatanDefault);
          }
          if (d.wali_kelas_mapping) {
            try {
              const parsedWali =
                typeof d.wali_kelas_mapping === 'string'
                  ? JSON.parse(d.wali_kelas_mapping)
                  : d.wali_kelas_mapping;
              if (parsedWali && typeof parsedWali === 'object') {
                resolvedWaliMap = { ...parsedWali };
              }
            } catch (e) {}
          }
          if (d.all_student_nilai) {
            try {
              parsedNilai = JSON.parse(d.all_student_nilai);
            } catch (e) {}
          }

          let loadedCatatanMap: Record<string, StudentCatatanEntry> = {};
          if (d.catatan_raport_siswa) {
            try {
              const parsedCat =
                typeof d.catatan_raport_siswa === 'string'
                  ? JSON.parse(d.catatan_raport_siswa)
                  : d.catatan_raport_siswa;
              if (parsedCat && typeof parsedCat === 'object') {
                loadedCatatanMap = { ...parsedCat };
              }
            } catch (e) {}
          }
          // Also check _catatan inside parsedNilai for each student
          Object.keys(parsedNilai).forEach((nisnKey) => {
            if (parsedNilai[nisnKey]?._catatan && !loadedCatatanMap[nisnKey]) {
              loadedCatatanMap[nisnKey] = parsedNilai[nisnKey]._catatan;
            }
          });
          if (localCatatanSiswa && Object.keys(localCatatanSiswa).length > 0) {
            loadedCatatanMap = { ...loadedCatatanMap, ...localCatatanSiswa };
          }
          setCatatanSiswaMap(loadedCatatanMap);
        }

        // Ensure Wali Kelas mapping is complete from /api/guru and /api/jadwal in DB if any class is missing
        try {
          const [resGuru, resJadwal] = await Promise.all([
            fetch('/api/guru'),
            fetch('/api/jadwal'),
          ]);
          const [jsonGuru, jsonJadwal] = await Promise.all([
            resGuru.json(),
            resJadwal.json(),
          ]);
          const guruRows: any[] = jsonGuru?.data || [];
          const jadwalRows: any[] = jsonJadwal?.data || [];

          if (guruRows.length > 0) {
            const guruByName = new Map<string, { nip: string; nama: string }>();
            guruRows.forEach((g: any) => {
              const cleanName = String(g.nama_guru || g['Nama Guru'] || '').trim();
              const cleanNip = String(g.nip || g.NIP || '').trim();
              if (cleanName) {
                guruByName.set(cleanName.toLowerCase(), { nip: cleanNip, nama: cleanName });
              }
              const gWali = normalizeKelasKey(g.wali_kelas || g.waliKelas || '');
              if (gWali && cleanName && !resolvedWaliMap[gWali]?.nama) {
                resolvedWaliMap[gWali] = { nip: cleanNip || '-', nama: cleanName };
              }
            });

            for (let c = 1; c <= 6; c++) {
              const klsKey = `Kelas ${c}`;
              const existing = resolvedWaliMap[klsKey];
              if (existing && existing.nama && (!existing.nip || existing.nip === '-')) {
                const foundG = guruByName.get(existing.nama.trim().toLowerCase());
                if (foundG?.nip) {
                  resolvedWaliMap[klsKey] = { nip: foundG.nip, nama: foundG.nama };
                }
              }
              if (resolvedWaliMap[klsKey]?.nama && resolvedWaliMap[klsKey]?.nip) continue;

              const classSchedules = jadwalRows.filter((j: any) => {
                const rk = normalizeKelasKey(String(j.kelas || ''));
                return rk === klsKey;
              });
              const teacherScore = new Map<string, number>();
              classSchedules.forEach((j: any) => {
                const tName = String(j.guru || '').trim();
                if (!tName || tName === 'null') return;
                const mLower = String(j.mapel || '').toLowerCase();
                const isCore =
                  mLower.includes('matematika') ||
                  mLower.includes('bahasa indonesia') ||
                  mLower.includes('pancasila') ||
                  mLower.includes('ipas') ||
                  mLower.includes('seni') ||
                  mLower.includes('bahasa jawa');
                teacherScore.set(tName, (teacherScore.get(tName) || 0) + (isCore ? 3 : 1));
              });

              let bestTeacher = '';
              let bestScore = 0;
              for (const [tName, score] of teacherScore.entries()) {
                if (score > bestScore) {
                  bestScore = score;
                  bestTeacher = tName;
                }
              }

              if (bestTeacher) {
                const gInfo = guruByName.get(bestTeacher.toLowerCase());
                resolvedWaliMap[klsKey] = {
                  nip: gInfo?.nip || '-',
                  nama: gInfo?.nama || bestTeacher,
                };
              }
            }
          }
        } catch (e) {}

        setWaliKelasMap(resolvedWaliMap);

        if (propDefaultCatatan) {
          setCatatanWaliKelas(propDefaultCatatan);
        }

        // Merge localNilaiOverride if teacher is currently editing a subject in NilaiGuru
        if (localNilaiOverride && initialMapel && selectedKelas === initialKelas) {
          Object.keys(localNilaiOverride).forEach((nisn) => {
            if (!parsedNilai[nisn]) parsedNilai[nisn] = {};
            parsedNilai[nisn][initialMapel] = {
              ...(parsedNilai[nisn][initialMapel] || {}),
              ...localNilaiOverride[nisn],
            };
          });
        }

        setAllNilaiGlobal(parsedNilai);

        // 2. Fetch students for target class
        let targetClass = role === 'siswa' ? currentUser?.Kelas : selectedKelas;
        if (role === 'siswa' && currentUser) {
          // Try fetching full student info from /api/murid so NIS, Kelas, and Nama Lengkap are complete
          const resMurid = await fetch('/api/murid');
          const resultMurid = await resMurid.json();
          if (resultMurid.success && Array.isArray(resultMurid.data)) {
            const found = resultMurid.data.find(
              (m: any) =>
                String(m.NISN) === String(currentUser.NISN) ||
                (currentUser.NIS && String(m.NIS) === String(currentUser.NIS))
            );
            if (found) {
              setStudents([found]);
              setSelectedNisn(found.NISN);
              if (found.Kelas) {
                targetClass = found.Kelas;
                setSelectedKelas(found.Kelas);
              }
            } else {
              setStudents([
                {
                  NISN: currentUser.NISN || '-',
                  NIS: currentUser.NIS || '-',
                  'Nama Lengkap': currentUser.Nama_Murid || currentUser.name || 'Siswa',
                  Kelas: currentUser.Kelas || '-',
                },
              ]);
            }
          }
        } else if (targetClass) {
          const resMurid = await fetch('/api/murid');
          const resultMurid = await resMurid.json();
          if (resultMurid.success && Array.isArray(resultMurid.data)) {
            const classStudents = resultMurid.data
              .filter((s: any) => s.Kelas === targetClass)
              .sort((a: any, b: any) => (a['Nama Lengkap'] || '').localeCompare(b['Nama Lengkap'] || ''));
            setStudents(classStudents);
            if (classStudents.length > 0 && (!selectedNisn || !classStudents.some((s: any) => s.NISN === selectedNisn))) {
              setSelectedNisn(initialStudentNisn || classStudents[0].NISN);
            }
          }
        }

        // 3. Calculate Attendance (Sakit, Izin, Alpa) from Jurnal for targetClass
        if (targetClass) {
          const { data: jurnalRows } = await supabase
            .from('jurnal')
            .select('timestamp, ketidakhadiran')
            .eq('kelas', targetClass);

          if (jurnalRows && jurnalRows.length > 0) {
            // Group by date + student name so multiple subjects on the same day count as 1 day
            const dailyStatusByStudent: Record<string, Record<string, string>> = {};
            jurnalRows.forEach((row: any) => {
              const dateKey = String(row.timestamp || '').split('T')[0];
              const absents = parseKetidakhadiran(row.ketidakhadiran);
              absents.forEach((ab) => {
                const normName = (ab.nama || '').trim().toLowerCase();
                if (!normName) return;
                if (!dailyStatusByStudent[normName]) dailyStatusByStudent[normName] = {};
                const ket = (ab.keterangan || '').toLowerCase();
                let code = 'A';
                if (ket.includes('sakit')) code = 'S';
                else if (ket.includes('izin') || ket.includes('ijin')) code = 'I';
                else if (ket.includes('dispen')) code = 'D';

                const prev = dailyStatusByStudent[normName][dateKey];
                // Priority: S > I > A
                if (!prev || code === 'S' || (code === 'I' && prev === 'A')) {
                  dailyStatusByStudent[normName][dateKey] = code;
                }
              });
            });

            const computedAtt: Record<string, { s: number; i: number; a: number }> = {};
            Object.entries(dailyStatusByStudent).forEach(([normName, dateMap]) => {
              let s = 0,
                i = 0,
                a = 0;
              Object.values(dateMap).forEach((code) => {
                if (code === 'S') s++;
                else if (code === 'I') i++;
                else if (code === 'A') a++;
              });
              computedAtt[normName] = { s, i, a };
            });
            setAttendanceByStudent(computedAtt);
          } else {
            setAttendanceByStudent({});
          }
        }
      } catch (err) {
        console.error('Error loading raport STS data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [isOpen, selectedKelas, role, currentUser]);

  // Determine which students to render
  const studentsToRender = useMemo(() => {
    if (role === 'siswa') {
      return students;
    }
    if (printMode === 'all') {
      return students;
    }
    return students.filter((s) => String(s.NISN) === String(selectedNisn));
  }, [role, printMode, students, selectedNisn]);

  // Helper to resolve a student's grade for a canonical subject name
  const getStudentSubjectGrade = (nisn: string, canonicalSubject: string) => {
    const studentGrades = allNilaiGlobal[nisn] || {};
    const aliases = SUBJECT_ALIASES[canonicalSubject] || [canonicalSubject];

    for (const alias of aliases) {
      // Case-insensitive match against keys in studentGrades
      const foundKey = Object.keys(studentGrades).find(
        (k) => k.trim().toLowerCase() === alias.trim().toLowerCase()
      );
      if (foundKey && studentGrades[foundKey]) {
        return studentGrades[foundKey];
      }
    }
    return null;
  };

  const activeCurriculum = useMemo(() => {
    const targetKls =
      selectedKelas || students[0]?.Kelas || currentUser?.Kelas || waliKelasKelas || '';
    return getCurriculumSubjectsByKelas(targetKls);
  }, [selectedKelas, students, currentUser, waliKelasKelas]);

  // Build ordered list of subjects to show on the Raport
  const subjectsToDisplay = useMemo(() => {
    if (role !== 'siswa' && subjectScope === 'active' && initialMapel) {
      return [initialMapel];
    }

    // Collect any extra custom academic subjects present in allNilaiGlobal for this class
    const extraSubjects = new Set<string>();
    const allKnownAliases = new Set(
      Object.values(SUBJECT_ALIASES)
        .flat()
        .map((a) => a.toLowerCase())
    );

    students.forEach((s) => {
      const sGrades = allNilaiGlobal[s.NISN] || {};
      Object.keys(sGrades).forEach((mapelKey) => {
        if (mapelKey === '_catatan') return;
        const lowerKey = mapelKey.trim().toLowerCase();
        if (NON_ACADEMIC_SCHEDULE_ITEMS.has(lowerKey)) return;
        if (!allKnownAliases.has(lowerKey)) {
          extraSubjects.add(mapelKey);
        }
      });
    });

    return [...activeCurriculum.all, ...Array.from(extraSubjects)];
  }, [role, subjectScope, initialMapel, students, allNilaiGlobal, activeCurriculum]);

  // Helper to update a single student's catatan entry
  const updateSingleStudentCatatan = (
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

      // When switching from default to manual and manual text is still empty, prefill with the default text so teacher can edit easily
      if (nextMode === 'manual' && !nextText.trim() && patch.text === undefined) {
        const presetHelper = CATATAN_DEFAULT_PRESETS[nextPreset] || CATATAN_DEFAULT_PRESETS.standar;
        nextText = presetHelper.getText(studentName || '', avgScoreNum ?? null, catatanWaliKelas);
      }

      const updatedMap = {
        ...prev,
        [nisn]: {
          mode: nextMode,
          text: nextText,
          defaultPreset: nextPreset,
        },
      };
      if (onUpdateCatatanSiswa) {
        onUpdateCatatanSiswa(updatedMap, catatanWaliKelas);
      }
      return updatedMap;
    });
  };

  // Persist default & manual student notes to /api/pengaturan
  const handleSaveCatatanToServer = async () => {
    setSavingCatatan(true);
    setCatatanSavedMsg('');
    try {
      const resPengaturan = await fetch('/api/pengaturan');
      const resultPengaturan = await resPengaturan.json();
      let existingCatatanMap: Record<string, StudentCatatanEntry> = {};
      let existingAllNilai: Record<string, any> = {};

      if (resultPengaturan.success && resultPengaturan.data) {
        if (resultPengaturan.data.catatan_raport_siswa) {
          try {
            existingCatatanMap = JSON.parse(resultPengaturan.data.catatan_raport_siswa);
          } catch (e) {}
        }
        if (resultPengaturan.data.all_student_nilai) {
          try {
            existingAllNilai = JSON.parse(resultPengaturan.data.all_student_nilai);
          } catch (e) {}
        }
      }

      const mergedCatatanMap = {
        ...existingCatatanMap,
        ...catatanSiswaMap,
      };

      Object.entries(mergedCatatanMap).forEach(([nisnKey, entry]) => {
        if (!existingAllNilai[nisnKey]) existingAllNilai[nisnKey] = {};
        existingAllNilai[nisnKey]._catatan = entry;
      });

      const saveRes = await fetch('/api/pengaturan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nilaiCatatanDefault: catatanWaliKelas,
          catatan_raport_siswa: JSON.stringify(mergedCatatanMap),
          all_student_nilai: JSON.stringify(existingAllNilai),
        }),
      });
      const saveResult = await saveRes.json();
      if (saveResult.success) {
        if (onUpdateCatatanSiswa) {
          onUpdateCatatanSiswa(mergedCatatanMap, catatanWaliKelas);
        }
        setCatatanSavedMsg('Catatan Default & Manual siswa berhasil disimpan!');
        setTimeout(() => setCatatanSavedMsg(''), 3500);
      }
    } catch (e) {
      console.error('Failed saving catatan:', e);
    } finally {
      setSavingCatatan(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  // Render an individual A4 Report Card Sheet for one student
  const renderStudentRaportPage = (student: any, pageIndex: number, totalPages: number) => {
    const nisn = student.NISN || '-';
    const nis = student.NIS || '-';
    const nama = student['Nama Lengkap'] || student.Nama_Murid || '-';
    const kelasSiswa = student.Kelas || selectedKelas || '-';
    const normName = String(nama).trim().toLowerCase();
    const att = attendanceByStudent[normName] || { s: 0, i: 0, a: 0 };

    const harianKey = semester === '1' ? 'harian1' : 'harian2';
    const studentCurriculum = getCurriculumSubjectsByKelas(kelasSiswa);
    const mulokSet = new Set(studentCurriculum.mulok.map((m) => m.toLowerCase()));

    const orderedSubjectsForStudent =
      role !== 'siswa' && subjectScope === 'active' && initialMapel
        ? [initialMapel]
        : [
            ...studentCurriculum.all,
            ...subjectsToDisplay.filter(
              (s) => !studentCurriculum.all.some((c) => c.toLowerCase() === s.toLowerCase())
            ),
          ];

    // Compute rows and summary
    let totalNilaiSts = 0;
    let countGradedSubjects = 0;

    const subjectRows = orderedSubjectsForStudent.map((subjectName, idx) => {
      const rawData = getStudentSubjectGrade(nisn, subjectName) || {};
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

      let nilaiAkhirSts: number | null = null;
      if (rerataHarian !== null && stsVal !== null) {
        nilaiAkhirSts = Math.round(rerataHarian * 0.5 + stsVal * 0.5);
      } else if (stsVal !== null) {
        nilaiAkhirSts = Math.round(stsVal);
      } else if (rerataHarian !== null) {
        nilaiAkhirSts = rerataHarian;
      }

      if (nilaiAkhirSts !== null && nilaiAkhirSts > 0) {
        totalNilaiSts += nilaiAkhirSts;
        countGradedSubjects++;
      }

      const predikat = getPredikat(nilaiAkhirSts);
      const deskripsi = generateCapaianDeskripsi(subjectName, nilaiAkhirSts, nama);
      const isMulok = mulokSet.has(subjectName.toLowerCase());

      return {
        no: idx + 1,
        subjectName,
        isMulok,
        harianArr,
        rerataHarian,
        stsVal,
        nilaiAkhirSts,
        predikat,
        deskripsi,
      };
    });

    const umumRows = subjectRows.filter((r) => !r.isMulok);
    const mulokRows = subjectRows.filter((r) => r.isMulok);

    const rataRataSemua =
      countGradedSubjects > 0 ? (totalNilaiSts / countGradedSubjects).toFixed(1) : '-';

    return (
      <div
        key={`${nisn}-${pageIndex}`}
        className="raport-a4-page bg-white text-black w-full max-w-[210mm] min-h-[297mm] mx-auto p-6 sm:p-10 shadow-xl border border-slate-300 rounded-sm mb-8 last:mb-0 flex flex-col justify-between font-serif"
      >
        <div>
          {/* 1. KOP SURAT RESMI SEKOLAH DASAR — UKURAN LOGO PROPORSIONAL KERTAS A4 */}
          <div className="border-b-4 border-double border-black pb-3 mb-3.5 flex items-center justify-between gap-4">
            <div className="w-20 h-20 sm:w-[88px] sm:h-[88px] print:w-[22mm] print:h-[22mm] shrink-0 flex items-center justify-center">
              {(schoolIdentity.nilaiLogoMode || 'both') !== 'sekolah' ? (
                <img
                  src={
                    schoolIdentity.nilaiLogoKabupaten ||
                    schoolIdentity.logoKabupaten ||
                    '/assets/logo-kab-pasuruan.png'
                  }
                  alt="Logo Kabupaten"
                  className="raport-kop-logo w-[76px] h-[76px] sm:w-[82px] sm:h-[82px] print:w-[21mm] print:h-[21mm] object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://upload.wikimedia.org/wikipedia/commons/9/9a/Lambang_Kabupaten_Pasuruan.png';
                  }}
                />
              ) : (
                <img
                  src={schoolIdentity.nilaiLogoSekolah || schoolIdentity.schoolLogo}
                  alt="Logo Sekolah"
                  className="raport-kop-logo w-[76px] h-[76px] sm:w-[82px] sm:h-[82px] print:w-[21mm] print:h-[21mm] object-contain"
                />
              )}
            </div>

            <div className="flex-1 text-center px-1 leading-tight">
              <p className="text-xs sm:text-[13px] print:text-[10.5pt] font-bold uppercase tracking-wider text-black">
                {schoolIdentity.kopHeaderLine1 || 'PEMERINTAH KABUPATEN PASURUAN'}
              </p>
              <p className="text-[13px] sm:text-sm print:text-[11.5pt] font-extrabold uppercase tracking-wider text-black mt-0.5">
                {(schoolIdentity.kopHeaderLine2 || 'DINAS PENDIDIKAN')
                  .replace(/\s*DAN\s+KEBUDAYAAN/gi, '')
                  .trim()}
              </p>
              <h1 className="text-lg sm:text-xl print:text-[15pt] font-black uppercase tracking-wide text-black mt-0.5 leading-tight">
                {schoolIdentity.schoolName || 'SDN BAUJENG I BEJI'}
              </h1>
              <p className="text-[10.5px] sm:text-[11px] print:text-[8.5pt] font-normal text-black mt-0.5 leading-snug">
                {schoolIdentity.schoolAddress ||
                  'Jl. Balai Desa Baujeng No. 01 Desa Baujeng, Kecamatan Beji, Kabupaten Pasuruan'}
              </p>
            </div>

            <div className="w-20 h-20 sm:w-[88px] sm:h-[88px] print:w-[22mm] print:h-[22mm] shrink-0 flex items-center justify-center">
              {(schoolIdentity.nilaiLogoMode || 'both') === 'kabupaten' ? (
                <div className="raport-kop-logo w-[76px] h-[76px] sm:w-[82px] sm:h-[82px] print:w-[21mm] print:h-[21mm]" />
              ) : (schoolIdentity.nilaiLogoSekolah || schoolIdentity.schoolLogo) ? (
                <img
                  src={schoolIdentity.nilaiLogoSekolah || schoolIdentity.schoolLogo}
                  alt="Logo Sekolah"
                  className="raport-kop-logo w-[76px] h-[76px] sm:w-[82px] sm:h-[82px] print:w-[21mm] print:h-[21mm] object-contain"
                />
              ) : (
                <div className="raport-kop-logo w-[76px] h-[76px] sm:w-[82px] sm:h-[82px] print:w-[21mm] print:h-[21mm] border border-black flex items-center justify-center text-[8px] font-bold text-center">
                  LOGO SEKOLAH
                </div>
              )}
            </div>
          </div>

          {/* 2. JUDUL RAPORT STS */}
          <div className="text-center mb-3.5">
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wide underline decoration-2">
              LAPORAN HASIL ASESMEN SUMATIF TENGAH SEMESTER (STS)
            </h2>
            <p className="text-[11px] font-bold uppercase mt-0.5">
              SEMESTER {semester === '1' ? 'I (GANJIL)' : 'II (GENAP)'} • TAHUN PELAJARAN {academicYear}
            </p>
          </div>

          {/* 3. IDENTITAS PESERTA DIDIK (2 KOLOM KHAS RAPORT SD) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[11px] mb-3.5 border border-black p-2.5 bg-slate-50/40 print:bg-transparent">
            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="py-0.5 font-semibold w-32 align-top">Nama Peserta Didik</td>
                  <td className="py-0.5 w-3 align-top">:</td>
                  <td className="py-0.5 font-bold uppercase align-top">{nama}</td>
                </tr>
                <tr>
                  <td className="py-0.5 font-semibold align-top">NIS / NISN</td>
                  <td className="py-0.5 align-top">:</td>
                  <td className="py-0.5 font-medium align-top">
                    {nis !== '-' ? `${nis} / ${nisn}` : nisn}
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 font-semibold align-top">Nama Sekolah</td>
                  <td className="py-0.5 align-top">:</td>
                  <td className="py-0.5 font-medium align-top">
                    {schoolIdentity.schoolName || 'SDN BAUJENG I BEJI'}
                  </td>
                </tr>
              </tbody>
            </table>

            <table className="w-full border-collapse">
              <tbody>
                <tr>
                  <td className="py-0.5 font-semibold w-32 align-top">Kelas / Fase</td>
                  <td className="py-0.5 w-3 align-top">:</td>
                  <td className="py-0.5 font-bold align-top">
                    {formatKelasSD(kelasSiswa)} / {studentCurriculum.fase}
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 font-semibold align-top">Semester</td>
                  <td className="py-0.5 align-top">:</td>
                  <td className="py-0.5 font-medium align-top">
                    {semester === '1' ? 'I (Satu) / Ganjil' : 'II (Dua) / Genap'}
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 font-semibold align-top">Tahun Pelajaran</td>
                  <td className="py-0.5 align-top">:</td>
                  <td className="py-0.5 font-medium align-top">{academicYear}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. BAGIAN A: TABEL CAPAIAN NILAI ASESMEN SUMATIF TENGAH SEMESTER */}
          <div className="mb-3">
            <h3 className="text-[11px] font-bold uppercase mb-1">
              A. Capaian Nilai Akademik Tengah Semester
            </h3>
            <table className="w-full border-collapse border border-black text-[10.5px]">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-100 font-bold text-center">
                  <th rowSpan={2} className="border border-black px-1.5 py-1.5 w-7">
                    No
                  </th>
                  <th rowSpan={2} className="border border-black px-2 py-1.5 text-left min-w-[135px]">
                    Mata Pelajaran
                  </th>
                  <th colSpan={jumlahUlangan + 1} className="border border-black px-1 py-1">
                    Nilai Sumatif Harian (Formatif / LM)
                  </th>
                  <th rowSpan={2} className="border border-black px-1.5 py-1.5 w-11">
                    Nilai STS
                  </th>
                  <th rowSpan={2} className="border border-black px-1.5 py-1.5 w-12">
                    Nilai Akhir
                  </th>
                  <th rowSpan={2} className="border border-black px-1 py-1.5 w-10">
                    Pred.
                  </th>
                  <th rowSpan={2} className="border border-black px-2 py-1.5 text-left">
                    Capaian Kompetensi / Keterangan
                  </th>
                </tr>
                <tr className="bg-slate-100 print:bg-slate-100 font-bold text-center text-[9.5px]">
                  {Array.from({ length: jumlahUlangan }).map((_, i) => (
                    <th key={`th-lm-${i}`} className="border border-black px-1 py-1 w-8">
                      PH {i + 1}
                    </th>
                  ))}
                  <th className="border border-black px-1 py-1 w-10 bg-slate-200/60 print:bg-slate-100">
                    Rerata
                  </th>
                </tr>
              </thead>
              <tbody>
                {subjectScope === 'all' && umumRows.length > 0 && (
                  <tr className="bg-slate-50 print:bg-slate-50">
                    <td
                      colSpan={7 + jumlahUlangan}
                      className="border border-black px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-left"
                    >
                      Kelompok Mata Pelajaran Umum ({studentCurriculum.fase})
                    </td>
                  </tr>
                )}
                {(subjectScope === 'all' ? umumRows : subjectRows).map((row) => (
                  <tr key={row.no} className="break-inside-avoid">
                    <td className="border border-black px-1 py-1 text-center align-middle">
                      {row.no}
                    </td>
                    <td className="border border-black px-2 py-1 font-semibold align-middle">
                      {row.subjectName}
                    </td>
                    {Array.from({ length: jumlahUlangan }).map((_, i) => {
                      const val = row.harianArr[i];
                      return (
                        <td
                          key={`td-lm-${i}`}
                          className="border border-black px-1 py-1 text-center align-middle"
                        >
                          {val !== undefined && val !== '' && val !== null ? val : '-'}
                        </td>
                      );
                    })}
                    <td className="border border-black px-1 py-1 text-center font-semibold align-middle bg-slate-50/50 print:bg-transparent">
                      {row.rerataHarian !== null ? row.rerataHarian : '-'}
                    </td>
                    <td className="border border-black px-1 py-1 text-center font-bold align-middle">
                      {row.stsVal !== null ? row.stsVal : '-'}
                    </td>
                    <td className="border border-black px-1 py-1 text-center font-extrabold align-middle bg-slate-50 print:bg-transparent">
                      {row.nilaiAkhirSts !== null ? row.nilaiAkhirSts : '-'}
                    </td>
                    <td className="border border-black px-1 py-1 text-center font-bold align-middle">
                      {row.predikat.huruf}
                    </td>
                    <td className="border border-black px-2 py-1 text-[9.5px] leading-snug align-middle">
                      {row.deskripsi}
                    </td>
                  </tr>
                ))}

                {subjectScope === 'all' && mulokRows.length > 0 && (
                  <>
                    <tr className="bg-slate-50 print:bg-slate-50">
                      <td
                        colSpan={7 + jumlahUlangan}
                        className="border border-black px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-left"
                      >
                        Muatan Lokal (Mulok)
                      </td>
                    </tr>
                    {mulokRows.map((row) => (
                      <tr key={row.no} className="break-inside-avoid">
                        <td className="border border-black px-1 py-1 text-center align-middle">
                          {row.no}
                        </td>
                        <td className="border border-black px-2 py-1 font-semibold align-middle">
                          {row.subjectName}
                        </td>
                        {Array.from({ length: jumlahUlangan }).map((_, i) => {
                          const val = row.harianArr[i];
                          return (
                            <td
                              key={`td-lm-${i}`}
                              className="border border-black px-1 py-1 text-center align-middle"
                            >
                              {val !== undefined && val !== '' && val !== null ? val : '-'}
                            </td>
                          );
                        })}
                        <td className="border border-black px-1 py-1 text-center font-semibold align-middle bg-slate-50/50 print:bg-transparent">
                          {row.rerataHarian !== null ? row.rerataHarian : '-'}
                        </td>
                        <td className="border border-black px-1 py-1 text-center font-bold align-middle">
                          {row.stsVal !== null ? row.stsVal : '-'}
                        </td>
                        <td className="border border-black px-1 py-1 text-center font-extrabold align-middle bg-slate-50 print:bg-transparent">
                          {row.nilaiAkhirSts !== null ? row.nilaiAkhirSts : '-'}
                        </td>
                        <td className="border border-black px-1 py-1 text-center font-bold align-middle">
                          {row.predikat.huruf}
                        </td>
                        <td className="border border-black px-2 py-1 text-[9.5px] leading-snug align-middle">
                          {row.deskripsi}
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 print:bg-slate-100 font-bold text-[10.5px]">
                  <td
                    colSpan={2 + jumlahUlangan + 2}
                    className="border border-black px-2 py-1.5 text-right uppercase"
                  >
                    Jumlah Nilai Akhir STS
                  </td>
                  <td className="border border-black px-1 py-1.5 text-center font-black">
                    {countGradedSubjects > 0 ? totalNilaiSts : '-'}
                  </td>
                  <td colSpan={2} className="border border-black px-2 py-1.5 text-left">
                    Rata-rata Capaian: <strong>{rataRataSemua}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
            <p className="text-[9px] text-slate-700 mt-1 italic">
              * Keterangan Predikat: A = 90–100 (Sangat Baik) | B = 80–89 (Baik) | C = 70–79 (Cukup) | D = &lt;70 (Perlu Bimbingan)
            </p>
          </div>

          {/* 5. BAGIAN B & C: KETIDAKHADIRAN DAN CATATAN WALI KELAS (BERDAMPINGAN AGAR PAS 1 HALAMAN A4) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4 break-inside-avoid">
            {/* Tabel Ketidakhadiran */}
            <div className="sm:col-span-5">
              <h3 className="text-[11px] font-bold uppercase mb-1">B. Ketidakhadiran</h3>
              <table className="w-full border-collapse border border-black text-[10.5px]">
                <tbody>
                  <tr>
                    <td className="border border-black px-2.5 py-1 font-medium">1. Sakit</td>
                    <td className="border border-black px-2 py-1 text-center w-20 font-semibold">
                      {att.s} hari
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2.5 py-1 font-medium">2. Izin</td>
                    <td className="border border-black px-2 py-1 text-center font-semibold">
                      {att.i} hari
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2.5 py-1 font-medium">3. Tanpa Keterangan</td>
                    <td className="border border-black px-2 py-1 text-center font-semibold">
                      {att.a} hari
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Catatan (Default & Manual untuk Masing-Masing Siswa) */}
            {(() => {
              const avgScoreNumeric = countGradedSubjects > 0 ? totalNilaiSts / countGradedSubjects : null;
              const studentEntry: StudentCatatanEntry = catatanSiswaMap[nisn] || {
                mode: 'default',
                text: '',
                defaultPreset: 'standar',
              };
              const presetKey = studentEntry.defaultPreset || 'standar';
              const presetConfig =
                CATATAN_DEFAULT_PRESETS[presetKey] || CATATAN_DEFAULT_PRESETS.standar;
              const resolvedDefaultText = presetConfig.getText(
                nama,
                avgScoreNumeric,
                catatanWaliKelas
              );
              const finalCatatanText =
                studentEntry.mode === 'manual' && studentEntry.text.trim() !== ''
                  ? studentEntry.text
                  : resolvedDefaultText;

              return (
                <div className="sm:col-span-7 flex flex-col">
                  <h3 className="text-[11px] font-bold uppercase mb-1">
                    C. Catatan
                  </h3>

                  {/* Official Printed Box on A4 */}
                  <div className="border border-black p-2.5 text-[10.5px] leading-relaxed italic flex-1 flex items-center bg-slate-50/30 print:bg-transparent">
                    "{finalCatatanText}"
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* 6. BLOK TANDA TANGAN PENGESAHAN (STANDAR RAPORT SD) */}
        <div className="pt-1 text-[11px] break-inside-avoid">
          <div className="grid grid-cols-2 gap-6 text-center">
            <div>
              <p className="font-medium">Mengetahui,</p>
              <p className="font-bold">Orang Tua / Wali Peserta Didik</p>
              <div className="h-14" />
              <p className="font-bold underline decoration-dotted">
                ( ................................................. )
              </p>
            </div>

            {(() => {
              const normStudentKls = normalizeKelasKey(kelasSiswa);
              const mappedForStudent = normStudentKls ? waliKelasMap[normStudentKls] : undefined;
              const resolvedWaliNama =
                (role !== 'siswa' && waliKelasName ? waliKelasName : '') ||
                mappedForStudent?.nama ||
                waliKelasName ||
                '';
              const resolvedWaliNip =
                (role !== 'siswa' && waliKelasNip && waliKelasNip !== '-' ? waliKelasNip : '') ||
                mappedForStudent?.nip ||
                waliKelasNip ||
                '-';
              const cleanKelasLabel = String(kelasSiswa || '').replace(/^kelas\s*/i, '').trim() || '-';

              return (
                <div>
                  <p className="font-medium">
                    {tempatRaport}, {tanggalRaport}
                  </p>
                  <p className="font-bold">Wali Kelas {cleanKelasLabel}</p>
                  <div className="h-14" />
                  <p className="font-bold underline">
                    {resolvedWaliNama || '.................................................'}
                  </p>
                  <p className="text-[10px]">NIP. {resolvedWaliNip || '-'}</p>
                </div>
              );
            })()}
          </div>

          <div className="mt-3 text-center">
            <p className="font-medium">Mengetahui,</p>
            <p className="font-bold">
              {(
                schoolIdentity.jabatanKepalaSekolah ||
                `Kepala ${schoolIdentity.schoolName || 'SDN BAUJENG I BEJI'}`
              ).replace(/Kepala\s+UPT\s+Satuan\s+Pendidikan/gi, 'Kepala')}
            </p>
            <div className="h-14" />
            <p className="font-bold underline">
              {schoolIdentity.headmasterName || 'AKHMAD NASOR, S.Pd'}
            </p>
            <p className="text-[10px]">
              NIP. {schoolIdentity.headmasterNIP || '198704082019031001'}
            </p>
          </div>

          {/* 7. FOOTER CETAK RAPORT A4: Sebelah Kiri = Nama Siswa | Kelas/NIS | [tagline] */}
          <div className="mt-4 pt-1.5 border-t border-black/80 flex items-center justify-between gap-4 text-[9.5px] font-sans text-black">
            <div className="font-semibold tracking-tight text-left">
              {nama} | {kelasSiswa}/{nis !== '-' && nis ? nis : nisn} |{' '}
              {raportTagline ||
                schoolIdentity.nilaiRaportTagline ||
                'BERMUTU - Beriman, Ramah, Mandiri, Unggul dan Tangguh'}
            </div>
            <div className="text-right text-[9px] text-slate-700 print:text-black shrink-0 font-medium">
              Raport STS Sem. {semester === '1' ? 'I' : 'II'} ({academicYear}) • Hal. {pageIndex + 1}
              {totalPages > 1 ? ` dari ${totalPages}` : ''}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* dedicated print CSS to ensure clean A4 pagination without modal clipping */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          body > *:not(#raport-sts-print-portal) {
            display: none !important;
          }
          #raport-sts-print-portal {
            display: block !important;
            position: static !important;
            width: 100% !important;
            overflow: visible !important;
            background: white !important;
          }
          .raport-a4-page {
            page-break-after: always !important;
            break-after: page !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 auto !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
          }
          .raport-a4-page:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          .raport-kop-logo {
            width: 21mm !important;
            height: 21mm !important;
            max-width: 21mm !important;
            max-height: 21mm !important;
            object-fit: contain !important;
          }
        }
      `}</style>

      {/* Screen Modal UI */}
      <div className="fixed inset-0 z-[130] bg-slate-950/75 backdrop-blur-sm flex flex-col print:hidden animate-in fade-in duration-200">
        {/* Top Control Bar */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white leading-tight">
                    Raport Asesmen Sumatif Tengah Semester (STS) — Format A4
                  </h2>
                  {effectiveIsWaliKelas && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                      ★ Wali Kelas {String(selectedKelas || waliKelasKelas || '').replace(/^kelas\s*/i, '').trim()} (Seluruh Mapel)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {role === 'siswa'
                    ? `Pratinjau & Cetak Raport Resmi SD • ${currentUser?.Nama_Murid || 'Siswa'}`
                    : effectiveIsWaliKelas
                      ? `Mode Print Out Wali Kelas: Mencetak seluruh mata pelajaran (${subjectsToDisplay.length} Mapel) • Footer Kiri: Nama Siswa | Kelas/NIS | Tagline`
                      : `Mode Cetak Guru: Pilih cetak per siswa atau keseluruhan satu kelas (${studentsToRender.length} halaman A4)`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {role !== 'siswa' && (
                <button
                  onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    showSettingsPanel
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-700 dark:text-indigo-300'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Atur Tanda Tangan & Catatan</span>
                </button>
              )}

              <button
                onClick={handlePrint}
                disabled={loading || studentsToRender.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-400 disabled:to-slate-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>
                  {role !== 'siswa' && printMode === 'all'
                    ? `Cetak Keseluruhan (${studentsToRender.length} Siswa) - A4`
                    : 'Cetak Raport STS (A4)'}
                </span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Tutup Pratinjau"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter & Mode Selector Bar */}
          <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Semester Selector */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Semester:</span>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="text-xs font-bold bg-transparent text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="1" className="dark:bg-slate-800">Semester I (Ganjil)</option>
                  <option value="2" className="dark:bg-slate-800">Semester II (Genap)</option>
                </select>
              </div>

              {/* Teacher-only Filters: Kelas, Mode Cetak (Per Siswa vs Keseluruhan), Pilih Siswa, Cakupan Mapel */}
              {role !== 'siswa' && (
                <>
                  {/* Pilih Kelas */}
                  {kelasList.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Kelas:</span>
                      <select
                        value={selectedKelas}
                        onChange={(e) => setSelectedKelas(e.target.value)}
                        className="text-xs font-bold bg-transparent text-slate-900 dark:text-white outline-none cursor-pointer"
                      >
                        <option value="" className="dark:bg-slate-800">-- Pilih Kelas --</option>
                        {kelasList.map((k) => (
                          <option key={k} value={k} className="dark:bg-slate-800">
                            {k.toLowerCase().startsWith('kelas') ? k : `Kelas ${k}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Toggle Pilihan Cetak: Per Siswa vs Keseluruhan */}
                  <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setPrintMode('single')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        printMode === 'single'
                          ? 'bg-fuchsia-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Cetak Per Siswa</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintMode('all')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        printMode === 'all'
                          ? 'bg-fuchsia-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Cetak Keseluruhan ({students.length} Siswa)</span>
                    </button>
                  </div>

                  {/* Dropdown Pilih Siswa jika mode === 'single' */}
                  {printMode === 'single' && students.length > 0 && (
                    <div className="flex items-center gap-1">
                      <select
                        value={selectedNisn}
                        onChange={(e) => setSelectedNisn(e.target.value)}
                        className="text-xs font-bold bg-fuchsia-50 dark:bg-slate-800 border border-fuchsia-300 dark:border-fuchsia-800 text-fuchsia-900 dark:text-fuchsia-200 rounded-xl px-3 py-1.5 outline-none"
                      >
                        {students.map((s, idx) => (
                          <option key={s.NISN} value={s.NISN} className="dark:bg-slate-800">
                            {idx + 1}. {s['Nama Lengkap']} ({s.NISN})
                          </option>
                        ))}
                      </select>

                      {/* Prev / Next student quick buttons */}
                      <button
                        type="button"
                        onClick={() => {
                          const curIdx = students.findIndex((s) => String(s.NISN) === String(selectedNisn));
                          if (curIdx > 0) setSelectedNisn(students[curIdx - 1].NISN);
                        }}
                        disabled={students.findIndex((s) => String(s.NISN) === String(selectedNisn)) <= 0}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-40 text-slate-700 dark:text-slate-300"
                        title="Siswa Sebelumnya"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const curIdx = students.findIndex((s) => String(s.NISN) === String(selectedNisn));
                          if (curIdx >= 0 && curIdx < students.length - 1) {
                            setSelectedNisn(students[curIdx + 1].NISN);
                          }
                        }}
                        disabled={
                          students.findIndex((s) => String(s.NISN) === String(selectedNisn)) >=
                          students.length - 1
                        }
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-40 text-slate-700 dark:text-slate-300"
                        title="Siswa Berikutnya"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Opsi Cakupan Mata Pelajaran */}
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <BookOpen className="w-3.5 h-3.5 text-fuchsia-600 dark:text-fuchsia-400" />
                    <select
                      value={subjectScope}
                      onChange={(e) => setSubjectScope(e.target.value as 'all' | 'active')}
                      className="text-xs font-bold bg-transparent text-slate-900 dark:text-white outline-none cursor-pointer"
                    >
                      <option value="all" className="dark:bg-slate-800">
                        Seluruh Mata Pelajaran SD ({activeCurriculum.all.length} Mapel {activeCurriculum.fase} - Mode Wali Kelas)
                      </option>
                      {initialMapel && (
                        <option value="active" className="dark:bg-slate-800">
                          Hanya Mapel {initialMapel}
                        </option>
                      )}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Ukuran Kertas: A4 Portrait (210 × 297 mm)</span>
            </div>
          </div>

          {/* Collapsible Teacher Customization Panel */}
          {role !== 'siswa' && showSettingsPanel && (
            <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl space-y-3 max-h-[52vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Nama Wali Kelas / Guru Kelas
                  </label>
                  <input
                    type="text"
                    value={waliKelasName}
                    onChange={(e) => setWaliKelasName(e.target.value)}
                    placeholder="Nama Wali Kelas..."
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    NIP Wali Kelas
                  </label>
                  <input
                    type="text"
                    value={waliKelasNip}
                    onChange={(e) => setWaliKelasNip(e.target.value)}
                    placeholder="NIP Wali Kelas..."
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Tempat & Tanggal Cetak Raport
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={tempatRaport}
                      onChange={(e) => setTempatRaport(e.target.value)}
                      className="w-24 text-xs px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                    />
                    <input
                      type="text"
                      value={tanggalRaport}
                      onChange={(e) => setTanggalRaport(e.target.value)}
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Tagline Footer Kiri ([tagline])
                  </label>
                  <input
                    type="text"
                    value={raportTagline}
                    onChange={(e) => setRaportTagline(e.target.value)}
                    placeholder="Tagline footer raport..."
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Teks Catatan Default Umum
                    </label>
                    <button
                      type="button"
                      onClick={() => setCatatanWaliKelas(DEFAULT_CATATAN_STANDAR)}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Reset
                    </button>
                  </div>
                  <input
                    type="text"
                    value={catatanWaliKelas}
                    onChange={(e) => setCatatanWaliKelas(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Panel Pengaturan Catatan Default & Manual untuk Masing-Masing Siswa */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-fuchsia-600" />
                      <span>Pengaturan Catatan Siswa: Mode Default & Manual untuk Masing-Masing Siswa</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Pilih <strong>Default</strong> (menggunakan template standar / otomatis capaian) atau <strong>Manual</strong> (ketik catatan khusus) untuk setiap siswa.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {catatanSavedMsg && (
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        ✓ {catatanSavedMsg}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const nextMap: Record<string, StudentCatatanEntry> = { ...catatanSiswaMap };
                        students.forEach((s) => {
                          nextMap[s.NISN] = {
                            mode: 'default',
                            text: nextMap[s.NISN]?.text || '',
                            defaultPreset: 'standar',
                          };
                        });
                        setCatatanSiswaMap(nextMap);
                        if (onUpdateCatatanSiswa) onUpdateCatatanSiswa(nextMap, catatanWaliKelas);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold cursor-pointer"
                    >
                      Set Semua: Default Standar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextMap: Record<string, StudentCatatanEntry> = { ...catatanSiswaMap };
                        students.forEach((s) => {
                          nextMap[s.NISN] = {
                            mode: 'default',
                            text: nextMap[s.NISN]?.text || '',
                            defaultPreset: 'auto_nilai',
                          };
                        });
                        setCatatanSiswaMap(nextMap);
                        if (onUpdateCatatanSiswa) onUpdateCatatanSiswa(nextMap, catatanWaliKelas);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Set Semua: Default Otomatis Nilai</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCatatanToServer}
                      disabled={savingCatatan}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingCatatan ? 'Menyimpan...' : 'Simpan Catatan Siswa'}</span>
                    </button>
                  </div>
                </div>

                {students.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                    {students.map((st, sIdx) => {
                      const stNisn = st.NISN;
                      const stNama = st['Nama Lengkap'] || st.Nama_Murid || 'Siswa';
                      const entry: StudentCatatanEntry = catatanSiswaMap[stNisn] || {
                        mode: 'default',
                        text: '',
                        defaultPreset: 'standar',
                      };
                      const presetKey = entry.defaultPreset || 'standar';
                      const presetObj =
                        CATATAN_DEFAULT_PRESETS[presetKey] || CATATAN_DEFAULT_PRESETS.standar;
                      const previewDefault = presetObj.getText(stNama, null, catatanWaliKelas);

                      return (
                        <div
                          key={stNisn}
                          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col gap-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {sIdx + 1}. {stNama}
                            </span>
                            <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  updateSingleStudentCatatan(stNisn, { mode: 'default' }, stNama, null)
                                }
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                  entry.mode === 'default'
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                Default
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateSingleStudentCatatan(stNisn, { mode: 'manual' }, stNama, null)
                                }
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                                  entry.mode === 'manual'
                                    ? 'bg-fuchsia-600 text-white'
                                    : 'text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                Manual
                              </button>
                            </div>
                          </div>

                          {entry.mode === 'default' ? (
                            <div className="space-y-1">
                              <select
                                value={presetKey}
                                onChange={(e) =>
                                  updateSingleStudentCatatan(
                                    stNisn,
                                    {
                                      mode: 'default',
                                      defaultPreset: e.target.value as StudentCatatanEntry['defaultPreset'],
                                    },
                                    stNama,
                                    null
                                  )
                                }
                                className="w-full text-[11px] font-semibold px-2 py-1 rounded border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-slate-800 text-indigo-900 dark:text-indigo-200 outline-none"
                              >
                                {Object.entries(CATATAN_DEFAULT_PRESETS).map(([k, cfg]) => (
                                  <option key={k} value={k}>
                                    {cfg.label}
                                  </option>
                                ))}
                              </select>
                              <p className="text-[10.5px] italic text-slate-500 dark:text-slate-400 line-clamp-2">
                                "{previewDefault}"
                              </p>
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={entry.text}
                              onChange={(e) =>
                                updateSingleStudentCatatan(
                                  stNisn,
                                  { mode: 'manual', text: e.target.value },
                                  stNama,
                                  null
                                )
                              }
                              placeholder={`Ketik catatan manual untuk ${stNama}...`}
                              className="w-full text-[11px] px-2.5 py-1.5 rounded border border-fuchsia-300 dark:border-fuchsia-700 bg-fuchsia-50/30 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-fuchsia-500 outline-none"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Scrollable A4 Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200/90 dark:bg-slate-950">
          {loading ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md mx-auto p-8 text-center shadow-lg">
              <div className="w-10 h-10 border-4 border-fuchsia-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Menyiapkan Lembar Raport STS A4...
              </p>
            </div>
          ) : studentsToRender.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md mx-auto p-8 text-center shadow-lg">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
                Pilih Kelas Terlebih Dahulu
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Silakan pilih kelas pada menu di atas untuk menampilkan lembaran Raport STS siswa.
              </p>
            </div>
          ) : (
            studentsToRender.map((student, idx) =>
              renderStudentRaportPage(student, idx, studentsToRender.length)
            )
          )}
        </div>
      </div>

      {/* Print Portal mounted directly on document.body so multi-page A4 printing never clips */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div id="raport-sts-print-portal" className="hidden print:block">
            {studentsToRender.map((student, idx) =>
              renderStudentRaportPage(student, idx, studentsToRender.length)
            )}
          </div>,
          document.body
        )}
    </>
  );
}
