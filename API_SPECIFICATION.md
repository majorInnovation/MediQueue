# MediQueue — REST API Specification
### Django REST Framework — Staff-Only Backend, No Patient-Facing Endpoints

**Scope:** API specification only — no code. Endpoint contracts for the domain model in [DATABASE_DESIGN.md](DATABASE_DESIGN.md), enforcing the roles/permissions in [SECURITY_AUTH_DESIGN.md](SECURITY_AUTH_DESIGN.md) and the workflow rules in [CLINICAL_WORKFLOW_DESIGN.md](CLINICAL_WORKFLOW_DESIGN.md). This catalog targets a Django REST Framework implementation specifically (per this request) — see [SECURITY_AUTH_DESIGN.md](SECURITY_AUTH_DESIGN.md) §13.2 for the DRF/SimpleJWT/Groups-as-Roles mapping this API layer assumes.

**Ground rule:** there is no endpoint anywhere in this catalog that a patient calls, authenticates against, or receives a token for. Every request carries a staff JWT; the only patient-originating HTTP traffic in the whole system is an inbound SMS-provider webhook (§11.6), which is not a patient using an API — it's a phone network delivering a text message.

---

## 0. API Conventions (apply to every endpoint below unless overridden)

| Convention | Value |
|---|---|
| Base URL | `/api/v1/` |
| Trailing slash | Required on every endpoint (DRF default: `APPEND_SLASH`) |
| Auth header | `Authorization: Bearer <access_token>` (JWT, via `djangorestframework-simplejwt`) |
| Content type | `application/json` for all request/response bodies |
| List response envelope | `{ "count": int, "next": url|null, "previous": url|null, "results": [ ... ] }` (DRF `PageNumberPagination`, default page size 20) |
| Single-object response envelope | The object itself, no wrapper |
| Validation error envelope | `{ "field_name": ["error message"] }` per DRF default `ValidationError` serialization |
| Non-field / auth / permission error envelope | `{ "detail": "message" }` |
| Filtering | Query params matching field names, e.g. `?status=waiting&department_id=<uuid>` |
| Search | `?search=<term>` where noted (DRF `SearchFilter`) |
| Ordering | `?ordering=field` / `?ordering=-field` where noted |
| Tenant scoping | **Every** endpoint except platform-level Super Admin endpoints is implicitly filtered to `request.user.staff.clinic_id` at the queryset level — a staff member can never retrieve, list, or mutate another clinic's rows, enforced identically regardless of what the URL/query params request |

### 0.1 Common Error Responses (referenced by code in every section below, not repeated in full each time)

| Code | Meaning | Body |
|---|---|---|
| `400` | Validation failed | `{ "field": ["reason"] }` |
| `401` | Missing, expired, or invalid access token | `{ "detail": "Authentication credentials were not provided." }` |
| `403` | Authenticated but lacks the required permission, or the target row belongs to a different clinic | `{ "detail": "You do not have permission to perform this action." }` |
| `404` | Resource does not exist **or** exists in another tenant (never distinguished — see §0.2) | `{ "detail": "Not found." }` |
| `409` | Conflicts with a uniqueness/state constraint (e.g. duplicate active ticket, stale status transition) | `{ "detail": "..." }` |
| `423` | Account locked (auth endpoints only) | `{ "detail": "Account locked. Contact your administrator." }` |
| `429` | Rate-limited (auth + SMS endpoints) | `{ "detail": "Too many requests. Try again in N seconds." }` |
| `500` | Unhandled server error | `{ "detail": "Internal server error." }` |

### 0.2 Tenant-Isolation Error Discipline

A request for another clinic's resource returns **`404`, never `403`** — per [SECURITY_AUTH_DESIGN.md](SECURITY_AUTH_DESIGN.md) §3's defense-in-depth model, the queryset-level RLS-equivalent filter means the row is simply absent from what that user's ORM manager can see, so the API cannot distinguish "doesn't exist" from "exists elsewhere" and must not leak which via the response code.

### 0.3 Permission Class Reference

Maps directly to the role matrix in [SECURITY_AUTH_DESIGN.md](SECURITY_AUTH_DESIGN.md) §2. Referenced by shorthand in every endpoint's **Permissions** field below.

| Shorthand | DRF permission class | Grants |
|---|---|---|
| `SuperAdmin` | `IsSuperAdministrator` | Platform-wide |
| `ClinicAdmin` | `IsClinicAdministrator` | Own clinic, administrative scope |
| `Receptionist` | `IsReceptionist` | Own clinic, front-desk scope |
| `Nurse` | `IsNurse` | Own clinic, triage/queue scope |
| `Doctor` | `IsDoctor` | Own clinic, consultation scope |
| `AnyStaff` | `IsAuthenticated` | Any authenticated staff role, own clinic |
| `Public` | `AllowAny` | No authentication (login, password reset request, provider webhooks only) |

---

## 1. Authentication

