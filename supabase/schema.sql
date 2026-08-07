-- ============================================================
-- MEDIQUEUE — SUPABASE SQL SCHEMA
-- Run this entire file in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. CLINICS
-- ============================================================
CREATE TABLE IF NOT EXISTS clinics (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  address       TEXT,
  phone         TEXT,
  email         TEXT,
  logo_url      TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  operating_hours JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. USER PROFILES (extends Supabase Auth users)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('administrator','receptionist','nurse','doctor','patient')),
  clinic_id   UUID REFERENCES clinics(id),
  avatar_url  TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. PATIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name              TEXT NOT NULL,
  phone             TEXT NOT NULL,
  email             TEXT,
  date_of_birth     DATE,
  gender            TEXT CHECK (gender IN ('male','female','other')),
  address           TEXT,
  emergency_contact JSONB,         -- { name, phone, relationship }
  medical_history   TEXT[],
  allergies         TEXT[],
  blood_type        TEXT,
  insurance_info    JSONB,         -- { provider, policyNumber }
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone   ON patients(phone);

-- ============================================================
-- 4. DEPARTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id   UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. STAFF MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_members (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id                 UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  user_id                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name                      TEXT NOT NULL,
  role                      TEXT NOT NULL CHECK (role IN ('administrator','receptionist','nurse','doctor')),
  email                     TEXT NOT NULL,
  phone                     TEXT,
  department                TEXT,
  status                    TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
  join_date                 DATE DEFAULT CURRENT_DATE,
  avatar_url                TEXT,
  -- Doctor extras
  specialization            TEXT,
  license_number            TEXT,
  years_experience          INT,
  schedule                  JSONB,
  average_consultation_time INT DEFAULT 15,
  rating                    DECIMAL(3,2),
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_clinic ON staff_members(clinic_id);

-- ============================================================
-- 6. QUEUE COUNTERS (sequential numbers per clinic/dept/day)
-- ============================================================
CREATE TABLE IF NOT EXISTS queue_counters (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  department    TEXT NOT NULL,
  counter_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  current_count INT  DEFAULT 0,
  UNIQUE (clinic_id, department, counter_date)
);

-- ============================================================
-- 7. QUEUE RECORDS  ← core real-time table
-- ============================================================
CREATE TABLE IF NOT EXISTS queue_records (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id           UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id          UUID NOT NULL REFERENCES patients(id),
  queue_number        TEXT NOT NULL,
  status              TEXT DEFAULT 'waiting'
                        CHECK (status IN ('waiting','called','inConsultation','completed','missed','cancelled')),
  priority            TEXT DEFAULT 'low'
                        CHECK (priority IN ('critical','high','medium','low')),
  department          TEXT NOT NULL DEFAULT 'General Consultation',
  symptoms            TEXT[],
  triage_notes        TEXT,
  assigned_doctor_id  UUID REFERENCES staff_members(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  called_at           TIMESTAMPTZ,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  wait_time           INT,
  consultation_time   INT
);

CREATE INDEX IF NOT EXISTS idx_queue_clinic_status ON queue_records(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_patient       ON queue_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_queue_date          ON queue_records(created_at);

-- ============================================================
-- 8. TRIAGE ASSESSMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS triage_assessments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_record_id  UUID NOT NULL REFERENCES queue_records(id) ON DELETE CASCADE,
  patient_id       UUID NOT NULL REFERENCES patients(id),
  assessed_by      UUID REFERENCES staff_members(id),
  priority         TEXT NOT NULL CHECK (priority IN ('critical','high','medium','low')),
  blood_pressure   TEXT,
  temperature      DECIMAL(4,1),
  heart_rate       INT,
  oxygen_saturation INT,
  weight           DECIMAL(5,1),
  notes            TEXT,
  assessed_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. APPOINTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id        UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id       UUID NOT NULL REFERENCES patients(id),
  doctor_id        UUID NOT NULL REFERENCES staff_members(id),
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  duration         INT  DEFAULT 30,
  type             TEXT DEFAULT 'consultation'
                     CHECK (type IN ('consultation','follow-up','emergency','check-up','specialist')),
  status           TEXT DEFAULT 'scheduled'
                     CHECK (status IN ('scheduled','confirmed','cancelled','completed','no-show')),
  reason           TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appt_clinic_date ON appointments(clinic_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appt_patient     ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appt_doctor      ON appointments(doctor_id);

-- ============================================================
-- 10. SMS LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS sms_logs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id        UUID REFERENCES clinics(id),
  patient_id       UUID REFERENCES patients(id),
  phone            TEXT NOT NULL,
  message          TEXT NOT NULL,
  message_type     TEXT DEFAULT 'general'
                     CHECK (message_type IN (
                       'Registration','Queue Update','Almost Your Turn','Now Serving',
                       'Appointment Reminder','Feedback Request','No-Show Alert','general'
                     )),
  status           TEXT DEFAULT 'pending'
                     CHECK (status IN ('sent','delivered','failed','pending')),
  queue_record_id  UUID REFERENCES queue_records(id),
  appointment_id   UUID REFERENCES appointments(id),
  sent_at          TIMESTAMPTZ DEFAULT NOW(),
  delivered_at     TIMESTAMPTZ,
  failure_reason   TEXT,
  external_id      TEXT
);

CREATE INDEX IF NOT EXISTS idx_sms_clinic ON sms_logs(clinic_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_patient ON sms_logs(patient_id);

-- ============================================================
-- 11. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('queue_update','appointment','system','sms','emergency','general')),
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT FALSE,
  metadata   JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read, created_at DESC);

-- ============================================================
-- 12. ACTIVITY LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id   UUID REFERENCES clinics(id),
  user_id     UUID REFERENCES auth.users(id),
  action      TEXT NOT NULL,
  description TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_clinic ON activity_logs(clinic_id, created_at DESC);

-- ============================================================
-- 13. PATIENT HEALTH RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS patient_health_records (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id     UUID NOT NULL REFERENCES patients(id),
  clinic_id      UUID NOT NULL REFERENCES clinics(id),
  doctor_id      UUID REFERENCES staff_members(id),
  visit_date     DATE NOT NULL,
  diagnosis      TEXT NOT NULL,
  treatment      TEXT,
  medications    TEXT[],
  vitals         JSONB NOT NULL DEFAULT '{}',
  notes          TEXT,
  follow_up_date DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_patient ON patient_health_records(patient_id, visit_date DESC);

-- ============================================================
-- 14. CLINIC SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS clinic_settings (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id             UUID NOT NULL UNIQUE REFERENCES clinics(id) ON DELETE CASCADE,
  queue_settings        JSONB NOT NULL DEFAULT '{
    "maxQueueSize": 100,
    "averageConsultationTime": 15,
    "autoCallNext": false,
    "smsNotifications": true
  }',
  notification_channels JSONB NOT NULL DEFAULT '{
    "sms": true,
    "email": false,
    "push": false
  }',
  operating_hours       JSONB NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 15. SMS SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS sms_settings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id   UUID NOT NULL UNIQUE REFERENCES clinics(id) ON DELETE CASCADE,
  api_key     TEXT,
  sender_id   TEXT DEFAULT 'MediQueue',
  is_enabled  BOOLEAN DEFAULT FALSE,
  templates   JSONB NOT NULL DEFAULT '{
    "registration":        "Welcome! Your queue number is {queueNumber}. Est. wait: {waitTime} mins.",
    "queueUpdate":         "Update: {ahead} patients ahead of you. Est. wait: {waitTime} mins.",
    "almostTurn":          "You are next! Please proceed to the waiting area near {department}.",
    "nowServing":          "ATTENTION: Queue {queueNumber} is now being served. Please proceed to {room}.",
    "appointmentReminder": "Reminder: Appointment at {time} with {doctor}. Reply CONFIRM or CANCEL.",
    "feedback":            "Thank you for visiting! Rate your experience (1-5) by replying to this message."
  }',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 16. MESSAGES (patient ↔ clinic)
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id  UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id),
  sender_id  UUID NOT NULL REFERENCES auth.users(id),
  content    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_clinic_patient ON messages(clinic_id, patient_id, created_at DESC);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-increment queue number per clinic/department/day
