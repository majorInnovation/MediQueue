# MediQueue — Clinical Workflow Design
### Patient Journey, Exception Handling & Business Rules — Physical-Presence-Only Model

**Scope:** Workflow design only — no code. Builds on [ARCHITECTURE.md](ARCHITECTURE.md) (Queue Engine, Notification Service), [DATABASE_DESIGN.md](DATABASE_DESIGN.md) (`patients`, `patient_visits`, `queues`, `queue_entries`, `triage_assessments`, `doctor_assignments`, `consultations`, `sms_notifications`), and [SECURITY_AUTH_DESIGN.md](SECURITY_AUTH_DESIGN.md) (role permissions).

**Ground rule:** the patient never operates a device, never logs in, and never initiates anything digitally. Every workflow step below is either a **physical action** (patient walks somewhere, hands over information verbally) or a **staff-operated system action**. The patient's only digital touchpoint, anywhere in this document, is receiving an SMS on a phone they already own.

---

## 0. Actors

| Actor | Nature | Role in workflow |
|---|---|---|
| Patient | Physical presence only, no system access | Arrives, waits, receives SMS, is seen |
| Receptionist | Staff, system user | Registration, appointment check-in, front-desk ticket actions |
| Nurse | Staff, system user | Triage, priority assignment, department call-next, room routing |
| Doctor | Staff, system user | Consultation call-next, diagnosis, treatment, completion |
| Queue Engine | System (automated) | Ticket numbering, priority scoring, aging, room assignment |
| Notification Service | System (automated) | All SMS dispatch, event-triggered |
| Clinic Administrator | Staff, oversight | Configuration, reporting, escalation review (not a workflow actor in the happy path) |

---

## 1. Master Workflow Diagram

```
                              ┌───────────────────┐
                              │   PATIENT ARRIVAL     │
                              └─────────┬───────────┘
                                        │
                         ┌──────────────┴──────────────┐
                         │  Emergency presentation?       │──YES──▶ [§8.2 EMERGENCY PATH]
                         └──────────────┬──────────────┘              (bypasses steps below,
                                        │ NO                            rejoins at Queue Generation)
                                        ▼
                              ┌───────────────────┐
                              │    REGISTRATION      │◀── walk-in OR appointment check-in
                              └─────────┬───────────┘         (§8.3 if appointment + late)
                                        │
                                        ▼
                              ┌───────────────────┐
                              │       TRIAGE          │
                              └─────────┬───────────┘
                                        │
                                        ▼
                              ┌───────────────────┐
                              │  PRIORITY ASSIGNMENT  │◀── may be revised later (§8.4 override)
                              └─────────┬───────────┘
                                        │
                                        ▼
                              ┌───────────────────┐
                              │  QUEUE GENERATION     │
                              └─────────┬───────────┘
                                        │
                                        ▼
                              ┌───────────────────┐
                              │  SMS CONFIRMATION     │
                              └─────────┬───────────┘
                                        │
                                        ▼
                              ┌───────────────────┐
                              │      WAITING           │◀── priority score ages continuously
                              └─────────┬───────────┘
                                        │
                                        ▼
                              ┌───────────────────┐
                              │   SMS REMINDER          │  ("almost your turn")
                              └─────────┬───────────┘
                                        │
                         ┌──────────────┴──────────────┐
                         │   Patient responds when         │
                         │   called within grace window?    │──NO──▶ [§8.1 SKIPPED / NO-SHOW]
                         └──────────────┬──────────────┘
                                        │ YES
                                        ▼
                              ┌───────────────────┐
                              │    CONSULTATION         │◀── multi-doctor/multi-room (§8.7, §8.8)
                              └─────────┬───────────┘
                                        │
                         ┌──────────────┴──────────────┐
                         │  Needs another department?      │──YES──▶ [§8.5 DEPARTMENT TRANSFER]
                         └──────────────┬──────────────┘              (loops back to
                                        │ NO                            QUEUE GENERATION
                                        ▼                                for new department)
                              ┌───────────────────┐
                              │      COMPLETION          │
                              └─────────┬───────────┘
                                        │
                                        ▼
                              ┌───────────────────┐
                              │        EXIT                │
                              └───────────────────┘
```

