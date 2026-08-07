# MediQueue — Authentication & Authorization Design
### Secure, Staff-Only RBAC System — Patients Never Authenticate

**Scope:** Security design only — no code. Builds on [ARCHITECTURE.md](ARCHITECTURE.md) §8 (Security Architecture) and the `roles` / `permissions` / `role_permissions` / `staff` / `audit_logs` tables defined in [DATABASE_DESIGN.md](DATABASE_DESIGN.md).

**Ground rule:** There is no such thing as a patient credential, patient session, patient token, or patient password anywhere in this design. Every identity that can authenticate is a member of clinic staff.

---

## 1. Role Hierarchy

```
                         ┌───────────────────────────┐
                         │   SUPER ADMINISTRATOR       │   ← Phase 2 (future)
                         │   (platform-wide scope)      │
                         └──────────────┬────────────┘
                                        │ provisions
                                        ▼
                         ┌───────────────────────────┐
                         │   CLINIC ADMINISTRATOR       │   ← one per clinic (can be more than one)
                         │   (single-clinic scope)       │
                         └──────────────┬────────────┘
                                        │ provisions
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
           ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
           │  RECEPTIONIST    │ │     NURSE        │ │     DOCTOR       │
           │ (front-desk ops)  │ │ (triage/queue)    │ │ (consultation)    │
           └────────────────┘ └────────────────┘ └────────────────┘
```

**This hierarchy expresses administrative scope, not permission inheritance.** A Clinic Administrator sits "above" a Doctor organizationally (can provision/deactivate the account, sees clinic-wide oversight data) but does **not** inherit the Doctor's clinical permissions — an Administrator cannot write a diagnosis, and a Doctor cannot manage staff accounts. Receptionist, Nurse, and Doctor are peers with disjoint, non-overlapping action sets, not a further sub-hierarchy.

This is a deliberate least-privilege design choice: permissions are granted explicitly per role through the `role_permissions` junction table ([DATABASE_DESIGN.md](DATABASE_DESIGN.md) §3.6), never inferred from hierarchy position. This prevents privilege creep — promoting someone to Administrator never silently grants them clinical authority they aren't credentialed for.

---

## 2. Permission Matrix

Legend: **✅** allowed · **🟡** allowed, own-scope/own-records only · **❌** forbidden

| Permission | Super Admin | Clinic Admin | Receptionist | Nurse | Doctor |
|---|:---:|:---:|:---:|:---:|:---:|
| Manage clinics (create/deactivate tenants) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage platform-global settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage RBAC catalog (roles/permissions) | ✅ | ❌ | ❌ | ❌ | ❌ |
| View audit logs (platform-wide) | ✅ | ❌ | ❌ | ❌ | ❌ |
| View audit logs (own clinic) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage clinic settings/branding | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage departments/rooms | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage working hours/holidays | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create/deactivate staff (own clinic) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Assign staff roles (own clinic, non-admin roles) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Force-reset a staff member's password | ✅ | ✅ | ❌ | ❌ | ❌ |
| Lock/unlock staff accounts (own clinic) | ✅ | ✅ | ❌ | ❌ | ❌ |
| View clinic dashboard/reports | ✅ | ✅ | 🟡 (queue view only) | 🟡 (own stats) | 🟡 (own stats) |
| Export reports | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage SMS templates | ✅ | ✅ | ❌ | ❌ | ❌ |
| View SMS delivery logs | ✅ | ✅ | 🟡 (own actions) | ❌ | ❌ |
| Register a new patient (intake) | ❌ | ❌ | ✅ | ❌ | ❌ |
| Edit patient demographics | ❌ | ❌ | ✅ | ❌ | ❌ |
| View patient demographics | ✅ (support) | ✅ | ✅ | ✅ | ✅ |
| Check in appointment | ❌ | ❌ | ✅ | ❌ | ❌ |
| Create/edit appointment | ❌ | ❌ | ✅ | ❌ | ❌ |
| Cancel a queue ticket | ❌ | ✅ | ✅ | ✅ | ❌ |
| View live queue board | ✅ | ✅ | ✅ | ✅ | ✅ |
| Perform triage assessment | ❌ | ❌ | ❌ | ✅ | ❌ |
| Set/override priority level | ❌ | ❌ | ❌ | ✅ | ❌ |
| Call next patient (triage stage) | ❌ | ❌ | ❌ | ✅ | ❌ |
| Assign/route patient to doctor & room | ❌ | ❌ | ❌ | ✅ | ❌ |
| Call next patient (consultation stage) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Start/complete a consultation | ❌ | ❌ | ❌ | ❌ | ✅ |
| Record diagnosis/treatment/prescription | ❌ | ❌ | ❌ | ❌ | ✅ |
| View own consultation history | ❌ | ✅ (oversight) | ❌ | ❌ | 🟡 (own) |
| Reset own password | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own audit trail (actions taken by self) | ✅ | ✅ | ✅ | ✅ | ✅ |

