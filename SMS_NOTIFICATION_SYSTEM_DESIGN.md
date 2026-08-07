# MediQueue — SMS Notification System Architecture
### Backend Design — Patients Receive SMS Only, No App, No Login

**Scope:** Architecture only — no code. Deepens [ARCHITECTURE.md](ARCHITECTURE.md) §7 into full backend-engineering detail; reuses `sms_notifications`, `sms_logs`, `notification_templates` from [DATABASE_DESIGN.md](DATABASE_DESIGN.md) and the trigger events defined in [CLINICAL_WORKFLOW_DESIGN.md](CLINICAL_WORKFLOW_DESIGN.md).

**Ground rule:** the patient's device receives exactly one thing from this entire system — an SMS. There is no push notification, no app, no inbound account, no read-receipt UI on the patient's side. Every piece of complexity below exists to make *that one SMS* reliable, timely, and correctly worded, at the operational scale of a clinic issuing hundreds of tickets a day.

---

## 1. Design Goals

| Goal | Why it matters here |
|---|---|
| **Never block clinical workflow** | A queue ticket must commit regardless of whether the SMS gateway is up. Notification failure is a notification problem, never a patient-care problem. |
| **Deliver time-sensitive messages first** | "Final call" and "missed queue" are more urgent than a completion thank-you — the SMS layer needs its own priority ordering, mirroring the Queue Engine's philosophy. |
| **Survive provider outages** | A single SMS gateway going down in one country/region must not silence the whole clinic — provider failover is a first-class concern, not an afterthought. |
| **Full auditability** | Every message sent, to whom, when, with what content, and its final delivery state must be reconstructable — both for operational debugging and for the audit obligations already established in [SECURITY_AUTH_DESIGN.md](SECURITY_AUTH_DESIGN.md) §10. |
| **Provider-agnostic core** | Twilio is the SMS provider for the platform; the engine, queue, retry, and template logic stay provider-agnostic. |

---

## 2. High-Level Architecture

