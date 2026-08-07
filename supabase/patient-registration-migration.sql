-- ============================================================
-- PATIENT REGISTRATION MIGRATION
-- Adds the fields needed by the front-desk "Register New Patient"
-- form (patient info + visit info + smart triage) that are not
-- covered by the base schema.sql.
-- Run in Supabase SQL Editor after schema.sql.
-- ============================================================

-- Receptionists capture age directly rather than date of birth
ALTER TABLE patients ADD COLUMN IF NOT EXISTS age INT;

-- Visit + smart-triage details captured at registration time
ALTER TABLE queue_records ADD COLUMN IF NOT EXISTS visit_type TEXT DEFAULT 'walk-in'
  CHECK (visit_type IN ('walk-in','follow-up','appointment','referral','emergency'));
ALTER TABLE queue_records ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE queue_records ADD COLUMN IF NOT EXISTS pain_level INT CHECK (pain_level BETWEEN 0 AND 10);
ALTER TABLE queue_records ADD COLUMN IF NOT EXISTS has_disability BOOLEAN DEFAULT FALSE;
ALTER TABLE queue_records ADD COLUMN IF NOT EXISTS disability_notes TEXT;
ALTER TABLE queue_records ADD COLUMN IF NOT EXISTS pregnancy_status TEXT DEFAULT 'n/a'
  CHECK (pregnancy_status IN ('pregnant','not-pregnant','unknown','n/a'));
ALTER TABLE queue_records ADD COLUMN IF NOT EXISTS vitals JSONB;
ALTER TABLE queue_records ADD COLUMN IF NOT EXISTS risk_score INT;
ALTER TABLE queue_records ADD COLUMN IF NOT EXISTS estimated_wait INT;
