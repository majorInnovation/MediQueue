'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw, LogOut, BarChart2, Users, Clock,
  MessageSquare, TrendingUp, Download, CheckCircle2,
} from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts'

type Kpis = { patientsServed: number; avgWait: number; smsSent: number; completionRate: number; smsDeliveryRate: number }
type DailyPoint = { day: string; patients: number; completed: number }
type HourPoint = { hour: string; count: number; avgWait: number }
type SmsHourPoint = { hour: string; sent: number; delivered: number; failed: number }
type NamedCount = { name: string; value: number }
type PriorityCount = { priority: string; count: number }

const DEPT_COLORS = ['#2563EB', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6']
const PRIORITY_COLORS: Record<string, string> = { critical: '#EF4444', high: '#F97316', medium: '#F59E0B', low: '#22C55E' }

const RANGES: { key: string; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'quarter', label: 'Last 3 Months' },
]

function toCSV(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const lines = rows.map(r => headers.map(h => `"${String(r[h]).replace(/"/g, '""')}"`).join(','))
  return [headers.join(','), ...lines].join('\n')
}

function downloadCSV(filename: string, rows: Record<string, string | number>[]) {
  const csv = toCSV(rows)
  if (!csv) return
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function ReportsPage() {
  const [range, setRange] = useState('today')
  const [loading, setLoading] = useState(true)

  const [kpis, setKpis] = useState<Kpis>({ patientsServed: 0, avgWait: 0, smsSent: 0, completionRate: 0, smsDeliveryRate: 0 })
  const [dailyVolume, setDailyVolume] = useState<DailyPoint[]>([])
  const [peakHours, setPeakHours] = useState<HourPoint[]>([])
  const [smsHourly, setSmsHourly] = useState<SmsHourPoint[]>([])
  const [deptDist, setDeptDist] = useState<NamedCount[]>([])
  const [priorityDist, setPriorityDist] = useState<PriorityCount[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reports?range=${range}`)
      if (!res.ok) return
      const d = await res.json()
      setKpis(d.kpis)
      setDailyVolume(d.dailyVolume ?? [])
      setPeakHours(d.peakHours ?? [])
      setSmsHourly(d.smsHourly ?? [])
      setDeptDist(d.departmentDistribution ?? [])
      setPriorityDist(d.priorityDistribution ?? [])
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => { load() }, [load])

  const priorityTotal = priorityDist.reduce((a, b) => a + b.count, 0)

  return (
    <div className="flex flex-col min-h-full">

      {/* Header */}
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
              <h1 className="text-base font-bold text-gray-900 hidden sm:block">Reports & Analytics</h1>
              <p className="text-xs text-gray-500 hidden md:block">Clinic performance overview</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button type="button" onClick={() => { window.location.href = '/api/auth/logout' }} className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 px-4 sm:px-6 lg:px-8 pt-6 pb-20 md:pb-24 lg:pb-28">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm">Admin · Reports</p>
            <h2 className="text-white font-bold text-2xl md:text-3xl mt-0.5">Reports & Analytics</h2>
            <p className="text-blue-300 text-sm mt-1">Track clinic performance and queue trends</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {RANGES.map(r => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${range === r.key ? 'bg-white text-blue-900' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-14 md:-mt-16 lg:-mt-20 pb-6 space-y-4 md:space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Patients Served', value: String(kpis.patientsServed), icon: Users, bg: 'bg-blue-50', iconColor: 'text-blue-700', border: 'border-blue-100' },
            { label: 'Avg Wait Time', value: `${kpis.avgWait} min`, icon: Clock, bg: 'bg-amber-50', iconColor: 'text-amber-700', border: 'border-amber-100' },
            { label: 'SMS Sent', value: String(kpis.smsSent), sub: `${kpis.smsDeliveryRate}% delivery rate`, icon: MessageSquare, bg: 'bg-purple-50', iconColor: 'text-purple-700', border: 'border-purple-100' },
            { label: 'Completion Rate', value: `${kpis.completionRate}%`, icon: CheckCircle2, bg: 'bg-emerald-50', iconColor: 'text-emerald-700', border: 'border-emerald-100' },
          ].map(({ label, value, sub, icon: Icon, bg, iconColor, border }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-lg p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500">{label}</p>
                  <p className="text-2xl font-black text-gray-900 mt-1 tracking-tight">{loading ? '—' : value}</p>
                  {sub && <p className="text-xs text-gray-400 font-medium mt-1">{sub}</p>}
                </div>
                <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Daily volume */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">Patient Volume</h3>
              <p className="text-xs text-gray-500">Patients registered vs completed per day</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-600" />Registered</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" />Completed</span>
            </div>
          </div>
          <div className="p-5 h-72">
            {dailyVolume.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">No queue activity in this period.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyVolume} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                  <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="patients" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" fill="#22C55E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Row: Peak Hours + SMS Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Peak Hours Analytics</h3>
              <p className="text-xs text-gray-500">Patient volume and average wait time by hour</p>
            </div>
            <div className="p-5 h-64">
              {peakHours.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">No data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={peakHours} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                    <XAxis dataKey="hour" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2.5} dot={false} name="Patients" />
                    <Line type="monotone" dataKey="avgWait" stroke="#F59E0B" strokeWidth={2} dot={false} strokeDasharray="4 2" name="Avg Wait (min)" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="px-5 pb-4 flex gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-gray-600"><span className="w-4 h-0.5 bg-blue-600 inline-block" /> Patient Volume</span>
              <span className="flex items-center gap-1.5 text-gray-600"><span className="w-4 h-0.5 bg-amber-500 inline-block border-dashed" /> Avg Wait Time</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">SMS Delivery Analytics</h3>
              <p className="text-xs text-gray-500">Sent and delivered SMS by hour</p>
            </div>
            <div className="p-5 h-64">
              {smsHourly.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-400">No SMS activity yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={smsHourly} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                    <XAxis dataKey="hour" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="sent" stroke="#2563EB" strokeWidth={2.5} dot={false} name="Sent" />
                    <Line type="monotone" dataKey="delivered" stroke="#22C55E" strokeWidth={2} dot={false} name="Delivered" />
                    <Line type="monotone" dataKey="failed" stroke="#EF4444" strokeWidth={2} dot={false} name="Failed" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="px-5 pb-4 flex gap-4 text-xs">
              {[{ color: 'bg-blue-600', label: 'Sent' }, { color: 'bg-emerald-500', label: 'Delivered' }, { color: 'bg-red-500', label: 'Failed' }].map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-gray-600">
                  <span className={`w-3 h-3 rounded-full ${color}`} /> {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Row: Department distribution + Priority distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Patients by Department</h3>
              <p className="text-xs text-gray-500">Distribution across clinic services</p>
            </div>
            {deptDist.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-400">No data yet.</div>
            ) : (
              <div className="p-5 grid grid-cols-[1fr_0.9fr] gap-4 items-center">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={deptDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={56}>
                        {deptDist.map((d, i) => <Cell key={d.name} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2.5">
                  {deptDist.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                        <span className="text-sm text-gray-700">{d.name}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Priority Distribution</h3>
              <p className="text-xs text-gray-500">Patient breakdown by triage priority</p>
            </div>
            {priorityDist.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-400">No data yet.</div>
            ) : (
              <div className="p-5 space-y-3">
                {priorityDist.map(({ priority, count }) => {
                  const pct = priorityTotal ? Math.round((count / priorityTotal) * 100) : 0
                  return (
                    <div key={priority} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-gray-700 capitalize">{priority}</span>
                        <span className="text-gray-900 font-bold">{count} <span className="text-gray-500 font-normal text-xs">({pct}%)</span></span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: PRIORITY_COLORS[priority] ?? '#94a3b8' }} />
                      </div>
                    </div>
                  )
                })}
                <div className="pt-2 border-t border-gray-100 flex justify-between text-sm">
                  <span className="text-gray-500">Total patients</span>
                  <span className="font-bold text-gray-900">{priorityTotal}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Export section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-5">
          <h3 className="font-bold text-gray-900 mb-4">Export Reports</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                label: 'Daily Volume (CSV)', sub: 'Registered vs completed by day', icon: BarChart2,
                onClick: () => downloadCSV('daily-volume.csv', dailyVolume),
              },
              {
                label: 'Peak Hours (CSV)', sub: 'Patient volume and wait time by hour', icon: TrendingUp,
                onClick: () => downloadCSV('peak-hours.csv', peakHours),
              },
              {
                label: 'SMS Analytics (CSV)', sub: 'Sent, delivered, failed by hour', icon: MessageSquare,
                onClick: () => downloadCSV('sms-analytics.csv', smsHourly),
              },
            ].map(({ label, sub, icon: Icon, onClick }) => (
              <button key={label} onClick={onClick} className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 hover:border-blue-200 hover:bg-blue-50 text-left transition-all group">
                <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-700 transition-colors">
                  <Icon className="w-4 h-4 text-blue-700 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
