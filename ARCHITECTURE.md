# MediQueue — Redesigned System Architecture
### Smart Clinic Queue & Priority Triage System — Staff-Operated, SMS-Notified

**Status:** Target architecture (supersedes patient self-service model)
**Scope:** Architecture only — no UI colors, branding, or code changes implied by this document.
**Stack basis:** This redesign is grounded in the actual current implementation (Next.js/React + TypeScript + Supabase/PostgreSQL), reorganized around a new operating model.

---

## 0. Design Mandate

The previous architecture treated patients as authenticated users with a self-service dashboard. That model is retired. The new mandate:

| # | Rule |
|---|------|
| 1 | Patients never authenticate, register, or use the software in any form. |
| 2 | Patients are enrolled physically at the clinic by a receptionist. |
| 3 | Every patient touchpoint after intake is a one-way or reply-capable **SMS**. |
| 4 | All screens, all workflows, all roles belong to clinic staff. |
| 5 | The system is multi-clinic, multi-department, multi-room from day one — not bolted on later. |
| 6 | Visual identity (colors, branding, logo) is unchanged. "More professional" means layout discipline, consistent component usage, information hierarchy, and accessibility — not a new palette. |

This single decision (removing the patient dashboard) is what simplifies almost every layer below: authentication only needs to model 4–5 staff roles, there is no patient session to secure, and the frontend shrinks to one operator-facing application instead of two.

---

## 1. Overall Architecture

### 1.1 System Context Diagram

```
                                   ┌────────────────────────────┐
                                   │        PATIENT (no login)    │
                                   │  physically present at desk  │
                                   └───────────────┬──────────────┘
                                                    │ (1) walk-in / hands over details
                                                    ▼
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │                              CLINIC — PHYSICAL SITE                              │
 │                                                                                    │
 │   ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────────────────────┐ │
 │   │Reception  │   │  Nurse /  │   │  Doctor    │   │  Waiting-Room Display      │ │
 │   │  Desk     │   │  Triage   │   │ Consult    │   │  (public, read-only,       │ │
 │   │ (tablet/PC)│   │  Station  │   │  Room(s)   │   │   no auth, TV/kiosk)       │ │
 │   └─────┬─────┘   └─────┬─────┘   └─────┬─────┘   └──────────────┬──────────────┘ │
 │         │               │               │                        │                │
 └─────────┼───────────────┼───────────────┼────────────────────────┼────────────────┘
           │               │               │                        │
           └───────────────┴───────┬───────┴────────────────────────┘
                                    │  HTTPS (staff auth required, except display)
                                    ▼
                   ┌───────────────────────────────────────┐
                   │        MEDIQUEUE STAFF WEB APP          │
                   │        (Next.js — role-based portal)    │
                   └───────────────────┬─────────────────────┘
                                        │  Service-layer calls
                                        ▼
                   ┌───────────────────────────────────────┐
                   │           APPLICATION BACKEND           │
                   │  API Layer → Domain Services → Repos     │
                   │  Queue Engine · Notification Service     │
                   │  Triage Engine · Reporting/Analytics     │
                   └───────┬───────────────────────┬─────────┘
                           │                        │
                           ▼                        ▼
             ┌─────────────────────────┐   ┌──────────────────────────┐
             │   POSTGRES (Supabase)    │   │      SMS GATEWAY          │
             │  multi-tenant, RLS,      │   │  (Twilio / Africa's       │
             │  Realtime channels        │   │   Talking / Infobip)      │
             └─────────────────────────┘   └────────────┬─────────────┘
                                                          │ SMS
                                                          ▼
                                             ┌────────────────────────┐
                                             │   PATIENT'S PHONE        │
                                             │  (any handset, no app)   │
                                             └────────────────────────┘
```

### 1.2 Architectural Style

