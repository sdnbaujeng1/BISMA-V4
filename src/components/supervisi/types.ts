export type SupervisiRole = 'kepala_sekolah' | 'guru';
export type BismaOriginRole = 'admin' | 'tendik' | 'guru';

export type SupervisionCycleState =
  | 'draft'
  | 'scheduled'
  | 'observed'
  | 'followup'
  | 'reflected'
  | 'completed';

export type FormCode = 'A' | 'B' | 'C' | 'D';
export type FormStatus = 'draft' | 'submitted' | 'reviewed' | 'published' | 'finalized';

export interface SupervisiActor {
  verified: boolean;
  uuid: string;
  nip: string;
  nama: string;
  mengajar?: string;
  bismaRole: BismaOriginRole;
  supervisiRole: SupervisiRole;
  jabatan: string;
  headmasterName: string;
  headmasterNIP: string;
  tahunAjaran: string;
  schoolId: string;
  schoolName: string;
}

export interface TargetBehaviorDefinition {
  code: string;
  label: string;
  recommended_practices: string[];
  practices_to_avoid: string[];
}

export interface PriorityIndicatorDefinition {
  code: string;
  number: number;
  title: string;
  dimension: string;
  description: string;
  behaviors: TargetBehaviorDefinition[];
}

export interface SupervisiConfig {
  schoolId: string;
  schoolCode: string;
  schoolName: string;
  subdistrict: string;
  district: string;
  province: string;
  motto: string;
  tahunPelajaranAktif: string;
  semesterAktif: string;
  logoKabupaten?: string;
  schoolLogo?: string;
  kopHeaderLine1?: string;
  kopHeaderLine2?: string;
  schoolAddress?: string;
  headmasterName?: string;
  headmasterNIP?: string;
  logo1x1?: string;
  bismaLogoUrl?: string;
  enableSequentialUnlock?: boolean;
  enableDriveLinkEmbed?: boolean;
  enableAiAutofill?: boolean;
  supervisiSequentialLock?: boolean;
  supervisiDriveEmbedMode?: boolean;
  supervisiEnableAi?: boolean;
  indicators: PriorityIndicatorDefinition[];
}

export interface TeacherDirectoryItem {
  nip: string;
  nama_guru: string;
  mengajar: string;
  kelasList: string[];
  mapelList: string[];
}

export interface SupervisionAttachment {
  id: string;
  school_id: string;
  cycle_id: string;
  form_code: FormCode;
  uploader_nip: string;
  uploader_name: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  file_size_bytes: number;
  evidence_category: string;
  download_url?: string;
  drive_url?: string;
  link_url?: string;
  principal_note?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  created_at?: string;
}

// =========================================================================
// FORM A — DISKUSI PERSIAPAN OBSERVASI
// =========================================================================
export interface FormAPayload {
  grade: string; // I - VI
  subject: string;
  topic: string;
  learning_objectives: string[];
  learning_date: string;
  teaching_doc_ref: string;
  indicator_code: string;
  target_behaviors: string[]; // array of behavior codes
  preparation_actions: string;
  proposed_date: string;
  start_time: string;
  end_time: string;
  location: string;
  supporting_rpp_title?: string;
  supporting_material_note?: string;
  // A8. Principal review
  review_note?: string;
  approved_date?: string;
  confirmed_schedule?: string;
  confirmed_start_time?: string;
  confirmed_end_time?: string;
  confirmed_location?: string;
  reviewed_by_nip?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
}

// =========================================================================
// FORM B — HASIL OBSERVASI KINERJA GURU (1-3 Categorical Rating Model)
// =========================================================================
export type BehaviorRatingCode = 1 | 2 | 3;

export interface BehaviorObservationRating {
  behavior_code: string;
  behavior_label: string;
  rating: BehaviorRatingCode;
  evidence: string;
  learning_impact: string;
  notes?: string;
}

export interface FormBPayload {
  observed_at: string;
  observer_nip: string;
  observer_name: string;
  ratings: BehaviorObservationRating[];
  summary: string;
  strengths: string;
  improvement_areas: string;
  recommendations: string;
  is_published: boolean;
  published_at?: string | null;
}