### `POST /api/v1/auth/login/`
- **Purpose:** Authenticate a staff member and issue access/refresh tokens.
- **Auth required:** No · **Permissions:** `Public`
- **Request body:** `{ "email": string, "password": string, "totp_code": string (optional, required for ClinicAdmin/SuperAdmin) }`
- **Response `200`:** `{ "access": string, "refresh": string, "staff": { "id", "full_name", "role", "clinic_id" } }`
- **Validation:** `email` valid format; `password` non-empty; generic `"Invalid email or password"` message for both wrong-password and unknown-email cases (enumeration prevention, per [SECURITY_AUTH_DESIGN.md](SECURITY_AUTH_DESIGN.md) §5)
- **Errors:** `400` (missing fields), `401` (bad credentials), `423` (account locked), `429` (too many attempts)

### `POST /api/v1/auth/refresh/`
- **Purpose:** Exchange a valid refresh token for a new access token (and rotated refresh token).
- **Auth required:** No (refresh token itself is the credential) · **Permissions:** `Public`
- **Request body:** `{ "refresh": string }`
- **Response `200`:** `{ "access": string, "refresh": string }`
- **Validation:** refresh token must be unexpired and not already superseded (rotation reuse-detection, §SECURITY_AUTH_DESIGN.md §4)
- **Errors:** `401` (expired/invalid/reused token — reuse triggers full session revocation server-side)

### `POST /api/v1/auth/logout/`
- **Purpose:** Revoke the current refresh token and end the session.
- **Auth required:** Yes · **Permissions:** `AnyStaff`
- **Request body:** `{ "refresh": string }`
- **Response `204`:** empty
- **Errors:** `401`

### `POST /api/v1/auth/logout-all/`
- **Purpose:** Revoke every outstanding refresh token for the current account.
- **Auth required:** Yes · **Permissions:** `AnyStaff`
- **Response `204`:** empty
- **Errors:** `401`

### `POST /api/v1/auth/password-reset/request/`
- **Purpose:** Begin self-service password reset.
- **Auth required:** No · **Permissions:** `Public`
- **Request body:** `{ "email": string }`
- **Response `200`:** `{ "detail": "If that email is registered, a reset link has been sent." }` — **always** this exact response, regardless of whether the email exists
- **Errors:** `400` (malformed email), `429`

### `POST /api/v1/auth/password-reset/confirm/`
- **Purpose:** Complete a password reset using the emailed token.
- **Auth required:** No (token is the credential) · **Permissions:** `Public`
- **Request body:** `{ "token": string, "new_password": string }`
- **Response `200`:** `{ "detail": "Password updated. Please log in." }`
- **Validation:** token unexpired (≤30 min) and unused; password ≥12 chars, not breach-listed, not equal to previous password (§SECURITY_AUTH_DESIGN.md §7)
- **Errors:** `400` (weak password), `401` (invalid/expired/used token)
- **Side effect:** revokes all existing sessions for the account

### `POST /api/v1/auth/password-change/`
- **Purpose:** Authenticated user changes their own known password.
- **Auth required:** Yes · **Permissions:** `AnyStaff`
- **Request body:** `{ "current_password": string, "new_password": string }`
- **Response `200`:** `{ "detail": "Password updated." }`
- **Validation:** `current_password` must verify; `new_password` per policy above
- **Errors:** `400`, `401`

### `GET /api/v1/auth/me/`
- **Purpose:** Return the authenticated staff member's profile, role, and clinic context — the client's source of truth for what UI to render.
- **Auth required:** Yes · **Permissions:** `AnyStaff`
- **Response `200`:** `{ "id", "full_name", "email", "role", "clinic": {"id","name"}, "department_id", "permissions": [string] }`
- **Errors:** `401`

---

## 2. User Accounts *(auth-identity layer, distinct from the Staff clinical profile — §3)*