---

## 2. Stage-by-Stage Specification

### 2.1 Patient Arrival
| | |
|---|---|
| Actor | Patient (physical) |
| Trigger | Patient walks into the clinic — walk-in or arriving for a scheduled appointment |
| System state | None yet — no database row exists until Registration begins |
| Business rule | **BR-01:** No workflow step exists before physical arrival. There is no pre-arrival digital queue join, ever. |
| Branch | Visibly critical presentation → Emergency Path (§8.2); scheduled-appointment arrival past the grace window → Late Arrival (§8.3) |

### 2.2 Registration
| | |
|---|---|
| Actor | Receptionist |
| Trigger | Patient reaches the front desk |
| System actions | Look up existing patient by phone (`patients` — unique per clinic+phone); reuse the record if found, otherwise create a new one. Create a `patient_visits` row: `visit_type` (`walk_in`/`appointment`), `checked_in_by`, `arrived_at`, `status = 'registered'` |
| Data captured | Full name, **phone (mandatory)**, date of birth, gender, visit reason; emergency contact/allergies captured or confirmed if this is a first visit or if stale |
| Validation | **VR-01:** phone number is mandatory and format-validated at entry — see §10 |
| Business rule | **BR-02:** a returning patient is recognized by phone, not re-entered from scratch — demographic data is edited only if changed, not duplicated |
| Output | `patient_visit_id`, status `registered` |

### 2.3 Triage
| | |
|---|---|
| Actor | Nurse |
| Precondition | `patient_visit.status IN ('registered','in_progress')` |
| System actions | Nurse records a `triage_assessments` row: symptoms, vitals (BP, temperature, pulse, SpO₂, weight), notes, `resulting_priority_level_id` |
| Validation | **VR-02:** at least one clinical observation (symptoms or vitals) must be recorded; **VR-03:** `resulting_priority_level_id` is mandatory before the visit can proceed |
| Business rule | **BR-03:** triage is mandatory for every walk-in before a queue ticket is issued; appointment patients may receive an abbreviated (vitals-only) triage per clinic policy, but never zero triage |
| Output | `triage_assessment_id` linked to the visit; a clinically-determined priority level |

### 2.4 Priority Assignment
| | |
|---|---|
| Actor | Nurse (clinical judgment) + Queue Engine (operational scoring) |
| System actions | Nurse's `resulting_priority_level_id` becomes the ticket's base priority. The Queue Engine additionally computes a **composite `priority_score`** = `base_weight(priority_level) + wait_time_aging + visit_type_bonus − department_load_penalty` (per [ARCHITECTURE.md](ARCHITECTURE.md) §6.2) — the *level* is a clinical judgment fixed at triage; the *score* is an operational ordering value that keeps moving while the patient waits |
| Business rule | **BR-04:** `critical` always bypasses normal score-based ordering — it is placed at the top of its target queue immediately and triggers a staff alert, regardless of computed score |
| Validation | **VR-04:** priority level must be one of the four fixed `priority_levels` values; never null once triage is complete |

### 2.5 Queue Generation
| | |
|---|---|
| Actor | Queue Engine (automatic, no staff action required) |
| Trigger | Priority Assignment complete |
| System actions | Resolve or create today's `queues` row for the target department (`UNIQUE(department_id, queue_date)`); atomically increment `last_ticket_sequence`; create a `queue_entries` row (`ticket_number`, `priority_level_id`, `priority_score`, `status = 'waiting'`) linked to the `patient_visit_id` |
| Business rule | **BR-05:** ticket numbers are department-scoped and reset daily; **BR-06:** ticket sequence increments happen inside an atomic DB operation to guarantee no duplicate numbers under concurrent registration at multiple desks |
| Validation | **VR-05:** a `patient_visit` may not have more than one *active* (`waiting`/`called`/`in_consultation`) `queue_entry` at a time — enforced by a partial unique index, not just application logic |
| Output | Ticket number, e.g. `A-014` |