// =========================================================================
// FORM C — RENCANA TINDAK LANJUT
// =========================================================================
export interface FormCPayload {
  challenges: string; // Q1: Tantangan saat pembelajaran
  root_causes: string; // Q2: Akar penyebab tantangan
  practices_to_improve: string; // Q3: Praktik yang perlu ditingkatkan
  goals: string[]; // Q4: Tujuan perbaikan
  action_steps: string[]; // Q5: Langkah konkret perbaikan
  target_date: string; // Q6: Tenggat waktu implementasi
  learning_sources: string[]; // Pilihan belajar (Ruang GTK, Komunitas Belajar, dll.)
  required_support: string; // Q7: Bantuan/sumber daya yang dibutuhkan
  success_indicators: string[]; // Q8: Indikator keberhasilan perbaikan
  // Principal review on Form C
  principal_review_note?: string;
  principal_reviewed_at?: string;
  principal_reviewed_by?: string;
}

// =========================================================================
// FORM D — REFLEKSI DAN EVALUASI TINDAK LANJUT
// =========================================================================
export interface FormDPayload {
  inspiration: string; // Q1: Inspirasi baru yang diperoleh
  actions_implemented: string[]; // Q2: Perbaikan yang telah diterapkan
  progress: string; // Q3: Kemajuan praktik mengajar yang diamati
  learning_impact: string; // Q4: Perubahan positif partisipasi/belajar murid
  remaining_challenges: string; // Q5: Tantangan yang masih dihadapi
  improvement_strategy: string; // Q6: Strategi mengatasi tantangan tersebut
  next_goals: string[]; // Q7: Target pengembangan profesional berikutnya
  // Principal Final Coaching & Cycle Confirmation
  recognition_of_progress?: string;
  coaching_feedback?: string;
  suggested_next_steps?: string;
  final_confirmation?: boolean;
  finalized_by_nip?: string;
  finalized_by_name?: string;
  finalized_at?: string;
}

