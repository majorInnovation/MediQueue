# MediQueue — Admin Dashboard UX Redesign
### Enterprise Healthcare Dashboard Specification — Branding & Palette Unchanged

**Scope:** UI/UX design only — no code. Every color referenced below is an existing token from `lib/colors.ts` (`medicalColors`, `priorityStyles`, `statusStyles`) and the current Tailwind classes already in use (`blue-900`, `blue-700`, etc.). Nothing here introduces a new hue — this redesign is about layout, density, hierarchy, and interaction, not color.

**Baseline reviewed:** current `app/admin/dashboard/page.tsx`, `app/admin/layout.tsx` (sidebar), and existing dashboard widgets (`AdminKpiCard`, `AdminQueueOverview`, `AdminLiveQueueTable`, `AdminSmsNotificationCenter`, `AdminRecentTriageTable`, `AdminAnalyticsCharts`, `AdminActivityFeed`, `AdminQuickActions`). This document keeps what already works (sidebar active-state treatment, badge tokens, card-based composition) and modernizes what reads as consumer-SaaS rather than clinical/enterprise (the large decorative gradient hero banner, full-gradient KPI tiles, tinted full-row table backgrounds).

---

## 0. Design Principles — What "Enterprise Hospital Software" Means Here

Reference class: Epic Hyperspace, Cerner PowerChart, Athenahealth — not consumer fintech/SaaS dashboards. The distinguishing traits to design toward:

1. **Information density over decoration.** Clinical staff scan a dashboard between patients, in seconds, not minutes. Every pixel of decorative gradient or oversized whitespace is a pixel not showing data.
2. **Color carries meaning, never mood.** Red/amber/purple/emerald map 1:1 to priority and status everywhere on the page — a KPI card, a table badge, and a chart series for "critical" are always the same red. The current `medicalColors.status` tokens already define this vocabulary; the redesign's job is to apply it *consistently*, not to invent it.
3. **Flat, quiet surfaces at rest; emphasis on hover/interaction.** Real EHR software doesn't drop heavy shadows on every card permanently — surfaces are calm (1px border, minimal shadow) and only lift slightly on hover/focus, so the page doesn't visually compete with itself.
4. **Numbers are typography-first, not icon-first.** Large tabular-figure numbers with a small supporting icon — not oversized icon tiles with the number as an afterthought.
5. **Persistent structural chrome (sidebar/header) stays stable**; only the content region changes as staff navigate — this is already true of the current shell and should be preserved, not rebuilt.

---

## 1. Color & Branding Usage Map

No new colors. This table is the *discipline* for applying the existing palette consistently across every widget below.

| Token (from `lib/colors.ts`) | Hex | Where it's used in the redesign |
|---|---|---|
| `primary.darkBlue` / `blue-900` | `#0E7CB8` / brand navy | Sidebar background, primary buttons, active nav state, header accents |
| `primary.blue` | `#0066CC` | Links, secondary buttons, "Today's Registrations" KPI accent, chart primary series |
| `primary.lightBlue` | `#3B82F6` | "Average Waiting Time" KPI accent, secondary chart series, info badges |
| `status.critical` | `#DC2626` | Emergency/critical KPI card, critical priority badges, failed-SMS indicator, critical chart series |
| `status.warning` | `#F59E0B` | Waiting-patients KPI accent, SLA-breach wait-time highlighting |
| `status.medium` (purple) | `#8B5CF6` | "Being Served" KPI accent, in-consultation status badge, medium-priority accents |
| `status.low` / `status.completed` | `#34D399` / `#10B981` | Completed-patients KPI, delivered-SMS indicator, low-priority badge, positive trend arrows |
| `neutral.lightGray` → `neutral.charcoal` | `#F3F4F6` → `#111827` | Page background, card borders, body text hierarchy, muted labels |

**Rule:** a color is never chosen "because it looks nice" on a given widget — it's chosen because that widget represents one of the categories above. This is the single biggest lever for making the page read as clinical software rather than a marketing dashboard, without touching the palette itself.

---

## 2. Global Layout Shell

### 2.1 Sidebar *(persistent across all admin pages)*

Keep the current `blue-900` background and the white-pill active-state treatment — it already reads correctly as enterprise navigation. Modernize the structure:

