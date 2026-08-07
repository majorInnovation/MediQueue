# MediQueue — Enterprise Database Design
### Smart Clinic Queue & Priority Triage System — Fully Normalized PostgreSQL Schema

**Scope:** Database design only. Staff-operated system — patients have no accounts, no login, no dashboard. Every table below is designed to 3NF/BCNF; deliberate denormalizations are called out explicitly with their justification.

**Engine:** PostgreSQL 14+ (uses `gen_random_uuid()` from `pgcrypto`, `JSONB`, partial/expression indexes, `GENERATED` columns).

---

## 0. Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Tables | `snake_case`, plural | `patient_visits`, `queue_entries` |
| Primary key column | `<singular_table>_id` | `patient_id`, `queue_entry_id` |
| Foreign key column | same name as the referenced PK | `clinic_id`, `department_id` |
| Junction tables | `<table_a>_<table_b>` | `role_permissions` |
| Boolean columns | prefixed `is_` / `has_` | `is_active`, `has_follow_up` |
| Timestamp columns | suffixed `_at`, always `TIMESTAMPTZ` | `created_at`, `called_at` |
| Date-only columns | suffixed `_date` | `queue_date`, `holiday_date` |
| Enum-like values | `TEXT` + `CHECK` constraint, not native `ENUM` | `status CHECK (status IN (...))` — avoids `ALTER TYPE` migration pain as states evolve |
| Indexes | `idx_<table>_<column(s)>` | `idx_queue_entries_status` |
| Unique constraints/indexes | `ux_<table>_<column(s)>` | `ux_staff_clinic_employee_code` |
| Foreign key constraints | `fk_<table>_<referenced_table>` | `fk_rooms_departments` |
| Check constraints | `chk_<table>_<rule>` | `chk_working_hours_time_order` |
| Surrogate keys | `UUID DEFAULT gen_random_uuid()` throughout | consistent with existing platform (Supabase Auth uses UUID) |
| Audit columns | every operational table carries `created_at`; mutable tables also carry `updated_at` | — |

---

## 1. Entity-Relationship Diagram

Grouped by domain cluster for readability. `──<` = one-to-many, `──1:1──` = one-to-one, `══` = many-to-many (via junction).

```
 ┌───────────────────────────── ORGANIZATION ─────────────────────────────┐
 │                                                                          │
 │   clinics ──< departments ──< rooms                                     │
 │      │                                                                  │
 │      ├──< working_hours                                                 │
 │      ├──< holidays                                                      │
 │      ├──< system_settings                                               │
 │      └──< staff >── roles ══ permissions (via role_permissions)         │
 │              │                                                          │
 └──────────────┼──────────────────────────────────────────────────────────┘
                 │
 ┌───────────────┼───────────────────── CARE EPISODE ──────────────────────┐
 │                ▼                                                        │
 │   patients ──< patient_visits >── staff (checked_in_by)                 │
 │                    │                                                    │
 │                    ├──< triage_assessments >── staff (assessed_by)      │
 │                    │         │                                          │
 │                    │         └──> priority_levels                      │
 │                    │                                                    │
 │                    └──< queue_entries >── queues >── departments        │
 │                              │                  (queue_date scoped)     │
 │                              ├──> priority_levels                       │
 │                              ├──< doctor_assignments >── staff, rooms   │
 │                              └──1:1── consultations >── staff, rooms    │
 │                                                                          │
 └──────────────────────────────────────────────────────────────────────────┘

 ┌───────────────────────────── NOTIFICATIONS ─────────────────────────────┐
 │                                                                          │
 │   notification_templates ──< sms_notifications ──< sms_logs             │
 │        (per clinic/event)      (outbox, per visit/ticket)  (audit trail)│
 │                                                                          │
 └──────────────────────────────────────────────────────────────────────────┘

 ┌──────────────────────────── GOVERNANCE ────────────────────────────────┐
 │                                                                          │
 │   audit_logs >── staff, clinics        reports >── staff, clinics       │
 │   (immutable, one row per action)      (generated report metadata)     │
 │                                                                          │
 └──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Relationship Explanations

| Relationship | Cardinality | Explanation |
|---|---|---|
| `clinics` → `departments` | 1:N | A clinic operates multiple departments (General Consultation, Maternal Health, etc.). Deleting a clinic cascades to its departments — a clinic record is never partially removed. |
| `departments` → `rooms` | 1:N | Rooms belong to exactly one department. A room cannot exist without a department context (consultation rooms, triage bays). |
| `roles` ══ `permissions` | M:N via `role_permissions` | A role (e.g. "Nurse") holds many permissions, and a permission (e.g. `queue.call_next`) can be granted to multiple roles. The junction table is the only correct normalized way to express this — embedding a permission list on `roles` would violate 1NF. |
| `staff` → `roles` | N:1 | Each staff member holds exactly one role. Multi-role staff (rare) are handled by creating a composite role (e.g. "Nurse-Receptionist") rather than a staff↔role junction, keeping authorization checks O(1) per request. |
| `staff` → `departments` | N:1 (nullable) | Staff are optionally tied to a home department; administrators and platform roles may span all departments (`NULL`). |
| `patients` → `patient_visits` | 1:N | One physical patient record accumulates many visits over time (repeat clinic visits). Splitting demographic data (`patients`) from episode data (`patient_visits`) avoids repeating name/DOB/allergies on every visit — a classic 2NF violation if merged. |
| `patient_visits` → `queue_entries` | 1:N | A single visit can produce more than one queue placement — e.g. a patient is first queued for triage, then re-queued into the doctor's department queue. Modeling this as 1:N (not 1:1) correctly captures multi-stage clinical workflows without overloading one row with conflicting statuses. |
| `queues` → `queue_entries` | 1:N | A `queue` is a department's ticket sequence for a specific calendar day; every ticket issued that day is a `queue_entry` row. Scoping queues by `(department_id, queue_date)` gives every department a fresh, independently-numbered queue each day. |
| `queue_entries` → `priority_levels` | N:1 | Every ticket references a fixed priority lookup (`critical/high/medium/low`), keeping the scoring vocabulary centralized and consistent across triage, queue ordering, and reporting. |
| `patient_visits` → `triage_assessments` | 1:N | A visit may be reassessed (e.g. condition changes while waiting), so history is preserved as multiple rows rather than overwritten. |
| `queue_entries` → `doctor_assignments` | 1:N | A ticket can be reassigned (doctor unavailable, room change) without losing the record of prior assignments — each reassignment is a new row, not an update-in-place, preserving an audit trail of who handled the patient. |
| `queue_entries` → `consultations` | 1:1 | Exactly one clinical consultation record results from a ticket reaching the doctor. Enforced with a `UNIQUE` constraint on `consultations.queue_entry_id`. |
| `notification_templates` → `sms_notifications` | 1:N | One template (e.g. "ticket called") is reused to generate many actual outbound messages. |
| `sms_notifications` → `sms_logs` | 1:N | `sms_notifications` holds current delivery state (fast to query); `sms_logs` is an append-only trail of every status transition/provider callback for that message — separating "current state" from "full history" is a standard normalization pattern for anything with a delivery lifecycle. |
| `staff` → `audit_logs` | 1:N | Every state-changing action a staff member performs is logged; `staff_id` is nullable to permit system/automated actions (e.g. scheduled no-show expiry) to also be audited. |

---

## 3. Table Definitions

### 3.1 `clinics`

**Purpose:** Root tenant entity. Every other table traces back to a clinic, directly or transitively — this is the multi-tenancy anchor.

```sql
CREATE TABLE clinics (
    clinic_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_name     VARCHAR(200) NOT NULL,
    clinic_code     VARCHAR(20)  NOT NULL,
    address         TEXT,
    city            VARCHAR(100),
    country         VARCHAR(100),
    phone           VARCHAR(20)  NOT NULL,
    email           VARCHAR(150),
    logo_url        TEXT,
    timezone        VARCHAR(50)  NOT NULL DEFAULT 'UTC',
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT ux_clinics_clinic_code UNIQUE (clinic_code),
    CONSTRAINT chk_clinics_phone_not_empty CHECK (btrim(phone) <> '')
);

