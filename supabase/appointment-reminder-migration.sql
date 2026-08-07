-- Adds a flag so the reminder cron job (app/api/cron/appointment-reminders)
-- can tell which upcoming appointments still need their "1 hour before" SMS.
-- Run this after schema.sql (and after any other migrations already applied).

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN NOT NULL DEFAULT FALSE;

-- Speeds up the cron job's scan for pending reminders.
CREATE INDEX IF NOT EXISTS idx_appt_pending_reminders
  ON appointments(appointment_date)
  WHERE reminder_sent = FALSE AND status IN ('scheduled', 'confirmed');