```
┌───────────────────────────────────────────────────────────────────────────────┐
│  DOMAIN EVENT SOURCES  (QueueService, TriageService, AppointmentService, ...)     │
│  emit: ticket.created · position.changed · ticket.called · ticket.final_call ·     │
│        ticket.no_show · visit.transferred · visit.completed · appointment.due       │
└───────────────────────────────────┬─────────────────────────────────────────────┘
                                     ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│  NOTIFICATION ENGINE                                                              │
│  1. Subscribe to domain events                                                      │
│  2. Decide: should this fire? (suppression rules, e.g. emergency-path §CLINICAL §8.2) │
│  3. Resolve template (clinic override → global default, by event+channel+language)     │
│  4. Render placeholders → final message body                                             │
│  5. Assign priority tier (URGENT / STANDARD / LOW)                                          │
│  6. Write to SMS QUEUE (outbox) — commits in the SAME transaction as the triggering event    │
└───────────────────────────────────┬─────────────────────────────────────────────────────────┘
                                     ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│  SMS QUEUE  (sms_notifications table, status='pending')                                        │
│  ordered by: priority_tier ASC, scheduled_at ASC                                                  │
└───────────────────────────────────┬─────────────────────────────────────────────────────────────┘
                                     ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│  DISPATCHER  (scheduled worker / cron-triggered, polls the queue)                                   │
│  - Claims a batch atomically (SELECT ... FOR UPDATE SKIP LOCKED)                                      │
│  - Applies RATE LIMITER (per-provider, per-clinic)                                                      │
│  - Selects PROVIDER via routing/failover policy                                                          │
│  - Calls the Provider Adapter                                                                              │
└───────────┬───────────────────────────────────────────────────────────────┬─────────────────────────────┘
            ▼                                                               ▼
┌────────────────────────┐                                     ┌────────────────────────┐
│  PROVIDER ADAPTER          │                                     │  PROVIDER ADAPTER          │
│  Twilio                       │                                     │  Twilio                       │
└───────────┬────────────────┘                                     └───────────┬────────────────┘
            ▼                                                                   ▼
┌────────────────────────┐                                     ┌────────────────────────┐
│  Twilio Gateway              │                                     │  Twilio Gateway              │
└───────────┬────────────────┘                                     └───────────┬────────────────┘
            └───────────────────────────────┬───────────────────────────────────┘
                                             ▼
                                  PATIENT'S PHONE (SMS)
                                             │
                              (async delivery receipt / status callback)
                                             ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│  DELIVERY WEBHOOK RECEIVER  (/api/notifications/webhook)                          │
│  - Verifies signature per provider                                                  │
│  - Maps provider status code → canonical status                                       │
│  - Updates sms_notifications.status, appends sms_logs row                               │
└───────────────────────────────────────────────────────────────────────────────────────┘

              (parallel, always-on)
┌───────────────────────────────────────────────────────────────────────────────┐
│  RETRY SCHEDULER  — re-queues eligible failed sends with backoff (§5)               │
│  RATE LIMITER STATE  — token buckets per provider account, per clinic (§8)            │
│  AUDIT / LOGGING  — sms_logs (technical trail) + audit_logs (business events) (§9)      │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Notification Engine

The Notification Engine is the only component that knows *when* and *whether* to notify — everything downstream (queue, dispatcher, provider) just moves an already-decided message.

**Responsibilities:**
1. **Event subscription** — listens for the domain events already defined by the service layer in [ARCHITECTURE.md](ARCHITECTURE.md) §5; it never queries queue/visit state directly, it only reacts to what's published.
2. **Suppression rules** — the engine, not the caller, owns the logic for *not* sending. Examples: the emergency path suppresses the routine ticket-confirmation SMS ([CLINICAL_WORKFLOW_DESIGN.md](CLINICAL_WORKFLOW_DESIGN.md) §8.2); a patient record flagged `sms_opt_out` (recommended addition to `patients` — see §12) suppresses everything except the legally/clinically essential "final call" class of message.
3. **Template resolution** — looks up `notification_templates` by `(event_type, channel, language_code)`, preferring a clinic-specific override over the global default (the partial-unique-index pattern already established in [DATABASE_DESIGN.md](DATABASE_DESIGN.md) §3.16).
4. **Rendering** — substitutes placeholders (`{{patient_ticket}}`, `{{clinic_name}}`, `{{estimated_wait}}`, etc.) against the event payload. Rendering failures (a template referencing a placeholder the event didn't supply) fail loud at write-time, never silently send a broken message with literal `{{...}}` in it.
5. **Priority tiering** — assigns one of three tiers (§4) so the SMS Queue itself can reorder under load, independent of when each message was generated.
6. **Enqueue** — writes the rendered `sms_notifications` row in the **same database transaction** as the domain event's own state change. This is the load-bearing guarantee of the whole design: a ticket can never exist without a corresponding (even if later-failed) notification attempt being recorded, and a notification attempt can never exist for a ticket that didn't actually commit.

---

## 4. SMS Queue

**Implementation:** the `sms_notifications` table itself *is* the queue (outbox pattern) — no separate message broker is required at the current scale, keeping the system operationally simple and consistent with the rest of the Postgres-centric backend. The design is written so it can graduate to a dedicated broker (Redis/BullMQ, SQS) later without changing the Notification Engine or Provider Adapter contracts — only the Dispatcher's polling mechanism would change.

**Priority tiers** (new field: `sms_notifications.priority_tier`):

| Tier | Message classes | Rationale |
|---|---|---|
| **URGENT** | Final Call, Missed Queue, emergency-related staff alerts | Time-boxed — a delay of even a minute defeats the purpose |
| **STANDARD** | Registration, Queue Number, Position Update, Transfer Notice | Time-sensitive but tolerant of a short queueing delay under load |
| **LOW** | Completion Message, appointment/return reminders, satisfaction surveys | Not time-critical; safe to spread over a scheduling window (§7) |

**Claim query pattern (conceptual, not code):** the Dispatcher selects the oldest eligible `pending` rows ordered by `(priority_tier, scheduled_at)`, locking them with the same `SELECT ... FOR UPDATE SKIP LOCKED` pattern already used by the Queue Engine's "Call Next" ([ARCHITECTURE.md](ARCHITECTURE.md) §6.4) — so multiple dispatcher workers can run concurrently (horizontal scaling) without ever double-sending the same message.

**State machine:**

```
 pending ──▶ sending ──▶ sent ──▶ delivered
    │            │           │
    │            │           └──▶ failed  (provider-reported delivery failure)
    │            └──▶ failed  (provider rejected the send outright)
    │
    └──▶ cancelled  (superseded — e.g. a newer position-update event
                      makes an older queued one pointless; see §4.1)