### 2.6 SMS Confirmation
| | |
|---|---|
| Actor | Notification Service (automatic) |
| Trigger | `ticket.created` event from Queue Generation |
| System actions | Render the `ticket_created` template, write a `sms_notifications` row (outbox), dispatcher sends: *"You are #A-014 at [Clinic]. Estimated wait ~24 min."* |
| Business rule | **BR-07:** SMS confirmation is best-effort. A failed or delayed send **never** blocks, delays, or voids the ticket — the queue transaction already committed before the SMS is even attempted (outbox pattern) |
| Validation | **VR-06:** if the phone number captured at Registration is invalid/unreachable, the ticket still proceeds; the failure is logged in `sms_logs` and visible to the Receptionist for a manual follow-up (e.g. verbal confirmation) |

### 2.7 Waiting
| | |
|---|---|
| Actor | Patient (physically present), Queue Engine (continuous background recalculation) |
| System actions | The waiting-room display shows live queue numbers/departments (no PHI, no login). Every waiting ticket's `priority_score` continues to age each minute |
| Business rule | **BR-08 (starvation prevention):** the aging component guarantees that a lower-priority patient who has waited long enough will eventually outrank a just-arrived higher-priority (non-critical) patient |
| Validation | None — no patient action occurs at this stage |

### 2.8 SMS Reminder
| | |
|---|---|
| Actor | Notification Service (automatic) |
| Trigger | Configurable threshold crossed — e.g. position ≤ 3, or estimated wait ≤ 10 minutes |
| System actions | Render `position_update` template: *"You are now #3 in line. Please be nearby."* |
| Business rule | **BR-09:** reminder thresholds are clinic-configurable (`system_settings`), not hardcoded, since queue volume and patient behavior differ per clinic |
| Distinct from | The pre-visit **appointment reminder** (sent hours/a day before a scheduled appointment, i.e. *before* Patient Arrival) — a separate template/event, not part of this in-queue sequence |

### 2.9 Consultation
| | |
|---|---|
| Actor | Doctor (or Nurse, for a triage-department "consultation") |
| Precondition | An active `doctor_assignment` exists (room + doctor determined by the Room Assignment Algorithm, §8.8) |
| System actions | **Call Next** (atomic, race-safe — §6): `queue_entries.status → 'called'`, SMS *"It's your turn — proceed to Room 3."* On patient arrival at the room: `status → 'in_consultation'`, a `consultations` row is opened (`started_at`). At the end: diagnosis/treatment/prescription recorded, `status → 'completed'`, `consultations.ended_at` set, `wait_time_seconds` frozen at the call moment (not recalculated afterward) |
| Business rule | **BR-10:** "Call Next" is atomic across all rooms in a department simultaneously — two doctors can never be handed the same ticket (§8.7) |
| Branch | Patient doesn't appear within the grace window → Skipped/No-Show (§8.1) |

### 2.10 Completion
| | |
|---|---|
| Actor | Doctor |
| System actions | Finalize the `consultations` record. If the patient needs another department (lab, pharmacy, a different specialty), a **new** `queue_entries` row is created for that department, linked to the *same* `patient_visit_id` — this is a loop back to Queue Generation (§8.5), not a new visit |
| Business rule | **BR-11:** a `patient_visit` can span multiple `queue_entries` (one per department touched); it is not "complete" until every associated `queue_entries` row reaches a terminal state (`completed`/`cancelled`/`no_show`) |

### 2.11 Exit
| | |
|---|---|
| Actor | Patient (physical) |
| System actions | Once all `queue_entries` for the visit are terminal, `patient_visits.status → 'completed'`, `completed_at` set |
| Future hook | Optional post-visit SMS satisfaction survey (`ticket.completed`/`visit.completed` event) — see [ARCHITECTURE.md](ARCHITECTURE.md) §10 |
| Business rule | **BR-12:** the workflow has no digital "after-visit" step for the patient — the visit record simply closes |

---

## 3. Activity Diagram — Standard Walk-In Visit (Swimlanes)

