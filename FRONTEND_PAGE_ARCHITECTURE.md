# MediQueue — Frontend Page Architecture
### React/Next.js — Staff-Only Page Catalog, Branding & Palette Unchanged

**Scope:** Frontend page architecture only — no code. Every page renders inside the persistent shell already specified in [ADMIN_DASHBOARD_UX_REDESIGN.md](ADMIN_DASHBOARD_UX_REDESIGN.md) §2 (Sidebar, Header, User Menu) — not re-described per page below, only page-specific deltas are called out. All colors are the existing tokens from `lib/colors.ts` (§1 of that same document) — nothing here introduces a new hue. Data contracts for every action below map directly to [API_SPECIFICATION.md](API_SPECIFICATION.md); workflow rules map to [CLINICAL_WORKFLOW_DESIGN.md](CLINICAL_WORKFLOW_DESIGN.md); role gating maps to [SECURITY_AUTH_DESIGN.md](SECURITY_AUTH_DESIGN.md) §2/§12.

**Ground rule:** every page in this catalog is reachable only by an authenticated staff session. There is no patient-facing route in this document except the one already-established exception — the unauthenticated waiting-room display ([ARCHITECTURE.md](ARCHITECTURE.md) §2, `(public)/display/[clinicId]`) — which is not a "page" in the staff sense and is out of scope here.

---

## 0. Cross-Cutting Principles