```
┌───────────────────────────┐
│  [✚]  MediQueue             │  ← logo, unchanged
│       Admin Portal           │
├───────────────────────────┤
│  OVERVIEW                     │  ← new: small uppercase section label
│   ● Dashboard                  │
│                                 │
│  OPERATIONS                     │
│   ○ Queue Management             │
│   ○ Triage                        │
│   ○ Appointments                   │
│                                     │
│  INSIGHTS                            │
│   ○ Reports                           │
│   ○ SMS Logs                           │
│                                          │
│  ADMINISTRATION                          │
│   ○ Staff Management                      │
│   ○ Departments & Rooms                    │
│   ○ Settings                                │
├───────────────────────────────────────────┤
│  🟢 All systems operational                  │  ← replaces static "Admin Mode" text
├───────────────────────────────────────────┤
│  [AD]  Admin • Dr. Sarah          ⌄            │  ← opens User Menu (§2.3),
│        Administrator                              │     not a bare Sign Out link
└─────────────────────────────────────────────────┘
```

- **Grouped navigation** (Overview / Operations / Insights / Administration) instead of the current flat 7-item list — matches how Epic/Cerner side-navs are organized and scales cleanly as Staff Management, Departments & Rooms, and multi-clinic items land (per `ARCHITECTURE.md`).
- **Active item:** keep the white-pill-on-navy treatment, add a 3px colored left accent bar for extra at-a-glance recognition even at a glance.
- **Collapsible icon rail:** add a true collapse-to-64px icon-only mode (pin/unpin toggle) for desktop power users, not just the current show/hide drawer — standard in professional dashboards, saves horizontal space on laptop screens.
- **System status chip:** replace the static "Admin Mode / Full access enabled" text with a live status row (green dot + "All systems operational") — a wiring point for future SMS-gateway/uptime monitoring, low effort now, high value later.
- **User block:** avatar initials (keep the existing blue→emerald gradient circle), name, role badge, chevron — opens the User Menu (§2.3) instead of the current bare "Sign Out" link.

### 2.2 Header *(persistent, sticky)*