```
 PATIENT        │ RECEPTIONIST      │ NURSE              │ QUEUE ENGINE        │ DOCTOR           │ SMS
─────────────────┼────────────────────┼──────────────────────┼───────────────────────┼────────────────────┼──────────────────
 Arrives           │                     │                        │                         │                      │
                   │ Registers patient    │                        │                         │                      │
                   │ Creates visit          │                        │                         │                      │
                   │                          ├── Sends to triage ──▶│                         │                      │
 Waits ─────────────┼──────────────────────────│ Records triage           │                         │                      │
                     │                            │ Assigns priority           │                         │                      │
                     │                              ├──────────────────────────▶ Creates ticket           │                      │
                     │                                │                            Computes score              │                      │
                     │                                │                            (aging begins)                ├──────────────────▶ "Confirmation"
 Receives SMS ◀───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 Waits, watches         │                                │                            Score ages over time            │                      │
 board                    │                                │                            Reminder threshold crossed       ├──────────────▶ "Reminder"
 Receives SMS ◀───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
                            │                                │                            Room assignment                     ├──────────▶ "Your turn"
 Receives SMS ◀───────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 Proceeds to room             │                                │                                                                    ├─ Consults, treats
                                │                                │                                                                    ├─ Marks complete
 Exits ────────────────────────┴────────────────────────────────┴───────────────────────────────────────────────────────────────────┘
```

---

## 4. Activity Diagram — Emergency Patient (Swimlanes)

```
 PATIENT              │ RECEPTIONIST                │ NURSE / DOCTOR                    │ QUEUE ENGINE
──────────────────────┼──────────────────────────────┼──────────────────────────────────────┼─────────────────────────
 Arrives critical         │                              │                                        │
                            ├── Flags emergency ──────────▶│ Begins treatment IMMEDIATELY             │
                            │  (name/phone captured           │ (no wait for full registration)            │
                            │   verbally, minimal)              │                                                │
                            │                                    ├── Records abbreviated triage ──────────────▶│ Creates critical-priority
                            │                                    │   (priority = critical, mandatory)             │  ticket, bypasses scoring,
                            │                                    │                                                   │  top of every relevant queue
                            │                                    ├─ Consults/stabilizes patient                        │  Staff alert broadcast
 Being treated                │  (in parallel) Completes full        │                                                          │
                                │  registration record retro-           │                                                            │
                                │  actively for the record                │                                                              │
```

Full description in §8.2.

---

## 5. Sequence Diagram — Standard Visit, End-to-End

```
Patient    Receptionist    Nurse       QueueEngine       Doctor      NotificationSvc      SMSGateway
  │             │             │              │               │              │                 │
  │──arrives───▶│             │              │               │              │                 │
  │             │─create visit─────────────▶ │               │              │                 │
  │             │─send to nurse─────────────▶│               │              │                 │
  │             │             │─record triage│               │              │                 │
  │             │             │─set priority─▶│              │              │                 │
  │             │             │              │─gen ticket────│              │                 │
  │             │             │              │─emit ticket.created──────────▶│                 │
  │             │             │              │               │              │─send SMS───────▶│
  │◀─────────────────────────────────────────────────────────────────────────────────SMS #A-014│
  │             │             │              │─(aging loop)──│              │                 │
  │             │             │              │─threshold X───│─emit position_changed──────────▶│
  │◀─────────────────────────────────────────────────────────────────────────────────SMS "#3"  │
  │             │             │              │─room assign──▶│              │                 │
  │             │             │              │◀──call next───│              │                 │
  │             │             │              │─emit ticket.called───────────▶│                 │
  │◀─────────────────────────────────────────────────────────────────────────────────SMS "turn"│
  │──proceeds to room────────────────────────────────────────▶│              │                 │
  │             │             │              │               │─start consult│                 │
  │             │             │              │               │─complete─────│                 │
  │             │             │              │─status=completed             │                 │
  │──exits──────│             │              │               │              │                 │
```

---

## 6. Sequence Diagram — Concurrent "Call Next" Across Multiple Doctors (Race Safety)

Two doctors in the same department press "Call Next" within the same second.

