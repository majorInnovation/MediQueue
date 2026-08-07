-- Fixes a cross-tenant data leak: "Staff can manage triage" allowed any
-- administrator/nurse/doctor to read/write triage_assessments for ANY clinic,
-- not just their own, because triage_assessments has no clinic_id column and
-- the policy never joined out to one.
--
-- Run this once in the Supabase SQL editor after schema.sql.

DROP POLICY IF EXISTS "Staff can manage triage" ON triage_assessments;

CREATE POLICY "Staff can manage triage"
  ON triage_assessments FOR ALL
  USING (
    auth_user_role() IN ('administrator', 'nurse', 'doctor')
    AND EXISTS (
      SELECT 1 FROM queue_records
      WHERE queue_records.id = triage_assessments.queue_record_id
        AND queue_records.clinic_id = auth_user_clinic_id()
    )
  )
  WITH CHECK (
    auth_user_role() IN ('administrator', 'nurse', 'doctor')
    AND EXISTS (
      SELECT 1 FROM queue_records
      WHERE queue_records.id = triage_assessments.queue_record_id
        AND queue_records.clinic_id = auth_user_clinic_id()
    )
  );