### `GET /api/v1/users/{id}/`
- **Purpose:** Retrieve the account-level record (email, active/locked state) behind a staff profile.
- **Auth required:** Yes · **Permissions:** `ClinicAdmin` (own clinic's users), `SuperAdmin` (any)
- **Response `200`:** `{ "id", "email", "is_active", "is_locked", "last_login_at", "failed_login_attempts" }`
- **Errors:** `401`, `403`, `404`

### `POST /api/v1/users/{id}/lock/`
- **Purpose:** Manually lock an account (security incident, lost device).
- **Auth required:** Yes · **Permissions:** `ClinicAdmin`, `SuperAdmin`
- **Request body:** `{ "reason": string }`
- **Response `200`:** `{ "detail": "Account locked." }`
- **Validation:** `reason` mandatory — every lock is audit-logged with justification
- **Errors:** `401`, `403`, `404`

### `POST /api/v1/users/{id}/unlock/`
- **Purpose:** Manually clear a lock and reset the failed-attempt counter.
- **Auth required:** Yes · **Permissions:** `ClinicAdmin`, `SuperAdmin`
- **Response `200`:** `{ "detail": "Account unlocked." }`
- **Errors:** `401`, `403`, `404`, `409` (account isn't currently locked)

### `POST /api/v1/users/{id}/force-password-reset/`
- **Purpose:** Administrator-initiated reset — flags `must_change_password` and invalidates current sessions.
- **Auth required:** Yes · **Permissions:** `ClinicAdmin`, `SuperAdmin`
- **Response `200`:** `{ "detail": "Password reset issued. Staff member must set a new password on next login." }`
- **Errors:** `401`, `403`, `404`
- **Audit:** logged as `password_reset_admin_forced` with both actor and target staff IDs (§SECURITY_AUTH_DESIGN.md §7)

---

## 3. Staff

### `GET /api/v1/staff/`
- **Purpose:** List staff in the caller's clinic.
- **Auth required:** Yes · **Permissions:** `ClinicAdmin` (full list), `AnyStaff` (own-clinic directory, name/role/department only — see field-level note)
- **Query params:** `role`, `department_id`, `is_active`, `search` (name/employee_code)
- **Response `200`:** paginated list of `{ "id", "full_name", "role", "department", "employee_code", "is_active" }`
- **Errors:** `401`

### `POST /api/v1/staff/`
- **Purpose:** Provision a new staff account (creates both the `User` account and `Staff` profile).
- **Auth required:** Yes · **Permissions:** `ClinicAdmin` (own clinic, roles below Clinic Administrator, or peer Clinic Administrator), `SuperAdmin` (any clinic, any role)
- **Request body:** `{ "full_name", "email", "phone", "role_id", "department_id" (optional), "employee_code" }`
- **Response `201`:** the created staff object; a temporary credential/invite flow is triggered, not a returned plaintext password
- **Validation:** `email` unique platform-wide; `employee_code` unique within clinic; `role_id` must not be `super_administrator` unless caller is `SuperAdmin`
- **Errors:** `400`, `401`, `403` (attempting to create a role above caller's authority), `409` (duplicate email/employee_code)

### `GET /api/v1/staff/{id}/`
- **Purpose:** Retrieve a single staff profile.
- **Auth required:** Yes · **Permissions:** `ClinicAdmin`, or `AnyStaff` viewing their own record
- **Response `200`:** full staff object
- **Errors:** `401`, `403`, `404`

### `PATCH /api/v1/staff/{id}/`
- **Purpose:** Update staff profile fields (name, phone, department).
- **Auth required:** Yes · **Permissions:** `ClinicAdmin`
- **Request body:** partial `{ "full_name", "phone", "department_id" }`
- **Response `200`:** updated object
- **Errors:** `400`, `401`, `403`, `404`

### `DELETE /api/v1/staff/{id}/`
- **Purpose:** Deactivate (soft-delete) a staff account — never a hard delete, per [DATABASE_DESIGN.md](DATABASE_DESIGN.md) `ON DELETE RESTRICT` design.
- **Auth required:** Yes · **Permissions:** `ClinicAdmin`
- **Response `204`:** empty
- **Validation:** cannot deactivate the last active `Clinic Administrator` of a clinic
- **Errors:** `401`, `403`, `404`, `409` (last-admin guard)
- **Side effect:** revokes all active sessions for that account

### `POST /api/v1/staff/{id}/assign-role/`
- **Purpose:** Change a staff member's role.
- **Auth required:** Yes · **Permissions:** `ClinicAdmin`, `SuperAdmin`
- **Request body:** `{ "role_id": uuid }`
- **Response `200`:** updated staff object
- **Validation:** cannot assign `super_administrator` unless caller is `SuperAdmin`
- **Errors:** `400`, `401`, `403`, `404`
- **Audit:** logged as `role_changed` with old/new role and actor

### `GET /api/v1/staff/{id}/activity/`
- **Purpose:** Staff member's own audit trail (or, for `ClinicAdmin`, any staff in their clinic).
- **Auth required:** Yes · **Permissions:** `AnyStaff` (self only), `ClinicAdmin` (any in clinic)
- **Query params:** `date_from`, `date_to`, `action_type`
- **Response `200`:** paginated `audit_logs` entries
- **Errors:** `401`, `403`, `404`

---

## 4. Clinics

### `GET /api/v1/clinics/`
- **Purpose:** List clinics.
- **Auth required:** Yes · **Permissions:** `SuperAdmin` (all clinics), `ClinicAdmin`/`AnyStaff` (own clinic only, single-item result)
- **Response `200`:** paginated clinic list
- **Errors:** `401`

### `POST /api/v1/clinics/`
- **Purpose:** Onboard a new clinic tenant.
- **Auth required:** Yes · **Permissions:** `SuperAdmin`
- **Request body:** `{ "clinic_name", "clinic_code", "address", "phone", "email", "timezone" }`
- **Response `201`:** created clinic object
- **Validation:** `clinic_code` unique platform-wide
- **Errors:** `400`, `401`, `403`, `409`

### `GET /api/v1/clinics/{id}/`
- **Purpose:** Retrieve clinic detail.
- **Auth required:** Yes · **Permissions:** `SuperAdmin`, `ClinicAdmin` (own), `AnyStaff` (own, read-only subset)
- **Response `200`:** clinic object
- **Errors:** `401`, `403`, `404`

### `PATCH /api/v1/clinics/{id}/`
- **Purpose:** Update clinic profile (name, address, contact, logo — **not** color/theme, per design mandate).
- **Auth required:** Yes · **Permissions:** `ClinicAdmin` (own), `SuperAdmin` (any)
- **Request body:** partial clinic fields
- **Response `200`:** updated clinic object
- **Errors:** `400`, `401`, `403`, `404`

### `DELETE /api/v1/clinics/{id}/`
- **Purpose:** Deactivate a clinic tenant (soft).
- **Auth required:** Yes · **Permissions:** `SuperAdmin`
- **Response `204`:** empty
- **Errors:** `401`, `403`, `404`

### `GET /api/v1/clinics/{id}/working-hours/` · `PUT /api/v1/clinics/{id}/working-hours/`
- **Purpose:** Retrieve/replace the clinic's weekly operating-hours set.
- **Auth required:** Yes · **Permissions:** `ClinicAdmin`
- **Request body (PUT):** array of `{ "day_of_week": 0-6, "opens_at", "closes_at", "is_closed" }`
- **Response `200`:** current working-hours array
- **Validation:** `closes_at > opens_at` unless `is_closed`; exactly one row per `day_of_week`
- **Errors:** `400`, `401`, `403`, `404`

### `GET /api/v1/clinics/{id}/holidays/` · `POST /api/v1/clinics/{id}/holidays/`
- **Purpose:** List/add clinic closure dates.
- **Auth required:** Yes · **Permissions:** `ClinicAdmin`
- **Request body (POST):** `{ "holiday_date", "holiday_name", "is_recurring_annual" }`
- **Response `201`:** created holiday
- **Validation:** unique `(clinic, holiday_date)`
- **Errors:** `400`, `401`, `403`, `409`

---

## 5. Departments & Rooms

### `GET /api/v1/departments/`
- **Purpose:** List departments in the caller's clinic.
- **Auth required:** Yes · **Permissions:** `AnyStaff`
- **Query params:** `is_active`
- **Response `200`:** paginated department list, each including a nested room count
- **Errors:** `401`

### `POST /api/v1/departments/`
- **Purpose:** Create a department.
- **Auth required:** Yes · **Permissions:** `ClinicAdmin`
- **Request body:** `{ "department_name", "department_code", "description" }`
- **Response `201`:** created department
- **Validation:** unique `(clinic, department_code)` and `(clinic, department_name)`
- **Errors:** `400`, `401`, `403`, `409`

### `GET /api/v1/departments/{id}/` · `PATCH /api/v1/departments/{id}/` · `DELETE /api/v1/departments/{id}/`
- **Purpose:** Retrieve / update / deactivate a department.
- **Auth required:** Yes · **Permissions:** `AnyStaff` (GET), `ClinicAdmin` (PATCH/DELETE)
- **Errors:** `400`, `401`, `403`, `404`, `409` (DELETE blocked if active queues/rooms reference it)

### `GET /api/v1/departments/{id}/rooms/` · `POST /api/v1/departments/{id}/rooms/`
- **Purpose:** List/create rooms within a department.
- **Auth required:** Yes · **Permissions:** `AnyStaff` (GET), `ClinicAdmin` (POST)
- **Request body (POST):** `{ "room_number", "room_type" }`
- **Response `201`:** created room
- **Validation:** `room_type ∈ {consultation, triage, procedure, emergency}`; unique `(department, room_number)`
- **Errors:** `400`, `401`, `403`, `409`

### `PATCH /api/v1/rooms/{id}/` · `DELETE /api/v1/rooms/{id}/`
- **Purpose:** Update/deactivate a room.
- **Auth required:** Yes · **Permissions:** `ClinicAdmin`
- **Errors:** `400`, `401`, `403`, `404`

---

## 6. Patients

### `GET /api/v1/patients/`
- **Purpose:** Search patients within the caller's clinic (for repeat-visit recognition).
- **Auth required:** Yes · **Permissions:** `Receptionist`, `Nurse`, `Doctor`, `ClinicAdmin`
- **Query params:** `search` (name or phone, partial match), `phone` (exact)
- **Response `200`:** paginated `{ "id", "full_name", "phone", "date_of_birth" }` — demographic list only, no clinical history in the list view
- **Errors:** `401`, `403`

### `POST /api/v1/patients/`
- **Purpose:** Register a new patient record (physical intake — never self-service).
- **Auth required:** Yes · **Permissions:** `Receptionist`
- **Request body:** `{ "full_name", "phone", "date_of_birth", "gender", "national_id" (optional), "address" (optional), "emergency_contact_name" (optional), "emergency_contact_phone" (optional), "allergies" (optional array), "blood_type" (optional) }`
- **Response `201`:** created patient object
- **Validation:** `phone` mandatory, E.164-normalizable format (§CLINICAL_WORKFLOW_DESIGN.md VR-01); `full_name` non-empty; `gender ∈ {male,female,other}` if provided
- **Errors:** `400`, `401`, `403`, `409` (phone already registered in this clinic — response includes the existing `patient_id` so the client can redirect to reuse rather than duplicate, per BR-02)

### `GET /api/v1/patients/{id}/` · `PATCH /api/v1/patients/{id}/`
- **Purpose:** Retrieve / update demographic details.
- **Auth required:** Yes · **Permissions:** GET: `Receptionist`, `Nurse`, `Doctor`, `ClinicAdmin`; PATCH: `Receptionist`
- **Errors:** `400`, `401`, `403`, `404`

### `GET /api/v1/patients/lookup/`
- **Purpose:** Fast exact-phone lookup at the front desk, distinct from the fuzzy `search` on the list endpoint — optimized for the "returning patient" flow.
- **Auth required:** Yes · **Permissions:** `Receptionist`
- **Query params:** `phone` (required, exact)
- **Response `200`:** matching patient object, or `204` (no body) if none found
- **Errors:** `400` (missing/malformed phone), `401`, `403`

---

## 7. Visits

### `POST /api/v1/visits/intake/`
- **Purpose:** Composite front-desk action — look up-or-create the patient **and** open a new visit in one atomic call, matching the real reception workflow ([CLINICAL_WORKFLOW_DESIGN.md](CLINICAL_WORKFLOW_DESIGN.md) §2.2).
- **Auth required:** Yes · **Permissions:** `Receptionist`
- **Request body:** `{ "patient": { ...as in §6 POST, or "existing_patient_id" }, "visit_type": "walk_in"|"appointment", "visit_reason" (optional) }`
- **Response `201`:** `{ "patient": {...}, "visit": {...} }`
- **Validation:** as §6 POST, plus `visit_type ∈ {walk_in, appointment}`
- **Errors:** `400`, `401`, `403`

### `GET /api/v1/visits/`
- **Purpose:** List visits.
- **Auth required:** Yes · **Permissions:** `AnyStaff`
- **Query params:** `status`, `patient_id`, `date_from`, `date_to`
- **Response `200`:** paginated visit list
- **Errors:** `401`

### `GET /api/v1/visits/{id}/`
- **Purpose:** Retrieve a visit, including its full `queue_entries` history (all department hops).
- **Auth required:** Yes · **Permissions:** `AnyStaff`
- **Response `200`:** visit object with nested `queue_entries: [...]`
- **Errors:** `401`, `404`

### `PATCH /api/v1/visits/{id}/`
- **Purpose:** Update visit status (e.g. manual cancellation).
- **Auth required:** Yes · **Permissions:** `Receptionist`, `ClinicAdmin`
- **Request body:** `{ "status": "cancelled" }`
- **Errors:** `400`, `401`, `403`, `404`, `409` (cannot cancel a visit with an `in_consultation` ticket)

### `POST /api/v1/visits/{id}/transfer/`
- **Purpose:** Department transfer — closes the current active `queue_entry` and opens a new one in the target department, same visit ([CLINICAL_WORKFLOW_DESIGN.md](CLINICAL_WORKFLOW_DESIGN.md) §8.5).
- **Auth required:** Yes · **Permissions:** `Doctor`, `Nurse`
- **Request body:** `{ "target_department_id": uuid, "reason": string, "carry_over_priority": boolean }`
- **Response `201`:** the newly created `queue_entry`
- **Validation:** visit must have an active `queue_entry` in `completed`-eligible state (i.e. consultation just finished); `target_department_id` must be active and in the same clinic
- **Errors:** `400`, `401`, `403`, `404`, `409` (no completed source entry to transfer from)
- **Side effect:** triggers the Transfer Notice SMS ([SMS_NOTIFICATION_SYSTEM_DESIGN.md](SMS_NOTIFICATION_SYSTEM_DESIGN.md) §12.7)

---

## 8. Queue

### `GET /api/v1/queue/`
- **Purpose:** Live queue view (the primary operational read endpoint, polled/subscribed by every staff dashboard).
- **Auth required:** Yes · **Permissions:** `AnyStaff`
- **Query params:** `department_id`, `status`, `room_id`, `ordering` (default: `priority_score` desc)
- **Response `200`:** paginated `queue_entries` with joined `ticket_number`, `patient.full_name`, `priority`, `status`, `department`, `room`, `waiting_minutes`
- **Errors:** `401`

### `GET /api/v1/queue/{id}/`
- **Purpose:** Retrieve a single ticket's full detail (including linked triage/consultation summaries).
- **Auth required:** Yes · **Permissions:** `AnyStaff`
- **Errors:** `401`, `404`

### `POST /api/v1/queue/call-next/`
- **Purpose:** Atomically claim and call the next eligible waiting ticket for a department/room ([ARCHITECTURE.md](ARCHITECTURE.md) §6.4, `SELECT ... FOR UPDATE SKIP LOCKED`).
- **Auth required:** Yes · **Permissions:** `Nurse` (triage-stage call), `Doctor` (consultation-stage call)
- **Request body:** `{ "department_id": uuid, "room_id": uuid }`
- **Response `200`:** the claimed `queue_entry`, now `status=called`
- **Response `204`:** no eligible ticket waiting (empty queue for that department)
- **Validation:** `room_id` must belong to `department_id` and be currently unoccupied
- **Errors:** `401`, `403`, `404`, `409` (room already has an active assignment — race lost to another caller, safe to retry)

### `PATCH /api/v1/queue/{id}/status/`
- **Purpose:** Manual status transition — cancel, mark no-show, or advance to in-consultation.
- **Auth required:** Yes · **Permissions:** `Receptionist`/`ClinicAdmin` (cancel), `Nurse`/`Doctor` (no-show, in-consultation)
- **Request body:** `{ "status": "cancelled"|"no_show"|"in_consultation" }`
- **Response `200`:** updated ticket
- **Validation:** only forward-valid transitions per the state machine ([CLINICAL_WORKFLOW_DESIGN.md](CLINICAL_WORKFLOW_DESIGN.md) §3 state diagram) — e.g. `waiting → in_consultation` directly is rejected, must pass through `called`
- **Errors:** `400` (invalid transition), `401`, `403`, `404`, `409` (ticket already in a terminal state)

### `POST /api/v1/queue/{id}/priority-override/`
- **Purpose:** Manually override a ticket's clinical priority level ([CLINICAL_WORKFLOW_DESIGN.md](CLINICAL_WORKFLOW_DESIGN.md) §8.4).
- **Auth required:** Yes · **Permissions:** `Nurse` **only**
- **Request body:** `{ "new_priority_level_id": smallint, "justification": string }`
- **Response `200`:** updated ticket with recalculated `priority_score`
- **Validation:** `justification` mandatory, non-empty
- **Errors:** `400`, `401`, `403` (including a Doctor attempting this — explicitly forbidden per the permission matrix), `404`
- **Audit:** logged as `priority_override` with old/new level, actor, and justification

### `POST /api/v1/queue/{id}/reassign-room/`
- **Purpose:** Manually reassign a called/waiting ticket to a different doctor/room, overriding the load-balancer's suggestion.
- **Auth required:** Yes · **Permissions:** `Nurse`, `Receptionist`, `ClinicAdmin`
- **Request body:** `{ "new_room_id": uuid, "new_doctor_staff_id": uuid (optional) }`
- **Errors:** `400`, `401`, `403`, `404`, `409`

### `GET /api/v1/queue/board/`
- **Purpose:** Aggregated, low-PHI view for the waiting-room display and staff overview boards — ticket numbers/department/status only, no patient names.
- **Auth required:** No (public display route) for the display variant; Yes for the staff-dashboard variant with full detail — implemented as two response shapes gated by the caller's auth state
- **Permissions:** `Public` (display), `AnyStaff` (full)
- **Errors:** none for the public variant beyond `500`

---

## 9. Triage

### `GET /api/v1/triage/`
- **Purpose:** List triage assessments.
- **Auth required:** Yes · **Permissions:** `Nurse`, `Doctor` (read), `ClinicAdmin` (oversight)
- **Query params:** `visit_id`, `date_from`, `date_to`
- **Errors:** `401`, `403`

### `POST /api/v1/triage/`
- **Purpose:** Record a triage assessment and assign the resulting priority level ([CLINICAL_WORKFLOW_DESIGN.md](CLINICAL_WORKFLOW_DESIGN.md) §2.3).
- **Auth required:** Yes · **Permissions:** `Nurse`
- **Request body:** `{ "patient_visit_id", "symptoms": [string], "blood_pressure", "temperature_celsius", "pulse_rate", "spo2", "weight_kg", "notes", "resulting_priority_level_id" }`
- **Response `201`:** created assessment; triggers Queue Generation (§CLINICAL_WORKFLOW_DESIGN.md §2.5) as a side effect
- **Validation:** at least one of `symptoms`/vitals present (VR-02); `resulting_priority_level_id` mandatory (VR-03)
- **Errors:** `400`, `401`, `403`, `404` (visit not found/not in caller's clinic)

### `GET /api/v1/triage/{id}/` · `PATCH /api/v1/triage/{id}/`
- **Purpose:** Retrieve / amend an assessment (condition reassessment while waiting).
- **Auth required:** Yes · **Permissions:** GET: `Nurse`, `Doctor`, `ClinicAdmin`; PATCH: `Nurse`
- **Errors:** `400`, `401`, `403`, `404`

---

## 10. Consultation

### `GET /api/v1/consultations/`
- **Purpose:** List consultations.
- **Auth required:** Yes · **Permissions:** `Doctor` (own only), `ClinicAdmin` (all, oversight)
- **Query params:** `status`, `date_from`, `date_to`
- **Errors:** `401`, `403`

### `POST /api/v1/consultations/`
- **Purpose:** Open a consultation record when a patient reaches the room (`queue_entry.status → in_consultation`).
- **Auth required:** Yes · **Permissions:** `Doctor`
- **Request body:** `{ "queue_entry_id", "doctor_assignment_id" }`
- **Response `201`:** created consultation, `status=in_progress`
- **Validation:** an active `doctor_assignment` must exist for this ticket (VR-08); `queue_entry.status` must be `called`
- **Errors:** `400`, `401`, `403`, `404`, `409` (consultation already exists for this ticket — 1:1 constraint)

### `GET /api/v1/consultations/{id}/` · `PATCH /api/v1/consultations/{id}/`
- **Purpose:** Retrieve / update diagnosis, treatment notes, prescription, follow-up flag.
- **Auth required:** Yes · **Permissions:** `Doctor` (own record)
- **Errors:** `400`, `401`, `403`, `404`

### `POST /api/v1/consultations/{id}/complete/`
- **Purpose:** Finalize the consultation (`status → completed`, `ended_at` set, ticket `status → completed`).
- **Auth required:** Yes · **Permissions:** `Doctor`
- **Request body:** `{ "diagnosis", "treatment_notes", "prescription" (optional), "follow_up_required": boolean, "follow_up_date" (required if follow_up_required) }`
- **Response `200`:** completed consultation
- **Validation:** `follow_up_date` mandatory when `follow_up_required=true` (matches the DB `CHECK` constraint in [DATABASE_DESIGN.md](DATABASE_DESIGN.md) §3.15)
- **Errors:** `400`, `401`, `403`, `404`, `409` (already completed)
- **Side effect:** if no department transfer follows, triggers Completion Message SMS

---

## 11. SMS

### `GET /api/v1/sms/notifications/`
- **Purpose:** Notification History — search/filter sent messages (staff-facing, per [SMS_NOTIFICATION_SYSTEM_DESIGN.md](SMS_NOTIFICATION_SYSTEM_DESIGN.md) §9).
- **Auth required:** Yes · **Permissions:** `ClinicAdmin` (full), `Receptionist` (own-triggered only)
- **Query params:** `status`, `event_type`, `patient_phone`, `date_from`, `date_to`
- **Errors:** `401`, `403`

### `GET /api/v1/sms/notifications/{id}/`
- **Purpose:** Full detail of a single message, including its `sms_logs` transition history.
- **Auth required:** Yes · **Permissions:** `ClinicAdmin`
- **Response `200`:** `{ ...notification fields, "logs": [ {status, occurred_at, provider_response} ] }`
- **Errors:** `401`, `403`, `404`

### `POST /api/v1/sms/notifications/{id}/resend/`
- **Purpose:** Manually re-trigger a failed or missed notification.
- **Auth required:** Yes · **Permissions:** `ClinicAdmin`
- **Response `202`:** `{ "detail": "Resend queued." }` — accepted, not synchronous
- **Errors:** `401`, `403`, `404`, `409` (already `delivered`)

### `GET /api/v1/sms/templates/` · `POST /api/v1/sms/templates/`
- **Purpose:** List global+clinic templates / create a clinic-specific override.
- **Auth required:** Yes · **Permissions:** `ClinicAdmin`
- **Request body (POST):** `{ "event_type", "channel", "language_code", "template_body" }`
- **Validation:** `event_type` must be one of the fixed set (§SMS_NOTIFICATION_SYSTEM_DESIGN.md §12); placeholder syntax validated against the event's known payload fields
- **Errors:** `400`, `401`, `403`, `409` (override already exists for this event/channel/language — use PATCH instead)

### `PATCH /api/v1/sms/templates/{id}/`
- **Purpose:** Edit a clinic-specific template.
- **Auth required:** Yes · **Permissions:** `ClinicAdmin`
- **Errors:** `400`, `401`, `403`, `404`

### `POST /api/v1/sms/webhook/{provider}/`
- **Purpose:** Inbound delivery-status callback from Twilio ([SMS_NOTIFICATION_SYSTEM_DESIGN.md](SMS_NOTIFICATION_SYSTEM_DESIGN.md) §6).
- **Auth required:** No staff auth — **provider signature verification instead** (Twilio `X-Twilio-Signature` HMAC) · **Permissions:** `Public` (to staff auth), verified at the payload level
- **Request body:** provider-specific payload
- **Response `200`:** empty (acknowledged)
- **Validation:** signature must verify; unrecognized `provider_message_id` is logged and ignored (`200`, not an error, to prevent provider retry storms)
- **Errors:** `401` (signature verification failed)

### `POST /api/v1/sms/inbound/{provider}/`
- **Purpose:** Inbound patient SMS reply (e.g. `YES` to rejoin the queue after a no-show, [SMS_NOTIFICATION_SYSTEM_DESIGN.md](SMS_NOTIFICATION_SYSTEM_DESIGN.md) §12.6).
- **Auth required:** No staff auth — provider signature verification · **Permissions:** `Public`
- **Request body:** provider-specific inbound-message payload
- **Response `200`:** empty (acknowledged)
- **Errors:** `401` (signature verification failed)

---

## 12. Reports

### `GET /api/v1/reports/`
- **Purpose:** List previously generated reports.
- **Auth required:** Yes · **Permissions:** `ClinicAdmin`
- **Query params:** `report_type`, `date_from`, `date_to`, `status`
- **Errors:** `401`, `403`

### `POST /api/v1/reports/generate/`
- **Purpose:** Trigger asynchronous report generation.
- **Auth required:** Yes · **Permissions:** `ClinicAdmin`
- **Request body:** `{ "report_type": "daily_summary"|"weekly_summary"|"monthly_summary"|"staff_performance"|"queue_analytics"|"sms_delivery", "period_start", "period_end", "parameters" (optional) }`
- **Response `202`:** `{ "report_id", "status": "generating" }`
- **Validation:** `period_end >= period_start`
- **Errors:** `400`, `401`, `403`

### `GET /api/v1/reports/{id}/`
- **Purpose:** Poll report generation status/metadata.
- **Auth required:** Yes · **Permissions:** `ClinicAdmin`
- **Response `200`:** report object with `status`
- **Errors:** `401`, `403`, `404`

### `GET /api/v1/reports/{id}/download/`
- **Purpose:** Download the generated file.
- **Auth required:** Yes · **Permissions:** `ClinicAdmin`
- **Response `200`:** binary file stream (PDF/CSV)
- **Errors:** `401`, `403`, `404`, `409` (`status != completed`)

---

## 13. Analytics

### `GET /api/v1/analytics/dashboard/`
- **Purpose:** Aggregated KPI summary powering the Admin Dashboard Overview Cards ([ADMIN_DASHBOARD_UX_REDESIGN.md](ADMIN_DASHBOARD_UX_REDESIGN.md) §3.2).
- **Auth required:** Yes · **Permissions:** `ClinicAdmin`
- **Query params:** `date_range` (`today`|`week`|`month`|`custom`), `date_from`/`date_to` (if custom)
- **Response `200`:** `{ registrations_today, waiting_count, being_served_count, completed_count, emergency_count, avg_wait_minutes, avg_consultation_minutes, sms_delivery_rate }`
- **Errors:** `401`, `403`

### `GET /api/v1/analytics/queue-performance/`
- **Purpose:** Hourly patient-volume + average-wait-time series (combo chart data, §ADMIN_DASHBOARD_UX_REDESIGN.md §3.4).
- **Auth required:** Yes · **Permissions:** `ClinicAdmin`
- **Response `200`:** `{ "hours": [{ "hour", "patient_count", "avg_wait_minutes" }] }`
- **Errors:** `401`, `403`

### `GET /api/v1/analytics/department-stats/`
- **Purpose:** Per-department statistics table data.
- **Auth required:** Yes · **Permissions:** `ClinicAdmin`
- **Response `200`:** array of `{ "department", "patients_today", "waiting_now", "avg_wait", "avg_consultation", "rooms_active", "sms_sent" }`
- **Errors:** `401`, `403`

### `GET /api/v1/analytics/sms-stats/`
- **Purpose:** SMS delivery statistics by hour.
- **Auth required:** Yes · **Permissions:** `ClinicAdmin`
- **Response `200`:** `{ "sent", "delivered", "failed", "hourly": [...] }`
- **Errors:** `401`, `403`

### `GET /api/v1/analytics/peak-hours/`
- **Purpose:** Patient-count-by-hour distribution.
- **Auth required:** Yes · **Permissions:** `ClinicAdmin`
- **Response `200`:** `{ "hours": [{ "hour", "count" }] }`
- **Errors:** `401`, `403`

---

## 14. Settings

### `GET /api/v1/settings/`
- **Purpose:** Retrieve the clinic's key-value configuration set.
- **Auth required:** Yes · **Permissions:** `ClinicAdmin`
- **Response `200`:** `{ "settings": { "key": value, ... } }`
- **Errors:** `401`, `403`

### `PATCH /api/v1/settings/`
- **Purpose:** Update one or more settings.
- **Auth required:** Yes · **Permissions:** `ClinicAdmin`
- **Request body:** `{ "key": value, ... }` (partial)
- **Response `200`:** updated settings
- **Validation:** each `key` validated against a known-settings schema (unknown keys rejected, not silently stored)
- **Errors:** `400`, `401`, `403`

### `GET /api/v1/settings/{key}/`
- **Purpose:** Retrieve a single setting value.
- **Auth required:** Yes · **Permissions:** `ClinicAdmin`
- **Errors:** `401`, `403`, `404`

---

## 15. Audit Logs

### `GET /api/v1/audit-logs/`
- **Purpose:** Query the immutable audit trail.
- **Auth required:** Yes · **Permissions:** `ClinicAdmin` (own clinic only), `SuperAdmin` (all clinics, via `?clinic_id=` filter)
- **Query params:** `staff_id`, `entity_type`, `entity_id`, `action_type`, `date_from`, `date_to`
- **Response `200`:** paginated audit entries `{ "id", "staff", "action_type", "entity_type", "entity_id", "old_values", "new_values", "occurred_at" }`
- **Validation:** none of this endpoint's fields are ever writable — read-only by construction, no `POST`/`PATCH`/`DELETE` exist for this resource anywhere in the API
- **Errors:** `401`, `403`

---

## 16. Cross-Cutting Notes for the DRF Implementation

- **Serializer split:** every resource with a list *and* detail view (`Patients`, `Staff`, `Queue`) uses a slim `ListSerializer` (summary fields only, minimizing payload for high-frequency polling like the Live Queue board) and a full `DetailSerializer` — a standard DRF pattern, called out here because the Live Queue endpoint in particular is polled frequently enough that payload size is a real performance concern.
- **Throttling:** `auth/login/`, `auth/password-reset/request/`, and both webhook endpoints carry a dedicated DRF throttle scope (`django-ratelimit` or DRF's built-in `AnonRateThrottle`/custom scoped throttle) independent of general API rate limits — these are the endpoints an attacker would actually hit.
- **Idempotency:** `POST /queue/call-next/` and the two webhook endpoints are the three write endpoints in this catalog that must tolerate safe retries (client timeout-and-retry, provider at-least-once delivery) without side effects duplicating — enforced via the `SKIP LOCKED` claim pattern and the `(provider_message_id, status)` dedupe key respectively, both already specified in their source design documents.
- **Versioning:** `/api/v1/` is the only version at launch; the prefix exists so a breaking change (e.g. a restructured Queue response shape for a future mobile staff app) can ship as `/api/v2/` without forcing simultaneous rollout across every client.