```

### 4.1 Superseding stale notifications

If a `position.changed` event fires again before the previous `position.changed` SMS for the same ticket has actually been sent (rapid queue movement), the newer notification supersedes the older one — the older `pending` row transitions to `cancelled` rather than sending two near-simultaneous "your position is now X" messages. This is a deliberate engine-level dedupe rule, not a provider concern.

---

## 5. Retry Mechanism

**Retryable vs. non-retryable failures** — the single most important distinction in this subsystem:

| Failure class | Examples | Action |
|---|---|---|
| **Transient** | Network timeout, provider 5xx, provider-side rate limit (`429`) | Retry with backoff, same or failover provider |
| **Permanent** | Invalid phone number format, number blacklisted/opted-out at carrier level, message content rejected | No retry — immediate `failed`, triggers the Failed Delivery staff alert (§12.9) |
| **Provider-account-level** | Credits exhausted, account suspended, sender ID revoked | No retry on the *same* provider — immediately re-route the retry to the failover provider (§10.3), and separately alert the Clinic Administrator that the primary provider account needs attention |

**Backoff schedule:** exponential, e.g. 30s → 2min → 10min, capped at a maximum of **4 attempts total**. After the final attempt fails, the message is marked `failed` (dead-lettered) and `sms_notifications.retry_count` reflects the exhausted attempt count — no infinite retry loops, no silent indefinite pending state.

**Backoff is per-message, not global** — one patient's bad number retrying doesn't throttle every other message in the queue; only the rate limiter (§8) imposes a system-wide pace.

---

## 6. Delivery Tracking

- **Asynchronous, webhook-driven.** Twilio reports final delivery state (`delivered`/`failed`, plus a provider-specific reason code) via an HTTP callback to `/api/notifications/webhook`, not a synchronous response to the send call — the send call itself only confirms the message was *accepted for delivery* (`sent`), not that it reached the handset.
- **Signature verification is mandatory.** The webhook endpoint validates the request came from Twilio before trusting its content via the `X-Twilio-Signature` HMAC header. An unverified webhook is a direct spoofing vector: anyone who discovers the endpoint URL could otherwise mark arbitrary messages "delivered" or inject fabricated failure noise.
- **Idempotency.** Providers deliver webhooks at-least-once — the same delivery event may arrive twice. The handler keys off `(provider_message_id, reported_status)` and is a no-op on an exact repeat, so a duplicate webhook never appends a duplicate `sms_logs` row or double-fires a downstream alert.
- **Status mapping table** (maintained for Twilio's status vocabulary):

| Canonical status | Twilio status |
|---|---|
| `sent` | `sent`/`queued` |
| `delivered` | `delivered` |
| `failed` | `failed`, `undelivered` |

---

## 7. Scheduling

Two categories, both served by the same `sms_notifications.scheduled_at` column and the same Dispatcher polling loop — no separate scheduling subsystem needed:

- **Immediate (event-driven):** `scheduled_at = now()` at enqueue time — Registration, Queue Number, Position Update, Final Call, Missed Queue, Transfer Notice, Completion. Dispatched within the next polling cycle (target: a few seconds).
- **Time-delayed (calendar-driven):** appointment/return reminders. A nightly batch job (not the real-time event stream) computes tomorrow's appointment list and inserts `sms_notifications` rows with `scheduled_at` set to the desired lead time (e.g. 24 hours and again 2 hours before the appointment) — the Dispatcher picks these up exactly when their `scheduled_at` arrives, using the same query it always uses.

**Burst spreading:** a nightly batch that generates, say, 200 appointment reminders for the next day does **not** set every row to the same `scheduled_at` timestamp — the batch job staggers `scheduled_at` values across a window (e.g. 200 reminders spread over 30 minutes) so the Dispatcher never presents the rate limiter (§8) with a 200-message instantaneous spike.

---

## 8. Rate Limiting

Two independent limits, enforced by the Dispatcher before every provider call:

1. **Per-provider throughput cap** — a token-bucket limiter matching the contracted/plan-level throughput of each provider account (e.g. N messages/second). Exceeding this at the provider is itself a `429`-class transient failure (§5), so the limiter exists to avoid *manufacturing* that failure in normal operation, not merely to survive it.
2. **Per-clinic fairness** — in a multi-tenant deployment, a very high-volume clinic's message burst must not starve a smaller clinic's time-sensitive "final call" SMS. The Dispatcher's claim query interleaves across clinics (round-robin by `clinic_id` within a priority tier) rather than strict global FIFO, so no single tenant can monopolize a polling cycle.

Rate limiter state is ephemeral (in-memory/Redis-backed token buckets), not persisted to Postgres — it governs *pace*, while the durable `sms_notifications` queue governs *what's owed*.

---

## 9. Logging, Audit Trail & Notification History

Three distinct records, each answering a different question — deliberately not merged into one table:

| Record | Table | Question it answers | Mutability |
|---|---|---|---|
| **Current state** | `sms_notifications` | "What is this message's status right now?" | Updated in place as status advances |
| **Technical trail** | `sms_logs` | "What exactly happened to this message, step by step, including the raw provider response?" | Append-only, one row per transition |
| **Business audit** | `audit_logs` | "Who/what caused a notification-related *decision* — e.g. a staff-forced manual resend, a template edit, a provider failover event?" | Append-only, insert-only (per [SECURITY_AUTH_DESIGN.md](SECURITY_AUTH_DESIGN.md) §10) |

**Notification History** (the staff-facing capability, e.g. `/admin/sms-logs`) is a **read model** over `sms_notifications` joined with `sms_logs` — not a new store. Query pattern: paginated, filtered by `clinic_id` (always), plus optional `date range`, `status`, `event_type`/template, and `patient phone` (partial match, for a receptionist looking up "did this specific patient's SMS go through"). This is exactly what the composite indexes in [DATABASE_DESIGN.md](DATABASE_DESIGN.md) §3.17–3.18 are shaped for.

---

## 10. Provider Integration

### 10.1 Common Adapter Contract

Every provider — current or future — implements the same three operations, so the Notification Engine, Queue, Retry, and Dispatcher components never contain provider-specific branching:

| Operation | Purpose |
|---|---|
| `send(recipient, message, senderId)` | Submit a message; returns a provider-assigned message ID and an initial accepted/rejected result |
| `checkStatus(providerMessageId)` | Optional polling fallback for providers/situations where the webhook didn't arrive within an expected window |
| `parseWebhook(rawPayload)` | Verify signature, extract `(providerMessageId, statusCode, reason)`, map to canonical status (§6) |

### 10.2 Twilio

- **Fit:** global reach and generally higher API reliability/tooling maturity, making it the platform's primary SMS provider.
- **Recommended API surface:** Twilio's **Messaging Service** (sender-pool abstraction) rather than raw single-number `Send`, so Twilio itself handles sender-number selection/failover on their side — one less thing this system needs to manage.
- **Delivery reports:** Twilio's status callback webhook, validated via the `X-Twilio-Signature` HMAC scheme (§6) — a well-documented, SDK-supported verification step that should never be skipped.
- **Phone formatting:** requires E.164 international format; the Notification Engine normalizes the phone number captured at Registration ([CLINICAL_WORKFLOW_DESIGN.md](CLINICAL_WORKFLOW_DESIGN.md) VR-01) before every send, not just at intake — a defensive re-check, since formatting bugs surfacing only at the provider boundary are expensive to debug.

### 10.3 Provider Configuration & Future Providers

- **Per-clinic provider configuration** (conceptually: `sms_provider_configs` — clinic_id, provider_name, priority_order, credentials reference, sender_id, is_active): lets each clinic choose its primary/secondary provider independent of every other clinic in the platform — a clinic in one country may reasonably prefer a different primary than a clinic elsewhere. Credential secrets themselves live in the deployment's secret manager, never in this table — the table stores *which* credential to look up, not the credential.
- **Onboarding a new provider** (Infobip, Vonage/Nexmo, MTN/Airtel direct APIs, or anything else) requires exactly three things, by design: (1) implement the three-method adapter contract (§10.1), (2) add its canonical status-mapping table entry (§6), (3) register it in provider configuration. No change to the Notification Engine, Queue, Retry, or Rate Limiter is ever required — this is the entire point of the adapter boundary.
- **Multi-provider redundancy** is therefore a configuration change, not an engineering change, once at least two adapters exist — though the current platform uses Twilio as the active provider.

---

## 11. End-to-End Sequence — Queue Number SMS with Provider Failover

```
QueueEngine    NotificationEngine    SMSQueue(DB)    Dispatcher    AT-Adapter    Twilio-Adapter    Webhook
    │                  │                  │              │              │               │             │
    │─ticket.created──▶│                  │              │              │               │             │
    │                  │─resolve template │              │              │               │             │
    │                  │─render message   │              │              │               │             │
    │                  │─tier=STANDARD────▶│              │              │               │             │
    │                  │  (same txn as ticket commit)     │              │               │             │
    │                                     │◀──poll────────│              │               │             │
    │                                     │──claim row────▶│              │               │             │
    │                                     │               │─send()───────▶│               │             │
    │                                     │               │◀─ACCOUNT_SUSPENDED (permanent, provider-level)│
    │                                     │               │─status=failed, no retry on AT─│               │
    │                                     │               │─alert Clinic Admin: "AT account issue"│       │
    │                                     │               │─reroute retry──────────────────▶│             │
    │                                     │               │◀─accepted, providerMessageId────│             │
    │                                     │               │─status=sent────────────────────│             │
    │                                                                                        │─deliver SMS─▶ Patient
    │                                                                                                       │
    │                                                                    (async, minutes later) ◀──webhook─│
    │                                     │◀─────────────────────────────────status=delivered──────────────│
    │                                     │  sms_logs row appended, sms_notifications.status updated          │