- **Layered / Clean Architecture** on the backend: Presentation (API routes) → Application Services (business rules) → Domain (queue, triage, notification logic) → Infrastructure (Supabase repositories, SMS adapters).
- **Modular monolith**, not microservices. A clinic queue system has tight transactional consistency needs (one ticket, one room, one status) — microservices would add distributed-transaction risk without a real scaling need at this stage. Section 9 explains how this monolith still scales horizontally and how individual services (Notification, Reporting) can be peeled off later without a rewrite.
- **Multi-tenant single database** with `clinic_id` as a first-class partition key on every table, enforced by Postgres Row-Level Security — not one database per clinic. This keeps operations simple while fully isolating each clinic's data.
- **Event-driven notification boundary**: state changes in the Queue Engine emit domain events (`ticket.created`, `ticket.called`, `ticket.position_changed`, `ticket.no_show`) that the Notification Service consumes asynchronously. The queue never blocks on SMS delivery.

---

## 2. Folder Architecture

Reorganized around **roles and domains**, not around "patient vs admin." Route groups map 1:1 to job functions; shared logic is centralized so no business rule is duplicated across routes.

```
clinic-queue-system/
├── app/
│   ├── (public)/
│   │   ├── login/                     # single staff login (all roles)
│   │   └── display/[clinicId]/        # waiting-room TV screen — no auth, read-only
│   │
│   ├── (platform)/                    # super-admin: manages clinics/tenants
│   │   └── platform-admin/
│   │       ├── clinics/
│   │       ├── billing/               (future)
│   │       └── system-settings/
│   │
│   ├── (clinic)/                      # everything below requires staff session + clinic context
│   │   ├── layout.tsx                 # resolves active clinic, role, permissions
│   │   │
│   │   ├── reception/                 # front-desk role
│   │   │   ├── intake/                # register walk-in patient, print/SMS ticket
│   │   │   ├── appointments/
│   │   │   └── queue-overview/
│   │   │
│   │   ├── triage/                    # nurse role
│   │   │   ├── assessment/
│   │   │   └── queue/
│   │   │
│   │   ├── consultation/              # doctor role
│   │   │   ├── room/[roomId]/
│   │   │   └── history/
│   │   │
│   │   ├── admin/                     # clinic administrator role
│   │   │   ├── dashboard/
│   │   │   ├── departments/
│   │   │   ├── rooms/
│   │   │   ├── staff/
│   │   │   ├── sms-templates/
│   │   │   ├── sms-logs/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   │
│   │   └── shared/                    # cross-role widgets (queue board, notif bell)
│   │
│   └── api/
│       ├── intake/                    # POST create patient + ticket (reception)
│       ├── triage/                    # POST/PATCH triage assessment
│       ├── queue/
│       │   ├── [ticketId]/call/
│       │   ├── [ticketId]/status/
│       │   └── live/                  # SSE/Realtime bridge for board + display
│       ├── appointments/
│       ├── notifications/
│       │   └── webhook/               # delivery-status callbacks from SMS provider
│       ├── reports/
│       ├── clinics/                   # platform-admin only
│       ├── staff/
│       └── auth/
│
├── lib/
│   ├── domain/                        # pure business logic, framework-agnostic
│   │   ├── queue/
│   │   │   ├── priority-score.ts
│   │   │   ├── queue-state-machine.ts
│   │   │   └── room-assignment.ts
│   │   ├── triage/
│   │   │   └── risk-scoring.ts
│   │   └── notifications/
│   │       └── event-types.ts
│   │
│   ├── services/                      # application services — orchestrate domain + repos
│   │   ├── intake-service.ts
│   │   ├── queue-service.ts
│   │   ├── triage-service.ts
│   │   ├── appointment-service.ts
│   │   ├── notification-service.ts
│   │   ├── reporting-service.ts
│   │   ├── staff-service.ts
│   │   └── clinic-service.ts
│   │
│   ├── repositories/                  # data-access, one per aggregate, Supabase-backed
│   │   ├── patient-repository.ts
│   │   ├── queue-repository.ts
│   │   ├── clinic-repository.ts
│   │   └── ...
│   │
│   ├── notifications/
│   │   ├── providers/                 # adapter per SMS vendor
│   │   │   ├── twilio-adapter.ts
│   │   │   └── provider-interface.ts
│   │   ├── templates/
│   │   └── dispatcher.ts              # outbox worker
│   │
│   ├── security/
│   │   ├── rbac.ts                    # role→permission matrix
│   │   ├── clinic-context.ts          # resolves tenant from session
│   │   └── audit.ts
│   │
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   │
│   └── realtime/
│       └── queue-channel.ts
│
├── components/
│   ├── ui/                            # existing design-system primitives (unchanged palette)
│   ├── queue-board/
│   ├── triage-form/
│   ├── ticket-card/
│   └── layout/                        # role-specific shells (reception, triage, admin)
│
└── supabase/
    ├── schema.sql
    ├── policies/                      # RLS policies, one file per table
    └── functions/                     # DB functions (atomic ticket-number, priority recompute)
```

