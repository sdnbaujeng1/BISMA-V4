-- =========================================================================
-- BISMA+ SUPERVISI AKADEMIK - SUPABASE POSTGRESQL MIGRATION & RLS POLICIES
-- "Sistem Supervisi Akademik Reflektif Terintegrasi"
-- SDN Baujeng I Beji, Kecamatan Beji, Kabupaten Pasuruan, Jawa Timur
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABEL SEKOLAH (bisma_supervision_schools)
CREATE TABLE IF NOT EXISTS public.bisma_supervision_schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_code TEXT NOT NULL UNIQUE DEFAULT 'SDN-BAUJENG-1-BEJI',
  school_name TEXT NOT NULL DEFAULT 'SDN Baujeng I Beji',
  subdistrict TEXT NOT NULL DEFAULT 'Kecamatan Beji',
  district TEXT NOT NULL DEFAULT 'Kabupaten Pasuruan',
  province TEXT NOT NULL DEFAULT 'Jawa Timur',
  motto TEXT NOT NULL DEFAULT 'BERMUTU — Beriman, Ramah, Mandiri, Unggul, Tangguh.',
  active_academic_year TEXT NOT NULL DEFAULT '2024/2025',
  active_semester TEXT NOT NULL DEFAULT 'Semester 2 (Genap)',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABEL KEANGGOTAAN SUPERVISI (bisma_supervision_memberships)
CREATE TABLE IF NOT EXISTS public.bisma_supervision_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.bisma_supervision_schools(id) ON DELETE CASCADE,
  user_id UUID,
  bisma_nip TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('guru', 'kepala_sekolah', 'admin')),
  assignment TEXT DEFAULT 'Guru Kelas',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_id, bisma_nip)
);

-- 3. TABEL SIKLUS SUPERVISI (bisma_supervision_cycles)
CREATE TABLE IF NOT EXISTS public.bisma_supervision_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.bisma_supervision_schools(id) ON DELETE CASCADE,
  teacher_membership_id UUID REFERENCES public.bisma_supervision_memberships(id) ON DELETE RESTRICT,
  principal_membership_id UUID REFERENCES public.bisma_supervision_memberships(id) ON DELETE SET NULL,
  teacher_nip TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  teacher_assignment TEXT NOT NULL DEFAULT 'Guru Kelas',
  principal_nip TEXT NOT NULL,
  principal_name TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  semester TEXT NOT NULL,
  grade TEXT NOT NULL DEFAULT 'IV',
  subject TEXT NOT NULL DEFAULT 'IPAS',
  indicator_code TEXT NOT NULL DEFAULT 'student_engagement',
  state TEXT NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'scheduled', 'observed', 'followup', 'reflected', 'completed')),
  proposed_date DATE,
  confirmed_date DATE,
  observed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABEL FORMULIR A-D BERBASIS JSONB (bisma_supervision_forms)
CREATE TABLE IF NOT EXISTS public.bisma_supervision_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES public.bisma_supervision_cycles(id) ON DELETE CASCADE,
  form_code TEXT NOT NULL CHECK (form_code IN ('A', 'B', 'C', 'D')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed', 'published', 'finalized')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cycle_id, form_code)
);

-- 5. TABEL UMPAN BALIK & PEMBINAAN KEPALA SEKOLAH (bisma_supervision_feedback)
CREATE TABLE IF NOT EXISTS public.bisma_supervision_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES public.bisma_supervision_cycles(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('preparation_review', 'observation_feedback', 'followup_review', 'final_coaching')),
  author_nip TEXT NOT NULL,
  author_name TEXT NOT NULL,
  recognition_of_progress TEXT,
  coaching_feedback TEXT NOT NULL,
  suggested_next_steps TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABEL LAMPIRAN & BUKTI DUKUNG PRIVAT (bisma_supervision_attachments)