Keep white background, sticky positioning, bottom border. Restructure contents:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Admin / Dashboard          [🔍 Search patients, staff, queue #...]         │
│                                                                             │
│                          [Today ▾]  [↻]  [🔔 3]  [AD  Dr. Sarah ▾]         │
└──────────────────────────────────────────────────────────────────────────┘
```

- **Breadcrumb page title** ("Admin / Dashboard", "Admin / Reports") instead of a static label — orients staff as they move between pages.
- **Global search** — patient name, queue ticket number, or staff name; a top clinical-software need that doesn't exist in the current header at all.
- **Date-range filter** ("Today / This Week / This Month / Custom") — scopes every KPI card and chart on the page. The current dashboard is locked to "today" only, which isn't enough for an Administrator reviewing trends.
- **Refresh button** — keep, unchanged behavior.
- **Notification bell** — add an unread-count badge and a real dropdown panel (currently a bare icon with no panel) — see §6.
- **User Menu** — avatar + name + chevron replacing the current plain "Sign Out" link — see §2.3.

**Remove the large decorative gradient hero banner** (`bg-gradient-to-br from-blue-900 to-blue-700`, ~140px tall) that currently sits under the header. Replace it with a slim **page context bar** (~56px):

```
┌──────────────────────────────────────────────────────────────────────────┐
│  City Central Clinic · Thu, Jul 10  10:42 AM      [Waiting: 24] [Now Serving: A-012]  [Export ⤓] │
└──────────────────────────────────────────────────────────────────────────┘
```

This keeps the genuinely useful at-a-glance info from the current banner (waiting count, now-serving ticket, live clock) as compact inline stat chips, reclaiming roughly 80–100px of vertical space for actual data — meaningful on the laptop-class screens most reception/admin desks use. Background: `neutral.white` with a `neutral.mediumGray` border, not a gradient — the brand blue stays reserved for the sidebar, buttons, and active states, which reads as more deliberate use of the palette than a full decorative wash.

### 2.3 User Menu *(dropdown, opens from header avatar or sidebar user block)*

```
┌───────────────────────────────┐
│  [AD]  Dr. Sarah Chen              │
│        Administrator · City Central │
├───────────────────────────────────┤
│  👤 My Profile                       │
│  🔔 Notification Preferences          │
│  ⚙️  Settings                          │
├───────────────────────────────────────┤
│  🔓 Log Out of All Devices               │
├───────────────────────────────────────────┤
│  🚪 Sign Out                                │  ← red text, destructive styling
├─────────────────────────────────────────────┤
│  v1.4.0 · System Status: Operational           │
└─────────────────────────────────────────────────┘
```

"Log Out of All Devices" surfaces the session-revocation control described in `SECURITY_AUTH_DESIGN.md` §6 directly where an Administrator would expect it, rather than requiring a trip to Settings.

---

## 3. Dashboard Page — Full Widget Inventory

### 3.1 Layout Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Page Context Bar  (§2.2)                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  OVERVIEW CARDS — 8-up KPI grid (§3.2)                                         │
│  [Registrations][Waiting][Being Served][Completed][Emergency][AvgWait][AvgCons][SMS]│
├───────────────────────────────────────────────────┬───────────────────────────┤
│  LIVE QUEUE  (§3.3)                                    │  SMS STATISTICS (§3.7)     │
│  full-width table, primary content                     │  Patient Distribution (§3.8)│
│                                                          │  Peak Hours (§3.9)          │
│                                                          │  Priority Guide (§3.13)      │
├───────────────────────────────────┬─────────────────────┴───────────────────────┤
│  QUEUE PERFORMANCE (§3.4)             │  DEPARTMENT STATISTICS (§3.5)                │
│  combo chart                            │  table + inline bars                        │
├───────────────────────────────────┴───────────────────────────────────────────┤
│  TODAY'S REGISTRATIONS trend (§3.6)     │  RECENT TRIAGE (§3.11)                       │
├───────────────────────────────────────┴───────────────────────────────────────┤
│  RECENT ACTIVITY (§3.10)                                                         │
├───────────────────────────────────────────────────────────────────────────────┤
│  QUICK ACTIONS  (§3.12, full-width action tile row)                                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

Grid: 12-column responsive grid. Live Queue takes 8 columns, the right rail takes 4 columns, on desktop (≥1280px). Below 1024px, every zone stacks to a single column in the order shown, right-rail widgets moving below the Live Queue table.

---

### 3.2 Overview Cards (8 KPI cards)

**Card anatomy** (applies to all 8 — described once):

```
┌───────────────────────┐
│ [🔵]  TODAY'S REGISTRATIONS │  ← small colored icon chip (tinted bg, not full gradient) + uppercase label
│                              │
│  128                          │  ← large tabular-nums value
│                                │
│  ▲ 12%  vs yesterday             │  ← small trend row, green/red per direction
└───────────────────────────────────┘
```

Flat white surface, 1px `neutral.mediumGray` border, subtle shadow only on hover — quieter resting state than the current permanent `shadow-lg` gradient tiles.

| # | Card | Value shown | Icon | Color accent | Notes |
|---|---|---|---|---|---|
| 1 | **Today's Registrations** | Count of patients registered today | UserPlus | `primary.blue` | Delta vs. same time yesterday |
| 2 | **Waiting Patients** | Current waiting count | Clock | `status.warning` | Sub-chip: "3 critical" if any critical tickets waiting |
| 3 | **Patients Being Served** | Count in `called`/`in_consultation` | Activity | `status.medium` | Sub-label: current ticket number |
| 4 | **Completed Patients** | Count completed today | CheckCircle | `status.completed` | Delta vs yesterday |
| 5 | **Emergency Patients** | Count of active critical-priority tickets | AlertTriangle | `status.critical` | **Persistent subtle red-tinted card background** even in the flattened style — the one KPI that should never blend in |
| 6 | **Average Waiting Time** | Minutes | Timer | `primary.lightBlue` | Trend arrow vs yesterday's average |
| 7 | **Average Consultation Time** | Minutes | Stethoscope | `primary.darkBlue` | Trend arrow vs yesterday's average |
| 8 | **SMS Delivery Rate** | Percentage | MessageSquare | `status.completed` (green) with red count if failures | Inline "126 delivered · 2 failed" sub-line |

Responsive: 4-up on desktop (two rows of 4), 2-up on tablet, 1-up (stacked) on mobile — same pattern as the current KPI row, just wider (5→8 cards) and flatter.

---

### 3.3 Live Queue *(primary table)*

**Purpose:** the single most-referenced widget on the page — every currently active ticket, clinic-wide, for oversight (not action — Admin view is oversight-first per the role's permission scope in `SECURITY_AUTH_DESIGN.md` §12.2; "Call Next" belongs to Nurse/Doctor dashboards, not here).

| Column | Content |
|---|---|
| Ticket # | e.g. `A-014`, monospace |
| Patient | Full name |
| Priority | Colored badge (`priorityStyles` — critical/high/medium/low) |
| Department | Text |
| Status | Colored badge (`statusStyles` — waiting/called/inConsultation) |
| Room | Room number or `—` |
| Waiting Time | Live-updating minutes; text color shifts amber → red as it crosses the department's SLA threshold |
| Actions | Icon buttons: **Reassign**, **Flag for review** — administrative escalation actions only, not clinical call/complete actions |

Modernization details:
- Segmented filter above the table: **All / Waiting / Called / In Consultation**.
- Row treatment: replace the current full-row tinted background (`bg-red-50` etc. across the whole row) with a flat white row + a **3px colored left-edge accent bar** matching priority. Full-row tints read as visually busy once 15–20 rows are on screen; a left accent bar keeps the same instant scanability with a calmer table.
- Sticky header on scroll; compact 44px row height by default with a Comfortable/Compact density toggle.
- Empty state: checkmark icon + "Queue is clear — no patients waiting."

---

### 3.4 Queue Performance *(chart card)*

**Chart type:** combo chart — bar series (patients processed per hour) + line series overlay (average wait time per hour), shared hour x-axis.

- Bar fill: `primary.blue` (flat, no gradient).
- Line: `status.warning` (amber), with point markers.
- Dual y-axis: left = patient count, right = minutes.
- Purpose: lets an Administrator see *why* wait time is climbing — because volume is up, or because service is slowing — in one glance, which the current separate "Peak Hours" bar chart alone doesn't show.

---

### 3.5 Department Statistics *(table + inline chart)*

| Department | Patients Today | Waiting Now | Avg Wait | Avg Consultation | Rooms Active | SMS Sent |
|---|---|---|---|---|---|---|
| General Consultation | 38 `▮▮▮▮▮▮▮▯▯▯` | 6 | 24 min | 12 min | 2/2 | 34 |
| Pediatrics | 24 `▮▮▮▮▯▯▯▯▯▯` | 3 | 19 min | 15 min | 1/1 | 22 |
| Dental | 18 `▮▮▮▯▯▯▯▯▯▯` | 2 | 14 min | 20 min | 1/2 | 16 |
| ... | | | | | | |

- "Patients Today" column includes an inline horizontal bar-in-cell (sparkline-style), scaled against the busiest department — a Cerner-style census-view pattern that lets an admin rank departments without a separate chart.
- Sortable by any column; default sort by Patients Today descending.

---

### 3.6 Today's Registrations *(trend chart card)*

**Chart type:** area/line chart, two series:
- **Today** (solid `primary.blue` line + light fill) — registrations per hour, so far today.
- **7-day average** (dashed `neutral.gray` line, no fill) — same-hour baseline from the trailing 7 days.

Purpose: distinct from the KPI card (which only shows the running total) — this shows whether *today* is trending busier or quieter than typical, at each hour, which is the actual operational question an admin needs answered.

---

### 3.7 SMS Statistics *(card)*

- **Top row:** three inline stat chips — Sent / Delivered / Failed — each with count and percentage.
- **Chart:** stacked bar chart by hour, three stacked series (Sent as the outline, Delivered in `status.completed` green, Failed in `status.critical` red, Pending in `neutral.gray`) — consistent coloring with every other delivered/failed indicator on the page (§1).
- **Footer:** "View all SMS logs →" linking to `/admin/sms-logs`.

---

### 3.8 Patient Distribution *(chart card)*

**Chart type:** horizontal bar chart, one bar per department, ranked by share of today's patients. Recommended over a pie/donut: with 5+ departments, horizontal bars are read and compared faster than pie-slice angles, and they align with the row-based visual language used everywhere else on this page (tables, KPI trend rows).

- Bars colored by a single consistent brand hue (`primary.blue`, varying opacity by rank) rather than a different color per department — department identity isn't a status category, so it shouldn't consume the status color vocabulary (§1's core rule: color = meaning, not decoration).

---

### 3.9 Peak Hours *(chart card)*

**Chart type:** vertical bar chart, x = hour of day, y = patient count.
- All bars in `neutral.mediumGray` **except** the bar matching the current hour, shown in `primary.blue` — an immediate "we are here" marker on the day's curve that the current implementation doesn't have.

---

### 3.10 Recent Activity *(feed card)*

Vertical list, most recent first:

```
🔵  Reception          Patient Registered           Just now
🟣  Triage Nurse        Triage Completed              2 min ago
🟠  Queue Desk           Queue Advanced                 6 min ago
🟢  SMS System            SMS Sent                        8 min ago
🟪  Doctor                 Consultation Started              11 min ago
```

- Each row: colored dot by action category (registration=blue, triage=purple, queue=amber, sms=teal, consultation=emerald — consistent, fixed mapping), actor, action, relative timestamp.
- Grouped under a "Today" divider; a "Yesterday" divider appears if the feed is scrolled further (paired with a "View all activity →" link to a future full audit view, gated to the Clinic Administrator audit-log permission from `SECURITY_AUTH_DESIGN.md` §12.2).

---

### 3.11 Recent Triage *(table card)*

| Time | Patient | Symptoms | Priority |
|---|---|---|---|
| 10:12 AM | Sarah Johnson | Severe chest pain | 🔴 Critical |
| 10:10 AM | James Wilson | Fever + persistent cough | 🟠 High |
| 10:06 AM | Emma Davis | Routine check-up | 🟢 Low |

- Same left-accent-bar-by-priority treatment as the Live Queue table (§3.3) for visual consistency between the two patient-list tables on the page.
- Symptoms column truncates with a hover tooltip for the full note.

---

### 3.12 Quick Actions *(action tile row, full width)*

Admin-scoped actions only — deliberately **not** the same tile set a Receptionist or Nurse would see, matching the permission boundaries in `SECURITY_AUTH_DESIGN.md` §12.2 (an Administrator doesn't register patients or perform triage):

```
[+ Add Staff Member]  [🏢 Departments & Rooms]  [📊 Full Reports]  [✉ SMS Templates]  [⤓ Export Today's Summary]  [⚙ System Settings]
```

Each tile: icon + label, flat card with a colored top border on hover (not permanent), single-click navigation — no nested menus.

---

### 3.13 Priority Guide *(reference card)*

Keep as a compact legend: four color swatches (critical/high/medium/low) each with a one-line definition ("Critical — immediate attention, life-threatening"). Genuinely useful reference in a clinical UI; only change is visual flattening (no gradient chip, just a colored dot) to match the rest of the redesigned surface language.

---

## 4. Other Pages

### 4.1 Reports Page

```
┌─────────────────────────────────────────────────────────────────┐
│  Admin / Reports          [Date Range ▾] [Department ▾] [Type ▾]   │
├─────────────────────────────────────────────────────────────────┤
│  REPORT TEMPLATES (card grid)                                       │
│  [Daily Summary]  [Weekly Summary]  [Monthly Summary]                 │
│  [Staff Performance]  [Queue Analytics]  [SMS Delivery]                 │
├─────────────────────────────────────────────────────────────────────┤
│  GENERATED REPORTS (table)                                             │
│  Type | Period | Generated By | Generated At | Status | Download          │
└─────────────────────────────────────────────────────────────────────────┘
```

- Each report-template card: icon, name, one-line description, small preview sparkline of the underlying trend, and a "Generate" button.
- The Generated Reports table lists prior runs (mapping to the `reports` table in `DATABASE_DESIGN.md` §3.23) — Type, Period, Generated By, Generated At, Status badge (`generating`/`completed`/`failed`), and a Download link for `completed` rows.

### 4.2 Notifications

- **Header dropdown panel** (opens from the bell icon, §2.2): tabbed — **All / Alerts / SMS Failures / System** — each row: icon, message, relative time, unread dot; "Mark all as read" footer action.
- **Dedicated `/admin/notifications` page** (linked from "View all →" at the bottom of the dropdown) for full history beyond the last ~10 items, with the same date-range and type filters used elsewhere in the app for consistency.

### 4.3 Settings Page

Left-nav-within-page (or tab strip) sections:

```
Clinic Profile │ Departments & Rooms │ Working Hours & Holidays │ Staff & Roles │
SMS Templates & Gateway │ Notification Preferences │ Security │ Audit Log
```

- **Clinic Profile:** name, logo upload, address, contact info — explicitly *not* a color/theme editor; branding stays fixed per this redesign's mandate.
- **Security section** surfaces session-timeout duration and the MFA-required toggle for Administrator/Super Administrator roles described in `SECURITY_AUTH_DESIGN.md` §13.1 — giving the Administrator a UI for a control that otherwise would only exist in config.
- **Audit Log** section deep-links to the clinic-scoped audit trail (`SECURITY_AUTH_DESIGN.md` §10), read-only, with actor/action/date filters.

---

## 5. Cross-Cutting Table Rules

Applies to every table in this document (Live Queue, Department Statistics, Recent Triage, Generated Reports):

- Header row: uppercase, small, `neutral.gray`, sticky on scroll.
- Default row height: compact (44px) for clinical scan speed; a Comfortable/Compact toggle is available per table.
- Status/priority values are **always** rendered as colored pill badges from `statusStyles`/`priorityStyles` — never plain text.
- Numeric columns right-aligned with tabular figures.
- Row hover: subtle `neutral.lightGray` background; row-action icons stay hidden until hover on desktop pointer devices (keeps rows visually quiet at rest).
- Empty state: icon + one-line message + a relevant primary action, never a bare "No data."
- Loading state: skeleton rows, not a spinner, to avoid layout shift when data arrives.
- Any table that can exceed ~15 rows in normal operation (Live Queue, Recent Activity, Generated Reports) gets pagination or incremental "Load more," never an unbounded scroll list.

## 6. Cross-Cutting Chart Rules

Applies to every chart in this document (Queue Performance, Today's Registrations, SMS Statistics, Patient Distribution, Peak Hours):

- **One fixed color vocabulary across every chart on the page** — critical=red, warning/waiting=amber, medium/in-progress=purple, completed/delivered/low=green, primary trend=`primary.blue`. A color never means something different in one chart than it does in another.
- Flat fills; at most a very subtle single-direction gradient — no heavy 3D or glossy chart styling.
- Y-axis for bar charts always starts at zero (no truncated axes that exaggerate differences).
- Gridlines minimal and light (`neutral.lightGray`), never full-opacity black.
- Tooltips on hover show exact values; legends only appear where a chart has more than one series that isn't already labeled inline.
- Bar charts preferred over pie/donut for any comparison across more than 3 categories (Patient Distribution, Department Statistics) — faster to read, consistent with the row-based visual language of the rest of the page.

---

## 7. Before → After Summary

| Element | Current | Redesigned |
|---|---|---|
| Hero area | Full-height decorative blue gradient banner (~140px) | Slim white page-context bar (~56px) with inline live stats |
| KPI cards | 5 cards, full-gradient tiles, icon-dominant | 8 cards, flat surface + small colored icon chip, number-dominant |
| Table row emphasis | Full-row tinted background by priority | Flat row + 3px colored left accent bar |
| Header | Static title, bare Refresh/Bell/Sign-out | Breadcrumb title, global search, date-range filter, notification panel, User Menu dropdown |
| Sidebar nav | Flat 7-item list | Grouped by Overview/Operations/Insights/Administration, collapsible icon rail |
| Notifications | Bell icon with no panel | Dropdown panel + dedicated notifications page |
| Quick Actions | Generic action set | Admin-scoped actions matching the RBAC permission boundary |
| Charts | Peak Hours, Patient Distribution, SMS Analytics only | Adds Queue Performance (combo) and Today's Registrations (trend vs. baseline); Patient Distribution moved from pie-style to horizontal bar |
| Color usage | Decorative (gradients used for visual variety) | Semantic only (every color maps to one fixed meaning, everywhere) |

No page in this redesign requires a new brand color, a new logo treatment, or a new typographic identity — every change is structural: density, hierarchy, consistency, and the removal of decorative elements that don't carry information.