Key change from the current tree: **`app/patient/*` and `app/auth/patient-login`, `patient-signup` are removed entirely.** `app/api/patient/*` is removed. A single public route (`(public)/display/[clinicId]`) replaces all patient-facing screens with a read-only, non-identifying queue board.

---

## 3. Backend Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  API LAYER  (Next.js Route Handlers)                                 │
│  - Thin controllers: parse request, check auth/role, call a service, │
│    map result to HTTP response. No business logic lives here.        │
└───────────────────────────────┬────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  APPLICATION SERVICE LAYER  (lib/services)                           │
│  - One service per business capability (Intake, Queue, Triage,       │
│    Appointment, Notification, Reporting, Staff, Clinic).             │
│  - Owns transactions, authorization rules, cross-aggregate workflow. │
│  - Publishes domain events after state changes.                      │
└───────────────────────────────┬────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  DOMAIN LAYER  (lib/domain)                                          │
│  - Pure functions/state machines: priority scoring, queue transition │
│    rules, triage risk scoring, room-assignment algorithm.            │
│  - No I/O, no framework dependency → independently testable.         │
└───────────────────────────────┬────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│  REPOSITORY / INFRASTRUCTURE LAYER  (lib/repositories, lib/supabase) │
│  - Supabase Postgres access, Realtime publish, RLS-scoped queries.   │
│  - SMS provider adapters, DB functions for atomic operations.        │
└─────────────────────────────────────────────────────────────────────┘
```

**Why this layering matters here specifically:** the current codebase calls Supabase directly from API route handlers. That works at small scale but means business rules (e.g., "critical triage bypasses queue position") end up duplicated across route files. Pulling that logic into `lib/domain` + `lib/services` means the same priority/queue rule is used by the intake API, the triage API, and any future channel (USSD, staff mobile app) without copy-paste.

**Backend building blocks:**
- **Next.js Route Handlers** — synchronous request/response API surface for staff app.
- **Postgres functions (RPC)** — for operations that must be atomic under concurrency: ticket-number generation, priority recomputation, room assignment. Using a DB function with `FOR UPDATE`/advisory locks avoids race conditions that application-layer logic can't guarantee under concurrent requests from multiple reception terminals.
- **Supabase Realtime** — publishes queue/ticket changes to subscribed staff clients and the waiting-room display.
- **Scheduled jobs (Vercel Cron / Supabase Cron)** — wait-time aging recalculation, appointment reminder dispatch, daily/weekly report pre-aggregation, stale-ticket auto-expiry.
- **Outbox table (`sms_outbox`)** — services write intended notifications here inside the same transaction as the state change; a separate dispatcher worker reads and sends. This decouples "the ticket was created" (must be reliable) from "the SMS was sent" (may retry, may fail, must not roll back the ticket).

---

## 4. Frontend Architecture

One application, several role-scoped experiences — not one app per role.

```
┌───────────────────────────────────────────────────────────────┐
│  Shell (app/(clinic)/layout.tsx)                                │
│  - Resolves session → role → clinic context → permission set    │
│  - Renders role-appropriate navigation, everything else shared  │
└───────────────────────────────────────────────────────────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
   Reception UI    Triage UI     Consultation UI   Admin UI
   (intake-first,  (assessment   (single active     (dashboards,
   large touch     form + queue  patient, big       config, reports)
   targets for     hand-off)     status controls)
   tablets)
