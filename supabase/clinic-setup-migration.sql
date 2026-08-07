-- ============================================================
-- MEDIQUEUE — CLINIC SETUP MIGRATION
-- Run in Supabase SQL Editor after schema.sql
-- ============================================================

-- ============================================================
-- 1. EXTEND CLINICS TABLE
-- ============================================================
ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS clinic_code             TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS facility_type           TEXT,
  ADD COLUMN IF NOT EXISTS ownership               TEXT,
  ADD COLUMN IF NOT EXISTS moh_registration_number TEXT,
  ADD COLUMN IF NOT EXISTS license_number          TEXT,
  ADD COLUMN IF NOT EXISTS tpin                    TEXT,
  ADD COLUMN IF NOT EXISTS province                TEXT,
  ADD COLUMN IF NOT EXISTS district                TEXT,
  ADD COLUMN IF NOT EXISTS town                    TEXT,
  ADD COLUMN IF NOT EXISTS website                 TEXT,
  ADD COLUMN IF NOT EXISTS opening_time            TIME,
  ADD COLUMN IF NOT EXISTS closing_time            TIME,
  ADD COLUMN IF NOT EXISTS queue_prefix            TEXT DEFAULT 'Q',
  ADD COLUMN IF NOT EXISTS priority_enabled        BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS sms_enabled             BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS voice_enabled           BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS display_enabled         BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS estimated_service_time  INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS logo                    TEXT,
  ADD COLUMN IF NOT EXISTS status                  TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS verified                BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS setup_completed         BOOLEAN DEFAULT FALSE;

-- ============================================================
-- 2. CLINIC ADMINS
-- ============================================================
CREATE TABLE IF NOT EXISTS clinic_admins (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  position      TEXT,
  email         TEXT NOT NULL,
  phone         TEXT,
  username      TEXT UNIQUE,
  password_hash TEXT,
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinic_admins_clinic ON clinic_admins(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_admins_email  ON clinic_admins(email);

-- ============================================================
-- 3. SMS CONFIGURATION
-- ============================================================
CREATE TABLE IF NOT EXISTS sms_configurations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id   UUID NOT NULL UNIQUE REFERENCES clinics(id) ON DELETE CASCADE,
  provider    TEXT,
  sender_id   TEXT,
  api_key     TEXT,
  api_secret  TEXT,
  daily_limit INTEGER DEFAULT 100,
  active      BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. CLINIC STATISTICS
-- ============================================================
CREATE TABLE IF NOT EXISTS clinic_statistics (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id           UUID NOT NULL UNIQUE REFERENCES clinics(id) ON DELETE CASCADE,
  patients_today      INTEGER DEFAULT 0,
  average_wait_time   INTEGER DEFAULT 0,
  doctors_available   INTEGER DEFAULT 0,
  nurses_available    INTEGER DEFAULT 0,
  rooms_available     INTEGER DEFAULT 0,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE clinic_admins    ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_statistics  ENABLE ROW LEVEL SECURITY;

-- Clinic admins: visible to users with matching clinic_id
CREATE POLICY "Clinic staff can view own clinic admins"
  ON clinic_admins FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Clinic admins can update own record"
  ON clinic_admins FOR UPDATE
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- SMS config: visible to clinic staff
CREATE POLICY "Clinic staff can view sms config"
  ON sms_configurations FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Statistics: visible to clinic staff
CREATE POLICY "Clinic staff can view statistics"
  ON clinic_statistics FOR SELECT
  USING (
    clinic_id IN (
      SELECT clinic_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- ============================================================
-- 6. UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_clinic_admins_updated_at') THEN
    CREATE TRIGGER set_clinic_admins_updated_at
      BEFORE UPDATE ON clinic_admins
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_sms_config_updated_at') THEN
    CREATE TRIGGER set_sms_config_updated_at
      BEFORE UPDATE ON sms_configurations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;