CREATE OR REPLACE FUNCTION get_next_queue_number(p_clinic_id UUID, p_department TEXT)
RETURNS TEXT AS $$
DECLARE
  v_count  INT;
  v_prefix TEXT;
BEGIN
  v_prefix := UPPER(LEFT(p_department, 1));
  INSERT INTO queue_counters (clinic_id, department, counter_date, current_count)
  VALUES (p_clinic_id, p_department, CURRENT_DATE, 1)
  ON CONFLICT (clinic_id, department, counter_date)
  DO UPDATE SET current_count = queue_counters.current_count + 1
  RETURNING current_count INTO v_count;
  RETURN v_prefix || '-' || LPAD(v_count::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS patient_number_counters (
  year INT PRIMARY KEY,
  current_sequence INT NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION get_next_patient_number(p_year INT)
RETURNS TEXT AS $$
DECLARE
  v_sequence INT;
  v_candidate TEXT;
BEGIN
  INSERT INTO patient_number_counters (year, current_sequence)
  VALUES (p_year, 0)
  ON CONFLICT (year) DO NOTHING;

  LOOP
    SELECT current_sequence + 1
    INTO v_sequence
    FROM patient_number_counters
    WHERE year = p_year
    FOR UPDATE;

    UPDATE patient_number_counters
    SET current_sequence = v_sequence
    WHERE year = p_year;

    v_candidate := LPAD(v_sequence::TEXT, 4, '0') || '/' || RIGHT(p_year::TEXT, 2);

    EXIT WHEN NOT EXISTS (
      SELECT 1
      FROM patients
      WHERE patient_number = v_candidate
    );
  END LOOP;

  RETURN v_candidate;
END;
$$ LANGUAGE plpgsql;

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to mutable tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'clinics','user_profiles','patients','staff_members',
    'appointments','clinic_settings','sms_settings','patient_health_records'
  ]
  LOOP
    EXECUTE format(
      'CREATE OR REPLACE TRIGGER trg_%I_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- Helper: current user's clinic_id
CREATE OR REPLACE FUNCTION auth_user_clinic_id()
RETURNS UUID LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT clinic_id FROM user_profiles WHERE id = auth.uid()
$$;

-- Helper: current user's role
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS TEXT LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid()
$$;

-- Helper: current user's patient record id
CREATE OR REPLACE FUNCTION auth_patient_id()
RETURNS UUID LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT id FROM patients WHERE user_id = auth.uid() LIMIT 1
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE clinics                ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients               ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_counters         ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_records          ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_assessments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_settings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages               ENABLE ROW LEVEL SECURITY;

-- clinics
CREATE POLICY "Clinic members can view their clinic"
  ON clinics FOR SELECT
  USING (id = auth_user_clinic_id());

CREATE POLICY "Admins can update their clinic"
  ON clinics FOR UPDATE
  USING (id = auth_user_clinic_id() AND auth_user_role() = 'administrator');

-- user_profiles
CREATE POLICY "Own profile: read/write"
  ON user_profiles FOR ALL
  USING (id = auth.uid());

CREATE POLICY "Staff can read clinic members"
  ON user_profiles FOR SELECT
  USING (clinic_id = auth_user_clinic_id());

-- patients
CREATE POLICY "Patients can read/update own record"
  ON patients FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Patients can register"
  ON patients FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Clinic staff can manage patients"
  ON patients FOR ALL
  USING (auth_user_role() IN ('administrator','receptionist','nurse','doctor'));

-- departments
CREATE POLICY "Clinic members can read departments"
  ON departments FOR SELECT
  USING (clinic_id = auth_user_clinic_id());

CREATE POLICY "Admins manage departments"
  ON departments FOR ALL
  USING (clinic_id = auth_user_clinic_id() AND auth_user_role() = 'administrator');

-- staff_members
CREATE POLICY "Clinic staff can read staff"
  ON staff_members FOR SELECT
  USING (clinic_id = auth_user_clinic_id());

CREATE POLICY "Patients can read active doctors"
  ON staff_members FOR SELECT
  USING (role = 'doctor' AND status = 'active');

CREATE POLICY "Admins manage staff"
  ON staff_members FOR ALL
  USING (clinic_id = auth_user_clinic_id() AND auth_user_role() = 'administrator');

-- queue_counters
CREATE POLICY "Staff can use counters"
  ON queue_counters FOR ALL
  USING (clinic_id = auth_user_clinic_id());

-- queue_records
CREATE POLICY "Clinic staff can manage queue"
  ON queue_records FOR ALL
  USING (clinic_id = auth_user_clinic_id()
    AND auth_user_role() IN ('administrator','receptionist','nurse','doctor'));

CREATE POLICY "Patients can view own queue record"
  ON queue_records FOR SELECT
  USING (patient_id = auth_patient_id());

CREATE POLICY "Patients can join queue"
  ON queue_records FOR INSERT
  WITH CHECK (patient_id = auth_patient_id());

-- triage_assessments
CREATE POLICY "Staff can manage triage"
  ON triage_assessments FOR ALL
  USING (auth_user_role() IN ('administrator','nurse','doctor'));

CREATE POLICY "Patients can view own triage"
  ON triage_assessments FOR SELECT
  USING (patient_id = auth_patient_id());

-- appointments
CREATE POLICY "Staff can manage appointments"
  ON appointments FOR ALL
  USING (clinic_id = auth_user_clinic_id()
    AND auth_user_role() IN ('administrator','receptionist','doctor'));

CREATE POLICY "Patients can view own appointments"
  ON appointments FOR SELECT
  USING (patient_id = auth_patient_id());

CREATE POLICY "Patients can book appointments"
  ON appointments FOR INSERT
  WITH CHECK (patient_id = auth_patient_id());

CREATE POLICY "Patients can cancel their appointments"
  ON appointments FOR UPDATE
  USING (patient_id = auth_patient_id() AND status = 'scheduled');

-- sms_logs
CREATE POLICY "Admin/reception can view SMS logs"
  ON sms_logs FOR SELECT
  USING (clinic_id = auth_user_clinic_id()
    AND auth_user_role() IN ('administrator','receptionist'));

CREATE POLICY "Service role manages SMS logs"
  ON sms_logs FOR ALL
  USING (auth_user_role() = 'administrator');

-- notifications
CREATE POLICY "Users manage own notifications"
  ON notifications FOR ALL
  USING (user_id = auth.uid());

-- activity_logs
CREATE POLICY "Admins view activity logs"
  ON activity_logs FOR SELECT
  USING (clinic_id = auth_user_clinic_id() AND auth_user_role() = 'administrator');

-- patient_health_records
CREATE POLICY "Patients view own records"
  ON patient_health_records FOR SELECT
  USING (patient_id = auth_patient_id());

CREATE POLICY "Staff manage health records"
  ON patient_health_records FOR ALL
  USING (clinic_id = auth_user_clinic_id()
    AND auth_user_role() IN ('administrator','nurse','doctor'));

-- clinic_settings
CREATE POLICY "Staff can read settings"
  ON clinic_settings FOR SELECT
  USING (clinic_id = auth_user_clinic_id());

CREATE POLICY "Admins manage settings"
  ON clinic_settings FOR ALL
  USING (clinic_id = auth_user_clinic_id() AND auth_user_role() = 'administrator');

-- sms_settings
CREATE POLICY "Admins manage SMS settings"
  ON sms_settings FOR ALL
  USING (clinic_id = auth_user_clinic_id() AND auth_user_role() = 'administrator');

-- messages
CREATE POLICY "Staff can read clinic messages"
  ON messages FOR SELECT
  USING (clinic_id = auth_user_clinic_id());

CREATE POLICY "Patients can read own messages"
  ON messages FOR SELECT
  USING (patient_id = auth_patient_id());

CREATE POLICY "Auth users can send messages"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- ============================================================
-- REALTIME: Enable on key tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE queue_records;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE sms_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ============================================================
-- SEED: Demo clinic + departments (run after first admin signup)
-- ============================================================
-- After registering your first clinic admin, replace the UUID below
-- with the clinic_id that was auto-created during signup, then run:
--
-- INSERT INTO departments (clinic_id, name) VALUES
--   ('<your-clinic-id>', 'General Consultation'),
--   ('<your-clinic-id>', 'Pediatrics'),
--   ('<your-clinic-id>', 'Cardiology'),
--   ('<your-clinic-id>', 'Dental'),
--   ('<your-clinic-id>', 'Laboratory'),
--   ('<your-clinic-id>', 'Pharmacy');