```

- **Rendering strategy:** Server Components for data-heavy dashboards/reports (fetch once, render on server, cheap for low-power reception PCs); Client Components only where live interactivity is required (queue board, call-next button, triage form).
- **Live data:** Supabase Realtime subscriptions drive the queue board and waiting-room display; SWR/React Query handles request caching for everything else. No polling loops.
- **Design system:** existing `components/ui` primitives and current color tokens are preserved as-is. "More professional" is achieved through: consistent spacing/typography scale, a shared page-header/breadcrumb pattern across all role portals, table/list density appropriate for clinical use, clearer empty/loading/error states, and accessible contrast/focus states — none of which touches the palette.
- **Waiting-room display:** a dedicated unauthenticated route rendering only queue numbers/department/room — never a patient name, condition, or any PHI. This is the only "public" surface in the whole system.
- **No patient routes, no patient auth guard, no patient state.** Removing this whole vertical shrinks the frontend's auth matrix to 4–5 staff roles.

---

## 5. Service Layer

Each service is the single owner of one capability's rules. API routes and background jobs are both just *callers* of these services — never a second place where the same rule is re-implemented.

| Service | Responsibility | Emits Events |
|---|---|---|
| `ClinicService` | Clinic (tenant) CRUD, operating hours, branding config | `clinic.updated` |
| `DepartmentService` | Departments per clinic, capacity, routing rules | — |
| `RoomService` | Consultation rooms, room↔department mapping, availability | `room.freed` |
| `StaffService` | Staff accounts, role assignment, shift/on-duty status | `staff.on_duty_changed` |
| `IntakeService` | Registers a physically-present patient, opens a ticket | `ticket.created` |
| `TriageService` | Records triage assessment, computes risk score | `triage.completed` |
| `QueueService` | Orchestrates the Queue Engine: call-next, transitions, reassignment | `ticket.called`, `ticket.completed`, `ticket.no_show`, `ticket.position_changed` |
| `AppointmentService` | Scheduled visits, converts appointment → queue ticket on arrival | `appointment.reminder_due` |
| `NotificationService` | Subscribes to domain events, renders template, writes to outbox | `notification.queued`, `notification.failed` |
| `ReportingService` | Aggregates queue/triage/staff metrics into report views | — |
| `AuditService` | Immutable log of every state-changing staff action | — |

```
   IntakeService ──ticket.created──▶ NotificationService ──▶ SMS Outbox ──▶ Gateway
        │
        ▼
   QueueService ◀──assessment──── TriageService
        │
        ├──ticket.called────────▶ NotificationService  ("It's your turn, Room 3")
        ├──ticket.position_changed (threshold crossed) ▶ NotificationService
        └──ticket.no_show───────▶ NotificationService  (rebooking SMS, optional)
```

Services communicate laterally only through **domain events**, never by calling each other's internals directly. This keeps `QueueService` ignorant of *how* a notification is delivered, and keeps `NotificationService` ignorant of queue logic — either can change independently.

---

## 6. Queue Engine

The core differentiator of the system. Deterministic, explainable, and safe under concurrent staff actions.

### 6.1 Ticket State Machine

```
   registered ──▶ waiting ──▶ called ──▶ inConsultation ──▶ completed
                     │            │
                     │            └────▶ noShow  ──▶ (rebook / re-queue)
                     └────▶ cancelled