- **Role-scoped navigation, not role-scoped apps.** One React application; the Sidebar renders a different nav-item set per role (already implemented in `Sidebar.tsx`'s `roles` filter), and each page's own permission check (mirroring [SECURITY_AUTH_DESIGN.md](SECURITY_AUTH_DESIGN.md) §12) governs what renders inside it — Receptionist and Nurse both might land on a "Queue" nav item, but see different action sets once there.
- **Shared component vocabulary**, reused verbatim across every page rather than redefined per page:
  - `StatusBadge` / `PriorityBadge` — colored pill, tokens from `statusStyles`/`priorityStyles`
  - `ConfirmDialog` — destructive/irreversible actions (deactivate staff, cancel ticket)
  - `EmptyState` — icon + message + primary action, never a bare "no data"
  - `DataTable` — sticky header, compact/comfortable density toggle, skeleton loading rows, pagination (per [ADMIN_DASHBOARD_UX_REDESIGN.md](ADMIN_DASHBOARD_UX_REDESIGN.md) §5)
  - `DateRangeFilter`, `SearchInput`, `FilterChip` — consistent filter UI across every list page
- **Responsive baseline** (stated once, referenced per page as "standard responsive behavior"): desktop ≥1280px (full multi-column layout, sidebar expanded), tablet 768–1279px (sidebar collapses to icon rail, grids drop to 2-column), mobile <768px (sidebar becomes the bottom-nav + drawer pattern already in `app/admin/layout.tsx`, all grids/tables stack to single column, tables convert to stacked card rows rather than horizontal-scroll where the row has more than 4 fields).

---

## 1. Page Inventory

| # | Page | Route (example) | Primary role(s) |
|---|---|---|---|
| 1 | Login | `/login` | All (unauthenticated) |
| 2 | Dashboard | `/{role}/dashboard` | All (role-variant content) |
| 3 | Patient Registration | `/reception/intake` | Receptionist |
| 4 | Patient Search | `/patients` | Receptionist, Nurse, Doctor, ClinicAdmin |
| 5 | Patient Details | `/patients/{id}` | Receptionist, Nurse, Doctor, ClinicAdmin |
| 6 | Queue Management | `/reception/queue` or `/triage/queue` | Receptionist, Nurse |
| 7 | Live Queue | `/queue/live` | All staff (read), ClinicAdmin (oversight actions) |
| 8 | Triage | `/triage/assessment` | Nurse |
| 9 | Consultation | `/consultation/room/{roomId}` | Doctor |
| 10 | SMS Logs | `/admin/sms-logs` | ClinicAdmin (full), Receptionist (own-triggered) |
| 11 | Reports | `/admin/reports` | ClinicAdmin |
| 12 | Analytics | `/admin/analytics` | ClinicAdmin |
| 13 | Staff Management | `/admin/staff` | ClinicAdmin, SuperAdmin |
| 14 | Departments | `/admin/departments` | ClinicAdmin |
| 15 | Settings | `/admin/settings` | ClinicAdmin |
| 16 | System Logs (Audit) | `/admin/audit-logs` | ClinicAdmin, SuperAdmin |
| 17 | Profile | `/profile` | All staff (self) |
| 18 | Notifications | `/notifications` | All staff (self) |

---

## 2. Login

**Purpose:** the sole entry point into the system — no signup link exists anywhere on or near this page.

- **Components:** centered auth card on a flat brand-navy background (no decorative imagery competing with the form); clinic logo + "MediQueue" wordmark above the card.
- **Forms:** Email field, Password field (masked, show/hide toggle), conditional TOTP code field (appears only after a successful password check for ClinicAdmin/SuperAdmin roles, per [SECURITY_AUTH_DESIGN.md](SECURITY_AUTH_DESIGN.md) §5).
- **Buttons:** primary "Sign In" (brand blue, full-width, disabled until both fields non-empty); text-link "Forgot password?" beneath the form.
- **Dialogs:** none on this page — "Forgot password" navigates to a dedicated route (§ password-reset flow), not a modal, so it's linkable/bookmarkable.
- **Validation feedback:** inline field errors (empty field) render immediately; server-side errors ("Invalid email or password", "Account locked. Contact your administrator.") render as a single banner above the form, never attributed to a specific field (enumeration prevention).
- **Cards/Tables/Filters/Search/Actions:** not applicable to this page.
- **Responsive behavior:** the card is the only element on the page at every breakpoint — no layout change needed beyond centering; on mobile the card takes ~90% viewport width instead of a fixed max-width.

---

## 3. Dashboard

**Purpose:** the role-appropriate landing page after login — the single busiest page in the system, so the content is role-variant, not one shared page.

- **Clinic Administrator variant:** fully specified in [ADMIN_DASHBOARD_UX_REDESIGN.md](ADMIN_DASHBOARD_UX_REDESIGN.md) §2–§3 — 8 Overview Cards, Live Queue table, Queue Performance/Department Statistics/Registrations-trend charts, SMS Statistics, Recent Activity, Quick Actions. Not repeated here.
- **Receptionist variant (new, not previously specified):** page context bar with today's registration count; 3 KPI cards only (Today's Registrations, Waiting Patients, Appointments Today — narrower set, front-desk-relevant); primary widget is a **compact intake shortcut card** ("+ Register Patient") pinned above the fold; Live Queue table scoped to a simplified read-only view (no department-wide oversight, just "who's currently in my clinic's queue"); Quick Actions scoped to Register Patient / Check In Appointment / View Queue.
- **Nurse variant:** KPI cards: Waiting for Triage, Critical/High Priority Waiting, Avg Triage Time; primary widget is the **Triage Queue list** (patients awaiting assessment, sorted oldest-first within priority) with a one-click "Start Triage" action per row; Recent Triage table (own assessments today).
- **Doctor variant:** KPI cards: My Queue (patients assigned to my room), Avg Consultation Time (mine), Completed Today (mine); primary widget is the **"Now Serving" card** (current patient's name, ticket, triage summary) plus a "Call Next" button; Recent Consultations table (own, today).
- **Cards/Tables/Charts:** as itemized per variant above; all reuse the KPI-card and table anatomy defined in [ADMIN_DASHBOARD_UX_REDESIGN.md](ADMIN_DASHBOARD_UX_REDESIGN.md) §3.2/§5 regardless of role, for visual consistency across variants.
- **Filters:** date-range filter in the header (ClinicAdmin variant only — the other roles are inherently "today, my queue" scoped and don't need a range picker).
- **Actions:** Call Next (Nurse/Doctor), Register Patient (Receptionist), Export Snapshot (ClinicAdmin).
- **Responsive behavior:** standard baseline; on mobile every variant collapses to a single-column stack, KPI cards to 2-up, with the role's primary widget (Triage Queue / Now Serving / Intake shortcut) promoted to the top of the stack, above the KPI row, since it's the most actionable content for that role on a small screen.

---

## 4. Patient Registration (Intake)

**Purpose:** the Receptionist's core workflow — register a walk-in or check in an appointment, physically, per [CLINICAL_WORKFLOW_DESIGN.md](CLINICAL_WORKFLOW_DESIGN.md) §2.2. This page never issues a queue ticket directly — it hands off to Triage, which is where Queue Generation actually happens.

- **Components:** two-stage flow on a single page — (1) **Phone Lookup** step: a prominent phone-number input with a "Search" action, checked against `GET /patients/lookup/` before anything else is shown; (2) **Registration Form**, which either pre-fills from a found record (editable) or starts blank for a new patient.
- **Forms:** Full Name*, Phone*, Date of Birth, Gender, National ID, Address, Emergency Contact Name/Phone, Known Allergies (tag input), Blood Type, Visit Type (Walk-in / Appointment toggle), Visit Reason (free text). `*` = mandatory per VR-01.
- **Buttons:** primary "Register & Send to Triage" (disabled until Full Name + Phone are valid); secondary "Clear Form"; if a lookup match was found, a "Not this patient?" link to discard the pre-fill and start blank (handles shared/typo'd phone numbers, Edge Case #2 in [CLINICAL_WORKFLOW_DESIGN.md](CLINICAL_WORKFLOW_DESIGN.md)).
- **Dialogs:** **"Existing Patient Found"** confirmation dialog when the phone lookup matches — shows the found name/DOB and asks the receptionist to confirm before pre-filling, rather than silently auto-filling (prevents mis-registering the wrong person on a shared phone).
- **Validation:** phone format-validated inline as typed (not only on submit); duplicate-phone `409` from the API surfaces as the confirmation dialog above rather than a raw error.
- **Cards/Tables/Filters/Search:** the Phone Lookup step doubles as the page's only "search," scoped to exact-match; no table on this page (that's Patient Search, §5).
- **Actions:** none post-submission beyond a success toast + redirect to the Triage queue with the new visit highlighted.
- **Responsive behavior:** on tablet (the realistic front-desk device), the form renders as a single column, large touch targets, sticky "Register & Send to Triage" button pinned to the bottom of the viewport rather than requiring scroll-to-submit.

---

## 5. Patient Search

**Purpose:** find an existing patient for any staff purpose (recognize a returning walk-in, look up history before a consultation, verify a record before editing).

- **Components:** full-width `SearchInput` (name or phone, debounced), results `DataTable` below.
- **Tables:** **Patients table** — columns: Name, Phone, Date of Birth, Last Visit Date, Actions. Empty-query state shows recent-patients (today's registrations) rather than a blank page.
- **Search:** fuzzy on name, exact-or-partial on phone (`?search=` per [API_SPECIFICATION.md](API_SPECIFICATION.md) §6); results update live as the receptionist types (debounced ~300ms).
- **Filters:** none beyond search — this is deliberately a lightweight lookup page, not a report; a Receptionist wanting a filtered patient report is redirected conceptually to Reports (§11), not this page.
- **Actions (row-level):** "View Details" (→ Patient Details, §6), "Start New Visit" (→ pre-fills Patient Registration with this patient, skipping the lookup step).
- **Buttons:** none page-level beyond the search itself.
- **Dialogs:** none.
- **Responsive behavior:** table converts to stacked cards on mobile (name + phone as the card header, last visit + actions below) rather than horizontal scroll, since only 2 of the 5 columns are essential for a quick lookup on a small screen.

---

## 6. Patient Details

**Purpose:** the full record for one patient — demographics plus the complete visit history, since a `patient` in this system accumulates many `patient_visits` over time.

- **Components:** header card (name, phone, DOB, allergies as warning-colored tags if present) + tab strip: **Demographics** / **Visit History** / **Medical Notes**.
- **Cards:** demographic summary card at the top of every tab (persistent context, doesn't scroll away — sticky on desktop).
- **Tables:** **Visit History table** (Visit History tab) — columns: Date, Type (Walk-in/Appointment), Department(s) visited (one visit may span several, per [CLINICAL_WORKFLOW_DESIGN.md](CLINICAL_WORKFLOW_DESIGN.md) §8.5), Outcome/Status, Actions ("View Visit" expands the full queue-entry/consultation chain for that visit inline).
- **Forms:** Demographics tab renders as an editable form (Receptionist only; read-only display for Nurse/Doctor/ClinicAdmin) — same field set as Registration (§4).
- **Buttons:** "Edit" (Receptionist, toggles the Demographics tab into edit mode), "Start New Visit" (top-right, always visible regardless of active tab).
- **Dialogs:** "Save changes?" confirm dialog only if navigating away with unsaved demographic edits.
- **Filters:** Visit History tab has a lightweight date-range filter once history grows long.
- **Actions:** none destructive on this page — patient records are never deleted, only edited (§ demographic edit) or extended (new visit).
- **Responsive behavior:** tab strip becomes a horizontally-scrollable pill row on mobile instead of full-width tabs; the sticky demographic summary card collapses to a compact single-line header (name + phone only, expandable) to preserve vertical space.

---

## 7. Queue Management

**Purpose:** the operational, action-heavy page where Receptionist/Nurse actively work a department's queue — distinct from Live Queue (§8), which is a broader monitoring view.

- **Components:** department-tab strip at the top (one tab per department the staff member has access to); within a tab, a `DataTable` of that department's active tickets.
- **Tables:** **Department Queue table** — Ticket #, Patient Name, Priority badge, Status badge, Waiting Time (live, color-shifts per SLA), Room, Actions. Same left-accent-bar-by-priority row treatment as specified in [ADMIN_DASHBOARD_UX_REDESIGN.md](ADMIN_DASHBOARD_UX_REDESIGN.md) §3.3.
- **Filters:** segmented control — All / Waiting / Called / In Consultation; a secondary Priority filter chip row (Critical/High/Medium/Low, multi-select).
- **Search:** ticket number or patient name, scoped to the active department tab.
- **Buttons:** "Call Next" (primary, top of table — claims the next eligible ticket per [API_SPECIFICATION.md](API_SPECIFICATION.md) §8 `call-next`, disabled if no eligible room is free); "Priority Override" (Nurse only, opens the override dialog).
- **Actions (row-level):** Cancel, Reassign Room, Mark No-Show, Priority Override (Nurse-only, per [SECURITY_AUTH_DESIGN.md](SECURITY_AUTH_DESIGN.md) §2 — the button itself doesn't render for a Receptionist session, not just disabled, so the permission boundary is visible in the UI, not just enforced server-side).
- **Dialogs:** **Priority Override dialog** — new priority level selector + mandatory justification text field (blocks submit until filled, per VR-10); **Cancel Ticket confirm dialog**; **Reassign Room dialog** — room/doctor picker, defaulting to the load-balancer's suggestion with a manual override dropdown.
- **Responsive behavior:** department tabs become a dropdown selector on mobile instead of a tab strip (saves horizontal space); table rows collapse to the stacked-card pattern with Call Next/actions as a bottom button row per card.

---

## 8. Live Queue

**Purpose:** a cross-department, largely read-only monitoring board — "what's happening across the whole clinic right now," used for oversight rather than active ticket-working (that's §7).

- **Components:** single unified `DataTable` spanning all departments (no tabs), each row tagged with its department; auto-refreshing via the same Realtime channel used by the waiting-room display.
- **Tables:** **Live Queue table** — Ticket #, Patient, Priority, Department, Status, Room, Waiting Time, (ClinicAdmin only) Flag/Escalate action — matches the spec already detailed in [ADMIN_DASHBOARD_UX_REDESIGN.md](ADMIN_DASHBOARD_UX_REDESIGN.md) §3.3.
- **Filters:** Department multi-select, Status segmented control, Priority chips.
- **Search:** ticket number or patient name, clinic-wide.
- **Actions:** for ClinicAdmin — "Flag for review" only (an oversight escalation, not an operational action); for other roles, view-only with no action buttons — reinforces that active queue-working happens on Queue Management (§7) or the doctor's Consultation page (§9), not here.
- **Cards:** a small summary strip above the table (Total Waiting, Total In Consultation, Critical Count) — a condensed version of the KPI row, not the full 8-card set from the Dashboard.
- **Responsive behavior:** standard baseline; on mobile this page is deprioritized in the nav (staff on a phone are more likely to need Queue Management for their own department) but remains reachable.

---

## 9. Triage

**Purpose:** the Nurse's assessment workflow — records `triage_assessments` and triggers Queue Generation, per [CLINICAL_WORKFLOW_DESIGN.md](CLINICAL_WORKFLOW_DESIGN.md) §2.3–§2.5.

- **Components:** split layout — left panel: **Triage Queue** (patients registered and awaiting assessment, oldest-first); right panel: **Assessment Form** for the currently-selected patient.
- **Tables:** **Triage Queue list** (left panel) — Patient Name, Registered Time, Visit Type, "Start" action per row; not a full DataTable, a lighter list component since it's a working queue, not a report.
- **Forms:** Assessment form — Symptoms (multi-line free text + a common-symptoms quick-tag picker), Vitals (Blood Pressure, Temperature, Pulse, SpO₂, Weight — numeric inputs with clinically sane range validation, e.g. flags an implausible temperature rather than blocking it outright), Notes, **Priority Level selector** (four large color-coded buttons — Critical/High/Medium/Low — not a plain dropdown, since this is the single most consequential choice on the page and deserves visual weight matching [ADMIN_DASHBOARD_UX_REDESIGN.md](ADMIN_DASHBOARD_UX_REDESIGN.md)'s Priority Guide card colors).
- **Buttons:** primary "Complete Triage & Generate Ticket" (disabled until VR-02/VR-03 satisfied — at least one observation plus a priority level); secondary "Save Draft" if the assessment needs to pause mid-entry.
- **Dialogs:** **Critical Priority confirmation** — selecting "Critical" opens a brief confirming dialog ("This will alert on-duty staff immediately — confirm critical priority?") as a deliberate extra check on the highest-consequence action on the page, not friction for its own sake.
- **Cards:** a compact Priority Guide reference card pinned in the assessment panel (same content as the Dashboard's, §ADMIN_DASHBOARD_UX_REDESIGN.md §3.13).
- **Filters/Search:** the Triage Queue list has a simple search-by-name filter only; no complex filtering needed for a working queue this operationally scoped.
- **Responsive behavior:** the split layout stacks vertically on tablet/mobile — Triage Queue list collapses to a compact horizontal-scroll chip row (patient name + time only) above the full-width Assessment Form, so the form (the actual task) gets the screen.

---

## 10. Consultation

**Purpose:** the Doctor's room-scoped workspace — call the next patient, review their triage/history, record the clinical outcome, per [CLINICAL_WORKFLOW_DESIGN.md](CLINICAL_WORKFLOW_DESIGN.md) §2.9–§2.10.

- **Components:** three-zone layout — top: **Now Serving** card (current patient identity, ticket, room); left/main: **Consultation Form**; right sidebar: **Patient Context panel** (triage summary, vitals, prior visit history for this patient, collapsible).
- **Cards:** Now Serving card (ticket number, patient name, time called, elapsed consultation time — live clock); a small "My Queue" card showing count of patients still waiting for this doctor/room today.
- **Forms:** Consultation form — Diagnosis (free text), Treatment Notes (free text), Prescription (free text, optionally structured as a repeatable medicine/dosage row), Follow-up Required toggle → reveals Follow-up Date field when on (mirrors the DB `CHECK` constraint from [DATABASE_DESIGN.md](DATABASE_DESIGN.md) §3.15).
- **Buttons:** "Call Next Patient" (primary, top of page, disabled while a consultation is already in progress — enforces VR-07/the single-active-consultation rule at the UI level, not just relying on the API's `409`); "Complete Consultation" (primary, in the form footer); "Transfer to Department" (secondary, opens the transfer dialog).
- **Dialogs:** **Department Transfer dialog** — target department selector, reason field, "carry over current priority" toggle (defaults on, per [CLINICAL_WORKFLOW_DESIGN.md](CLINICAL_WORKFLOW_DESIGN.md) BR-17); **Complete Consultation confirm** if Follow-up Required is off (a lightweight "no follow-up needed?" double-check, since it's easy to forget to toggle).
- **Filters/Search/Tables:** none primary on this page — it's a single-patient-at-a-time workspace, not a list view; the Patient Context sidebar includes a small, non-interactive **Prior Visits list** (date + outcome only, links out to full Patient Details, §6).
- **Responsive behavior:** the Patient Context sidebar collapses to a bottom drawer/accordion on tablet, fully hidden-behind-a-toggle on mobile — the Consultation form itself always gets full width first, since a phone-sized Doctor workstation is an edge case this page should still support gracefully rather than assume a desktop.

---

## 11. SMS Logs

**Purpose:** Notification History — the staff-facing read model over `sms_notifications`/`sms_logs`, per [SMS_NOTIFICATION_SYSTEM_DESIGN.md](SMS_NOTIFICATION_SYSTEM_DESIGN.md) §9.

- **Components:** filter bar + `DataTable`; a secondary tab for **SMS Templates** (ClinicAdmin only).
- **Tables:** **Notifications table** — Timestamp, Patient (name/phone), Event Type (badge, e.g. "Queue Number", "Final Call"), Status badge (Sent/Delivered/Failed, colored per the fixed status-color vocabulary), Provider, Actions. **Templates table** (second tab) — Event Type, Channel, Language, Last Updated, Actions (Edit).
- **Filters:** Status, Event Type, Date Range; **Search** by patient phone (exact/partial, the realistic "did this specific patient get their SMS" lookup).
- **Actions (row-level):** "View Detail" (opens the delivery-log dialog below), "Resend" (ClinicAdmin only, disabled if already `delivered`).
- **Dialogs:** **Delivery Detail dialog** — shows the full `sms_logs` transition history for one message (queued → sent → delivered/failed timestamps + raw provider response code) — the debugging view for "why didn't this patient get their text"; **Edit Template dialog** (Templates tab) — template body textarea with a live placeholder-preview pane rendering sample data alongside the raw template text.
- **Buttons:** "New Template Override" (Templates tab, ClinicAdmin).
- **Cards:** a small stats strip at the top (Sent / Delivered / Failed counts + delivery rate for the current filter window) — mirrors the Dashboard's SMS Statistics card but scoped to whatever filter is currently active on this page.
- **Responsive behavior:** table collapses to stacked cards on mobile (Patient + Status as the card header); the Templates tab's live-preview pane stacks below the textarea instead of beside it.

---

## 12. Reports

**Purpose:** generate and retrieve formal, exportable report snapshots — distinct from Analytics (§13), which is exploratory rather than generate-and-download. Full layout spec already given in [ADMIN_DASHBOARD_UX_REDESIGN.md](ADMIN_DASHBOARD_UX_REDESIGN.md) §4.1; expanded here to the requested component granularity.

- **Cards:** **Report Template cards** (one per `report_type`: Daily/Weekly/Monthly Summary, Staff Performance, Queue Analytics, SMS Delivery) — icon, name, one-line description, small preview sparkline, "Generate" button per card.
- **Tables:** **Generated Reports table** — Type, Period, Generated By, Generated At, Status badge (`generating`/`completed`/`failed`), Download action.
- **Forms:** **Generate Report form** (inside a dialog, triggered by a template card's "Generate" button) — Date Range picker, optional Department filter, optional extra parameters specific to that report type.
- **Buttons:** "Generate" (per template card), "Download" (per completed row, disabled for `generating`/`failed` rows).
- **Dialogs:** **Generate Report dialog** (the form above); a **"Generation Failed"** dialog/toast offering "Retry" if a report's status resolves to `failed`.
- **Filters:** on the Generated Reports table — Report Type, Status, Date Range.
- **Search:** none needed — the table is naturally small (bounded by how often reports are actually generated) and better served by filters than free-text search.
- **Responsive behavior:** Report Template cards go from a 3-up grid (desktop) to 2-up (tablet) to a single stacked column (mobile); the Generated Reports table converts to stacked cards.

---

## 13. Analytics

**Purpose:** interactive, exploratory trend analysis — custom date ranges, comparisons, drill-downs — for a Clinic Administrator asking open-ended questions rather than pulling a standard report.

- **Components:** a persistent filter bar (Date Range, Department, Compare-to-previous-period toggle) governing every chart on the page at once, not per-chart filters.
- **Charts:** **Volume Trend** (line, patients per day over the selected range, with a dashed comparison-period overlay when toggled on); **Wait Time Trend** (line, average wait per day); **Department Comparison** (horizontal bar, current range totals per department); **Priority Distribution** (horizontal bar, % of visits by priority level over the range); **Staff Performance** (table+bar combo — avg consultation time per doctor, ticket throughput per nurse) — all following the fixed color-vocabulary and bar-over-pie rules from [ADMIN_DASHBOARD_UX_REDESIGN.md](ADMIN_DASHBOARD_UX_REDESIGN.md) §6.
- **Tables:** the Staff Performance chart's underlying data is also available as a sortable table view (chart/table toggle on that one widget, since ranking staff is often more useful as a sorted list than a bar chart at a glance).
- **Cards:** a compact "This period vs last period" summary card (Total Patients, Avg Wait, Avg Consultation — each with a delta) above the chart grid.
- **Filters:** the persistent bar described above; **Search:** none (this page is filter-driven, not lookup-driven).
- **Buttons:** "Export Data" (per chart, downloads the underlying series as CSV) — distinct from Reports' formal PDF/CSV report generation; this is a lightweight raw-data export for a chart the admin is currently looking at.
- **Dialogs:** none — every interaction resolves inline (filter bar changes, chart tooltips) rather than opening modals, consistent with this being an exploration tool where modal interruptions would break flow.
- **Responsive behavior:** chart grid drops from a 2-column layout (desktop) to fully stacked (tablet/mobile); the persistent filter bar collapses into a single "Filters" button opening a bottom-sheet on mobile rather than consuming header space permanently.

---

## 14. Staff Management

**Purpose:** provision, edit, and deactivate staff accounts, per [API_SPECIFICATION.md](API_SPECIFICATION.md) §3 and the provisioning rules in [SECURITY_AUTH_DESIGN.md](SECURITY_AUTH_DESIGN.md) §11.

- **Tables:** **Staff table** — Name, Role badge, Department, Employee Code, Status (Active/Inactive/Locked badge), Last Login, Actions.
- **Filters:** Role, Department, Status (Active/Inactive/Locked); **Search:** name or employee code.
- **Buttons:** "+ Add Staff Member" (primary, top-right, opens the Add Staff dialog).
- **Dialogs:** **Add Staff dialog** — Full Name, Email, Phone, Role selector, Department selector, Employee Code (auto-suggested, editable); **Edit Staff dialog** — same fields minus Role (role changes go through the dedicated flow below, kept separate since it's a distinctly audited action); **Assign Role dialog** — role selector + a warning if downgrading someone with in-progress work (e.g. an active consultation); **Deactivate confirm dialog** — blocks with an inline error if this is the clinic's last active Clinic Administrator (per [API_SPECIFICATION.md](API_SPECIFICATION.md) §3 `409` guard), otherwise requires a reason; **Force Password Reset confirm dialog**; **Lock/Unlock Account dialog** — reason field (lock only).
- **Actions (row-level, via an overflow menu to avoid button-row clutter given how many actions exist per staff row):** Edit, Assign Role, Force Password Reset, Lock/Unlock, Deactivate, View Activity (→ that staff member's audit trail, a filtered view of §16).
- **Cards:** a small summary strip (Total Staff, Active Now, Locked Accounts) above the table.
- **Responsive behavior:** table collapses to stacked cards; the row-level overflow menu becomes a full-width action sheet on mobile tap rather than a small dropdown.

---

## 15. Departments

**Purpose:** manage departments and their nested rooms, plus clinic-wide working hours/holidays, per [API_SPECIFICATION.md](API_SPECIFICATION.md) §5.

- **Components:** a card grid of departments (not a flat table — departments are few enough per clinic that a card layout reads better and naturally accommodates the nested room list); a secondary tab strip for **Working Hours** and **Holidays**.
- **Cards:** **Department card** — name, code, active room count, active/inactive toggle, expandable to show its **Rooms list** inline (room number, type badge, active toggle) without navigating away.
- **Tables:** **Working Hours table** (7 rows, one per day) — Day, Opens At, Closes At, Closed toggle, inline-editable; **Holidays table** — Date, Name, Recurring toggle, Actions (delete).
- **Forms:** **Add/Edit Department form** (in a dialog) — Name, Code, Description; **Add/Edit Room form** (in a dialog, launched from within a department card) — Room Number, Room Type selector (Consultation/Triage/Procedure/Emergency).
- **Buttons:** "+ Add Department" (page-level); "+ Add Room" (per department card, in its expanded state); "+ Add Holiday" (Holidays tab).
- **Dialogs:** Add/Edit Department, Add/Edit Room, Add Holiday, Deactivate Department confirm (blocked with an inline error if active queues/rooms still reference it, per [API_SPECIFICATION.md](API_SPECIFICATION.md) `409`).
- **Filters/Search:** a simple active/inactive filter on the department grid; no search needed at typical department-count scale.
- **Responsive behavior:** department card grid goes 3-up → 2-up → 1-up across breakpoints; the Working Hours table (naturally narrow, 7 fixed rows) stays a table even on mobile rather than converting to cards, since it reads better as a compact grid at any width.

---

## 16. Settings

**Purpose:** clinic-wide configuration, structured as the tabbed page specified in [ADMIN_DASHBOARD_UX_REDESIGN.md](ADMIN_DASHBOARD_UX_REDESIGN.md) §4.3, expanded here per-tab.

- **Components:** left-nav tab strip (desktop) / top tab strip (mobile): Clinic Profile · Departments & Rooms (deep-link to §15) · Working Hours & Holidays (deep-link to §15) · Staff & Roles (deep-link to §14) · SMS Templates & Gateway (deep-link to §11) · Notification Preferences · Security · Audit Log (deep-link to §16-System-Logs).
- **Forms:** **Clinic Profile form** — Clinic Name, Logo upload, Address, Phone, Email, Timezone selector (explicitly **no** color/theme fields, per the redesign mandate); **Security form** — Session timeout duration, MFA-required toggle (ClinicAdmin/SuperAdmin roles), Failed-login lockout threshold; **Notification Preferences form** — which in-app alert categories this Administrator personally wants to see (does not affect patient SMS behavior, which is clinic-wide config, not personal preference).
- **Buttons:** "Save Changes" per tab (only enabled once a field has actually changed — dirty-state tracking, avoids accidental no-op saves triggering unnecessary audit entries).
- **Dialogs:** "Discard unsaved changes?" confirm if navigating away from a dirty tab.
- **Cards/Tables/Filters/Search/Actions:** not primary on this page — the tabs that need them (Departments, Staff, SMS Templates, Audit Log) are deep-links to their dedicated pages rather than duplicated inline, keeping Settings itself a pure configuration-forms page.
- **Responsive behavior:** left-nav tab strip collapses to a horizontal scrollable tab row on mobile/tablet, matching the pattern used on Patient Details (§6).

---

## 17. System Logs (Audit)

**Purpose:** the read-only audit trail viewer, per [API_SPECIFICATION.md](API_SPECIFICATION.md) §15 and the immutability rules in [SECURITY_AUTH_DESIGN.md](SECURITY_AUTH_DESIGN.md) §10.

- **Tables:** **Audit Log table** — Timestamp, Staff (actor), Action Type (badge), Entity Type + ID, Summary (short human-readable description derived from `action_type`), Actions ("View Detail").
- **Filters:** Staff (searchable dropdown), Action Type, Entity Type, Date Range.
- **Search:** free-text across the summary field.
- **Dialogs:** **Audit Entry Detail dialog** — side-by-side old/new values diff (for `UPDATE`-class entries) or a plain description (for auth/session-class entries like `login_failed`), plus IP address/user agent where recorded.
- **Buttons:** "Export" (CSV, for compliance/offline review) — this is the one export affordance on the page, since there is otherwise deliberately no write action anywhere here.
- **Cards:** none — a pure filtered-table page.
- **Actions:** view-only; no edit, no delete, no bulk actions — this page has zero mutating affordances by design, matching the "insert-only, no application role can modify `audit_logs`" rule from [SECURITY_AUTH_DESIGN.md](SECURITY_AUTH_DESIGN.md) §10.
- **Responsive behavior:** table collapses to stacked cards on mobile; the diff view in the detail dialog stacks old-then-new vertically instead of side-by-side below tablet width.

---

## 18. Profile

**Purpose:** every staff member's own account management — the one page whose content doesn't vary meaningfully by role (aside from the MFA section only appearing for ClinicAdmin/SuperAdmin).

- **Components:** tab strip — **My Details** / **Security** / **Sessions** / **My Activity**.
- **Forms:** **My Details** — read-only Full Name/Role/Department/Clinic (editable only by an Administrator elsewhere, not self-service, per the provisioning model in [SECURITY_AUTH_DESIGN.md](SECURITY_AUTH_DESIGN.md) §11) plus an editable Phone/contact-preference field; **Security tab** — Change Password form (current + new + confirm), MFA enrollment (TOTP QR code + verification field, ClinicAdmin/SuperAdmin only).
- **Tables:** **Sessions tab** — list of active sessions (device/browser hint, IP region, last active time), each with a "Revoke" action; **My Activity tab** — a self-scoped, read-only view of the same Audit Log table component used in §17, filtered to `staff_id = self`.
- **Buttons:** "Save" (My Details), "Update Password" (Security), "Log Out of All Devices" (Sessions, prominent — the same control surfaced in the User Menu dropdown per [ADMIN_DASHBOARD_UX_REDESIGN.md](ADMIN_DASHBOARD_UX_REDESIGN.md) §2.3, present here too since Profile is where a security-conscious user would naturally look for it).
- **Dialogs:** "Confirm Log Out of All Devices" (destructive-adjacent — ends every session including the current one, redirecting to Login).
- **Filters/Search:** none needed at personal-account scale.
- **Responsive behavior:** tab strip → horizontal scroll on mobile, matching the pattern elsewhere; the Sessions table's device/IP columns collapse into a single stacked line per session card.

---

## 19. Notifications

**Purpose:** the full-history counterpart to the header's Notification dropdown ([ADMIN_DASHBOARD_UX_REDESIGN.md](ADMIN_DASHBOARD_UX_REDESIGN.md) §6.2) — internal staff/system alerts (e.g. the "Failed Delivery" staff alert from [SMS_NOTIFICATION_SYSTEM_DESIGN.md](SMS_NOTIFICATION_SYSTEM_DESIGN.md) §12.9, account-lock notices, system status changes) — **not** a view of patient-facing SMS, which lives in SMS Logs (§11) instead.

- **Components:** tab strip — All / Alerts / SMS Failures / System — matching the dropdown's tabs so the two surfaces feel like one continuous feature rather than two disconnected UIs.
- **Tables/Lists:** a vertical notification-item list (not a dense DataTable — these are read-at-a-glance items, not tabular data) — icon, message, relative + absolute timestamp, unread indicator, per-item "Mark as read" affordance.
- **Filters:** the tab strip itself is the primary filter; a secondary Date Range filter for scrolling back further than the default recent window.
- **Search:** free-text across notification message bodies.
- **Buttons:** "Mark All as Read" (page-level, per active tab).
- **Dialogs:** none — clicking a notification navigates directly to its related record (e.g. a Failed Delivery notification opens that message's Delivery Detail in SMS Logs, §11) rather than opening an in-place modal, since the destination page already has the right detail view.
- **Cards:** none.
- **Responsive behavior:** identical single-column list at every breakpoint — this page was never multi-column, so there's no responsive collapse needed beyond standard padding/touch-target adjustments.

---

## 20. Summary: What's Genuinely New vs. Cross-Referenced

| Page | Status |
|---|---|
| Dashboard | Admin variant fully specified in [ADMIN_DASHBOARD_UX_REDESIGN.md](ADMIN_DASHBOARD_UX_REDESIGN.md); Receptionist/Nurse/Doctor variants newly specified here |
| Reports | Layout established in [ADMIN_DASHBOARD_UX_REDESIGN.md](ADMIN_DASHBOARD_UX_REDESIGN.md) §4.1; component-level detail (forms/dialogs/buttons) newly specified here |
| Login, Patient Registration, Patient Search, Patient Details, Queue Management, Live Queue, Triage, Consultation, SMS Logs, Analytics, Staff Management, Departments, Settings, System Logs, Profile, Notifications | Newly specified in full here |

No page in this catalog required a new color, a new logo treatment, or a departure from the shell established in the dashboard redesign — every page is a variation on the same component vocabulary (§0), which is what makes the eventual implementation consistent rather than 18 independently-styled screens.
