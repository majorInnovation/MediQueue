'use client'

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import {
  Users,
  Clock,
  MessageSquare,
  Activity,
  Shield,
  RefreshCw,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

import { AdminKpiCard } from '@/components/dashboard-admin/AdminKpiCard'
import { AdminQueueOverview } from '@/components/dashboard-admin/AdminQueueOverview'
import { AdminLiveQueueTable, type AdminQueueRow } from '@/components/dashboard-admin/AdminLiveQueueTable'
import {
  AdminSmsNotificationCenter,
  type AdminSmsPreview,
} from '@/components/dashboard-admin/AdminSmsNotificationCenter'
import { AdminRecentTriageTable, type RecentTriageRow } from '@/components/dashboard-admin/AdminRecentTriageTable'
import { AdminSmsAnalyticsCard, AdminPatientDistributionCard, AdminPeakHoursCard } from '@/components/dashboard-admin/AdminAnalyticsCharts'
import { AdminPriorityGuide } from '@/components/dashboard-admin/AdminPriorityGuide'
import { AdminActivityFeed, type ActivityEvent } from '@/components/dashboard-admin/AdminActivityFeed'
import { AdminQuickActions } from '@/components/dashboard-admin/AdminQuickActions'
import { priorityCountsToWaiting } from '@/components/dashboard-admin/AdminPriorityKpis'

function todayDateString(d = new Date()) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{title}</h2>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  )
}