This matrix is the source document from which the `role_permissions` seed data ([DATABASE_DESIGN.md](DATABASE_DESIGN.md) §3.6) is populated — every row here becomes a `permissions.permission_code`, every ✅/🟡 cell becomes a `role_permissions` row for that role.

---

## 3. RBAC Model

```
┌───────────┐        ┌────────────────────┐        ┌───────────────┐
│   staff    │──N:1──▶│       roles          │◀──M:N──▶│  permissions    │
│           │        │                      │  (via   │                 │
│ staff_id   │        │ role_id              │ role_    │ permission_id   │
│ role_id ───┼───────▶│ role_name            │ permissions)│ permission_code│
│ clinic_id   │        │                      │        │ module           │
└───────────┘        └────────────────────┘        └───────────────┘
      │
      │  every clinic-scoped table also carries clinic_id
      ▼
  Row-Level Security compares staff.clinic_id (from JWT claim)
  against the target row's clinic_id on every query.
```

- **Role assignment is single-valued**: `staff.role_id` is one FK, not a many-to-many staff↔role table. A staff member holds exactly one role at a time. A person doing two jobs (e.g. nurse who also covers reception on quiet days) is either issued a composite role by the Clinic Administrator or, preferably, two separate accounts tied to the same person's employment record — never a silent union of two roles' permissions, which would violate least privilege and make audit trails ambiguous about which "hat" they were wearing for a given action.
- **Two-layer enforcement (defense in depth):**
  1. **Application layer:** every API route/service method checks `staff.role` against the required `permission_code` for that operation before executing it.
  2. **Database layer:** Postgres Row-Level Security policies independently enforce `clinic_id` scoping and, where relevant, role-based row visibility — so a bug or bypass in the application layer cannot leak cross-clinic or cross-role data. Neither layer alone is trusted as sufficient.
- **Permissions are additive, never subtractive.** There is no "deny" permission type — a role either has a capability or it doesn't. This keeps the matrix in §2 the single source of truth with no override logic to reason about.
- **Tenant scoping is orthogonal to role.** Every permission check is implicitly `role AND clinic_id match`. A Receptionist at Clinic A can never act on Clinic B's data regardless of role, enforced identically for every role including Clinic Administrator (Super Administrator is the only role that legitimately crosses clinic boundaries).

---

## 4. JWT Authentication Flow

```
 Staff Browser                Auth Service                  API / Service Layer          Database
      │                            │                               │                          │
      │ 1. POST /login             │                               │                          │
      │   (email, password)        │                               │                          │
      ├───────────────────────────▶│                               │                          │
      │                            │ 2. Verify credentials          │                          │
      │                            │    + check is_locked/is_active │                          │
      │                            ├──────────────────────────────────────────────────────────▶│
      │                            │◀──────────────────────────────────────────────────────────┤
      │                            │ 3. Issue JWT access token       │                          │
      │                            │    (short-lived, e.g. 30-60min) │                          │
      │                            │    claims: staff_id, clinic_id, │                          │
      │                            │    role, iat, exp                │                          │
      │                            │ 4. Issue refresh token           │                          │
      │                            │    (longer-lived, rotating)      │                          │
      │◀───────────────────────────┤                               │                          │
      │ 5. Both tokens set as       │                               │                          │
      │    httpOnly, Secure,        │                               │                          │
      │    SameSite cookies          │                               │                          │
      │                            │                               │                          │
      │ 6. Subsequent request        │                               │                          │
      │    (cookie sent automatically)│                             │                          │
      ├─────────────────────────────────────────────────────────▶│                          │
      │                            │                               │ 7. Verify signature+exp  │
      │                            │                               │ 8. Extract claims          │
      │                            │                               │ 9. Check permission for   │
      │                            │                               │    requested action        │
      │                            │                               ├─────────────────────────▶│
      │                            │                               │  10. RLS re-checks         │
      │                            │                               │      clinic_id at row level │
      │◀─────────────────────────────────────────────────────────┤                          │
      │ 11. Response (200/403)      │                               │                          │
```