export interface SupervisionFormRecord<T = any> {
  id: string;
  cycle_id: string;
  form_code: FormCode;
  status: FormStatus;
  payload: T;
  created_by: string;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupervisionFeedbackRecord {
  id: string;
  cycle_id: string;
  stage: 'preparation_review' | 'observation_feedback' | 'followup_review' | 'final_coaching';
  author_nip: string;
  author_name: string;
  recognition_of_progress?: string;
  coaching_feedback: string;
  suggested_next_steps?: string;
  is_published: boolean;
  published_at?: string | null;
  created_at: string;
}

export interface SupervisionCycle {
  id: string;
  school_id: string;
  teacher_nip: string;
  teacher_name: string;
  teacher_assignment: string;
  principal_nip: string;
  principal_name: string;
  academic_year: string;
  semester: string;
  grade: string;
  subject: string;
  indicator_code: string;
  state: SupervisionCycleState;
  proposed_date?: string | null;
  confirmed_date?: string | null;
  observed_at?: string | null;
  published_at?: string | null;
  completed_at?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  forms: {
    A?: SupervisionFormRecord<FormAPayload> | null;
    B?: SupervisionFormRecord<FormBPayload> | null;
    C?: SupervisionFormRecord<FormCPayload> | null;
    D?: SupervisionFormRecord<FormDPayload> | null;
  };
  attachments: SupervisionAttachment[];
  feedback: SupervisionFeedbackRecord[];
}

// =========================================================================
// CONFIGURABLE 6 PRIORITY INDICATORS & TARGET BEHAVIORS (PMM/Reflektif)
// =========================================================================
export const DEFAULT_PRIORITY_INDICATORS: PriorityIndicatorDefinition[] = [
  {
    code: 'classroom_management',
    number: 1,
    title: 'Keteraturan Suasana Kelas (Pengelolaan Kelas)',
    dimension: 'Manajemen Kelas Kondusif',
    description: 'Kemampuan guru membangun kesepakatan kelas, komunikasi positif, dan pengelolaan rutinitas belajar yang aman serta fokus.',
    behaviors: [
      {
        code: 'cm_1',
        label: 'Guru melakukan komunikasi positif untuk membangun suasana kelas yang kondusif.',
        recommended_practices: [
          'Memanggil murid dengan menyebut namanya secara hangat.',
          'Menyampaikan harapan positif terhadap kelas sebelum memulai materi.',
          'Mengajak murid menyepakati aturan belajar bersama.'
        ],
        practices_to_avoid: [
          'Menyebutkan perilaku negatif murid secara mempermalukan di depan kelas.',
          'Mengabaikan kesepakatan kelas yang telah dibuat bersama.'
        ]
      },
      {
        code: 'cm_2',
        label: 'Guru melakukan strategi pengelompokan untuk mengaktifkan keterlibatan peserta didik.',
        recommended_practices: [
          'Mengelompokkan murid dengan menyampaikan peran dan tujuan kerja kelompok.',
          'Memvariasikan susunan kelompok sesuai kebutuhan aktivitas belajar.'
        ],
        practices_to_avoid: [
          'Membiarkan sebagian murid pasif tanpa pembagian tugas dalam kelompok.'
        ]
      },
      {
        code: 'cm_3',
        label: 'Guru membuat dan mengingatkan aturan/kesepakatan kelas secara konsisten.',
        recommended_practices: [
          'Melibatkan murid dalam merumuskan kesepakatan kelas.',
          'Mengingatkan kesepakatan kelas secara tenang dan konstruktif saat fokus menurun.'
        ],
        practices_to_avoid: [
          'Memberikan hukuman sepihak tanpa merujuk pada kesepakatan kelas.'
        ]
      }
    ]
  },
  {
    code: 'student_engagement',
    number: 2,
    title: 'Keterlibatan Aktif Peserta Didik (Aktivitas Interaktif)',
    dimension: 'Praktik Pembelajaran Interaktif',
    description: 'Upaya guru memfasilitasi diskusi bermakna, pertanyaan pemantik, kolaborasi, dan partisipasi merata seluruh murid.',
    behaviors: [
      {
        code: 'se_1',
        label: 'Guru mengajukan pertanyaan pemantik yang bermakna dan menstimulasi penalaran siswa.',
        recommended_practices: [
          'Mengajukan pertanyaan terbuka yang mengaitkan materi dengan pengalaman sehari-hari murid.',
          'Memberikan waktu tunggu (wait time) bagi murid untuk berpikir sebelum menjawab.'
        ],
        practices_to_avoid: [
          'Hanya mengajukan pertanyaan tertutup (ya/tidak) atau langsung menjawab sendiri.'
        ]
      },
      {
        code: 'se_2',
        label: 'Guru melibatkan peserta didik secara aktif dalam diskusi dan kolaborasi kelas.',
        recommended_practices: [
          'Memfasilitasi murid untuk saling menanggapi pendapat teman secara santun.',
          'Mendorong kerja kelompok yang menghasilkan karya atau pemecahan masalah bersama.'
        ],
        practices_to_avoid: [
          'Pembelajaran satu arah (ceramah penuh) tanpa ruang interaksi antar murid.'
        ]
      },
      {
        code: 'se_3',
        label: 'Guru memberikan kesempatan partisipasi yang setara dan merespons ide siswa secara konstruktif.',
        recommended_practices: [
          'Mengundang murid dari berbagai kelompok/barisan tempat duduk untuk berbagi gagasan.',
          'Mengapresiasi keberanian murid berpendapat dan mengelaborasi ide mereka.'
        ],
        practices_to_avoid: [
          'Hanya menunjuk murid yang sama berulang kali dan mengabaikan murid yang pendiam.'
        ]
      }
    ]
  },
  {
    code: 'differentiated_learning',
    number: 3,
    title: 'Pembelajaran Berdiferensiasi Sesuai Kebutuhan Murid',
    dimension: 'Layanan Kebutuhan Belajar',
    description: 'Penyesuaian konten, proses, produk, atau pendampingan belajar berdasarkan kesiapan, minat, dan profil belajar peserta didik.',
    behaviors: [
      {
        code: 'dl_1',
        label: 'Guru menyajikan variasi media atau cara penjelasan yang sesuai dengan kesiapan belajar siswa.',
        recommended_practices: [
          'Menggunakan media visual, benda konkret, dan penjelasan bertahap (scaffolding).',
          'Menyediakan pilihan bahan bacaan atau aktivitas sesuai tingkat pemahaman murid.'
        ],
        practices_to_avoid: [
          'Menyamakan satu metode penjelasan tunggal tanpa memeriksa pemahaman awal murid.'
        ]
      },
      {
        code: 'dl_2',
        label: 'Guru memberikan bimbingan bertahap (scaffolding) bagi siswa yang membutuhkan pendampingan khusus.',
        recommended_practices: [
          'Berkeliling memantau kemajuan belajar dan mendampingi murid yang mengalami kesulitan.',
          'Memberikan tantangan pengayaan bagi murid yang telah tuntas lebih cepat.'
        ],
        practices_to_avoid: [
          'Membiarkan murid yang kesulitan tertinggal tanpa bantuan terarah.'
        ]
      }
    ]
  },
  {
    code: 'formative_assessment',
    number: 4,
    title: 'Asesmen Formatif dan Umpan Balik Konstruktif',
    dimension: 'Asesmen & Umpan Balik Pembelajaran',
    description: 'Pengecekan pemahaman secara berkala selama proses belajar serta pemberian umpan balik spesifik yang membantu murid berkembang.',
    behaviors: [
      {
        code: 'fa_1',
        label: 'Guru melakukan pengecekan pemahaman peserta didik secara berkala selama pembelajaran.',
        recommended_practices: [
          'Menggunakan teknik cek pemahaman cepat (kuis singkat, kartu respons, tanya jawab terarah).',
          'Menyesuaikan langkah mengajar berikutnya berdasarkan hasil cek pemahaman.'
        ],
        practices_to_avoid: [
          'Melanjutkan materi baru tanpa memastikan murid memahami konsep prasyarat.'
        ]
      },
      {
        code: 'fa_2',
        label: 'Guru memberikan umpan balik yang spesifik dan berorientasi pada perbaikan proses belajar.',
        recommended_practices: [
          'Menjelaskan bagian mana yang sudah tepat dan langkah apa yang perlu diperbaiki murid.',
          'Mendorong murid melakukan refleksi diri terhadap hasil kerjanya.'
        ],
        practices_to_avoid: [
          'Hanya memberikan nilai angka tanpa penjelasan letak kekuatan atau kekeliruan.'
        ]
      }
    ]
  },
  {
    code: 'positive_communication',
    number: 5,
    title: 'Komunikasi Positif, Empatik, dan Perhatian Kepedulian',
    dimension: 'Dukungan Psikologis & Sosial Emosional',
    description: 'Interaksi empatik, mendengarkan secara aktif, serta apresiasi terhadap usaha dan pertumbuhan peserta didik.',
    behaviors: [
      {
        code: 'pc_1',
        label: 'Guru menyimak pendapat dan perasaan peserta didik dengan penuh perhatian dan empati.',
        recommended_practices: [
          'Menunjukkan bahasa tubuh terbuka dan kontak mata yang ramah saat murid berbicara.',
          'Memvalidasi usaha murid meskipun jawaban belum sepenuhnya tepat.'
        ],
        practices_to_avoid: [
          'Memotong pembicaraan murid secara terburu-buru atau meremehkan pertanyaan murid.'
        ]
      },
      {
        code: 'pc_2',
        label: 'Guru memberikan pujian spesifik terhadap usaha, ketekunan, dan kemajuan belajar siswa.',
        recommended_practices: [
          'Mengapresiasi strategi dan kerja keras murid (growth mindset).',
          'Membangun rasa percaya diri murid untuk mencoba menyelesaikan soal menantang.'
        ],
        practices_to_avoid: [
          'Memberikan label negatif pada kemampuan akademik murid.'
        ]
      }
    ]
  },
  {
    code: 'student_centered',
    number: 6,
    title: 'Pembelajaran Berpusat pada Peserta Didik & Kontekstual',
    dimension: 'Eksplorasi & Kemandirian Murid',
    description: 'Keterkaitan materi dengan konteks nyata di sekitar sekolah/rumah serta pemberian ruang kemandirian dan refleksi murid.',
    behaviors: [
      {
        code: 'sc_1',
        label: 'Guru mengaitkan materi pembelajaran dengan konteks kehidupan nyata peserta didik.',
        recommended_practices: [
          'Menggunakan contoh lingkungan sekitar SDN Baujeng I Beji dan kehidupan sehari-hari murid.',
          'Mengajak murid mengamati fenomena nyata sebelum masuk ke definisi konsep.'
        ],
        practices_to_avoid: [
          'Menyampaikan konsep abstrak semata-mata menghafal buku teks.'
        ]
      },
      {
        code: 'sc_2',
        label: 'Guru memfasilitasi peserta didik menyimpulkan dan merefleksikan pengalaman belajarnya.',
        recommended_practices: [
          'Memandu murid merangkum poin penting pelajaran dengan bahasa mereka sendiri.',
          'Menanyakan hal yang paling disukai dan hal yang masih ingin dipelajari lebih lanjut.'
        ],
        practices_to_avoid: [
          'Menutup pelajaran secara mendadak tanpa kesimpulan dan refleksi bersama.'
        ]
      }
    ]
  }
];

export const RATING_CATEGORIES: Array<{
  code: BehaviorRatingCode;
  label: string;
  shortLabel: string;
  description: string;
  badgeClass: string;
  cardClass: string;
}> = [
  {
    code: 1,
    label: '1 — Belum dilakukan',
    shortLabel: 'Belum Dilakukan',
    description: 'Perilaku sasaran belum tampak dilakukan selama sesi observasi pembelajaran berlangsung.',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
    cardClass: 'border-rose-400 bg-rose-50/80 text-rose-950'
  },
  {
    code: 2,
    label: '2 — Dilakukan tetapi belum efektif',
    shortLabel: 'Dilakukan (Belum Efektif)',
    description: 'Perilaku sasaran sudah dilakukan oleh guru, namun belum konsisten atau belum berdampak optimal pada belajar murid.',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    cardClass: 'border-amber-400 bg-amber-50/80 text-amber-950'
  },
  {
    code: 3,
    label: '3 — Dilakukan dan efektif',
    shortLabel: 'Dilakukan & Efektif',
    description: 'Perilaku sasaran dilakukan secara konsisten, tepat sasaran, dan berdampak positif nyata pada keterlibatan murid.',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    cardClass: 'border-emerald-500 bg-emerald-50/90 text-emerald-950'
  }
];

export const LEARNING_SOURCE_OPTIONS: string[] = [
  'Ruang GTK (Platform Kemendikdasmen)',
  'Komunitas Belajar Guru (Kombel / KKG)',
  'Diskusi & Observasi Rekan Sejawat',
  'Coaching & Pendampingan Kepala Sekolah',
  'Praktik Mandiri & Eksperimen di Kelas',
  'Kegiatan Pengembangan Diri Lainnya'
];

export const GRADE_OPTIONS = ['I', 'II', 'III', 'IV', 'V', 'VI'];

export const CYCLE_STATE_META: Record<
  SupervisionCycleState,
  {
    stepNumber: number;
    label: string;
    shortLabel: string;
    badgeClass: string;
    gradientClass: string;
    description: string;
  }
> = {
  draft: {
    stepNumber: 1,
    label: 'Tahap 1: Persiapan Observasi (Draf / Menunggu Konfirmasi)',
    shortLabel: '1. Persiapan',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    gradientClass: 'from-slate-600 to-slate-800',
    description: 'Guru menyusun Form A (Fokus Observasi, Perilaku Sasaran & Usulan Jadwal) untuk ditinjau Kepala Sekolah.'
  },
  scheduled: {
    stepNumber: 2,
    label: 'Tahap 2: Terjadwal — Menunggu Observasi Kelas',
    shortLabel: '2. Terjadwal',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
    gradientClass: 'from-sky-600 to-blue-700',
    description: 'Jadwal persiapan telah disetujui Kepala Sekolah. Siap melaksanakan observasi pembelajaran di kelas (Form B).'
  },
  observed: {
    stepNumber: 3,
    label: 'Tahap 3: Selesai Observasi — Penyusunan Tindak Lanjut',
    shortLabel: '3. Diobservasi',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    gradientClass: 'from-indigo-600 to-blue-800',
    description: 'Hasil observasi (Form B) telah dipublikasikan Kepala Sekolah. Guru menyusun Rencana Tindak Lanjut (Form C).'
  },
  followup: {
    stepNumber: 4,
    label: 'Tahap 4: Implementasi & Pengisian Refleksi (Form D)',
    shortLabel: '4. Tindak Lanjut',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    gradientClass: 'from-amber-500 to-orange-600',
    description: 'Rencana tindak lanjut (Form C) telah dikirim. Guru mengimplementasikan perbaikan dan mengisi Refleksi & Evaluasi (Form D).'
  },
  reflected: {
    stepNumber: 5,
    label: 'Tahap 5: Refleksi Terkirim — Pembinaan Akhir Kepala Sekolah',
    shortLabel: '5. Direfleksi',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
    gradientClass: 'from-purple-600 to-indigo-700',
    description: 'Guru telah mengirimkan Form D beserta bukti dukung. Menunggu umpan balik akhir dan finalisasi Kepala Sekolah.'
  },
  completed: {
    stepNumber: 6,
    label: 'Tahap 6: Siklus Tuntas (Arsip Permanen)',
    shortLabel: '6. Selesai',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    gradientClass: 'from-emerald-600 to-teal-700',
    description: 'Seluruh rangkaian siklus supervisi akademik reflektif telah difinalisasi dan tersimpan sebagai arsip resmi sekolah.'
  }
};

export function getIndicatorByCode(code: string, indicators = DEFAULT_PRIORITY_INDICATORS): PriorityIndicatorDefinition {
  return indicators.find(i => i.code === code) || indicators[0];
}

export function getNextActionForCycle(cycle: SupervisionCycle, role: SupervisiRole): {
  title: string;
  description: string;
  targetPage: string;
  urgent: boolean;
} {
  const formAStatus = cycle.forms?.A?.status;
  const formBStatus = cycle.forms?.B?.status;
  const formCStatus = cycle.forms?.C?.status;

  if (role === 'guru') {
    if (cycle.state === 'draft') {
      if (formAStatus === 'submitted') {
        return {
          title: 'Menunggu Konfirmasi Jadwal Kepala Sekolah',
          description: 'Persiapan supervisi (Form A) Anda telah dikirim. Silakan menunggu konfirmasi jadwal dari kepala sekolah.',
          targetPage: 'form_a',
          urgent: false
        };
      }
      return {
        title: 'Lengkapi & Kirim Form A (Persiapan Observasi)',
        description: 'Pilih fokus indikator, perilaku sasaran, dan ajukan jadwal observasi kelas Anda.',
        targetPage: 'form_a',
        urgent: true
      };
    }
    if (cycle.state === 'scheduled') {
      return {
        title: 'Siapkan Praktik Pembelajaran di Kelas',
        description: `Jadwal observasi Anda telah disetujui (${formatIndonesianDate(cycle.confirmed_date || cycle.proposed_date)}). Kepala Sekolah akan melakukan observasi kelas.`,
        targetPage: 'form_b',
        urgent: false
      };
    }
    if (cycle.state === 'observed') {
      return {
        title: 'Pelajari Hasil Observasi & Isi Form C (Tindak Lanjut)',
        description: 'Kepala Sekolah telah mempublikasikan hasil observasi (Form B). Lanjutkan menyusun Rencana Tindak Lanjut (Form C).',
        targetPage: 'form_c',
        urgent: true
      };
    }
    if (cycle.state === 'followup') {
      const reviewedByKS = Boolean(cycle.forms?.C?.payload?.principal_reviewed_at || formCStatus === 'reviewed');
      return {
        title: reviewedByKS
          ? 'Isi Form D (Refleksi & Evaluasi Tindak Lanjut)'
          : 'Laksanakan Perbaikan & Isi Form D (Refleksi)',
        description: reviewedByKS
          ? 'Rencana Tindak Lanjut telah ditinjau Kepala Sekolah. Silakan isi refleksi dampak perbaikan dan unggah bukti dukung pada Form D.'
          : 'Implementasikan langkah perbaikan di kelas dan lengkapi Form D beserta bukti dokumentasi kegiatan.',
        targetPage: 'form_d',
        urgent: true
      };
    }
    if (cycle.state === 'reflected') {
      return {
        title: 'Menunggu Umpan Balik Akhir & Finalisasi Kepala Sekolah',
        description: 'Form D (Refleksi & Evaluasi) telah dikirim. Kepala Sekolah sedang meninjau kemajuan dan memfinalisasi siklus.',
        targetPage: 'form_d',
        urgent: false
      };
    }
    return {
      title: 'Siklus Supervisi Akademik Selesai',
      description: 'Seluruh tahapan supervisi telah tuntas dan diarsipkan. Anda dapat mengunduh dokumen PDF lengkap.',
      targetPage: 'history_pdf',
      urgent: false
    };
  } else {
    // Principal (Kepala Sekolah / Admin)
    if (cycle.state === 'draft') {
      if (formAStatus === 'submitted') {
        return {
          title: 'Tinjau Form A & Setujui Jadwal Observasi',
          description: `${cycle.teacher_name} telah mengirim Form A. Periksa fokus perilaku dan konfirmasi jadwal observasi.`,
          targetPage: 'ks_prep',
          urgent: true
        };
      }
      return {
        title: 'Menunggu Guru Mengirim Form A',
        description: `${cycle.teacher_name} sedang menyusun draf persiapan observasi (Form A).`,
        targetPage: 'ks_prep',
        urgent: false
      };
    }
    if (cycle.state === 'scheduled') {
      return {
        title: formBStatus === 'draft' ? 'Lanjutkan & Publikasikan Form B (Observasi)' : 'Lakukan Observasi Kelas & Isi Form B',
        description: `Catat bukti nyata perilaku sasaran ${cycle.teacher_name} di kelas dan publikasikan umpan balik observasi.`,
        targetPage: 'ks_obs',
        urgent: true
      };
    }
    if (cycle.state === 'observed') {
      return {
        title: 'Menunggu Guru Mengisi Form C (Tindak Lanjut)',
        description: `Hasil observasi telah dipublikasikan. Menunggu ${cycle.teacher_name} menyusun Rencana Tindak Lanjut.`,
        targetPage: 'ks_followup',
        urgent: false
      };
    }
    if (cycle.state === 'followup') {
      const reviewed = Boolean(cycle.forms?.C?.payload?.principal_reviewed_at);
      return {
        title: reviewed ? 'Menunggu Guru Mengirim Refleksi (Form D)' : 'Tinjau Rencana Tindak Lanjut Guru (Form C)',
        description: reviewed
          ? `Rencana tindak lanjut telah ditinjau. Menunggu ${cycle.teacher_name} menyelesaikan Form D.`
          : `${cycle.teacher_name} telah mengirim Form C. Berikan catatan peninjauan rencana tindak lanjut.`,
        targetPage: 'ks_followup',
        urgent: !reviewed
      };
    }
    if (cycle.state === 'reflected') {
      return {
        title: 'Berikan Pembinaan Akhir & Finalisasi Siklus',
        description: `${cycle.teacher_name} telah mengirim refleksi & evaluasi (Form D). Berikan pengakuan kemajuan dan finalisasi siklus.`,
        targetPage: 'ks_reflection',
        urgent: true
      };
    }
    return {
      title: 'Siklus Terfinalisasi (Arsip Lengkap)',
      description: `Siklus supervisi ${cycle.teacher_name} telah selesai. Siap dicetak atau diunduh sebagai PDF.`,
      targetPage: 'ks_reports',
      urgent: false
    };
  }
}

export function formatIndonesianDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const clean = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`;
    const d = new Date(clean);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export function formatClassLabel(val?: string | number | null): string {
  const s = String(val ?? '').trim();
  if (!s) return '-';
  return /^kelas\b/i.test(s) ? s.replace(/^kelas\s*/i, 'Kelas ') : `Kelas ${s}`;
}

export function toEmbedPreviewUrl(rawUrl?: string | null): string {
  const url = String(rawUrl || '').trim();
  if (!url) return '';
  // Google Drive file link: https://drive.google.com/file/d/FILE_ID/view...
  const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch?.[1]) {
    return `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`;
  }
  // Google Drive open?id=FILE_ID
  const driveIdMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (driveIdMatch?.[1]) {
    return `https://drive.google.com/file/d/${driveIdMatch[1]}/preview`;
  }
  // Google Docs / Sheets / Slides
  const docsMatch = url.match(/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]+)/);
  if (docsMatch?.[1] && docsMatch?.[2]) {
    return `https://docs.google.com/${docsMatch[1]}/d/${docsMatch[2]}/preview`;
  }
  // Google Drive folder link
  const folderMatch = url.match(/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch?.[1]) {
    return `https://drive.google.com/embeddedfolderview?id=${folderMatch[1]}#list`;
  }
  return url;
}