```

---

## 12. Message Templates

Every template is stored in `notification_templates` (event_type + channel + language, clinic-overridable per [DATABASE_DESIGN.md](DATABASE_DESIGN.md) §3.16). GSM-7 single-segment SMS is 160 characters; templates below are written to fit in one segment wherever possible, since every extra segment is a real per-message cost with both providers.

### 12.1 Registration
| | |
|---|---|
| **Trigger** | `patient_visit.status = 'registered'` (Registration stage complete, before Triage) |
| **Audience** | Patient |
| **Priority tier** | STANDARD |
| **Placeholders** | `{{clinic_name}}` |
| **Sample** | *"You've been registered at {{clinic_name}}. Please wait to be called for assessment."* |

### 12.2 Queue Number
| | |
|---|---|
| **Trigger** | `ticket.created` (Queue Generation complete) |
| **Audience** | Patient |
| **Priority tier** | STANDARD |
| **Placeholders** | `{{ticket_number}}`, `{{clinic_name}}`, `{{estimated_wait}}` |
| **Sample** | *"Your queue number is {{ticket_number}} at {{clinic_name}}. Estimated wait: {{estimated_wait}} min."* |

### 12.3 Queue Position Update
| | |
|---|---|
| **Trigger** | `position.changed`, threshold crossed (e.g. position ≤ 3 or wait ≤ 10 min) |
| **Audience** | Patient |
| **Priority tier** | STANDARD |
| **Placeholders** | `{{position}}`, `{{ticket_number}}` |
| **Sample** | *"Update: you are now #{{position}} in line ({{ticket_number}}). Please be nearby."* |
| **Note** | Subject to the supersede rule (§4.1) — only the latest position update for a ticket is ever actually sent |

### 12.4 Return Reminder
| | |
|---|---|
| **Trigger** | `appointment.due` (pre-visit, 24h/2h before a scheduled appointment) **or** `follow_up.due` (post-visit return, e.g. lab-result collection) |
| **Audience** | Patient |
| **Priority tier** | LOW |
| **Placeholders** | `{{clinic_name}}`, `{{date}}`, `{{time}}`, `{{reason}}` (optional) |
| **Sample** | *"Reminder: your appointment at {{clinic_name}} is on {{date}} at {{time}}."* |

### 12.5 Final Call
| | |
|---|---|
| **Trigger** | `ticket.final_call` — escalation fired shortly before the no-show grace window expires ([CLINICAL_WORKFLOW_DESIGN.md](CLINICAL_WORKFLOW_DESIGN.md) §8.1) |
| **Audience** | Patient |
| **Priority tier** | URGENT |
| **Placeholders** | `{{ticket_number}}`, `{{room}}` |
| **Sample** | *"FINAL CALL: {{ticket_number}}, please proceed to {{room}} now or your turn may be given to the next patient."* |

### 12.6 Missed Queue
| | |
|---|---|
| **Trigger** | `ticket.no_show` (grace window expired, §CLINICAL §8.1) |
| **Audience** | Patient |
| **Priority tier** | URGENT |
| **Placeholders** | `{{ticket_number}}` |
| **Sample** | *"You missed your turn ({{ticket_number}}). Reply YES within 10 min to rejoin the queue, or visit reception."* |
| **Note** | This is the one patient-facing template with an expected **inbound** reply — the webhook receiver also handles inbound SMS parsing for the `YES` keyword, routed back into the Queue Engine's rejoin flow, not just outbound delivery status |

### 12.7 Transfer Notice
| | |
|---|---|
| **Trigger** | `visit.department_transferred` or `visit.externally_referred` (§CLINICAL §8.5/§8.6) |
| **Audience** | Patient |
| **Priority tier** | STANDARD |
| **Placeholders** | `{{department_or_facility}}`, `{{new_ticket_number}}` (if internal transfer) |
| **Sample (internal)** | *"You've been transferred to {{department_or_facility}}. Your new queue number is {{new_ticket_number}}."* |
| **Sample (external)** | *"You have been referred to {{department_or_facility}}. Please bring this reference: {{reference_code}}."* |

### 12.8 Completion Message
| | |
|---|---|
| **Trigger** | `visit.completed` |
| **Audience** | Patient |
| **Priority tier** | LOW |
| **Placeholders** | `{{clinic_name}}` |
| **Sample** | *"Thank you for visiting {{clinic_name}} today. We wish you good health."* |
| **Note** | Natural attach point for a future post-visit satisfaction-survey follow-up ([ARCHITECTURE.md](ARCHITECTURE.md) §10), sent as a separate LOW-tier message rather than bundled into this one |

### 12.9 Failed Delivery
| | |
|---|---|
| **Trigger** | An `sms_notifications` row reaches terminal `failed` status after exhausting retries (§5) |
| **Audience** | **Staff** (Receptionist / Clinic Administrator) — **not the patient**, since by definition the patient could not be reached by the channel that would tell them |
| **Priority tier** | URGENT (internal alert) |
| **Delivery mechanism** | In-app notification panel ([ADMIN_DASHBOARD_UX_REDESIGN.md](ADMIN_DASHBOARD_UX_REDESIGN.md) §6) at minimum; email escalation recommended for Clinic Administrator if the failure is provider-account-level rather than a single bad number |
| **Sample** | *"SMS delivery failed for ticket {{ticket_number}} ({{patient_name}}) after {{retry_count}} attempts. Please notify the patient in person."* |
| **Note** | This is the explicit exception to "patients receive SMS only" — it's a staff-facing safety net that exists *because* that constraint is real: when the one channel to the patient fails, a human has to close the gap |

---

## 13. Recommended Data Model Additions

Beyond `sms_notifications` / `sms_logs` / `notification_templates` already in [DATABASE_DESIGN.md](DATABASE_DESIGN.md), this architecture assumes:

| Addition | Purpose |
|---|---|
| `sms_notifications.priority_tier` | Drives Dispatcher claim ordering (§4) |
| `sms_notifications.provider_used` | Which adapter actually sent it — needed once failover (§10.3) is possible, distinct from the already-present `provider` intent field |
| `patients.sms_opt_out` (boolean, default false) | Lets a patient verbally decline non-essential SMS at Registration while still receiving the operationally-essential Final Call/Missed Queue class |
| `sms_provider_configs` (per clinic: provider, priority order, sender ID, credential reference, is_active) | Backs the per-clinic provider routing/failover policy (§10.4) |

None of these change the core entity relationships established in the database design — they extend the notification subsystem's own tables, consistent with that document's normalization approach.
