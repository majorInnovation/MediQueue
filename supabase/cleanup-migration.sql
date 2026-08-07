-- ============================================================
-- MEDIQUEUE — POST-PATIENT-PORTAL CLEANUP MIGRATION
-- Run in Supabase SQL Editor after schema.sql, clinic-setup-migration.sql
-- and clinic-registration-migration.sql
--
-- ⚠ BACK UP FIRST. This drops tables and their data.
-- Context: the patient self-service portal (login, signup, dashboard,
-- book-appointment, join-queue, medical-records, messages, notifications
-- UI) was removed — the system is staff-only now, and clinics/admins are
-- provisioned via /auth/signup + /admin/setup. This migration removes the
-- tables that only existed to back that deleted patient-facing code, and
-- consolidates a table duplicated by the clinic self-registration feature.
-- ============================================================

-- ============================================================
-- 1. DROP: patient ↔ clinic messaging
-- ============================================================
-- Backed only the deleted `/patient/messages` page. No staff-facing
-- equivalent exists or is planned (SMS is the staff→patient channel).
DROP TABLE IF EXISTS messages CASCADE;

-- ============================================================
-- 2. DROP: patient-facing medical records
-- ============================================================
-- Backed only the deleted `/api/medical-records` route and the patient
-- portal's "Medical Records" page. If a staff-facing "Medical Notes" tab
-- (per FRONTEND_PAGE_ARCHITECTURE.md §6) is built later, recreate this
-- (or a similarly-shaped table) scoped to staff read/write, not patient.
DROP TABLE IF EXISTS patient_health_records CASCADE;

-- ============================================================
-- 3. CONSOLIDATE: sms_configurations → sms_settings
-- ============================================================
-- `sms_settings` (schema.sql) is the table the live Settings page
-- (app/admin/settings + /api/settings) actually reads and writes.
-- `sms_configurations` (clinic-setup-migration.sql) duplicated the same
-- concern and was the one /api/admin/setup and /api/auth/register-clinic
-- were writing to — meaning a newly registered clinic's SMS config was
-- invisible on its own Settings page. Fold it into sms_settings and drop it.

ALTER TABLE sms_settings
  ADD COLUMN IF NOT EXISTS provider     TEXT,
  ADD COLUMN IF NOT EXISTS api_secret   TEXT,
  ADD COLUMN IF NOT EXISTS daily_limit  INTEGER DEFAULT 100;

INSERT INTO sms_settings (clinic_id, provider, sender_id, api_key, api_secret, daily_limit, is_enabled)
SELECT clinic_id, provider, sender_id, api_key, api_secret, daily_limit, active
FROM sms_configurations
ON CONFLICT (clinic_id) DO UPDATE SET
  provider    = EXCLUDED.provider,
  api_key     = COALESCE(sms_settings.api_key, EXCLUDED.api_key),
  api_secret  = COALESCE(sms_settings.api_secret, EXCLUDED.api_secret),
  daily_limit = EXCLUDED.daily_limit;

DROP TABLE IF EXISTS sms_configurations CASCADE;

-- After running this, app/api/admin/setup/route.ts and
-- app/api/auth/register-clinic/route.ts must upsert into `sms_settings`
-- instead of `sms_configurations` — already updated in this change set.

-- ============================================================
-- 4. NOT DROPPED — flagged for a follow-up decision
-- ============================================================
-- `notifications`: still INSERTed into by app/api/appointments/route.ts
-- and app/api/queue/action/route.ts (both live, staff-facing routes), so
-- it can't be dropped without editing those call sites first. But since
-- the patient-facing reader (`/api/notifications`, `/patient/notifications`)
-- is gone, every row written there today is now unread by anyone — it's
-- a write-only table. Either build a staff-facing notification center
-- that reads it, or remove those two insert call sites and drop the table
-- in a later migration.
--
-- `clinic_admins`: written by /api/admin/setup and /api/auth/register-clinic,
-- but nothing reads it — `staff_members` (which already supports
-- role = 'administrator') is what the Settings/Staff pages actually query.
-- This predates the patient-portal removal and wasn't touched here to
-- avoid conflating two unrelated cleanups in one migration — worth a
-- dedicated follow-up if you want a single source of truth for staff.