CREATE TABLE IF NOT EXISTS public.bisma_supervision_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.bisma_supervision_schools(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES public.bisma_supervision_cycles(id) ON DELETE CASCADE,
  form_code TEXT NOT NULL CHECK (form_code IN ('A', 'B', 'C', 'D')),
  uploader_nip TEXT NOT NULL,
  uploader_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760),
  evidence_category TEXT NOT NULL DEFAULT 'Dokumen Pembelajaran',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEKS PERFORMA QUERY
CREATE INDEX IF NOT EXISTS idx_bisma_sup_cycles_school ON public.bisma_supervision_cycles(school_id, academic_year, semester);
CREATE INDEX IF NOT EXISTS idx_bisma_sup_cycles_teacher ON public.bisma_supervision_cycles(teacher_nip);
CREATE INDEX IF NOT EXISTS idx_bisma_sup_cycles_state ON public.bisma_supervision_cycles(state);
CREATE INDEX IF NOT EXISTS idx_bisma_sup_forms_cycle ON public.bisma_supervision_forms(cycle_id, form_code);
CREATE INDEX IF NOT EXISTS idx_bisma_sup_attachments_cycle ON public.bisma_supervision_attachments(cycle_id, form_code);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) ENFORCEMENT
-- =========================================================================
ALTER TABLE public.bisma_supervision_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bisma_supervision_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bisma_supervision_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bisma_supervision_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bisma_supervision_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bisma_supervision_attachments ENABLE ROW LEVEL SECURITY;

-- Helper Functions for RLS
CREATE OR REPLACE FUNCTION public.bisma_current_user_nip()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'nip',
    auth.jwt() -> 'user_metadata' ->> 'nip',
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public.bisma_is_principal_in_school(target_school_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bisma_supervision_memberships m
    WHERE m.school_id = target_school_id
      AND (m.user_id = auth.uid() OR m.bisma_nip = public.bisma_current_user_nip())
      AND m.role IN ('kepala_sekolah', 'admin')
      AND m.is_active = TRUE
  );
$$;

-- RLS Policies on Cycles
DROP POLICY IF EXISTS "principal_read_school_cycles" ON public.bisma_supervision_cycles;
CREATE POLICY "principal_read_school_cycles"
  ON public.bisma_supervision_cycles FOR SELECT
  USING (
    public.bisma_is_principal_in_school(school_id)
    OR teacher_nip = public.bisma_current_user_nip()
  );

-- RLS Policies on Forms (Draft Form B is strictly invisible to teachers!)
DROP POLICY IF EXISTS "read_authorized_forms" ON public.bisma_supervision_forms;
CREATE POLICY "read_authorized_forms"
  ON public.bisma_supervision_forms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bisma_supervision_cycles c
      WHERE c.id = cycle_id
        AND (
          public.bisma_is_principal_in_school(c.school_id)
          OR (
            c.teacher_nip = public.bisma_current_user_nip()
            AND (form_code <> 'B' OR status IN ('published', 'finalized'))
          )
        )
    )
  );

-- Teacher can write Form A, C, D only at authorized workflow stages; Principal writes Form B
DROP POLICY IF EXISTS "teacher_write_forms_acd" ON public.bisma_supervision_forms;
CREATE POLICY "teacher_write_forms_acd"
  ON public.bisma_supervision_forms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.bisma_supervision_cycles c
      WHERE c.id = cycle_id
        AND c.teacher_nip = public.bisma_current_user_nip()
        AND c.state <> 'completed'
        AND form_code IN ('A', 'C', 'D')
    )
  );

DROP POLICY IF EXISTS "principal_write_form_b" ON public.bisma_supervision_forms;
CREATE POLICY "principal_write_form_b"
  ON public.bisma_supervision_forms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.bisma_supervision_cycles c
      WHERE c.id = cycle_id
        AND public.bisma_is_principal_in_school(c.school_id)
    )
  );

-- Private Storage Bucket Setup (`bisma-supervision`)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bisma-supervision',
  'bisma-supervision',
  FALSE,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
