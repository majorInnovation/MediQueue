-- Gives each appointment a sequential, human-readable appointment number
-- (e.g. "A-007"), the same way queue_records.queue_number is generated —
-- an atomic per-clinic/per-day counter via a Postgres function. Run after
-- schema.sql (and appointment-reminder-migration.sql, if applied).

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS appointment_number TEXT;

CREATE TABLE IF NOT EXISTS appointment_counters (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  counter_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  current_count INT  DEFAULT 0,
  UNIQUE (clinic_id, counter_date)
);

ALTER TABLE appointment_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic staff can manage appointment_counters"
  ON appointment_counters FOR ALL
  USING (clinic_id = auth_user_clinic_id())
  WITH CHECK (clinic_id = auth_user_clinic_id());

-- Auto-increment appointment number per clinic/day.
CREATE OR REPLACE FUNCTION get_next_appointment_number(p_clinic_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_count INT;
BEGIN
  INSERT INTO appointment_counters (clinic_id, counter_date, current_count)
  VALUES (p_clinic_id, CURRENT_DATE, 1)
  ON CONFLICT (clinic_id, counter_date)
  DO UPDATE SET current_count = appointment_counters.current_count + 1
  RETURNING current_count INTO v_count;
  RETURN 'A-' || LPAD(v_count::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;
