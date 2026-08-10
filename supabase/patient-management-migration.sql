-- ============================================================
-- PATIENT MANAGEMENT MIGRATION
-- Adds permanent patient records, patient numbering, and visit history.
-- Run this file in Supabase SQL Editor after the base schema.
-- ============================================================

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS patient_number TEXT,
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS national_id TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS last_visit_at TIMESTAMPTZ;

ALTER TABLE queue_records
  ADD COLUMN IF NOT EXISTS estimated_wait INT;

CREATE TABLE IF NOT EXISTS patient_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  queue_id UUID REFERENCES queue_records(id) ON DELETE SET NULL,
  chief_complaint TEXT,
  symptoms TEXT[],
  symptom_duration TEXT,
  pain_level INT CHECK (pain_level BETWEEN 0 AND 10),
  additional_notes TEXT,
  priority_score INT,
  triage_priority TEXT CHECK (triage_priority IN ('critical','high','medium','low')),
  registered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_visits_patient ON patient_visits(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_visits_queue ON patient_visits(queue_id);

CREATE TABLE IF NOT EXISTS patient_number_counters (
  year INT PRIMARY KEY,
  current_sequence INT NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION get_next_patient_number(p_year INT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_sequence INT;
  v_year_suffix TEXT := RIGHT(p_year::TEXT, 2);
  v_candidate TEXT;
  v_sequence_name TEXT := format('patient_number_seq_%s', p_year);
BEGIN
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I START 1', v_sequence_name);

  LOOP
    EXECUTE format('SELECT nextval(%L)', v_sequence_name) INTO v_sequence;

    v_candidate := LPAD(v_sequence::TEXT, 4, '0') || '/' || v_year_suffix;

    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM patients
      WHERE patient_number = v_candidate
    );
  END LOOP;

  RETURN v_candidate;
END;
$$;

CREATE OR REPLACE FUNCTION migrate_legacy_patient_numbers()
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  rec RECORD;
  v_year INT;
  v_sequence INT;
  v_candidate TEXT;
BEGIN
  FOR rec IN
    SELECT id, patient_number, created_at
    FROM patients
    WHERE patient_number IS NOT NULL
      AND patient_number !~ '^\d{4}/\d{2}$'
  LOOP
    v_year := COALESCE(EXTRACT(YEAR FROM rec.created_at)::INT, EXTRACT(YEAR FROM NOW())::INT);
    v_sequence := NULL;

    IF rec.patient_number ~ '^PT-|^PAT-' THEN
      v_sequence := CAST(regexp_replace(rec.patient_number, E'^PT-|^PAT-', '', 'g') AS INT);
    ELSIF rec.patient_number ~ '^\d+$' THEN
      v_sequence := CAST(rec.patient_number AS INT);
    END IF;

    IF v_sequence IS NOT NULL THEN
      LOOP
        v_candidate := LPAD(v_sequence::TEXT, 4, '0') || '/' || RIGHT(v_year::TEXT, 2);

        EXIT WHEN NOT EXISTS (
          SELECT 1
          FROM patients
          WHERE patient_number = v_candidate
            AND id <> rec.id
        );

        v_sequence := v_sequence + 1;
      END LOOP;

      UPDATE patients
      SET patient_number = v_candidate
      WHERE id = rec.id;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION set_patient_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.patient_number IS NULL OR NEW.patient_number = '' THEN
    NEW.patient_number := get_next_patient_number(EXTRACT(YEAR FROM NOW())::INT);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_patient_number ON patients;
CREATE TRIGGER trg_set_patient_number
BEFORE INSERT ON patients
FOR EACH ROW
EXECUTE FUNCTION set_patient_number();

CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_patient_number ON patients(patient_number) WHERE patient_number IS NOT NULL;

CREATE OR REPLACE FUNCTION cleanup_duplicate_patient_numbers()
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  rec RECORD;
  v_year INT;
BEGIN
  FOR rec IN
    SELECT id, patient_number
    FROM (
      SELECT id,
             patient_number,
             ROW_NUMBER() OVER (PARTITION BY patient_number ORDER BY created_at NULLS LAST, id) AS row_number
      FROM patients
      WHERE patient_number IS NOT NULL
    ) duplicates
    WHERE row_number > 1
  LOOP
    BEGIN
      v_year := 2000 + CAST(RIGHT(rec.patient_number, 2) AS INT);
    EXCEPTION WHEN invalid_text_representation THEN
      v_year := EXTRACT(YEAR FROM NOW())::INT;
    END;

    UPDATE patients
    SET patient_number = get_next_patient_number(v_year)
    WHERE id = rec.id;
  END LOOP;
END;
$$;

SELECT cleanup_duplicate_patient_numbers();

SELECT migrate_legacy_patient_numbers();

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS patients_all_staff ON patients;
CREATE POLICY patients_all_staff
ON patients
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid()
      AND up.role IN ('administrator','receptionist','nurse','doctor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid()
      AND up.role IN ('administrator','receptionist','nurse','doctor')
  )
);

DROP POLICY IF EXISTS queue_records_all_staff ON queue_records;
CREATE POLICY queue_records_all_staff
ON queue_records
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid()
      AND up.role IN ('administrator','receptionist','nurse','doctor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid()
      AND up.role IN ('administrator','receptionist','nurse','doctor')
  )
);

DROP POLICY IF EXISTS patient_visits_all_staff ON patient_visits;
CREATE POLICY patient_visits_all_staff
ON patient_visits
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid()
      AND up.role IN ('administrator','receptionist','nurse','doctor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid()
      AND up.role IN ('administrator','receptionist','nurse','doctor')
  )
);