```
Dr. A                DoctorA-Terminal        DB (queue_entries)        DoctorB-Terminal            Dr. B
  │                        │                       │                        │                        │
  │──"Call Next"──────────▶│                       │                        │                        │
  │                        │──BEGIN; SELECT ... FOR UPDATE SKIP LOCKED──────▶│                        │
  │                        │                       │ (locks ticket A-014, skips any already-locked row)│
  │                        │◀──returns A-014────────│                        │                        │
  │                        │──UPDATE status='called'▶│                        │                        │
  │                        │──COMMIT────────────────▶│                        │                        │
  │◀──"Now serving A-014"──│                       │                        │──"Call Next"───────────│
  │                        │                       │◀──BEGIN; SELECT ... FOR UPDATE SKIP LOCKED────────│
  │                        │                       │  (A-014 already locked+committed as 'called',      │
  │                        │                       │   so this SELECT returns the NEXT eligible ticket,  │
  │                        │                       │   e.g. A-015 — never the same ticket twice)          │
  │                        │                       │──────────────────────▶│◀──returns A-015────────│
  │                        │                       │                        │──"Now serving A-015"──▶│
```

`SKIP LOCKED` is the mechanism that makes **BR-10** true: it is structurally impossible for two concurrent "Call Next" transactions to receive the same ticket, without either terminal ever needing to retry or show an error.

---

## 7. Sequence Diagram — No-Show → Rejoin (§8.1 detail)

```
Patient        QueueEngine (cron)      NotificationSvc         SMSGateway         Patient's Phone
  │                    │                       │                    │                    │
  │  (ticket status='called', patient absent)   │                    │                    │
  │                    │─5 min grace expires────│                    │                    │
  │                    │─status='no_show'───────▶│                    │                    │
  │                    │                         │─send "missed turn"─▶│───────────────────▶│
  │                                                                                        │──"YES"─┐
  │                                                                                                 ▼
  │                    │◀──inbound reply webhook────────────────────────────────────────────────────│
  │                    │─create NEW queue_entry (same patient_visit,│                    │
  │                    │  priority level preserved, aging restarted)│                    │
  │                    │─send new ticket confirmation────────────────────────────────────▶│
```

---

## 8. Special-Case Workflows

### 8.1 Skipped Patients (No-Show)

- **Trigger:** ticket `status = 'called'` and the patient does not reach the room within the grace window (default 5 minutes, clinic-configurable).
- **Resolution:** the Queue Engine (scheduled check) or the calling staff member manually transitions the ticket to `status = 'no_show'`.
- **SMS:** *"You missed your turn. Reply YES within 10 minutes to rejoin, or visit reception."*
- **Rejoin rule (BR-13):** a `YES` reply within the reply window creates a **new** `queue_entries` row on the same `patient_visit_id`, preserving the clinically-assigned priority *level*, but the *aging* component of the score restarts from the rejoin moment — the patient does not retroactively receive credit for wait time that elapsed while they were absent.
- **No reply / expired window:** the ticket remains `no_show` (terminal). If the patient returns later, they must check in again at reception, which reopens the `patient_visit` context rather than reviving the old ticket.
- **Repeated no-shows:** flagged for Receptionist visibility (not automatically penalized in priority — a clinic policy decision, not a system judgment call).

### 8.2 Emergency Patients

- **Trigger:** a patient presents with visibly life-threatening symptoms (chest pain, severe trauma, unconsciousness, etc.) at any point — front desk, triage bay, or waiting area.
- **Deviation from the standard sequence (BR-14):** Registration and Triage are **not skipped**, but their *order and completeness* change:
  1. **Abbreviated intake** — name and phone captured verbally in seconds (or deferred entirely if the patient cannot respond), not the full standard registration form.
  2. **Immediate treatment begins** — Nurse/Doctor starts stabilizing care in parallel with, not after, any paperwork.
  3. **Triage is a single mandatory field:** priority = `critical`. Full vitals/notes are backfilled once the patient is stable.
  4. Full `patient_visits`/`patients` records are completed retroactively by the Receptionist while treatment is already underway — the clinical workflow never waits on the administrative one.