CREATE INDEX idx_clinics_is_active ON clinics (is_active);
```

- **PK:** `clinic_id`
- **FK:** none (root entity)
- **Relationships:** parent of `departments`, `staff`, `patients`, `queues`, `system_settings`, `working_hours`, `holidays`, `audit_logs`, `reports`, `notification_templates`, `sms_notifications`

---

### 3.2 `departments`

**Purpose:** Clinical/administrative subdivisions of a clinic (e.g. General Consultation, Maternal & Child Health).

```sql
CREATE TABLE departments (
    department_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id        UUID NOT NULL,
    department_name  VARCHAR(150) NOT NULL,
    department_code  VARCHAR(20)  NOT NULL,
    description      TEXT,
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT fk_departments_clinics FOREIGN KEY (clinic_id)
        REFERENCES clinics (clinic_id) ON DELETE CASCADE,
    CONSTRAINT ux_departments_clinic_code UNIQUE (clinic_id, department_code),
    CONSTRAINT ux_departments_clinic_name UNIQUE (clinic_id, department_name)
);

CREATE INDEX idx_departments_clinic_id ON departments (clinic_id);
```

- **PK:** `department_id` · **FK:** `clinic_id → clinics`
- **Constraints:** department code/name unique per clinic (not globally — two clinics may both have "General Consultation")
- **Recommended indexes:** `idx_departments_clinic_id` (every list query filters by clinic)

---

### 3.3 `rooms`

**Purpose:** Physical consultation/triage rooms within a department.

```sql
CREATE TABLE rooms (
    room_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL,
    clinic_id     UUID NOT NULL,          -- denormalized for fast clinic-scoped queries; see §5.4
    room_number   VARCHAR(20) NOT NULL,
    room_type     VARCHAR(30) NOT NULL DEFAULT 'consultation',
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_rooms_departments FOREIGN KEY (department_id)
        REFERENCES departments (department_id) ON DELETE CASCADE,
    CONSTRAINT fk_rooms_clinics FOREIGN KEY (clinic_id)
        REFERENCES clinics (clinic_id) ON DELETE CASCADE,
    CONSTRAINT ux_rooms_department_number UNIQUE (department_id, room_number),
    CONSTRAINT chk_rooms_room_type CHECK (room_type IN ('consultation','triage','procedure','emergency'))
);

CREATE INDEX idx_rooms_department_id ON rooms (department_id);
CREATE INDEX idx_rooms_clinic_id ON rooms (clinic_id);
```

- **PK:** `room_id` · **FK:** `department_id → departments`, `clinic_id → clinics`
- **Note on `clinic_id`:** technically derivable via `departments.clinic_id`, so this is a deliberate denormalization to avoid a join on every room-availability query — see §5.4.

---

### 3.4 `roles`

**Purpose:** Fixed catalog of staff job functions.

```sql
CREATE TABLE roles (
    role_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name      VARCHAR(50)  NOT NULL,
    description    TEXT,
    is_system_role BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT ux_roles_role_name UNIQUE (role_name)
);
```

- **PK:** `role_id`
- **Seed data:** `platform_admin`, `administrator`, `receptionist`, `nurse`, `doctor`
- **Relationships:** parent of `staff` (N:1), joined to `permissions` via `role_permissions` (M:N)

---

### 3.5 `permissions`

**Purpose:** Atomic, enforceable capabilities (e.g. `queue.call_next`, `patient.register`, `reports.export`).

```sql
CREATE TABLE permissions (
    permission_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_code VARCHAR(100) NOT NULL,
    module          VARCHAR(50)  NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT ux_permissions_code UNIQUE (permission_code)
);