```

- Transitions are only ever executed inside `QueueService`, via a Postgres function that locks the row, validates the current state permits the transition, and writes the new state — preventing two staff members from double-calling the same ticket.

### 6.2 Priority Scoring

Each waiting ticket has a **composite priority score**, recomputed on a schedule and on every relevant event:

```
priority_score = f(triage_level, wait_time_aging, visit_type, department_load)

  triage_level      → base weight (critical=1000, high=500, medium=200, low=50)
  wait_time_aging    → + (minutes_waited × aging_factor)   [prevents starvation]
  visit_type          → appointment-on-time gets a scheduled slot bonus
  department_load    → deprioritizes routing into an already-saturated department
```

- **Aging factor** guarantees a "low" priority patient who has waited 90 minutes eventually outranks a newly-arrived "medium" patient — this is what stops indefinite starvation in a pure severity-first queue.
- **Critical bypass:** triage level `critical` is exempt from normal ordering and is surfaced immediately at the top of every relevant room's queue, with a distinct alert to on-duty staff.

### 6.3 Multi-Room / Multi-Department Structure

```
CLINIC
 ├── Department: General Consultation
 │      ├── Room 1 (Dr. A) ── sub-queue
 │      └── Room 2 (Dr. B) ── sub-queue
 ├── Department: Maternal & Child Health
 │      └── Room 3 (Nurse C) ── sub-queue
 └── Department: Emergency / Priority Bay
        └── Room 4 ── critical-only sub-queue
```

- The engine maintains one logical clinic-wide priority queue **and** per-department/per-room views derived from it, so a receptionist sees the whole clinic while a doctor sees only their room's next patient.
- **Room assignment algorithm:** least-loaded-room-in-matching-department, with manual override always available to staff (the algorithm assists, never locks out human judgment — critical for a clinical setting).

### 6.4 Concurrency & Correctness

- "Call next" is implemented as a single atomic DB function (`SELECT ... FOR UPDATE SKIP LOCKED` pattern) so two terminals calling "next" simultaneously never pull the same patient twice.
- Ticket numbers are generated from a per-clinic-per-day sequence, not from application-layer counting, to avoid duplicates under concurrent intake.

---

## 7. Notification Service

The only channel patients ever see. Must be reliable, provider-agnostic, and template-driven.

### 7.1 Architecture

```
Domain Event ──▶ NotificationService ──▶ Template Renderer ──▶ sms_outbox (DB, status=pending)
                                                                       │
                                                        Dispatcher Worker (cron / queue consumer)
                                                                       │
                                                          ┌────────────┴────────────┐
                                                          ▼                          ▼
                                                  Provider Adapter          Provider Adapter
                                                  (Twilio)                  (Twilio)
                                                          │                          │
                                                          └────────────┬─────────────┘
                                                                       ▼
                                                              Patient's phone (SMS)
                                                                       │
                                                     Delivery webhook ──▶ /api/notifications/webhook
                                                                       │
                                                              sms_outbox.status = delivered/failed
