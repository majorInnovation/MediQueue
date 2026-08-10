-- ============================================================
-- Patient Number Migration
-- Applies sequence-backed patient number generation and uniqueness.
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
  v_candidate TEXT;
  v_year_suffix TEXT := RIGHT(p_year::TEXT, 2);
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_patient_number ON patients(patient_number);

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