function fmtHour(h: number) {
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}${period}`
}

// triage_assessments.priority uses critical/high/medium/low; the triage
// table component's taxonomy is critical/urgent/standard/minor.
const triagePriorityMap: Record<string, RecentTriageRow['priority']> = {
  critical: 'critical', high: 'urgent', medium: 'standard', low: 'minor',
}

export default function AdminDashboardPage() {
  const supabase = createClient()

  const [now, setNow] = useState<Date | null>(null)
  const [clinicId, setClinicId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchRequestId = useRef(0)

  const [stats, setStats] = useState({
    totalToday: 0, waiting: 0, serving: 0, avgWait: 0,
    smsSent: 0, smsDeliveryRate: 0,
    byPriority: { high: 0, medium: 0, low: 0 },
    departmentDistribution: [] as { name: string; value: number }[],
    hourlyVolume: [] as { hour: number; count: number }[],
  })

  const [queueRows, setQueueRows] = useState<AdminQueueRow[]>([])
  const [nowServingQueue, setNowServingQueue] = useState({ queueNumber: '—', department: '—' })
  const [triageRows, setTriageRows] = useState<RecentTriageRow[]>([])
  const [smsPreviews, setSmsPreviews] = useState<AdminSmsPreview[]>([])
  const [smsHourly, setSmsHourly] = useState<{ hour: string; sent: number; delivered: number; failed: number; pending: number }[]>([])
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([])
  const [callingNext, setCallingNext] = useState(false)

  const nowTimeStr = now?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) ?? '--:--'

  const kpiCards = useMemo(
    () => [
      {
        label: 'Total Patients Today',
        value: String(stats.totalToday),
        change: 'Since midnight',
        icon: Users,
        accent: 'blue' as const,
      },
      {
        label: 'Now Serving',
        value: nowServingQueue.queueNumber,
        change: nowServingQueue.department,
        icon: Activity,
        accent: 'emerald' as const,
      },
      {
        label: 'Waiting Patients',
        value: String(stats.waiting),
        change: `High priority: ${stats.byPriority.high}`,
        icon: Shield,
        accent: 'amber' as const,
      },
      {
        label: 'Average Waiting Time',
        value: `${stats.avgWait} min`,
        change: 'Today',
        icon: Clock,
        accent: 'indigo' as const,
      },
      {
        label: 'SMS Notifications',
        value: String(stats.smsSent),
        change: `${stats.smsDeliveryRate}% delivered`,
        icon: MessageSquare,
        accent: 'violet' as const,
      },
    ],
    [stats, nowServingQueue],
  )

  const waitingBreakdown = useMemo(() => priorityCountsToWaiting(stats.byPriority), [stats.byPriority])

  const loadAll = useCallback(async () => {
    const requestId = ++fetchRequestId.current
    setLoading(true)
    setError(null)

    try {
      console.log('[dashboard] loadAll start', requestId)
      const [statsRes, queueRes, triageRes, smsRes, activityRes] = await Promise.all([
        fetch('/api/admin/stats', { cache: 'no-store' }),
        fetch('/api/admin/queue', { cache: 'no-store' }),
        fetch('/api/triage', { cache: 'no-store' }),
        fetch('/api/sms-logs', { cache: 'no-store' }),
        fetch('/api/admin/activity', { cache: 'no-store' }),
      ])

      if (requestId !== fetchRequestId.current) {
        console.log('[dashboard] ignored stale loadAll', requestId)
        return
      }

      if (statsRes.ok) {
        const d = await statsRes.json()
        setStats({
          totalToday: d.totalToday ?? 0, waiting: d.waiting ?? 0, serving: d.serving ?? 0,
          avgWait: d.avgWait ?? 0, smsSent: d.smsSent ?? 0, smsDeliveryRate: d.smsDeliveryRate ?? 0,
          byPriority: d.byPriority ?? { high: 0, medium: 0, low: 0 },
          departmentDistribution: d.departmentDistribution ?? [],
          hourlyVolume: d.hourlyVolume ?? [],
        })
      }

      if (queueRes.ok) {
        const { queue } = await queueRes.json()
        const rows: AdminQueueRow[] = (queue ?? []).map((q: any) => ({
          id: q.id,
          queueNumber: q.queue_number,
          patientName: q.patients?.name ?? '—',
          priority: q.priority === 'critical' ? 'high' : q.priority,
          department: q.department,
          status: q.status,
          waitingMinutes: Math.max(0, Math.floor((Date.now() - new Date(q.created_at).getTime()) / 60000)),
        }))
        setQueueRows(rows)
        const serving = (queue ?? []).find((q: any) => q.status === 'inConsultation' || q.status === 'called')
        setNowServingQueue(serving ? { queueNumber: serving.queue_number, department: serving.department } : { queueNumber: '—', department: '—' })
      }

      if (triageRes.ok) {
        const { recent } = await triageRes.json()
        setTriageRows((recent ?? []).slice(0, 6).map((r: any) => ({
          id: r.id,
          time: fmtTime(r.assessed_at),
          patientName: r.patients?.name ?? '—',
          symptoms: (r.queue_records?.symptoms ?? []).join(', ') || '—',
          priority: triagePriorityMap[r.priority] ?? 'minor',
        })))
      }

      if (smsRes.ok) {
        const { logs } = await smsRes.json()
        const all = logs ?? []
        setSmsPreviews(all.slice(0, 4).map((l: any) => ({
          id: l.id, type: l.message_type ?? 'General', message: l.message, status: l.status, timestamp: fmtTime(l.sent_at),
        })))

        const byHour = new Map<number, { sent: number; delivered: number; failed: number; pending: number }>()
        for (const l of all) {
          const hour = new Date(l.sent_at).getHours()
          const entry = byHour.get(hour) ?? { sent: 0, delivered: 0, failed: 0, pending: 0 }
          entry.sent += 1
          if (l.status === 'delivered') entry.delivered += 1
          if (l.status === 'failed') entry.failed += 1
          if (l.status === 'pending') entry.pending += 1
          byHour.set(hour, entry)
        }
        setSmsHourly(Array.from(byHour.entries()).sort((a, b) => a[0] - b[0]).map(([hour, v]) => ({ hour: fmtHour(hour), ...v })))
      }

      if (activityRes.ok) {
        const { activity } = await activityRes.json()
        setActivityEvents((activity ?? []).map((a: any) => ({ id: a.id, user: a.user, action: a.action, timestamp: fmtTime(a.timestamp) })))
      }
    } catch (loadError) {
      if (requestId !== fetchRequestId.current) return
      console.error('[dashboard] failed to load all data', loadError)
      setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard data.')
    } finally {
      if (requestId === fetchRequestId.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    setNow(new Date())
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('user_profiles').select('clinic_id').eq('id', user.id).single()
        .then(({ data }) => setClinicId(data?.clinic_id ?? null))
    })
  }, [])

  useEffect(() => {
    if (!clinicId) return
    const channel = supabase
      .channel('dashboard_admin')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'queue_records',
        filter: `clinic_id=eq.${clinicId}`,
      }, () => loadAll())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [clinicId, loadAll])

  async function callNext() {
    const next = queueRows.find(r => r.status === 'waiting')
    if (!next) return
    setCallingNext(true)
    await fetch('/api/queue/action', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueRecordId: next.id, action: 'call' }),
    })
    setCallingNext(false)
    loadAll()
  }

  return (
    <div className="flex flex-col min-h-full">

      {/* Top Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="lg:hidden w-8 h-8 bg-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="6" y="1" width="4" height="14" rx="1.5" fill="white" />
                <rect x="1" y="6" width="14" height="4" rx="1.5" fill="white" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 hidden sm:block">Admin Dashboard</h1>
              <p className="text-xs text-gray-500 hidden md:block">{now ? todayDateString(now) : ''}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadAll}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => { window.location.href = '/api/auth/logout' }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Blue Hero Banner */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 px-4 sm:px-6 lg:px-8 pt-6 pb-20 md:pb-24 lg:pb-28">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm">Control Center</p>
            <h2 className="text-white font-bold text-2xl md:text-3xl mt-0.5">Admin Dashboard</h2>
            <p className="text-blue-300 text-sm mt-1">Here&apos;s what&apos;s happening in your clinic today</p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            <div>
              <p className="text-blue-200 text-xs font-medium">Live</p>
              <p className="text-white font-bold text-sm tabular-nums">{nowTimeStr}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-14 md:-mt-16 lg:-mt-20 pb-6 space-y-4 md:space-y-6">
        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p>
                {queueRows.length > 0 || stats.totalToday > 0
                  ? 'Some dashboard data could not refresh. Showing previously loaded results.'
                  : 'Unable to load dashboard data. Please check your connection.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true)
                  void loadAll()
                }}
                className="self-start rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-slate-100 sm:self-auto"
              >
                Retry
              </button>
            </div>
          </div>
        ) : null}

        {/* KPI Cards */}
        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {kpiCards.map((kpi) => (
            <AdminKpiCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              change={kpi.change}
              icon={kpi.icon}
              accent={kpi.accent}
            />
          ))}
        </section>

        {/* Queue & Triage */}
        <SectionHeading title="Queue & Triage" />
        <AdminLiveQueueTable rows={queueRows} />
        <AdminRecentTriageTable rows={triageRows} />

        {/* Communications */}
        <SectionHeading title="Communications" />
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AdminSmsNotificationCenter items={smsPreviews} />
          <AdminSmsAnalyticsCard data={smsHourly} />
        </section>

        {/* Analytics */}
        <SectionHeading title="Analytics" />
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AdminPatientDistributionCard data={stats.departmentDistribution} />
          <AdminPeakHoursCard data={stats.hourlyVolume.map(h => ({ hour: fmtHour(h.hour), count: h.count }))} />
        </section>

        {/* Activity */}
        <SectionHeading title="Activity" />
        <AdminActivityFeed events={activityEvents} />

        {/* Queue Summary */}
        <SectionHeading title="Queue Summary" />
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <AdminQueueOverview
            waitingTotal={waitingBreakdown.total}
            byPriority={{ High: waitingBreakdown.high, Medium: waitingBreakdown.medium, Low: waitingBreakdown.low }}
          />
          <AdminPriorityGuide />

          {/* Now Serving card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-900">Now Serving</h3>
                <p className="text-xs text-gray-500">Live department assignment</p>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live
              </div>
            </div>
            <div className="p-5">
              <div className="text-3xl font-bold text-gray-900 tracking-tight">{nowServingQueue.queueNumber}</div>
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-semibold">{nowServingQueue.department}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <div className="pt-2">
          <AdminQuickActions onCallNext={callNext} callDisabled={callingNext || !queueRows.some(r => r.status === 'waiting')} />
        </div>
      </div>
    </div>
  )
}