export interface StageUnlockState {
  stage1Filled: boolean;
  stage2Filled: boolean;
  stage3Filled: boolean;
  stage4Filled: boolean;
  stage5Filled: boolean;
  stage1Unlocked: boolean;
  stage2Unlocked: boolean;
  stage3Unlocked: boolean;
  stage4Unlocked: boolean;
  stage5Unlocked: boolean;
  formAUnlocked: boolean;
  formBUnlocked: boolean;
  formCUnlocked: boolean;
  formDUnlocked: boolean;
  reportUnlocked: boolean;
}

export function getCycleStageUnlocks(
  cycle: SupervisionCycle | null | undefined,
  _sequentialLockEnabled = false
): StageUnlockState {
  if (!cycle) {
    return {
      stage1Filled: false,
      stage2Filled: false,
      stage3Filled: false,
      stage4Filled: false,
      stage5Filled: false,
      stage1Unlocked: true,
      stage2Unlocked: true,
      stage3Unlocked: true,
      stage4Unlocked: true,
      stage5Unlocked: true,
      formAUnlocked: true,
      formBUnlocked: true,
      formCUnlocked: true,
      formDUnlocked: true,
      reportUnlocked: true
    };
  }

  const pA = cycle.forms?.A?.payload;
  const stage1Filled = Boolean(
    cycle.forms?.A &&
      (cycle.forms.A.status === 'submitted' ||
        cycle.forms.A.status === 'reviewed' ||
        cycle.forms.A.status === 'finalized' ||
        (pA?.topic && pA?.preparation_actions && (pA?.target_behaviors || []).length > 0))
  );

  const stage2Filled = Boolean(
    cycle.forms?.B &&
      (cycle.forms.B.status === 'published' ||
        cycle.forms.B.status === 'finalized' ||
        cycle.forms.B.payload?.is_published === true ||
        ['observed', 'followup', 'reflected', 'completed'].includes(cycle.state))
  );

  const stage3Filled = Boolean(
    cycle.forms?.C &&
      (cycle.forms.C.status === 'submitted' ||
        cycle.forms.C.status === 'reviewed' ||
        cycle.forms.C.status === 'finalized' ||
        ['followup', 'reflected', 'completed'].includes(cycle.state))
  );

  const stage4Filled = Boolean(
    cycle.forms?.D &&
      (cycle.forms.D.status === 'submitted' ||
        cycle.forms.D.status === 'reviewed' ||
        cycle.forms.D.status === 'finalized' ||
        ['reflected', 'completed'].includes(cycle.state))
  );

  const stage5Filled = cycle.state === 'completed';

  return {
    stage1Filled,
    stage2Filled,
    stage3Filled,
    stage4Filled,
    stage5Filled,
    stage1Unlocked: true,
    stage2Unlocked: true,
    stage3Unlocked: true,
    stage4Unlocked: true,
    stage5Unlocked: true,
    formAUnlocked: true,
    formBUnlocked: true,
    formCUnlocked: true,
    formDUnlocked: true,
    reportUnlocked: true
  };
}



