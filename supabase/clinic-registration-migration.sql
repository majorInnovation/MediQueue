-- ============================================================
-- MEDIQUEUE — CLINIC SELF-REGISTRATION MIGRATION
-- Run in Supabase SQL Editor after schema.sql and clinic-setup-migration.sql
-- ============================================================

-- ============================================================
-- 1. EXTEND CLINICS TABLE
-- ============================================================
ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS registration_number   TEXT,
  ADD COLUMN IF NOT EXISTS working_days          TEXT[] DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri'],
  ADD COLUMN IF NOT EXISTS license_document_url  TEXT;

-- ============================================================
-- 2. STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('clinic-logos', 'clinic-logos', TRUE, 2097152, ARRAY['image/png','image/jpeg','image/webp','image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('clinic-licenses', 'clinic-licenses', FALSE, 5242880, ARRAY['application/pdf','image/png','image/jpeg'])
ON CONFLICT (id) DO NOTHING;

-- Logos: public read (displayed on the clinic's own pages), writes only via service role
-- (CREATE POLICY has no IF NOT EXISTS in Postgres — DROP first to stay idempotent)
DROP POLICY IF EXISTS "Public can view clinic logos" ON storage.objects;
CREATE POLICY "Public can view clinic logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'clinic-logos');

-- Licenses: private — only the owning clinic's staff can view; writes only via service role
DROP POLICY IF EXISTS "Clinic staff can view own license documents" ON storage.objects;
CREATE POLICY "Clinic staff can view own license documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'clinic-licenses'
    AND (storage.foldername(name))[1] IN (
      SELECT clinic_id::text FROM user_profiles WHERE id = auth.uid()
    )
  );

-- ============================================================
-- 3. NOTES
-- ============================================================
-- `registration_number` is the free-text registration/license number entered
-- on the form (distinct from `license_document_url`, the uploaded proof).
-- `verified` (added by clinic-setup-migration.sql) stays FALSE until a
-- platform operator reviews the uploaded license and flips it — the
-- registration flow itself never sets verified = true.