**Claims contained in the access token:** `staff_id`, `clinic_id`, `role`, token issue/expiry times. **Deliberately excluded:** the full permission list. Embedding all permissions in the token bloats it and — worse — makes a permission revoked mid-session stay valid until the token naturally expires. Instead, the token carries only `role`, and the permission-to-role mapping is looked up fresh from `role_permissions` on each request (fast: a small, cacheable table), so a permission change by an Administrator takes effect on the very next request, not after token expiry.

**Token storage:** httpOnly, `Secure`, `SameSite=Lax` (or `Strict` for high-privilege roles) cookies — never `localStorage`/`sessionStorage`. This is non-negotiable for a clinical system: `localStorage` tokens are readable by any injected script, turning a single XSS bug into full account takeover; httpOnly cookies are not.

**Refresh flow:** access token expiry triggers a silent background refresh call using the refresh token; the refresh token itself **rotates** on every use (old one invalidated, new one issued) so a stolen refresh token can only be replayed once before the legitimate client's next refresh fails and triggers a full session revocation + security alert (reuse-detection pattern).

---

## 5. Login Flow

```
1. Staff opens /login — the ONLY entry point into the system. No signup link exists anywhere.
2. Staff enters email + password (+ TOTP code, required for Clinic Administrator / Super Administrator).
3. Server-side, BEFORE calling the auth provider:
     a. Look up account by email.
     b. If is_locked = true → reject immediately: "Account locked. Contact your administrator."
        (This message IS safe to reveal — it's actionable for a legitimate locked-out staff member,
         unlike revealing "no such account exists".)
     c. If account not found or is_active = false → fall through to generic failure in step 5.
4. Validate credentials against the auth provider.
5. On failure (bad password / account not found / inactive):
     - Increment failed_login_attempts.
     - Write an audit_logs row: action_type = 'login_failed', with the attempted email (not the password).
     - Return ONE generic message regardless of the actual reason: "Invalid email or password."
       (Prevents account enumeration — an attacker cannot distinguish "wrong password" from
        "no such account".)
6. On success:
     - Reset failed_login_attempts to 0.
     - Update staff.last_login_at.
     - Issue access + refresh tokens (§4).
     - Write an audit_logs row: action_type = 'login_success'.
     - Redirect to the role-appropriate landing page:
         Receptionist → /reception/intake
         Nurse        → /triage/queue
         Doctor       → /consultation/room/[assigned]
         Clinic Admin → /admin/dashboard
         Super Admin  → /platform-admin/clinics
7. If failed_login_attempts crosses the lockout threshold during step 5, transition to
   Account Locking (§8) instead of returning the generic message.
```

---

## 6. Logout Flow

```
1. Staff clicks "Log out" (available from every authenticated page's header).
2. Client calls the logout endpoint.
3. Server:
     a. Revokes the current refresh token server-side (not just deleting the cookie —
        a merely client-deleted cookie doesn't stop a token that was copied/stolen).
     b. Clears both access and refresh cookies.
     c. Writes an audit_logs row: action_type = 'logout'.
4. Client redirects to /login.

Additional controls:
  - "Log out of all devices" — available to a staff member for their own account; revokes
    every outstanding refresh token for that staff_id.
  - "Force logout" — available to Clinic Administrator (own clinic's staff) and Super Administrator
    (any staff); used when a device is lost/stolen or an account is suspected compromised.
    Always audit-logged with both the actor (who forced it) and the target account.
  - Idle-timeout logout (§7) and shift-boundary logout are system-initiated variants of this
    same revoke-and-clear flow, not a separate code path.
```

---

## 7. Password Reset Flow

**Self-service (forgotten password):**

```
1. Staff clicks "Forgot password" on /login, enters their email.
2. Server ALWAYS responds with the same message: "If that email is registered, a reset link
   has been sent." — regardless of whether the email exists, is active, or is locked.
   (Same enumeration-prevention principle as login failures.)
3. If the email does match an active staff account, a signed, single-use, time-limited
   (≤30 minutes) reset token is emailed to that address.
4. Staff clicks the link → lands on a "Set new password" page (the token itself, not a
   session, authorizes this one action).
5. New password is validated against policy: minimum length (≥12 chars), not a known-breached
   or common password (checked via a k-anonymity breach-list lookup or local blocklist),
   not identical to the current password.
6. On success:
     - Password is updated.
     - ALL existing sessions/refresh tokens for that account are revoked — a password reset
       must force re-authentication everywhere, in case the reset was triggered because a
       session was already compromised.
     - A confirmation is sent to the account's email (out-of-band notice: "your password
       was just changed — contact your administrator if this wasn't you").
     - audit_logs: action_type = 'password_reset_self'.
```