- **Queue behavior:** the resulting `queue_entries` row bypasses scoring entirely (**BR-04**) and appears at the top of the relevant department/Emergency Bay queue; a staff alert (not just a queue position change) is broadcast to on-duty Nurse/Doctor.
- **SMS behavior:** the standard "ticket confirmation" SMS is suppressed for true emergencies — a patient in active emergency care is not "waiting," and sending a queue-position SMS would be meaningless (and if a companion/family member's phone was given instead, it may still be sent as an acknowledgment/status update — clinic-configurable).

### 8.3 Late Arrivals (Scheduled Appointments)

- **Grace window (BR-15):** e.g. 15 minutes past the scheduled appointment time, clinic-configurable.
- **Within grace:** checked in normally; the appointment's `visit_type = 'appointment'` and its associated scheduling bonus in the priority-score formula (§2.4) still applies.
- **Beyond grace:** the appointment slot bonus is forfeited — the patient is scored as a standard walk-in from that point forward. Clinic policy determines whether they're offered immediate re-triage into the walk-in queue or asked to rebook; either way, this is a scoring consequence, not a refusal of service.
- **Audit trail:** `patient_visits.visit_reason`/`activity_logs`-equivalent records the actual arrival time versus the scheduled time for reporting (feeds the "no-show/late" metrics in Reports — [ARCHITECTURE.md](ARCHITECTURE.md) §10).

### 8.4 Manual Priority Overrides

- **Actor:** **Nurse only** — consistent with the permission matrix in [SECURITY_AUTH_DESIGN.md](SECURITY_AUTH_DESIGN.md) §2, where "Set/override priority level" is granted exclusively to the Nurse role. A Doctor who observes a waiting patient's condition worsening does not directly edit the priority level; they raise a flag that immediately notifies the nearest on-duty Nurse to perform the override — keeping clinical-priority authorship consistent and auditable in one role, not scattered across two.
- **Trigger:** patient's condition visibly changes while waiting, or the initial triage under-estimated severity.
- **Business rule (BR-16):** every override requires a free-text clinical justification and is written to `audit_logs` as a distinct `action_type = 'priority_override'` (not just a generic update) — this is a clinically and legally significant action.
- **Effect:** `queue_entries.priority_level_id` and `priority_score` are recalculated immediately; if the new level is `critical`, the critical-bypass rule (BR-04) applies retroactively from that moment.

### 8.5 Department Transfers (Within-Clinic)

- **Trigger:** at Completion (§2.10), the doctor determines the patient needs another department (lab, pharmacy, a different specialty) before their visit is truly finished.
- **Mechanism (BR-11, restated operationally):** the current `queue_entries` row is marked `completed`; a **new** `queue_entries` row is created in the target department's `queues` for the *same* `patient_visit_id`. This is a loop back to Queue Generation (§2.5), not a new registration.
- **Priority carry-over policy (BR-17):** the new department ticket inherits the same clinical priority level by default. If more than a configurable gap (e.g. 60 minutes) elapses before the patient reaches the new department, a re-triage checkpoint is recommended rather than blindly trusting a stale assessment.
- **SMS:** a fresh ticket-confirmation SMS is sent for the new department (reuses §2.6 logic) — the patient always knows which queue they're currently in.
- **Distinct from "Transferred Patients" (§8.6):** a Department Transfer stays inside the same clinic and the same `patient_visit`; it is purely an internal queue routing event.

### 8.6 Transferred Patients (External / Inter-Clinic Referral)

- **Trigger:** the clinic cannot provide the needed care (specialist unavailable, equipment/capacity limits) and refers the patient to another facility.
- **System behavior:** the current `queue_entries` and `patient_visits` are marked `completed`/`cancelled` as appropriate, with `visit_reason`/consultation notes recording the referral destination and reason — this closes the loop cleanly rather than leaving a ticket in limbo.
- **Business rule (BR-18):** because `patients` records are clinic-scoped by design (per [DATABASE_DESIGN.md](DATABASE_DESIGN.md) §3.8), an inter-clinic transfer does **not** automatically carry the patient's record to the receiving clinic in the current model — the receiving clinic registers them as (from their perspective) a new patient, with the referral note as the only carried-over artifact (typically a printed or verbally relayed summary, since there is no patient-held digital record to transfer). This is explicitly flagged as a **future-expansion item** (national patient ID / cross-clinic identity resolution — [ARCHITECTURE.md](ARCHITECTURE.md) §10), not solved by this workflow.
- **SMS:** an optional referral-acknowledgment SMS may be sent ("You have been referred to [Facility]. Please bring this reference: [code].") if useful to the receiving facility's own intake process.

### 8.7 Multiple Doctors

- **Routing:** within a department running multiple doctors concurrently, the Room Assignment Algorithm (§8.8) selects the least-loaded active doctor/room combination for each new "Call Next," with Nurse/Receptionist able to manually override the suggestion (e.g. a specific doctor is the patient's known/preferred provider).
- **Concurrency safety:** every "Call Next" action, regardless of which doctor's terminal triggers it, competes for the *same* shared department queue using the atomic locking pattern in §6 — this is what makes "multiple doctors" safe rather than a source of duplicate-call bugs.
- **Doctor going off-duty mid-shift (BR-19):** any of that doctor's `doctor_assignments` still in `assigned` (not yet started) status are automatically released back into the department's pool (`status → 'reassigned'`) so another on-duty doctor can pick them up — a patient is never stranded on an absent doctor's personal list.

### 8.8 Multiple Consultation Rooms

- **Room Assignment Algorithm:** least-loaded-room-in-matching-department by default (fewest currently-assigned-but-not-yet-completed tickets) — an assistive suggestion, never a hard lock: staff can always manually reassign a room.
- **Room state model:** a room is "available" the moment its current `doctor_assignments`/`consultations` reaches a terminal state; the algorithm re-evaluates on every new "Call Next," not on a fixed schedule.
- **Emergency Bay carve-out (BR-20):** at least one room per clinic (or per relevant department) can be designated `room_type = 'emergency'` and is excluded from normal load-balancing — it is reserved specifically for the Emergency Path (§8.2) and is never assigned to a routine walk-in even if it's the least busy room at that moment.

---

## 9. Business Rules (Consolidated)

| ID | Rule |
|---|---|
| BR-01 | No workflow step exists before physical arrival — no pre-visit digital queue join |
| BR-02 | Returning patients are recognized by phone, never re-registered from scratch |
| BR-03 | Triage is mandatory for every walk-in before ticket issuance |
| BR-04 | `critical` priority always bypasses score-based ordering and triggers a staff alert |
| BR-05 | Ticket numbers are department-scoped and reset daily |
| BR-06 | Ticket sequence increments are atomic — no duplicates under concurrent registration |
| BR-07 | SMS failures never block, delay, or void a queue ticket |
| BR-08 | Wait-time aging prevents starvation of lower-priority patients |
| BR-09 | SMS reminder thresholds are clinic-configurable, not hardcoded |
| BR-10 | "Call Next" is atomic across all rooms in a department — no duplicate calls |
| BR-11 | A `patient_visit` can span multiple `queue_entries`; it closes only when all are terminal |
| BR-12 | There is no digital "after-visit" step for the patient |
| BR-13 | A no-show rejoin restarts wait-time aging; it does not preserve elapsed absent time |
| BR-14 | Emergency treatment begins before administrative registration completes, never after |
| BR-15 | Late-appointment grace window is clinic-configurable |
| BR-16 | Every manual priority override requires a documented reason and is distinctly audit-logged |
| BR-17 | Department-transfer tickets inherit priority by default; long gaps trigger re-triage |
| BR-18 | Patient records are clinic-scoped; inter-clinic transfer does not auto-carry the record |
| BR-19 | An off-duty doctor's unstarted assignments are auto-released to the department pool |
| BR-20 | Emergency-designated rooms are excluded from routine load-balancing |

---

## 10. Validation Rules (Consolidated)

| ID | Stage | Rule |
|---|---|---|
| VR-01 | Registration | Phone number is mandatory and must pass format validation — it is the only patient communication channel that exists |
| VR-02 | Triage | At least one clinical observation (symptoms or vitals) must be recorded |
| VR-03 | Triage | `resulting_priority_level_id` is mandatory before proceeding |
| VR-04 | Priority Assignment | Priority level must be one of the four fixed `priority_levels` values |
| VR-05 | Queue Generation | A `patient_visit` cannot hold more than one active `queue_entry` at a time |
| VR-06 | SMS Confirmation | An invalid/unreachable phone does not block ticket issuance; it is flagged for staff follow-up |
| VR-07 | Consultation | "Call Next" cannot target a ticket not in `waiting` status |
| VR-08 | Consultation | A `consultations` row cannot be opened without an active `doctor_assignments` row |
| VR-09 | Department Transfer | The new department's `queue_entries` row cannot be created until the prior one reaches `completed` |
| VR-10 | Priority Override | Requires a non-empty justification string; role must be Nurse |
| VR-11 | No-show Rejoin | Only accepted within the configured reply window; one rejoin creates exactly one new ticket, never duplicates |
| VR-12 | Emergency Path | `priority_level = critical` is set immediately even if all other triage fields are still pending |

---

## 11. Edge Cases

| # | Scenario | Resolution |
|---|---|---|
| 1 | Two receptionists register the same walk-in patient simultaneously at different desks (phone collision) | `UNIQUE(clinic_id, phone)` on `patients` causes the second insert to resolve to the existing record instead of creating a duplicate |
| 2 | Patient gives a phone number that already belongs to a different registered patient (shared household phone, typo) | Receptionist is prompted with the existing record for confirmation before proceeding — never silently merged |
| 3 | Patient's phone is off / SMS gateway is down clinic-wide | Ticket and queue processing continue unaffected (BR-07); Receptionist can verbally communicate ticket number as a fallback |
| 4 | Nurse sets priority = critical, but the target Emergency Bay room is already occupied by another critical patient | Second critical patient queues at the top of the *next* eligible room's queue — critical bypass affects ordering, not room availability, which is still finite |
| 5 | Patient is called (`status='called'`), leaves briefly (e.g. restroom), and returns within the grace window | Treated as present — grace window exists precisely to absorb this; no no-show transition fires |
| 6 | A doctor manually reassigns a ticket to themselves that was about to be auto-assigned to another doctor by the load-balancer | Manual assignment always wins — the algorithm is advisory (§8.8), not authoritative |
| 7 | Appointment patient arrives *early* | Checked in immediately if the department can accommodate; otherwise held in a distinct "early arrival" waiting state until their scheduled slot opens, without forfeiting the appointment scoring bonus |
| 8 | Patient needs three departments in one visit (e.g. Triage → Doctor → Lab → Doctor again) | Each hop is its own `queue_entries` row on the same `patient_visit_id` (§8.5), repeated as many times as clinically needed — the data model does not cap the number of hops |
| 9 | Clinic closes (end of working hours, per `working_hours`) while patients are still waiting | Existing `queues` remain `open` until manually closed or all entries reach terminal status; new ticket issuance is blocked once outside working hours, surfaced to Receptionist before they attempt registration |
| 10 | A `no_show` patient's `YES` reply arrives after the reply window has already expired | Reply is not auto-processed; the inbound message is logged (`sms_logs`) and surfaced to Receptionist for a manual decision — no silent re-queue on an expired window |
| 11 | Power/connectivity outage at the clinic mid-day | Queue state persists in the database as of the last committed transaction; no in-memory-only state exists, so recovery on reconnect resumes exactly where it left off — no data loss, no re-registration needed |
| 12 | A staff member manually cancels a ticket for a patient who is, in fact, still in the waiting room | Patient is visibly not-served at the door on exit sweep / display shows no matching ticket — Receptionist re-registers a fresh ticket; the cancelled one remains in history for audit, never silently deleted |
| 13 | Two departments both legitimately need to see the same patient "next" (e.g. Lab and Doctor both flagged as urgent follow-up) | Each department maintains its own independent queue; the patient simply holds two concurrent `queue_entries` in different departments — VR-05's "one active entry" constraint is *per department's queue*, not per patient globally, since `queue_id` is part of the uniqueness scope |
| 14 | Emergency patient stabilizes and no longer needs `critical` priority mid-wait for a follow-up department | A Nurse-executed priority override (§8.4) downgrades the level for the *next* queue_entry (e.g. the lab follow-up) — the completed emergency encounter's historical record is never rewritten |
| 15 | Clinic has only one doctor and one room in a department, and that doctor calls "next" while still finishing the current consultation | Blocked at the application level — the doctor's own in-progress `consultations` row must reach `completed` before their next "Call Next" succeeds; this is a single-doctor edge case of BR-10, not an exception to it |