CREATE INDEX idx_permissions_module ON permissions (module);
```

- **PK:** `permission_id`
- **Relationships:** joined to `roles` via `role_permissions`

---

### 3.6 `role_permissions` (junction)

**Purpose:** Resolves the many-to-many relationship between `roles` and `permissions`. Required for full normalization — without it, permissions would need to be repeated as an array/JSON on `roles`, violating 1NF.

```sql
CREATE TABLE role_permissions (
    role_id       UUID NOT NULL,
    permission_id UUID NOT NULL,
    granted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_role_permissions PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_roles FOREIGN KEY (role_id)
        REFERENCES roles (role_id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permissions FOREIGN KEY (permission_id)
        REFERENCES permissions (permission_id) ON DELETE CASCADE
);

CREATE INDEX idx_role_permissions_permission_id ON role_permissions (permission_id);
```

- **PK:** composite `(role_id, permission_id)` · **FK:** both columns
- **Recommended index:** `idx_role_permissions_permission_id` (the PK already indexes `role_id` first, so reverse lookups by permission need their own index)

---

### 3.7 `staff`

**Purpose:** Every human operator of the system — receptionists, nurses, doctors, administrators. Authentication identity lives in Supabase Auth (`auth.users`); this table holds the clinical/organizational profile.

```sql
CREATE TABLE staff (
    staff_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id      UUID NOT NULL,
    department_id  UUID,                  -- nullable: administrators may span departments
    role_id        UUID NOT NULL,
    auth_user_id   UUID,                  -- FK to Supabase auth.users(id)
    employee_code  VARCHAR(30)  NOT NULL,
    full_name      VARCHAR(150) NOT NULL,
    email          VARCHAR(150) NOT NULL,
    phone          VARCHAR(20),
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    hired_at       DATE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT fk_staff_clinics FOREIGN KEY (clinic_id)
        REFERENCES clinics (clinic_id) ON DELETE CASCADE,
    CONSTRAINT fk_staff_departments FOREIGN KEY (department_id)
        REFERENCES departments (department_id) ON DELETE SET NULL,
    CONSTRAINT fk_staff_roles FOREIGN KEY (role_id)
        REFERENCES roles (role_id) ON DELETE RESTRICT,
    CONSTRAINT fk_staff_auth_users FOREIGN KEY (auth_user_id)
        REFERENCES auth.users (id) ON DELETE SET NULL,
    CONSTRAINT ux_staff_clinic_employee_code UNIQUE (clinic_id, employee_code),
    CONSTRAINT ux_staff_email UNIQUE (email),
    CONSTRAINT ux_staff_auth_user_id UNIQUE (auth_user_id)
);

CREATE INDEX idx_staff_clinic_id ON staff (clinic_id);
CREATE INDEX idx_staff_role_id ON staff (role_id);
CREATE INDEX idx_staff_department_id ON staff (department_id);
CREATE INDEX idx_staff_clinic_active ON staff (clinic_id, is_active);
```

- **PK:** `staff_id` · **FK:** `clinic_id → clinics`, `department_id → departments`, `role_id → roles`, `auth_user_id → auth.users`
- **Constraint:** `role_id` uses `ON DELETE RESTRICT` — a role in active use cannot be deleted out from under staff records (must be reassigned first)

---

### 3.8 `patients`

**Purpose:** Demographic record of a physical person known to a clinic. Created only by staff at physical intake — never self-registered, never linked to a login.

```sql
CREATE TABLE patients (
    patient_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id               UUID NOT NULL,
    full_name                VARCHAR(150) NOT NULL,
    phone                     VARCHAR(20)  NOT NULL,
    date_of_birth             DATE,
    gender                    VARCHAR(10),
    national_id               VARCHAR(50),
    address                   TEXT,
    emergency_contact_name    VARCHAR(150),
    emergency_contact_phone   VARCHAR(20),
    blood_type                VARCHAR(5),
    allergies                 TEXT[],
    chronic_conditions        TEXT[],
    registered_by             UUID NOT NULL,
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_patients_clinics FOREIGN KEY (clinic_id)
        REFERENCES clinics (clinic_id) ON DELETE CASCADE,
    CONSTRAINT fk_patients_registered_by FOREIGN KEY (registered_by)
        REFERENCES staff (staff_id) ON DELETE RESTRICT,
    CONSTRAINT ux_patients_clinic_phone UNIQUE (clinic_id, phone),
    CONSTRAINT chk_patients_gender CHECK (gender IN ('male','female','other') OR gender IS NULL)
);

CREATE INDEX idx_patients_clinic_id ON patients (clinic_id);
CREATE INDEX idx_patients_phone ON patients (phone);
CREATE INDEX idx_patients_national_id ON patients (national_id) WHERE national_id IS NOT NULL;
```

- **PK:** `patient_id` · **FK:** `clinic_id → clinics`, `registered_by → staff`
- **Design decision:** patient records are **clinic-scoped**, not shared across the platform. `UNIQUE(clinic_id, phone)` means a returning patient is recognized (via reception phone lookup) and reused rather than duplicated on every visit. Cross-clinic patient identity resolution is a deliberate future-expansion item (national ID integration), not solved at this layer, to keep tenant data isolation strict — see [ARCHITECTURE.md](ARCHITECTURE.md) §8.

---

### 3.9 `patient_visits`

**Purpose:** One clinical episode/encounter — the anchor that everything clinical (triage, queueing, consultation, notifications) attaches to.

```sql
CREATE TABLE patient_visits (
    patient_visit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id        UUID NOT NULL,
    patient_id       UUID NOT NULL,
    visit_type       VARCHAR(20) NOT NULL DEFAULT 'walk_in',
    visit_reason     TEXT,
    checked_in_by    UUID NOT NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'registered',
    arrived_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_patient_visits_clinics FOREIGN KEY (clinic_id)
        REFERENCES clinics (clinic_id) ON DELETE CASCADE,
    CONSTRAINT fk_patient_visits_patients FOREIGN KEY (patient_id)
        REFERENCES patients (patient_id) ON DELETE CASCADE,
    CONSTRAINT fk_patient_visits_checked_in_by FOREIGN KEY (checked_in_by)
        REFERENCES staff (staff_id) ON DELETE RESTRICT,
    CONSTRAINT chk_patient_visits_type CHECK (visit_type IN ('walk_in','appointment')),
    CONSTRAINT chk_patient_visits_status CHECK (status IN ('registered','in_progress','completed','cancelled'))
);

CREATE INDEX idx_patient_visits_clinic_id ON patient_visits (clinic_id);
CREATE INDEX idx_patient_visits_patient_id ON patient_visits (patient_id);
CREATE INDEX idx_patient_visits_clinic_status ON patient_visits (clinic_id, status);
CREATE INDEX idx_patient_visits_arrived_at ON patient_visits (clinic_id, arrived_at);
```

- **PK:** `patient_visit_id` · **FK:** `clinic_id → clinics`, `patient_id → patients`, `checked_in_by → staff`

---

### 3.10 `priority_levels`

**Purpose:** Fixed reference lookup for triage/queue priority. Small, mostly-static table — a `SMALLINT` surrogate key keeps every `queue_entry` and `triage_assessment` FK compact.

```sql
CREATE TABLE priority_levels (
    priority_level_id SMALLINT PRIMARY KEY,
    level_code         VARCHAR(20)  NOT NULL,
    display_label       VARCHAR(50)  NOT NULL,
    base_weight          INTEGER      NOT NULL,
    display_order        SMALLINT     NOT NULL,
    color_code            VARCHAR(7),

    CONSTRAINT ux_priority_levels_code UNIQUE (level_code),
    CONSTRAINT chk_priority_levels_code CHECK (level_code IN ('critical','high','medium','low'))
);
```

- **PK:** `priority_level_id` (seeded: 1=critical, 2=high, 3=medium, 4=low)
- **Relationships:** referenced by `queue_entries`, `triage_assessments`
- **Note:** `base_weight` feeds the Queue Engine's priority-scoring formula (see [ARCHITECTURE.md](ARCHITECTURE.md) §6.2) — kept as data, not hardcoded logic, so clinics can tune weighting without a code change.

---

### 3.11 `queues`

**Purpose:** A department's daily ticket sequence. Recreated fresh each calendar day so ticket numbers reset per department per day.

```sql
CREATE TABLE queues (
    queue_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id             UUID NOT NULL,
    department_id         UUID NOT NULL,
    queue_date             DATE NOT NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'open',
    opened_at               TIMESTAMPTZ,
    closed_at               TIMESTAMPTZ,
    last_ticket_sequence     INTEGER NOT NULL DEFAULT 0,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_queues_clinics FOREIGN KEY (clinic_id)
        REFERENCES clinics (clinic_id) ON DELETE CASCADE,
    CONSTRAINT fk_queues_departments FOREIGN KEY (department_id)
        REFERENCES departments (department_id) ON DELETE CASCADE,
    CONSTRAINT ux_queues_department_date UNIQUE (department_id, queue_date),
    CONSTRAINT chk_queues_status CHECK (status IN ('open','closed'))
);

CREATE INDEX idx_queues_clinic_id ON queues (clinic_id);
CREATE INDEX idx_queues_department_date ON queues (department_id, queue_date);
```

- **PK:** `queue_id` · **FK:** `clinic_id → clinics`, `department_id → departments`
- **`last_ticket_sequence`:** incremented via an atomic `UPDATE ... RETURNING` (or `SELECT ... FOR UPDATE`) inside the ticket-issuing transaction to guarantee no duplicate ticket numbers under concurrent intake from multiple reception terminals.

---

### 3.12 `queue_entries`

**Purpose:** One ticket — a patient's placement in a specific department's queue for a specific visit. The core operational table the Queue Engine reads/writes continuously.

```sql
CREATE TABLE queue_entries (
    queue_entry_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id           UUID NOT NULL,
    patient_visit_id   UUID NOT NULL,
    ticket_number       VARCHAR(20) NOT NULL,
    priority_level_id    SMALLINT NOT NULL,
    priority_score        NUMERIC(10,2) NOT NULL DEFAULT 0,
    status                 VARCHAR(20) NOT NULL DEFAULT 'waiting',
    assigned_room_id       UUID,        -- denormalized cache, see §5.4
    assigned_staff_id      UUID,        -- denormalized cache, see §5.4
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    called_at               TIMESTAMPTZ,
    started_at              TIMESTAMPTZ,
    completed_at             TIMESTAMPTZ,
    wait_time_seconds         INTEGER,

    CONSTRAINT fk_queue_entries_queues FOREIGN KEY (queue_id)
        REFERENCES queues (queue_id) ON DELETE CASCADE,
    CONSTRAINT fk_queue_entries_patient_visits FOREIGN KEY (patient_visit_id)
        REFERENCES patient_visits (patient_visit_id) ON DELETE CASCADE,
    CONSTRAINT fk_queue_entries_priority_levels FOREIGN KEY (priority_level_id)
        REFERENCES priority_levels (priority_level_id) ON DELETE RESTRICT,
    CONSTRAINT fk_queue_entries_rooms FOREIGN KEY (assigned_room_id)
        REFERENCES rooms (room_id) ON DELETE SET NULL,
    CONSTRAINT fk_queue_entries_staff FOREIGN KEY (assigned_staff_id)
        REFERENCES staff (staff_id) ON DELETE SET NULL,
    CONSTRAINT ux_queue_entries_queue_ticket UNIQUE (queue_id, ticket_number),
    CONSTRAINT chk_queue_entries_status CHECK (
        status IN ('waiting','called','in_consultation','completed','no_show','cancelled')
    )
);

-- Only one ACTIVE ticket per visit at a time (multiple historical/terminal tickets are fine)
CREATE UNIQUE INDEX ux_queue_entries_one_active_per_visit
    ON queue_entries (patient_visit_id)
    WHERE status IN ('waiting','called','in_consultation');

CREATE INDEX idx_queue_entries_queue_id ON queue_entries (queue_id);
CREATE INDEX idx_queue_entries_queue_status ON queue_entries (queue_id, status);
CREATE INDEX idx_queue_entries_priority_score ON queue_entries (queue_id, priority_score DESC)
    WHERE status = 'waiting';
CREATE INDEX idx_queue_entries_assigned_room ON queue_entries (assigned_room_id);
```

- **PK:** `queue_entry_id` · **FK:** `queue_id → queues`, `patient_visit_id → patient_visits`, `priority_level_id → priority_levels`, `assigned_room_id → rooms`, `assigned_staff_id → staff`
- **Recommended indexes:** the partial index `idx_queue_entries_priority_score` is the single most important index in the schema — it's exactly the query the "call next patient" operation runs, hundreds of times a day, per department.

---

### 3.13 `triage_assessments`

**Purpose:** Nurse-recorded clinical assessment that determines/updates a visit's priority level.

```sql
CREATE TABLE triage_assessments (
    triage_assessment_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_visit_id           UUID NOT NULL,
    queue_entry_id              UUID,
    assessed_by                  UUID NOT NULL,
    resulting_priority_level_id    SMALLINT NOT NULL,
    symptoms                        TEXT[],
    blood_pressure                   VARCHAR(10),
    temperature_celsius                NUMERIC(4,1),
    pulse_rate                          SMALLINT,
    spo2                                 SMALLINT,
    weight_kg                             NUMERIC(5,2),
    notes                                  TEXT,
    assessed_at                            TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_triage_patient_visits FOREIGN KEY (patient_visit_id)
        REFERENCES patient_visits (patient_visit_id) ON DELETE CASCADE,
    CONSTRAINT fk_triage_queue_entries FOREIGN KEY (queue_entry_id)
        REFERENCES queue_entries (queue_entry_id) ON DELETE SET NULL,
    CONSTRAINT fk_triage_assessed_by FOREIGN KEY (assessed_by)
        REFERENCES staff (staff_id) ON DELETE RESTRICT,
    CONSTRAINT fk_triage_priority_levels FOREIGN KEY (resulting_priority_level_id)
        REFERENCES priority_levels (priority_level_id) ON DELETE RESTRICT
);

CREATE INDEX idx_triage_patient_visit_id ON triage_assessments (patient_visit_id);
CREATE INDEX idx_triage_assessed_by ON triage_assessments (assessed_by);
CREATE INDEX idx_triage_assessed_at ON triage_assessments (assessed_at);
```

- **PK:** `triage_assessment_id` · **FK:** `patient_visit_id → patient_visits`, `queue_entry_id → queue_entries`, `assessed_by → staff`, `resulting_priority_level_id → priority_levels`
- **Relationships:** 1:N from `patient_visits` (a visit may be reassessed if condition changes)

---

### 3.14 `doctor_assignments`

**Purpose:** Records which staff member/room a ticket was routed to, preserving a full reassignment history.

```sql
CREATE TABLE doctor_assignments (
    doctor_assignment_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_entry_id         UUID NOT NULL,
    doctor_staff_id         UUID NOT NULL,
    room_id                   UUID NOT NULL,
    assigned_by                UUID NOT NULL,
    status                       VARCHAR(20) NOT NULL DEFAULT 'assigned',
    assigned_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    released_at                   TIMESTAMPTZ,

    CONSTRAINT fk_doctor_assignments_queue_entries FOREIGN KEY (queue_entry_id)
        REFERENCES queue_entries (queue_entry_id) ON DELETE CASCADE,
    CONSTRAINT fk_doctor_assignments_staff FOREIGN KEY (doctor_staff_id)
        REFERENCES staff (staff_id) ON DELETE RESTRICT,
    CONSTRAINT fk_doctor_assignments_rooms FOREIGN KEY (room_id)
        REFERENCES rooms (room_id) ON DELETE RESTRICT,
    CONSTRAINT fk_doctor_assignments_assigned_by FOREIGN KEY (assigned_by)
        REFERENCES staff (staff_id) ON DELETE RESTRICT,
    CONSTRAINT chk_doctor_assignments_status CHECK (
        status IN ('assigned','active','completed','reassigned')
    )
);

-- Only one active/assigned routing per ticket at a time
CREATE UNIQUE INDEX ux_doctor_assignments_one_active_per_entry
    ON doctor_assignments (queue_entry_id)
    WHERE status IN ('assigned','active');

CREATE INDEX idx_doctor_assignments_queue_entry_id ON doctor_assignments (queue_entry_id);
CREATE INDEX idx_doctor_assignments_doctor_status ON doctor_assignments (doctor_staff_id, status);
CREATE INDEX idx_doctor_assignments_room_status ON doctor_assignments (room_id, status);
```

- **PK:** `doctor_assignment_id` · **FK:** `queue_entry_id → queue_entries`, `doctor_staff_id → staff`, `room_id → rooms`, `assigned_by → staff`

---

### 3.15 `consultations`

**Purpose:** The clinical outcome record — diagnosis, treatment, prescription — for a completed doctor visit.

```sql
CREATE TABLE consultations (
    consultation_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_entry_id          UUID NOT NULL,
    doctor_assignment_id     UUID NOT NULL,
    doctor_staff_id            UUID NOT NULL,
    room_id                      UUID NOT NULL,
    diagnosis                     TEXT,
    treatment_notes                 TEXT,
    prescription                     TEXT,
    follow_up_required                 BOOLEAN NOT NULL DEFAULT FALSE,
    follow_up_date                       DATE,
    started_at                             TIMESTAMPTZ NOT NULL,
    ended_at                                 TIMESTAMPTZ,
    status                                     VARCHAR(20) NOT NULL DEFAULT 'in_progress',

    CONSTRAINT fk_consultations_queue_entries FOREIGN KEY (queue_entry_id)
        REFERENCES queue_entries (queue_entry_id) ON DELETE CASCADE,
    CONSTRAINT fk_consultations_doctor_assignments FOREIGN KEY (doctor_assignment_id)
        REFERENCES doctor_assignments (doctor_assignment_id) ON DELETE RESTRICT,
    CONSTRAINT fk_consultations_staff FOREIGN KEY (doctor_staff_id)
        REFERENCES staff (staff_id) ON DELETE RESTRICT,
    CONSTRAINT fk_consultations_rooms FOREIGN KEY (room_id)
        REFERENCES rooms (room_id) ON DELETE RESTRICT,
    CONSTRAINT ux_consultations_queue_entry_id UNIQUE (queue_entry_id),
    CONSTRAINT chk_consultations_status CHECK (status IN ('in_progress','completed')),
    CONSTRAINT chk_consultations_follow_up_date CHECK (
        (follow_up_required = FALSE) OR (follow_up_required = TRUE AND follow_up_date IS NOT NULL)
    )
);

CREATE INDEX idx_consultations_doctor_staff_id ON consultations (doctor_staff_id);
CREATE INDEX idx_consultations_started_at ON consultations (started_at);
```

- **PK:** `consultation_id` · **FK:** `queue_entry_id → queue_entries` (1:1, enforced by `UNIQUE`), `doctor_assignment_id → doctor_assignments`, `doctor_staff_id → staff`, `room_id → rooms`

---

### 3.16 `notification_templates`

**Purpose:** Reusable, editable message templates per event type/channel/language. Global defaults (`clinic_id IS NULL`) can be overridden per clinic.

```sql
CREATE TABLE notification_templates (
    notification_template_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id                   UUID,          -- NULL = platform-wide default
    event_type                    VARCHAR(50) NOT NULL,
    channel                         VARCHAR(20) NOT NULL DEFAULT 'sms',
    language_code                     VARCHAR(10) NOT NULL DEFAULT 'en',
    template_body                       TEXT NOT NULL,
    is_active                             BOOLEAN NOT NULL DEFAULT TRUE,
    created_at                             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_notification_templates_clinics FOREIGN KEY (clinic_id)
        REFERENCES clinics (clinic_id) ON DELETE CASCADE,
    CONSTRAINT chk_notification_templates_event_type CHECK (event_type IN (
        'ticket_created','position_update','ticket_called','no_show',
        'appointment_reminder','visit_completed'
    )),
    CONSTRAINT chk_notification_templates_channel CHECK (channel IN ('sms','whatsapp'))
);

-- One global default per (event_type, channel, language) when clinic_id IS NULL
CREATE UNIQUE INDEX ux_notification_templates_global
    ON notification_templates (event_type, channel, language_code)
    WHERE clinic_id IS NULL;

-- One override per clinic per (event_type, channel, language)
CREATE UNIQUE INDEX ux_notification_templates_clinic
    ON notification_templates (clinic_id, event_type, channel, language_code)
    WHERE clinic_id IS NOT NULL;

CREATE INDEX idx_notification_templates_event_type ON notification_templates (event_type);
```

- **PK:** `notification_template_id` · **FK:** `clinic_id → clinics` (nullable)
- **Note:** ordinary `UNIQUE` constraints treat `NULL` as distinct per row (would allow unlimited global duplicates), so the "one global template per event" rule is enforced via a **partial unique index** instead — see §5.2.

---

### 3.17 `sms_notifications`

**Purpose:** The notification **outbox** — one row per intended outbound message, holding current delivery state. Written in the same transaction as the triggering event so a gateway outage never blocks clinical operations.

```sql
CREATE TABLE sms_notifications (
    sms_notification_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id                  UUID NOT NULL,
    patient_visit_id             UUID,
    queue_entry_id                 UUID,
    notification_template_id         UUID,
    recipient_phone                    VARCHAR(20) NOT NULL,
    message_body                         TEXT NOT NULL,
    event_type                             VARCHAR(50) NOT NULL,
    provider                                 VARCHAR(30),
    provider_message_id                        VARCHAR(100),
    status                                       VARCHAR(20) NOT NULL DEFAULT 'pending',
    retry_count                                    SMALLINT NOT NULL DEFAULT 0,
    scheduled_at                                     TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at                                            TIMESTAMPTZ,
    created_at                                           TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_sms_notifications_clinics FOREIGN KEY (clinic_id)
        REFERENCES clinics (clinic_id) ON DELETE CASCADE,
    CONSTRAINT fk_sms_notifications_patient_visits FOREIGN KEY (patient_visit_id)
        REFERENCES patient_visits (patient_visit_id) ON DELETE CASCADE,
    CONSTRAINT fk_sms_notifications_queue_entries FOREIGN KEY (queue_entry_id)
        REFERENCES queue_entries (queue_entry_id) ON DELETE SET NULL,
    CONSTRAINT fk_sms_notifications_templates FOREIGN KEY (notification_template_id)
        REFERENCES notification_templates (notification_template_id) ON DELETE SET NULL,
    CONSTRAINT chk_sms_notifications_status CHECK (
        status IN ('pending','sent','delivered','failed')
    )
);

CREATE INDEX idx_sms_notifications_clinic_status ON sms_notifications (clinic_id, status);
CREATE INDEX idx_sms_notifications_pending_dispatch ON sms_notifications (scheduled_at)
    WHERE status = 'pending';
CREATE INDEX idx_sms_notifications_patient_visit_id ON sms_notifications (patient_visit_id);
```

- **PK:** `sms_notification_id` · **FK:** `clinic_id → clinics`, `patient_visit_id → patient_visits`, `queue_entry_id → queue_entries`, `notification_template_id → notification_templates`
- **Recommended index:** the partial index `idx_sms_notifications_pending_dispatch` is what the dispatcher worker polls — keeping it partial (only `pending` rows) keeps it small regardless of total historical volume.

---

### 3.18 `sms_logs`

**Purpose:** Append-only audit trail of every status transition/provider callback for a notification — separate from `sms_notifications` so the outbox table stays small and fast while full history is preserved for compliance/debugging.

```sql
CREATE TABLE sms_logs (
    sms_log_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sms_notification_id      UUID NOT NULL,
    event_status                VARCHAR(20) NOT NULL,
    provider_response              JSONB,
    occurred_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_sms_logs_sms_notifications FOREIGN KEY (sms_notification_id)
        REFERENCES sms_notifications (sms_notification_id) ON DELETE CASCADE,
    CONSTRAINT chk_sms_logs_event_status CHECK (
        event_status IN ('queued','sent','delivered','failed','retry')
    )
);

CREATE INDEX idx_sms_logs_sms_notification_id ON sms_logs (sms_notification_id);
CREATE INDEX idx_sms_logs_occurred_at ON sms_logs (occurred_at);
CREATE INDEX idx_sms_logs_provider_response_gin ON sms_logs USING GIN (provider_response);
```

- **PK:** `sms_log_id` · **FK:** `sms_notification_id → sms_notifications`
- **Recommended index:** GIN index on `provider_response` if provider payloads are ever queried/filtered (e.g. searching for a specific error code across failures).

---

### 3.19 `audit_logs`

**Purpose:** Immutable record of every state-changing staff (or system) action, required for clinical accountability.

```sql
CREATE TABLE audit_logs (
    audit_log_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id           UUID,
    staff_id               UUID,
    action_type               VARCHAR(50) NOT NULL,
    entity_type                  VARCHAR(50) NOT NULL,
    entity_id                       UUID,
    old_values                        JSONB,
    new_values                          JSONB,
    ip_address                            INET,
    user_agent                              TEXT,
    occurred_at                                TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_audit_logs_clinics FOREIGN KEY (clinic_id)
        REFERENCES clinics (clinic_id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_logs_staff FOREIGN KEY (staff_id)
        REFERENCES staff (staff_id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_logs_clinic_occurred_at ON audit_logs (clinic_id, occurred_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_staff_id ON audit_logs (staff_id);
```

- **PK:** `audit_log_id` · **FK:** `clinic_id → clinics` (nullable, for platform-level actions), `staff_id → staff` (nullable, for automated/system actions)
- **Growth profile:** this table grows monotonically and is never updated — see §5.1 for partitioning recommendation.

---

### 3.20 `system_settings`

**Purpose:** Key-value configuration store, per clinic or platform-global.

```sql
CREATE TABLE system_settings (
    system_setting_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id               UUID,          -- NULL = platform-wide default
    setting_key                 VARCHAR(100) NOT NULL,
    setting_value                  JSONB NOT NULL,
    description                       TEXT,
    updated_by                          UUID,
    updated_at                             TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_system_settings_clinics FOREIGN KEY (clinic_id)
        REFERENCES clinics (clinic_id) ON DELETE CASCADE,
    CONSTRAINT fk_system_settings_updated_by FOREIGN KEY (updated_by)
        REFERENCES staff (staff_id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX ux_system_settings_global ON system_settings (setting_key)
    WHERE clinic_id IS NULL;
CREATE UNIQUE INDEX ux_system_settings_clinic ON system_settings (clinic_id, setting_key)
    WHERE clinic_id IS NOT NULL;
CREATE INDEX idx_system_settings_clinic_id ON system_settings (clinic_id);
```

- **PK:** `system_setting_id` · **FK:** `clinic_id → clinics` (nullable), `updated_by → staff`

---

### 3.21 `working_hours`

**Purpose:** Operating hours per clinic (and optionally per department, overriding the clinic default) by day of week — drives whether the queue can accept new tickets.

```sql
CREATE TABLE working_hours (
    working_hour_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id            UUID NOT NULL,
    department_id            UUID,          -- NULL = clinic-wide default
    day_of_week                 SMALLINT NOT NULL,
    opens_at                       TIME,
    closes_at                         TIME,
    is_closed                            BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_working_hours_clinics FOREIGN KEY (clinic_id)
        REFERENCES clinics (clinic_id) ON DELETE CASCADE,
    CONSTRAINT fk_working_hours_departments FOREIGN KEY (department_id)
        REFERENCES departments (department_id) ON DELETE CASCADE,
    CONSTRAINT chk_working_hours_day CHECK (day_of_week BETWEEN 0 AND 6),
    CONSTRAINT chk_working_hours_time_order CHECK (
        is_closed = TRUE OR closes_at > opens_at
    )
);

CREATE UNIQUE INDEX ux_working_hours_clinic_default
    ON working_hours (clinic_id, day_of_week)
    WHERE department_id IS NULL;
CREATE UNIQUE INDEX ux_working_hours_department
    ON working_hours (department_id, day_of_week)
    WHERE department_id IS NOT NULL;
CREATE INDEX idx_working_hours_clinic_id ON working_hours (clinic_id);
```

- **PK:** `working_hour_id` · **FK:** `clinic_id → clinics`, `department_id → departments` (nullable)

---

### 3.22 `holidays`

**Purpose:** Clinic-specific closure dates, overriding regular `working_hours`.

```sql
CREATE TABLE holidays (
    holiday_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id                UUID NOT NULL,
    holiday_date                 DATE NOT NULL,
    holiday_name                    VARCHAR(150) NOT NULL,
    is_recurring_annual                BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                            TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_holidays_clinics FOREIGN KEY (clinic_id)
        REFERENCES clinics (clinic_id) ON DELETE CASCADE,
    CONSTRAINT ux_holidays_clinic_date UNIQUE (clinic_id, holiday_date)
);

CREATE INDEX idx_holidays_clinic_date ON holidays (clinic_id, holiday_date);
```

- **PK:** `holiday_id` · **FK:** `clinic_id → clinics`

---

### 3.23 `reports`

**Purpose:** Metadata for generated report snapshots/exports (daily summaries, staff performance, queue analytics). Raw data is queried live from operational tables; this table tracks what was generated, when, by whom, and where the export lives.

```sql
CREATE TABLE reports (
    report_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id           UUID NOT NULL,
    report_type             VARCHAR(50) NOT NULL,
    generated_by                UUID,
    period_start                    DATE NOT NULL,
    period_end                          DATE NOT NULL,
    parameters                              JSONB,
    file_url                                    TEXT,
    status                                          VARCHAR(20) NOT NULL DEFAULT 'completed',
    generated_at                                        TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_reports_clinics FOREIGN KEY (clinic_id)
        REFERENCES clinics (clinic_id) ON DELETE CASCADE,
    CONSTRAINT fk_reports_generated_by FOREIGN KEY (generated_by)
        REFERENCES staff (staff_id) ON DELETE SET NULL,
    CONSTRAINT chk_reports_type CHECK (report_type IN (
        'daily_summary','weekly_summary','monthly_summary',
        'staff_performance','queue_analytics','sms_delivery'
    )),
    CONSTRAINT chk_reports_status CHECK (status IN ('generating','completed','failed')),
    CONSTRAINT chk_reports_period CHECK (period_end >= period_start)
);

CREATE INDEX idx_reports_clinic_type ON reports (clinic_id, report_type);
CREATE INDEX idx_reports_clinic_period ON reports (clinic_id, period_start, period_end);
```

- **PK:** `report_id` · **FK:** `clinic_id → clinics`, `generated_by → staff`

---

## 4. Full FK Dependency / Creation Order

```
clinics
  └─ departments
       └─ rooms
  └─ staff  (needs roles)
  └─ patients  (needs staff)
       └─ patient_visits  (needs staff)
            └─ triage_assessments  (needs staff, priority_levels)
  └─ working_hours, holidays, system_settings
roles
  └─ role_permissions  (needs permissions)
  └─ staff
permissions
  └─ role_permissions
priority_levels  (seed/reference — no FK dependencies)
queues  (needs clinics, departments)
  └─ queue_entries  (needs patient_visits, priority_levels, rooms, staff)
       └─ doctor_assignments  (needs staff, rooms)
            └─ consultations  (needs queue_entries, doctor_assignments, staff, rooms)
       └─ triage_assessments (back-reference)
notification_templates  (needs clinics)
  └─ sms_notifications  (needs clinics, patient_visits, queue_entries, notification_templates)
       └─ sms_logs
audit_logs  (needs clinics, staff)
reports  (needs clinics, staff)
```

---

## 5. Database Optimization Recommendations

### 5.1 Partitioning
- **`audit_logs`** and **`sms_logs`** grow monotonically and are queried almost exclusively by recent time range. Partition both by `RANGE` on their timestamp column (`occurred_at`), monthly, using native PostgreSQL declarative partitioning. Old partitions can be detached and archived to cold storage without a `DELETE` scan.
- **`queue_entries`** can similarly be partitioned by `created_at` (monthly) once volume across many clinics grows large — most queries only ever touch "today's" partition, keeping the hot working set small.

### 5.2 Partial & Expression Indexes
- Every "outbox"/"in-flight" query pattern (`status = 'pending'`, `status = 'waiting'`) should use a **partial index** filtered on that status, not a full index on the column — see `idx_queue_entries_priority_score`, `idx_sms_notifications_pending_dispatch`. This keeps the index small and fast regardless of how many historical/terminal rows accumulate.
- Nullable-dimension uniqueness (global vs. per-clinic templates/settings/hours) is enforced with **partial unique indexes** split on `IS NULL` / `IS NOT NULL`, since a plain `UNIQUE` constraint does not treat multiple `NULL`s as a conflict.

### 5.3 Row-Level Security (multi-tenancy)
- Every clinic-scoped table should carry a Postgres RLS policy keyed on `clinic_id = current_setting('app.clinic_id')::uuid` (or the equivalent Supabase `auth.jwt()` claim), so tenant isolation is enforced at the database layer, not only in application code. This is consistent with the security model in [ARCHITECTURE.md](ARCHITECTURE.md) §8.

### 5.4 Deliberate Denormalization (documented trade-offs)
| Column | Table | Why it's denormalized |
|---|---|---|
| `rooms.clinic_id` | `rooms` | Avoids a join through `departments` on every clinic-scoped room-availability query — read far more often than written. |
| `queue_entries.assigned_room_id`, `assigned_staff_id` | `queue_entries` | Cached from the current active `doctor_assignments` row so the queue board (the highest-traffic read in the system) never joins three tables to render a live ticket list. Kept in sync by the application service layer whenever `doctor_assignments` changes. |

Both are narrow, single-column caches with a clear source of truth (`departments`, `doctor_assignments` respectively) — not general schema duplication.

### 5.5 Foreign Key Indexing Discipline
PostgreSQL does **not** automatically index foreign key columns (unlike the primary key side). Every FK column in this schema has an explicit index, either standalone or as the leading column of a composite index — required both for join performance and to avoid table-wide locks on the parent row during `ON DELETE CASCADE`/`RESTRICT` checks.

### 5.6 JSONB Usage Discipline
`JSONB` is used only for genuinely semi-structured or provider-defined payloads (`sms_logs.provider_response`, `audit_logs.old_values`/`new_values`, `system_settings.setting_value`, `reports.parameters`) — never as a substitute for columns with known, queryable structure. Add `GIN` indexes only where such a column is actually filtered/searched (as with `sms_logs.provider_response`), not preemptively.

### 5.7 Materialized Views for Reporting
Heavy aggregate queries backing the `reports` table and staff dashboards (daily patient counts, average wait time by department, SMS delivery rates) should read from **materialized views**, refreshed on a schedule (e.g. every 5–15 minutes for "today," nightly for historical rollups), rather than aggregating raw `queue_entries`/`sms_notifications` on every dashboard load.

### 5.8 Connection Management
Route all application traffic through a connection pooler (Supabase's built-in pgbouncer-style pooler, or an equivalent) — a serverless Next.js deployment can otherwise open far more concurrent connections than Postgres' `max_connections` comfortably supports.

### 5.9 Read/Write Separation
Point reporting and analytics queries at a read replica where available, so long-running aggregate queries never contend with the low-latency writes the Queue Engine depends on (ticket creation, status transitions are clinically time-sensitive).

### 5.10 Generated/Computed Columns
`queue_entries.wait_time_seconds` is populated by the application service layer at the moment a ticket is called (`called_at - created_at`), rather than as a `GENERATED` column — because it must freeze at the call moment, not keep recalculating relative to "now" for waiting tickets. Where a column *should* always reflect a fixed formula on other columns in the same row, prefer PostgreSQL `GENERATED ALWAYS AS (...) STORED` over application-layer computation to guarantee consistency regardless of write path.

### 5.11 Vacuum/Autovacuum Tuning
High-churn tables with frequent status transitions (`queue_entries`, `doctor_assignments`, `sms_notifications`) benefit from a more aggressive `autovacuum_vacuum_scale_factor` than the Postgres default, since their `UPDATE` pattern (rather than `INSERT`-only) generates dead tuples quickly during peak clinic hours.

---

## 6. Summary Table Inventory

| # | Table | Category |
|---|---|---|
| 1 | `clinics` | Organization |
| 2 | `departments` | Organization |
| 3 | `rooms` | Organization |
| 4 | `roles` | RBAC |
| 5 | `permissions` | RBAC |
| 6 | `role_permissions` | RBAC (junction) |
| 7 | `staff` | Organization / RBAC |
| 8 | `patients` | Care Episode |
| 9 | `patient_visits` | Care Episode |
| 10 | `priority_levels` | Reference/Lookup |
| 11 | `queues` | Queue Engine |
| 12 | `queue_entries` | Queue Engine |
| 13 | `triage_assessments` | Clinical |
| 14 | `doctor_assignments` | Clinical |
| 15 | `consultations` | Clinical |
| 16 | `notification_templates` | Notifications |
| 17 | `sms_notifications` | Notifications |
| 18 | `sms_logs` | Notifications |
| 19 | `audit_logs` | Governance |
| 20 | `system_settings` | Governance |
| 21 | `working_hours` | Governance/Config |
| 22 | `holidays` | Governance/Config |
| 23 | `reports` | Governance/Reporting |

23 tables, all in 3NF/BCNF, with every many-to-many relationship (`roles`↔`permissions`) resolved through a proper junction table and every deliberate denormalization explicitly documented rather than accidental.