```

### 7.2 Design Decisions

- **Adapter pattern for gateways:** `ProviderInterface` (send, checkStatus) is implemented per vendor (Twilio, Infobip). Swapping or adding a provider — including per-clinic provider choice, e.g. different countries — never touches `NotificationService` logic.
- **Outbox pattern, not direct send:** the state change (ticket created, ticket called) commits to the database regardless of SMS success. SMS sending is a best-effort side effect with its own retry policy — a gateway outage must never block or roll back clinical workflow.
- **Retry with backoff + dead-letter:** failed sends retry a bounded number of times, then land in a `failed` state visible to admins in `sms-logs`, rather than silently dropping.
- **Templates by event type**, localizable per clinic/language:
  - Ticket issued: *"You are #{{number}} at {{clinic}}. Estimated wait {{minutes}} min."*
  - Position update: *"You are now #{{position}} in line. Please be nearby."*
  - Called: *"It's your turn — please proceed to {{room}}."*
  - No-show: *"You missed your turn. Reply YES within 10 min to rejoin, or visit reception."*
  - Appointment reminder: *"Reminder: appointment at {{clinic}} on {{date}} {{time}}."*
- **Inbound SMS (optional, future-ready):** the webhook endpoint is designed to also accept inbound replies (e.g. "YES" to rejoin queue), giving patients a minimal reply channel without ever requiring an app or login.
- **Rate limiting / batching:** dispatcher respects per-provider throughput limits and batches sends during high-volume periods (e.g., mass appointment reminders) to avoid provider throttling or cost spikes.

---

## 8. Security Architecture

Because patients never authenticate, the entire security model collapses to **protecting staff access and clinic data isolation** — a materially smaller and more auditable surface than the previous dual patient/staff model.

```
┌──────────────────────────────────────────────────────────────────┐
│ Identity: Supabase Auth (staff only)                              │
│  - Email + password, optional org SSO later                       │
│  - MFA available for administrator/platform-admin roles           │
├──────────────────────────────────────────────────────────────────┤
│ Authorization: RBAC                                                │
│  Roles: platform-admin, administrator, receptionist, nurse, doctor │
│  - Permission matrix in lib/security/rbac.ts, enforced in the      │
│    service layer (not just hidden in the UI)                      │
├──────────────────────────────────────────────────────────────────┤
│ Tenant Isolation: Postgres Row-Level Security                     │
│  - Every table scoped by clinic_id                                 │
│  - A receptionist's session can only ever read/write their own    │
│    clinic's rows, enforced at the database, not just the API      │
├──────────────────────────────────────────────────────────────────┤
│ Data Protection                                                    │
│  - TLS everywhere (client↔app, app↔Supabase, app↔SMS gateway)      │
│  - PHI (symptoms, history, allergies) never sent via SMS —         │
│    outbound messages are limited to number/room/time only          │
│  - Waiting-room display shows queue numbers only, never names      │
├──────────────────────────────────────────────────────────────────┤
│ Auditability                                                       │
│  - AuditService logs every state-changing action: who, what,      │
│    when, on which patient/ticket — required for clinical           │
│    accountability and incident review                              │
├──────────────────────────────────────────────────────────────────┤
│ Secrets & Keys                                                     │
│  - SMS provider keys and Supabase service-role key live only in   │
│    server-side environment, never shipped to the browser           │
│  - Service-role key used exclusively inside trusted server code    │
│    (API routes, cron jobs) — never in client components            │
├──────────────────────────────────────────────────────────────────┤
│ Abuse / Availability                                                │
│  - Rate limiting on intake and auth endpoints                      │
│  - Idempotency keys on ticket-creation to prevent duplicate         │
│    tickets from double-submits on shared terminals                 │
└──────────────────────────────────────────────────────────────────┘
```

Removing patient login also removes an entire historically high-risk surface: patient account takeover, password reset abuse, and patient-side session hijacking simply no longer exist as attack vectors.

---

## 9. Scalability Architecture

```
                         ┌────────────────────────┐
                         │   CDN / Edge (static)    │
                         └────────────┬─────────────┘
                                      ▼
              ┌────────────────────────────────────────┐
              │   Next.js app — stateless, horizontally  │
              │   scaled across serverless instances     │
              │   (Vercel or equivalent), N clinics       │
              └───────────────────┬──────────────────────┘
                                   ▼
              ┌────────────────────────────────────────┐
              │   Connection pooler (Supabase pgbouncer) │
              └───────────────────┬──────────────────────┘
                                   ▼
      ┌────────────────────┐            ┌─────────────────────────┐
      │  Primary Postgres    │──replica──▶│  Read replica            │
      │  (writes: intake,    │            │  (reads: reporting,      │
      │   queue transitions) │            │   analytics dashboards)  │
      └────────────────────┘            └─────────────────────────┘