**Administrator-initiated reset (staff forgot their password and has no email access, or an account needs re-securing):**

```
1. Clinic Administrator (own clinic) or Super Administrator (any clinic) selects a staff
   account and triggers "Force password reset."
2. System generates a temporary credential or reset link and flags the account
   must_change_password = true.
3. On the staff member's next login, they authenticate once with the temporary credential,
   are immediately redirected to a mandatory "set new password" screen, and cannot reach
   any other page until it's completed.
4. audit_logs: action_type = 'password_reset_admin_forced', recording BOTH the acting
   administrator's staff_id and the target account's staff_id — this is a sensitive action
   and must always be attributable.
```

---

## 8. Session Management

| Control | Policy | Rationale |
|---|---|---|
| Access token lifetime | 30–60 minutes | Short blast radius if a token is somehow exfiltrated |
| Refresh token lifetime | 8–12 hours (aligned to a clinic shift), rotating on every use | Clinical terminals are often shared/kiosk devices — long-lived "remember me" style sessions are inappropriate here, unlike a consumer app |
| Idle timeout | 15 minutes of inactivity → auto-logout | Front-desk and triage terminals are frequently left unattended between patients; this is the single highest-value control for a shared-device clinical environment |
| Absolute session timeout | Forced re-auth at end of shift window regardless of activity | Bounds how long a token remains useful even if idle-timeout is somehow bypassed |
| Refresh token rotation | New token issued + old one invalidated on every refresh | Enables reuse-detection: a replayed old token signals theft and triggers full revocation |
| Concurrent sessions | Single active session recommended for Clinic Administrator / Super Administrator; reasonable device limit (e.g. 2) for Receptionist/Nurse/Doctor | High-privilege accounts are the highest-value target; limiting concurrency reduces the value of a stolen credential |
| Session storage | httpOnly, Secure, SameSite cookies only | See §4 — never client-readable storage |
| Session binding (optional, high-privilege roles) | Flag/re-prompt on IP range or device fingerprint change | Extra friction only where the risk (Administrator-level access) justifies it |

---

## 9. Account Locking

```
                     ┌────────────┐
                     │   ACTIVE     │
                     └─────┬──────┘
             failed login  │  ▲ successful login
             attempt        │  │  resets counter to 0
                            ▼  │
                     ┌────────────┐
                     │  WARNING     │  (e.g. 3rd consecutive failure — UI shows
                     │  (soft)       │   "2 attempts remaining" to the legitimate user)
                     └─────┬──────┘
             threshold reached
             (e.g. 5 failures in 15 min)
                            ▼
                     ┌────────────┐
                     │   LOCKED     │──── audit_logs: 'account_locked'
                     └─────┬──────┘       + email notice to staff AND their Clinic Admin
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
   Auto-expiring lock                Manual unlock required
   (Receptionist/Nurse/Doctor:        (Clinic Admin / Super Admin:
   e.g. 30 min cool-down)              always required for these roles —
                                        an auto-unlocking Administrator
                                        account is too high-value a target
                                        to leave to a timer)
              │                           │
              └─────────────┬─────────────┘
                            ▼
                     ┌────────────┐
                     │   ACTIVE     │  (counter reset)
                     └────────────┘
```

- **Progressive delay before hard lock:** an increasing delay between attempts (e.g. 1s, 2s, 4s...) slows automated credential-stuffing before the hard threshold is even reached.
- **`is_locked` is distinct from `is_active`.** `is_locked` is a temporary security state (too many failed attempts) that can self-clear or be unlocked; `is_active = false` is a permanent deprovisioning state (staff member has left the clinic) that only an Administrator sets and that also requires an Administrator to reverse — these must never be conflated in the data model or the UI.
- Every lock and unlock event is audit-logged with a reason and, for unlocks, the acting staff member.

---

## 10. Audit Logging

Persisted in `audit_logs` ([DATABASE_DESIGN.md](DATABASE_DESIGN.md) §3.19). Minimum event set that **must** be logged:

| Category | Events |
|---|---|
| Authentication | login_success, login_failed, logout, logout_all_devices, force_logout |
| Account lifecycle | account_locked, account_unlocked, account_deactivated, account_reactivated, staff_created, role_changed |
| Credentials | password_reset_self, password_reset_admin_forced, mfa_enabled, mfa_disabled |
| Clinical actions | patient_registered, triage_recorded, ticket_called, doctor_assigned, consultation_started, consultation_completed |
| Configuration | department/room/working_hours/holiday changed, sms_template changed, system_setting changed |
| Access to sensitive data | audit_log_viewed, report_exported |

**Rules:**
- **Immutable:** `audit_logs` supports `INSERT` only — no application role, including Clinic Administrator, has `UPDATE`/`DELETE` grants on it at the database level. An audit trail that can be edited by the people it might implicate is not an audit trail.
- **Always records the actor**, even for automated/system actions (`staff_id NULL` explicitly means "the system," never "unknown").
- **Retention:** align to applicable healthcare record-retention requirements in the clinic's jurisdiction (commonly multi-year); archive older partitions to cold storage rather than deleting ([DATABASE_DESIGN.md](DATABASE_DESIGN.md) §5.1 recommends monthly partitioning specifically for this table).
- **Access:** Clinic Administrator sees only their own clinic's log; Super Administrator sees all; no other role has audit-log read access.
- **Alerting:** flag (don't just log) patterns like repeated failed logins across multiple accounts from one source, off-hours Administrator access, or a sudden spike in report exports/data reads — these are the signatures of credential stuffing, insider misuse, and data exfiltration respectively.

---

## 11. User Management

- **No self-registration for anyone, including staff.** Every staff account is provisioned by a human with authority over it: a Clinic Administrator creates Receptionist/Nurse/Doctor accounts (and other Clinic Administrators) for their own clinic; only a Super Administrator can create a Clinic Administrator for a *new* clinic or another Super Administrator. This is distinct from — and stricter than — the patient side, where there is no account concept at all.
- **Two-person consideration for Super Administrator creation:** because this role has platform-wide reach, recommend requiring provisioning by an existing Super Administrator with the action itself flagged for review, rather than being creatable through any automated path.
- **Deactivation over deletion.** Staff accounts are never hard-deleted — `is_active = false` preserves referential integrity (a Doctor's past `consultations`, an Administrator's past `audit_logs` entries must remain attributable) and matches the `ON DELETE RESTRICT` choice already made on staff foreign keys in the database design.
- **Offboarding checklist** (triggered the moment a staff member leaves): deactivate account → revoke all active sessions/refresh tokens → audit-log the deactivation with the acting Administrator → account remains visible in historical records but cannot authenticate.
- **Periodic access review:** recommend a quarterly review by each Clinic Administrator of their own staff roster — flagging dormant accounts (no login in N days) for deactivation, and confirming role assignments still match actual job function.
- **Role changes are re-provisioning events, not edits.** Changing someone's role is itself a sensitive, audit-logged action (`role_changed`, actor + target + old role + new role) — because it immediately changes what that person's already-issued session can do on its next request (§4 explains why permissions are re-checked live rather than cached in the token).

---

## 12. Per-Role Access Specification

### 12.1 Super Administrator *(Phase 2 — future)*

| | |
|---|---|
| **Allowed pages** | `/platform-admin/clinics`, `/platform-admin/system-settings`, `/platform-admin/audit-logs` (global), `/platform-admin/billing` *(future)* |
| **Allowed APIs** | `/api/clinics` (full CRUD), `/api/roles`, `/api/permissions`, `/api/platform/*`, `/api/audit-logs?scope=platform` |
| **Allowed actions** | Create/deactivate clinics; manage the global role/permission catalog; provision Clinic Administrators for any clinic; force password reset or lock/unlock any staff account; view any clinic's data for support/compliance purposes (read access, explicitly logged as `platform_admin_support_access`) |
| **Forbidden actions** | Performing clinical actions (triage, consultation, diagnosis) attributed as if by clinic staff; editing patient records directly outside of an explicit, separately-audited support workflow; bypassing the audit log |

### 12.2 Clinic Administrator

| | |
|---|---|
| **Allowed pages** | `/admin/dashboard`, `/admin/departments`, `/admin/rooms`, `/admin/staff`, `/admin/sms-templates`, `/admin/sms-logs`, `/admin/reports`, `/admin/settings`, `/admin/working-hours`, `/admin/holidays`, `/admin/audit-logs` (own clinic) |
| **Allowed APIs** | `/api/staff` (own clinic CRUD), `/api/departments`, `/api/rooms`, `/api/working-hours`, `/api/holidays`, `/api/reports`, `/api/settings`, `/api/sms-logs`, `/api/sms-templates`, `/api/audit-logs?clinic_id=own` |
| **Allowed actions** | Create/deactivate/reassign-role for own clinic's staff (not other clinics); configure departments, rooms, working hours, holidays; manage SMS templates; view/export reports and audit logs for own clinic; view the live queue board (oversight); cancel a queue ticket |
| **Forbidden actions** | Managing another clinic's data (enforced by RLS, not just UI hiding); creating a Super Administrator; performing triage assessments or writing consultation diagnoses — an Administrator is not a credentialed clinician and the system must not let administrative access double as clinical authority |

### 12.3 Receptionist

| | |
|---|---|
| **Allowed pages** | `/reception/intake`, `/reception/appointments`, `/reception/queue-overview` |
| **Allowed APIs** | `POST /api/intake`, `GET/POST/PATCH /api/appointments`, `GET /api/queue/live`, `PATCH /api/queue/{id}/status` (cancel / no-show / department-reassign only), `GET /api/departments` |
| **Allowed actions** | Register a walk-in patient; check in a scheduled appointment; issue a queue ticket; view the live queue board; cancel a ticket or reassign it to a different department at front-desk level; trigger a manual SMS resend on patient request |
| **Forbidden actions** | Performing a triage assessment or setting a priority level; calling a patient into triage/consultation; viewing or editing consultation notes/diagnosis; managing staff, departments, or settings; viewing reports or audit logs; accessing any other clinic's data |

### 12.4 Nurse

| | |
|---|---|
| **Allowed pages** | `/triage/assessment`, `/triage/queue` |
| **Allowed APIs** | `POST/PATCH /api/triage`, `GET /api/queue/live` (department-scoped), `PATCH /api/queue/{id}/status` (call-next, priority updates), `POST /api/doctor-assignments` |
| **Allowed actions** | Record and update a triage assessment; set/override priority level with clinical justification noted; call the next waiting patient into triage; assign/route an assessed patient to a doctor and room; view the visit-relevant medical information needed to triage safely |
| **Forbidden actions** | Registering a new patient (front-desk function); writing a consultation diagnosis, treatment plan, or prescription (physician-only); managing staff, departments, SMS templates, or settings; viewing reports beyond own performance stats or any audit logs; accessing another clinic's data |

### 12.5 Doctor

| | |
|---|---|
| **Allowed pages** | `/consultation/room/{roomId}`, `/consultation/history` |
| **Allowed APIs** | `GET /api/queue/live` (assigned room only), `PATCH /api/queue/{id}/status` (start/complete consultation), `POST/PATCH /api/consultations`, `GET /api/triage` (read, for the patient in front of them), `GET /api/patients/{id}` (read, visit-scoped) |
| **Allowed actions** | View their assigned queue; call the next patient into their room; start and complete a consultation; record diagnosis, treatment notes, and prescription; flag follow-up required; view triage history and prior consultation history for continuity of care |
| **Forbidden actions** | Registering patients or managing appointments; managing staff, departments, or clinic settings; viewing another doctor's in-progress consultation; viewing SMS logs, clinic-wide reports, or any audit log beyond their own action history; accessing another clinic's data |

---

## 13. Implementation Best Practices

### 13.1 Primary stack — Next.js + Supabase *(matches the current codebase)*

- **Identity provider:** Supabase Auth for staff accounts only. No Supabase Auth user is ever created for a patient — patient records in `patients` have no `auth_user_id` equivalent and no corresponding auth account at all.
- **Custom claims:** use a Supabase Auth Hook (Postgres function invoked at token-issuance time) to inject `role` and `clinic_id` into the JWT from the `staff` table — never trust a client-supplied role/clinic value.
- **Row-Level Security:** write one RLS policy per clinic-scoped table comparing `clinic_id` against `auth.jwt() ->> 'clinic_id'`, plus role-gated policies (e.g. only `role = 'nurse'` can `INSERT` into `triage_assessments`) — this is the database-layer half of the defense-in-depth model in §3.
- **Route guarding:** extend the existing `proxy.ts` session-refresh logic to also enforce role-based route access per the folder structure in [ARCHITECTURE.md](ARCHITECTURE.md) §2 (`/admin/*` → Clinic Administrator, `/triage/*` → Nurse, etc.), redirecting unauthorized roles rather than relying on the page itself to check.
- **Session cookies:** use `@supabase/ssr`'s cookie-based session handling (already the pattern in `lib/supabase/server.ts`), which defaults to httpOnly cookies — do not switch to a client-side-stored token approach.
- **MFA:** enable Supabase Auth's TOTP factor, required for Clinic Administrator and Super Administrator roles specifically (highest blast radius if compromised).
- **Rate limiting:** apply edge-level rate limiting (e.g. Next.js Proxy, formerly Edge Middleware + a store like Upstash Redis) to `/login`, `/forgot-password`, and any account-lookup endpoint, independent of the application-level lockout counter in §9 — two layers, since one is IP-based and the other is account-based.
- **Service-role key isolation:** the Supabase service-role key (which bypasses RLS) is used exclusively in trusted server contexts (API routes, cron jobs) — never in a client component, never in any code path reachable from the browser bundle.
- **Password policy:** enforce via Supabase Auth's minimum-length/strength settings plus an application-level breach-list check (k-anonymity API) before accepting a new password, per §7.

### 13.2 Django/DRF equivalent *(reference mapping, in case a Django implementation of this design is pursued)*

The current codebase is Next.js/Supabase, not Django — this subsection is provided because it was explicitly requested and maps every control above onto Django-ecosystem equivalents for reference:

- **Roles/Permissions:** Django's built-in `django.contrib.auth` `Group`/`Permission` model is a near-exact fit for the `roles`/`permissions`/`role_permissions` design in §3 — `Group` maps to `roles`, `Permission` maps to `permissions`, and Django's `Group.permissions` M:N field *is* the `role_permissions` junction, no custom table needed.
- **Custom user model:** a custom `User` extending `AbstractUser` (or `AbstractBaseUser`) adding `clinic` (FK) and using `groups` for role — set `AUTH_USER_MODEL` before the first migration.
- **JWT issuance:** `djangorestframework-simplejwt`, with a custom `TokenObtainPairSerializer` override to inject `clinic_id` and `role` claims as described in §4.
- **Password hashing:** explicitly set `argon2` as the first entry in `PASSWORD_HASHERS` (`django[argon2]` extra) rather than relying on the PBKDF2 default.
- **Account lockout / brute-force protection:** `django-axes` (or `django-defender`) for the failed-attempt counting and lockout state machine in §9.
- **Tenant isolation:** Django has no native Postgres RLS integration — enforce `clinic_id` scoping at the ORM layer via a custom manager/queryset mixin applied to every clinic-scoped model (`Model.objects.for_clinic(request.user.clinic_id)`), used consistently everywhere so no viewset can accidentally return cross-clinic rows; pair with actual Postgres RLS policies applied directly via raw SQL in a migration for true defense-in-depth, since ORM-only enforcement is a single point of failure.
- **Audit logging:** `django-auditlog` or `django-simple-history` for automatic model change tracking, supplemented by explicit service-layer audit calls for non-model events (login/logout/lock/unlock) that a model-change library won't catch on its own.
- **Object-level permissions:** `django-guardian` if any permission ever needs to be scoped to a specific row rather than a whole model (not required by the matrix in §2 as currently defined, but the natural tool if a future requirement needs it).
- **CSRF:** Django's CSRF protection is on by default for cookie-authenticated views — keep it enabled; DRF's `SessionAuthentication` respects it automatically, JWT-header-based auth does not need it but cookie-stored JWTs (recommended per §4) do.
- **Rate limiting:** `django-ratelimit` on the login/password-reset views, mirroring the edge-level limiting described in §13.1.
- **Async notification dispatch:** Celery (+ Redis/RabbitMQ broker) for the password-reset email and any outbox-pattern SMS dispatch worker described in [ARCHITECTURE.md](ARCHITECTURE.md) §7 — do not send email/SMS synchronously inside the request/response cycle.
- **Avoid implicit signal handlers for audit logging.** Django signals can silently trigger audit-log writes from unexpected code paths; prefer explicit service-layer calls (`AuditService.log(...)`) so every audit entry has a traceable call site — consistent with the layered service architecture already specified for this project.
