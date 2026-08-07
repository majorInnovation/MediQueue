# TODO.md — MediQueue Admin Dashboard (Smart Healthcare Ops Center)

## Plan summary
Transform `/clinic/dashboard` (admin dashboard) into a real-time, data-driven **Smart Healthcare Operations Center** with premium healthcare UI.

## Steps
- [x] (1) Create/update dashboard layout to match spec grid/sections

- [ ] (2) Upgrade KPI cards to required 6-card set (patients, now serving, waiting breakdown, avg waiting time w/ yesterday trend, active doctors breakdown, efficiency score)
- [ ] (3) Redesign premium healthcare sidebar (dark navy theme, logo, system name/subtitle, footer profile dropdown)
- [ ] (4) Replace in-dashboard header area to include title + date/time + clinic name + search + notifications + emergency icon + messages + admin avatar/profile menu
- [ ] (5) Add new panels as dedicated components: Emergency Alert Center, Doctor Workload, Department Performance, AI Clinic Insights (and optional Efficiency Center)
- [ ] (6) Wire best-effort real-time updates via `lib/realtime/wsClient.ts` into dashboard state (queue, notifications, emergency indicators)
- [ ] (7) Smart UX polish: live indicators, animated queue movement, priority highlighting, contextual tooltips, priority badges color system
- [ ] (8) Verify build & run: no TS errors, `/admin/dashboard` renders without refresh, responsive behavior across breakpoints