```

- **Stateless application tier** means adding clinics adds load, not architectural complexity — every request carries its own clinic/tenant context, so scaling horizontally is just adding instances.
- **Tenant partitioning via `clinic_id`** on every table + composite indexes (`clinic_id, status`, `clinic_id, created_at`) keeps per-clinic queries fast even as total row count grows across hundreds of clinics.
- **Read/write separation for reporting:** analytics and report generation query a read replica (or pre-aggregated materialized views refreshed on schedule) so heavy reporting queries never contend with live queue writes — this matters specifically because queue-call latency is clinically time-sensitive.
- **Realtime fan-out:** Supabase Realtime channels are scoped per clinic (`queue:{clinicId}`), so a busy clinic's update volume doesn't broadcast to or burden other clinics' connected clients.
- **Notification throughput decoupled from request path:** the outbox + dispatcher pattern means a slow or rate-limited SMS provider never slows down queue operations; the dispatcher scales independently (more workers, more provider accounts) as SMS volume grows.
- **Caching:** clinic configuration, department/room lists, and SMS templates change rarely — cached at the edge/application layer with short TTL + explicit invalidation on admin update, reducing DB load for effectively-static lookups.
- **Growth path beyond the monolith:** if a specific capability (e.g. Notification dispatch at very high SMS volume, or Reporting at very large multi-year datasets) outgrows the shared app, that single service layer module can be extracted into its own deployable process communicating over the same domain-event contract — the modular-monolith boundaries drawn in Section 5 are exactly where that seam would be cut, without redesigning the rest of the system.

---

## 10. Future Expansion

Designed to be added onto, not around:

- **USSD channel** (`*XXX#`) for patients on feature phones to check queue position or self-report arrival — reuses the same `QueueService`/`NotificationService` contracts, just a new inbound adapter, no core changes.
- **WhatsApp Business API** as a second notification channel alongside SMS — implemented as another `ProviderInterface` adapter (Section 7.2), selectable per clinic or per patient preference.
- **Telemedicine handoff:** a queue ticket can route to a virtual consultation room instead of a physical one — `RoomService` already models rooms as an abstraction, so a "virtual room" is a natural extension, not a redesign.
- **National Patient ID / EMR integration:** `IntakeService` gains an optional lookup step against an external identity/health-record system at registration time, without changing the queue or notification layers.
- **Post-visit SMS satisfaction survey:** a new event (`ticket.completed`) consumer, following the exact same event-driven notification pattern already built for queue updates.
- **AI-assisted triage suggestion:** an advisory scoring model that feeds into `TriageService`'s risk-scoring step as an additional signal — staff retain final decision authority, consistent with the "assist, never auto-decide" principle already used in room assignment (Section 6.3).
- **Staff mobile app (React Native):** consumes the exact same `lib/services` and API contracts as the web app — no duplicated business logic, because none of it lives in the frontend.
- **Multi-region deployment:** for national/cross-border clinic networks, the tenant-partitioned data model (Section 9) is the prerequisite already in place for regional database placement per data-residency requirements.
- **Billing / subscription layer for platform-admin:** clinics as tenants already exist as a first-class entity (Section 1.1, `ClinicService`), making a usage/billing module an additive service rather than a structural change.

---

## Summary of What Changes vs. Current Implementation

| Area | Before | After |
|---|---|---|
| Patient access | Login, self-service dashboard, book appointments online | No login, no app access — physical intake only |
| Frontend surfaces | Patient app + Admin app | Single staff app (role-scoped) + one public read-only display |
| Auth complexity | 5 roles incl. patient, patient session guard | 4–5 staff roles only, no patient session |
| Patient communication | In-app notifications page | SMS only, event-driven, provider-agnostic |
| Business logic location | Partly inline in API routes | Centralized in `lib/domain` + `lib/services` |
| Queue fairness | Priority + basic status | Composite score with aging, critical bypass, room-aware |
| Multi-tenancy | `clinic_id` present but not the organizing principle | `clinic_id` + RLS is the core partitioning strategy throughout |
