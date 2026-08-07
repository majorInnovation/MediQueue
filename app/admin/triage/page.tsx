'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw, LogOut, Activity, Clock, CheckCircle2,
  AlertTriangle, User, ChevronRight, Stethoscope, ClipboardList, Loader2,
} from 'lucide-react'

type TriageCategory = 'critical' | 'urgent' | 'standard' | 'minor'

type PendingRow = {
  id: string
  queue_number: string
  priority: string
  department: string
  symptoms: string[] | null
  created_at: string
  patients: { id: string; name: string; phone: string; date_of_birth: string | null } | null
}

type RecentRow = {
  id: string
  priority: string
  notes: string | null
  assessed_at: string
  patients: { name: string } | null
  staff_members: { name: string } | null
  queue_records: { queue_number: string; department: string; symptoms: string[] | null } | null
}

const priorityMeta: Record<TriageCategory, { label: string; cls: string; bg: string }> = {
  critical: { label: 'Critical', cls: 'bg-red-50 text-red-700 border-red-200', bg: 'bg-red-500' },
  urgent:   { label: 'Urgent',   cls: 'bg-orange-50 text-orange-700 border-orange-200', bg: 'bg-orange-500' },
  standard: { label: 'Standard', cls: 'bg-amber-50 text-amber-800 border-amber-200', bg: 'bg-amber-400' },
  minor:    { label: 'Minor',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', bg: 'bg-emerald-500' },
}

function calcAge(dob: string | null) {
  if (!dob) return null
  return Math.floor((Date.now() - new Date(dob).getTime()) / 3.156e10)
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export default function TriagePage() {
  const [pending, setPending]             = useState<PendingRow[]>([])
  const [recent, setRecent]               = useState<RecentRow[]>([])
  const [loading, setLoading]             = useState(true)
  const [selectedRow, setSelected]        = useState<PendingRow | null>(null)
  const [selectedPriority, setPriority]   = useState<TriageCategory | ''>('')
  const [notes, setNotes]                 = useState('')
  const [bp, setBP]                       = useState('')
  const [temp, setTemp]                   = useState('')
  const [spo2, setSpo2]                   = useState('')
  const [submitting, setSubmitting]       = useState(false)
  const [assessed, setAssessed]           = useState<Set<string>>(new Set())

  const pendingCount   = pending.filter(p => !assessed.has(p.id)).length
  const completedToday = recent.length + assessed.size

  const load = useCallback(async () => {
    const res = await fetch('/api/triage')
    if (!res.ok) { setLoading(false); return }
    const { pending: p, recent: r } = await res.json()
    setPending(p ?? [])
    setRecent(r ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSubmit() {
    if (!selectedRow || !selectedPriority) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueRecordId:    selectedRow.id,
          priority:         selectedPriority,
          bloodPressure:    bp || undefined,
          temperature:      temp ? parseFloat(temp) : undefined,
          oxygenSaturation: spo2 ? parseFloat(spo2) : undefined,
          notes:            notes || undefined,
        }),
      })
      if (res.ok) {
        setAssessed(prev => new Set([...prev, selectedRow.id]))
        setSelected(null); setPriority(''); setNotes(''); setBP(''); setTemp(''); setSpo2('')
        load()
      }
    } finally {
      setSubmitting(false)
    }
  }

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
              <h1 className="text-base font-bold text-gray-900 hidden sm:block">Triage Center</h1>
              <p className="text-xs text-gray-500 hidden md:block">Assess and prioritize incoming patients</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all">
              <RefreshCw className="w-4 h-4" /><span className="hidden sm:inline">Refresh</span>
            </button>
            <button type="button" onClick={() => { window.location.href = '/api/auth/logout' }} className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
              <LogOut className="w-4 h-4" /><span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 px-4 sm:px-6 lg:px-8 pt-6 pb-20 md:pb-24 lg:pb-28">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm">Admin · Triage</p>
            <h2 className="text-white font-bold text-2xl md:text-3xl mt-0.5">Triage Center</h2>
            <p className="text-blue-300 text-sm mt-1">Assess patients and assign clinical priorities</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 text-center border border-white/20">
              <p className="text-blue-200 text-xs font-medium">Pending</p>
              <p className="text-white font-black text-xl">{loading ? '—' : pendingCount}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 text-center border border-white/20">
              <p className="text-blue-200 text-xs font-medium">Done Today</p>
              <p className="text-white font-black text-xl">{loading ? '—' : completedToday}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-14 md:-mt-16 lg:-mt-20 pb-6 space-y-4 md:space-y-6">

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Pending Assessment', value: loading ? '—' : String(pendingCount),   icon: ClipboardList, bg: 'bg-amber-50',   iconColor: 'text-amber-700',   border: 'border-amber-100'   },
            { label: 'Critical Today',     value: loading ? '—' : String(recent.filter(r => r.priority === 'critical').length), icon: AlertTriangle, bg: 'bg-red-50', iconColor: 'text-red-700', border: 'border-red-100' },
            { label: 'Urgent Today',       value: loading ? '—' : String(recent.filter(r => r.priority === 'urgent').length),   icon: Activity,     bg: 'bg-orange-50', iconColor: 'text-orange-700', border: 'border-orange-100' },
            { label: 'Completed Today',    value: loading ? '—' : String(completedToday), icon: CheckCircle2,  bg: 'bg-emerald-50', iconColor: 'text-emerald-700', border: 'border-emerald-100' },
          ].map(({ label, value, icon: Icon, bg, iconColor, border }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-lg p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500">{label}</p>
                  <p className="text-3xl font-black text-gray-900 mt-1 tracking-tight">{value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main two-column: Pending list + Assessment form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Pending patients */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Awaiting Triage</h3>
              <p className="text-xs text-gray-500">Tap a patient to begin assessment</p>
            </div>
            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
              ) : pending.length === 0 ? (
                <div className="py-10 text-center text-gray-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                  <p className="text-sm">No patients awaiting triage</p>
                </div>
              ) : pending.map(p => {
                const done = assessed.has(p.id)
                const age  = calcAge(p.patients?.date_of_birth ?? null)
                const symptoms = Array.isArray(p.symptoms) ? p.symptoms.join(', ') : String(p.symptoms ?? '—')
                return (
                  <button
                    key={p.id}
                    onClick={() => { if (!done) setSelected(p) }}
                    disabled={done}
                    className={`w-full text-left flex items-start gap-4 px-5 py-4 transition-colors ${done ? 'opacity-50 cursor-default' : 'hover:bg-blue-50 cursor-pointer'} ${selectedRow?.id === p.id ? 'bg-blue-50' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-blue-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{p.patients?.name ?? '—'}</span>
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-0.5">{p.queue_number}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{age != null ? `Age ${age} · ` : ''}{fmtTime(p.created_at)}</p>
                      <p className="text-xs text-gray-700 mt-1 line-clamp-1">{symptoms}</p>
                    </div>
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-1" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Assessment form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Triage Assessment</h3>
                <p className="text-xs text-gray-500">{selectedRow ? `Assessing ${selectedRow.patients?.name ?? selectedRow.queue_number}` : 'Select a patient to begin'}</p>
              </div>
            </div>

            {selectedRow ? (
              <div className="p-5 space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-gray-900">{selectedRow.patients?.name ?? '—'}</p>
                    <span className="text-xs font-bold text-blue-700">{selectedRow.queue_number}</span>
                  </div>
                  <p className="text-xs text-gray-600">{selectedRow.department} · {fmtTime(selectedRow.created_at)}</p>
                  <p className="text-sm text-gray-800 mt-2">
                    <span className="font-semibold">Chief Complaint:</span>{' '}
                    {Array.isArray(selectedRow.symptoms) ? selectedRow.symptoms.join(', ') : String(selectedRow.symptoms ?? '—')}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Vitals (optional)</p>
                  <div className="grid grid-cols-3 gap-3">
                    <input value={bp} onChange={e => setBP(e.target.value)} placeholder="BP (mmHg)"
                      className="h-9 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40" />
                    <input value={temp} onChange={e => setTemp(e.target.value)} placeholder="Temp (°C)"
                      className="h-9 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40" />
                    <input value={spo2} onChange={e => setSpo2(e.target.value)} placeholder="SpO2 (%)"
                      className="h-9 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40" />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Assign Priority</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(['critical', 'urgent', 'standard', 'minor'] as TriageCategory[]).map(cat => {
                      const meta   = priorityMeta[cat]
                      const active = selectedPriority === cat
                      return (
                        <button key={cat} onClick={() => setPriority(cat)}
                          className={`flex items-center gap-3 p-3 rounded-xl border font-semibold text-sm transition-all ${active ? meta.cls + ' ring-2 ring-offset-1 ring-blue-500' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${active ? meta.bg : 'bg-gray-300'}`} />
                          {meta.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Clinical Notes</p>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Add clinical observations..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" />
                </div>

                <button onClick={handleSubmit} disabled={!selectedPriority || submitting}
                  className="w-full h-11 bg-blue-700 text-white rounded-xl font-bold text-sm hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : 'Submit Triage Assessment'}
                </button>
              </div>
            ) : (
              <div className="p-10 text-center text-gray-400">
                <Stethoscope className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                <p className="text-sm font-medium">Select a patient from the list to begin assessment</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Triage Records */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Recent Triage Records</h3>
            <p className="text-xs text-gray-500">Completed assessments from today</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Time', 'Patient', 'Chief Complaint', 'Priority', 'Assessed By'].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">No assessments yet today.</td></tr>
                ) : recent.map(r => {
                  const meta = priorityMeta[r.priority as TriageCategory] ?? priorityMeta.standard
                  const symptoms = Array.isArray(r.queue_records?.symptoms) ? r.queue_records!.symptoms.join(', ') : (r.queue_records?.symptoms ?? '—')
                  return (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Clock className="w-4 h-4" /> {fmtTime(r.assessed_at)}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-900">{r.patients?.name ?? '—'}</td>
                      <td className="px-5 py-4 text-gray-700">{String(symptoms)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${meta.cls}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-600 text-xs">{r.staff_members?.name ?? 'Staff'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
