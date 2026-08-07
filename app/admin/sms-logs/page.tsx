'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  RefreshCw, LogOut, MessageSquare, CheckCircle2,
  Clock, Send, Search, Filter, Download,
  BadgeCheck, BadgeX, AlertCircle, ChevronLeft, ChevronRight,
  Phone, User, Eye, RotateCcw,
} from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

type SmsStatus = 'delivered' | 'sent' | 'failed' | 'pending'
type SmsType =
  | 'Registration'
  | 'Queue Update'
  | 'Almost Your Turn'
  | 'Now Serving'
  | 'Appointment Reminder'
  | 'Feedback Request'
  | 'No-Show Alert'

type SmsLog = {
  id: string
  patientName: string
  phone: string
  type: SmsType
  message: string
  status: SmsStatus
  sentAt: string
  sentAtRaw: string
  deliveredAt?: string
  failureReason?: string
  department: string
  queueNumber?: string
}

function fmtHour(h: number) {
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}${period}`
}

const SMS_TYPES: SmsType[] = [
  'Registration', 'Queue Update', 'Almost Your Turn',
  'Now Serving', 'Appointment Reminder', 'Feedback Request', 'No-Show Alert',
]

const PAGE_SIZE = 8

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusMeta: Record<SmsStatus, { label: string; cls: string; icon: React.ElementType }> = {
  delivered: { label: 'Delivered', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: BadgeCheck },
  sent:      { label: 'Sent',      cls: 'bg-blue-50 text-blue-700 border-blue-100',          icon: Send },
  failed:    { label: 'Failed',    cls: 'bg-red-50 text-red-700 border-red-200',             icon: BadgeX },
  pending:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-700 border-amber-200',       icon: Clock },
}

const typeCls: Record<SmsType, string> = {
  'Registration':        'bg-blue-50 text-blue-700',
  'Queue Update':        'bg-purple-50 text-purple-700',
  'Almost Your Turn':    'bg-amber-50 text-amber-700',
  'Now Serving':         'bg-emerald-50 text-emerald-700',
  'Appointment Reminder':'bg-indigo-50 text-indigo-700',
  'Feedback Request':    'bg-teal-50 text-teal-700',
  'No-Show Alert':       'bg-red-50 text-red-700',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SmsLogsPage() {
  const [logs, setLogs]             = useState<SmsLog[]>([])
  const [loading, setLoading]       = useState(true)
  const [query, setQuery]           = useState('')
  const [statusFilter, setStatus]   = useState<SmsStatus | 'All'>('All')
  const [typeFilter, setType]       = useState<SmsType | 'All'>('All')
  const [expandedId, setExpanded]   = useState<string | null>(null)
  const [page, setPage]             = useState(1)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'All') params.set('status', statusFilter)
      const res = await fetch(`/api/sms-logs?${params}`)
      if (res.ok) {
        const { logs: data } = await res.json()
        const mapped: SmsLog[] = (data ?? []).map((l: any) => ({
          id:            l.id,
          patientName:   l.patients?.name ?? '—',
          phone:         l.phone ?? '—',
          type:          (l.message_type ?? 'Queue Update') as SmsType,
          message:       l.message ?? '',
          status:        (l.status ?? 'sent') as SmsStatus,
          sentAt:        l.sent_at ? new Date(l.sent_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—',
          sentAtRaw:     l.sent_at ?? '',
          deliveredAt:   l.delivered_at ? new Date(l.delivered_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
          failureReason: l.failure_reason ?? undefined,
          department:    l.queue_records?.department ?? '—',
          queueNumber:   l.queue_records?.queue_number ?? undefined,
        }))
        setLogs(mapped)
      }
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { loadLogs() }, [loadLogs])

  // Derived stats
  const total     = logs.length
  const delivered = logs.filter(l => l.status === 'delivered').length
  const failed    = logs.filter(l => l.status === 'failed').length
  const pending   = logs.filter(l => l.status === 'pending').length
  const rate      = total ? Math.round((delivered / total) * 100) : 0

  const hourlyChart = useMemo(() => {
    const byHour = new Map<number, { sent: number; delivered: number; failed: number }>()
    for (const l of logs) {
      if (!l.sentAtRaw) continue
      const hour = new Date(l.sentAtRaw).getHours()
      const entry = byHour.get(hour) ?? { sent: 0, delivered: 0, failed: 0 }
      entry.sent += 1
      if (l.status === 'delivered') entry.delivered += 1
      if (l.status === 'failed') entry.failed += 1
      byHour.set(hour, entry)
    }
    return Array.from(byHour.entries()).sort((a, b) => a[0] - b[0]).map(([hour, v]) => ({ hour: fmtHour(hour), ...v }))
  }, [logs])

  const exportCSV = () => {
    const header = 'Time,Patient,Phone,Type,Status,Message\n'
    const body = filtered.map(l =>
      `${l.sentAt},"${l.patientName}",${l.phone},${l.type},${l.status},"${l.message.replace(/"/g, '""')}"`
    ).join('\n')
    const blob = new Blob([header + body], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = 'sms-logs.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return logs.filter(l => {
      const matchQ      = !q || l.patientName.toLowerCase().includes(q) || l.phone.includes(q) || l.message.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'All' || l.status === statusFilter
      const matchType   = typeFilter   === 'All' || l.type   === typeFilter
      return matchQ && matchStatus && matchType
    })
  }, [query, statusFilter, typeFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleFilterChange<T>(setter: (v: T) => void, value: T) {
    setter(value)
    setPage(1)
    setExpanded(null)
  }

  return (
    <div className="flex flex-col min-h-full">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
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
              <h1 className="text-base font-bold text-gray-900 hidden sm:block">SMS Logs</h1>
              <p className="text-xs text-gray-500 hidden md:block">Full history of outbound patient messages</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-all">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button onClick={loadLogs} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button type="button" onClick={() => { window.location.href = '/api/auth/logout' }} className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 px-4 sm:px-6 lg:px-8 pt-6 pb-20 md:pb-24 lg:pb-28">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm">Admin · SMS Logs</p>
            <h2 className="text-white font-bold text-2xl md:text-3xl mt-0.5">SMS Logs</h2>
            <p className="text-blue-300 text-sm mt-1">Track every outbound message sent to patients today</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 text-center border border-white/20">
              <p className="text-blue-200 text-xs font-medium">Total Sent</p>
              <p className="text-white font-black text-xl">{total}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 text-center border border-white/20">
              <p className="text-blue-200 text-xs font-medium">Delivered</p>
              <p className="text-white font-black text-xl">{delivered}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 text-center border border-white/20">
              <p className="text-blue-200 text-xs font-medium">Delivery Rate</p>
              <p className="text-white font-black text-xl">{rate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-14 md:-mt-16 lg:-mt-20 pb-6 space-y-4 md:space-y-6">

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Sent',     value: String(total),     sub: 'Since 6 AM today',      icon: MessageSquare, bg: 'bg-blue-50',    iconColor: 'text-blue-700',    border: 'border-blue-100' },
            { label: 'Delivered',      value: String(delivered), sub: `${rate}% success rate`,  icon: BadgeCheck,    bg: 'bg-emerald-50', iconColor: 'text-emerald-700', border: 'border-emerald-100' },
            { label: 'Failed',         value: String(failed),    sub: 'Requires attention',     icon: BadgeX,        bg: 'bg-red-50',     iconColor: 'text-red-700',     border: 'border-red-100' },
            { label: 'Pending',        value: String(pending),   sub: 'Awaiting delivery',      icon: Clock,         bg: 'bg-amber-50',   iconColor: 'text-amber-700',   border: 'border-amber-100' },
          ].map(({ label, value, sub, icon: Icon, bg, iconColor, border }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-lg p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500">{label}</p>
                  <p className="text-3xl font-black text-gray-900 mt-1 tracking-tight">{value}</p>
                  <p className="text-xs text-gray-400 mt-1">{sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Activity chart + type breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Hourly volume chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Hourly SMS Volume</h3>
                <p className="text-xs text-gray-500">Sent vs delivered vs failed throughout the day</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-600" />Sent</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" />Delivered</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" />Failed</span>
              </div>
            </div>
            <div className="p-5 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyChart} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                  <XAxis dataKey="hour" tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="sent"      stroke="#2563EB" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="delivered" stroke="#22C55E" strokeWidth={2}   dot={false} />
                  <Line type="monotone" dataKey="failed"    stroke="#EF4444" strokeWidth={2}   dot={false} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Message type breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">By Message Type</h3>
              <p className="text-xs text-gray-500">Distribution of SMS categories</p>
            </div>
            <div className="p-4 space-y-2.5">
              {SMS_TYPES.map(type => {
                const count = logs.filter(l => l.type === type).length
                const pct = total ? Math.round((count / total) * 100) : 0
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-700 truncate pr-2">{type}</span>
                      <span className="text-xs text-gray-500 flex-shrink-0">{count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Logs Table ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">

          {/* Table header + filters */}
          <div className="p-5 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-900">Message Log</h3>
                <p className="text-xs text-gray-500">
                  {filtered.length} message{filtered.length !== 1 ? 's' : ''} · showing page {page} of {totalPages}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={query}
                    onChange={e => handleFilterChange(setQuery, e.target.value)}
                    placeholder="Patient, phone, message..."
                    className="pl-9 pr-3 h-9 w-52 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                {/* Status filter */}
                <div className="relative">
                  <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={statusFilter}
                    onChange={e => handleFilterChange(setStatus, e.target.value as SmsStatus | 'All')}
                    className="pl-9 pr-3 h-9 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    <option value="All">All Status</option>
                    <option value="delivered">Delivered</option>
                    <option value="sent">Sent</option>
                    <option value="failed">Failed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                {/* Type filter */}
                <select
                  value={typeFilter}
                  onChange={e => handleFilterChange(setType, e.target.value as SmsType | 'All')}
                  className="px-3 h-9 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  <option value="All">All Types</option>
                  {SMS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Active filters display */}
            {(statusFilter !== 'All' || typeFilter !== 'All' || query) && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-xs text-gray-400">Filters:</span>
                {query && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                    &ldquo;{query}&rdquo;
                    <button onClick={() => handleFilterChange(setQuery, '')} className="text-gray-400 hover:text-gray-700 ml-0.5">×</button>
                  </span>
                )}
                {statusFilter !== 'All' && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusMeta[statusFilter].cls}`}>
                    {statusMeta[statusFilter].label}
                    <button onClick={() => handleFilterChange(setStatus, 'All')} className="ml-0.5 opacity-70 hover:opacity-100">×</button>
                  </span>
                )}
                {typeFilter !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                    {typeFilter}
                    <button onClick={() => handleFilterChange(setType, 'All')} className="ml-0.5 opacity-70 hover:opacity-100">×</button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Time', 'Patient', 'Type', 'Message Preview', 'Status', 'Delivery', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center">
                      <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No messages match your filters</p>
                      <button
                        onClick={() => { handleFilterChange(setQuery, ''); handleFilterChange(setStatus, 'All'); handleFilterChange(setType, 'All') }}
                        className="mt-2 text-sm text-blue-700 font-semibold hover:underline"
                      >
                        Clear all filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  currentRows.map(log => {
                    const meta    = statusMeta[log.status]
                    const Icon    = meta.icon
                    const isOpen  = expandedId === log.id

                    return (
                      <React.Fragment key={log.id}>
                        <tr className={`border-b border-gray-100 transition-colors ${isOpen ? 'bg-blue-50/40' : 'hover:bg-gray-50'}`}>

                          {/* Time */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-gray-700 text-xs font-semibold">
                              <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              {log.sentAt}
                            </div>
                          </td>

                          {/* Patient */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-blue-700" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 whitespace-nowrap">{log.patientName}</p>
                                <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                                  <Phone className="w-3 h-3" />
                                  {log.phone}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${typeCls[log.type]}`}>
                              {log.type}
                            </span>
                          </td>

                          {/* Message preview */}
                          <td className="px-5 py-4 max-w-[260px]">
                            <p className="text-gray-700 text-xs line-clamp-2 leading-relaxed">{log.message}</p>
                            {log.queueNumber && (
                              <span className="mt-1 inline-flex items-center text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5">
                                {log.queueNumber}
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${meta.cls}`}>
                              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                              {meta.label}
                            </span>
                          </td>

                          {/* Delivery info */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            {log.status === 'delivered' && log.deliveredAt ? (
                              <div className="flex items-center gap-1.5 text-xs text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {log.deliveredAt}
                              </div>
                            ) : log.status === 'failed' ? (
                              <div className="flex items-center gap-1.5 text-xs text-red-600">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {log.failureReason}
                              </div>
                            ) : log.status === 'pending' ? (
                              <span className="text-xs text-amber-600 font-medium">Queued</span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setExpanded(isOpen ? null : log.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-700 hover:bg-blue-50 transition-all"
                                title="View full message"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {log.status === 'failed' && (
                                <button
                                  onClick={async () => {
                                    await fetch('/api/sms-logs', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ smsLogId: log.id }),
                                    })
                                    loadLogs()
                                  }}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-amber-700 hover:bg-amber-50 transition-all"
                                  title="Retry sending"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded detail row */}
                        {isOpen && (
                          <tr className="border-b border-gray-100 bg-blue-50/30">
                            <td colSpan={7} className="px-5 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2 bg-white rounded-xl border border-blue-100 p-4">
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Full Message</p>
                                  <p className="text-sm text-gray-800 leading-relaxed">{log.message}</p>
                                </div>
                                <div className="bg-white rounded-xl border border-blue-100 p-4 space-y-2">
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Details</p>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Department</span>
                                    <span className="font-semibold text-gray-900">{log.department}</span>
                                  </div>
                                  {log.queueNumber && (
                                    <div className="flex justify-between text-xs">
                                      <span className="text-gray-500">Queue #</span>
                                      <span className="font-bold text-blue-700">{log.queueNumber}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Sent at</span>
                                    <span className="font-semibold text-gray-900">{log.sentAt}</span>
                                  </div>
                                  {log.deliveredAt && (
                                    <div className="flex justify-between text-xs">
                                      <span className="text-gray-500">Delivered at</span>
                                      <span className="font-semibold text-emerald-700">{log.deliveredAt}</span>
                                    </div>
                                  )}
                                  {log.failureReason && (
                                    <div className="flex justify-between text-xs">
                                      <span className="text-gray-500">Failure reason</span>
                                      <span className="font-semibold text-red-600">{log.failureReason}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Message ID</span>
                                    <span className="font-mono text-gray-400 text-[10px]">{log.id}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              Showing{' '}
              <span className="font-semibold text-gray-700">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}</span>
              {' '}of{' '}
              <span className="font-semibold text-gray-700">{filtered.length}</span> messages
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="h-9 w-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-9 min-w-[36px] px-2 rounded-xl border text-sm font-semibold transition-all ${
                    p === page
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="h-9 w-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Failed messages callout */}
        {failed > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 border border-red-200 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-red-800">
                  {failed} message{failed > 1 ? 's' : ''} failed to deliver
                </p>
                <p className="text-sm text-red-600 mt-0.5">
                  Review the failed messages above and use the retry button to resend them. Common causes: invalid phone numbers, network timeouts, carrier rejection.
                </p>
              </div>
              <button
                onClick={() => { handleFilterChange(setStatus, 'failed'); handleFilterChange(setType, 'All') }}
                className="flex-shrink-0 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-all"
              >
                View Failed
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
