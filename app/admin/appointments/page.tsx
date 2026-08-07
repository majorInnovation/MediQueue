'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  RefreshCw, LogOut, Calendar, Clock, CheckCircle2,
  XCircle, Search, Filter, Plus,
  User, Stethoscope, Loader2, Phone, FileText, Ban, UserX, X,
} from 'lucide-react'
import type { AppointmentStatus, AppointmentType } from '@/lib/types'

type Appointment = {
  id: string
  appointmentNumber: string | null
  patientName: string
  patientPhone: string
  age: number | null
  doctor: string
  department: string
  date: string
  time: string
  type: AppointmentType
  status: AppointmentStatus
  notes?: string
}

const statusMeta: Record<AppointmentStatus, { label: string; cls: string }> = {
  completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  confirmed: { label: 'Confirmed', cls: 'bg-blue-50 text-blue-700 border-blue-100' },
  scheduled: { label: 'Scheduled', cls: 'bg-gray-50 text-gray-700 border-gray-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-50 text-red-700 border-red-200' },
  'no-show': { label: 'No Show', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
}

const typeMeta: Record<AppointmentType, string> = {
  general: 'General',
  'follow-up': 'Follow-up',
  emergency: 'Emergency',
  consultation: 'Consultation',
}

const STATUSES = ['All', 'scheduled', 'confirmed', 'completed', 'cancelled', 'no-show']

const STATUS_ACTIONS: { status: AppointmentStatus; label: string; icon: typeof CheckCircle2; cls: string }[] = [
  { status: 'confirmed', label: 'Confirm',   icon: CheckCircle2, cls: 'bg-blue-700 hover:bg-blue-800' },
  { status: 'completed', label: 'Completed', icon: CheckCircle2, cls: 'bg-emerald-600 hover:bg-emerald-700' },
  { status: 'cancelled', label: 'Cancelled', icon: Ban,          cls: 'bg-red-600 hover:bg-red-700' },
  { status: 'no-show',   label: 'No Show',   icon: UserX,        cls: 'bg-amber-600 hover:bg-amber-700' },
]

function fmtTime(time: string) {
  if (!time) return '—'
  try { return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) } catch { return time }
}

function fmtDate(date: string) {
  if (!date) return '—'
  try { return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) } catch { return date }
}

function calcAge(dob: string | null) {
  if (!dob) return null
  return Math.floor((Date.now() - new Date(dob).getTime()) / 3.156e10)
}

type PatientOption = { id: string; name: string; phone: string }
type DoctorOption = { id: string; name: string }

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading]           = useState(true)
  const [query, setQuery]               = useState('')
  const [doctorFilter, setDoctorFilter] = useState('All Doctors')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showForm, setShowForm]         = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [bookError, setBookError]       = useState('')
  const [bookSuccess, setBookSuccess]   = useState('')
  const [doctorOptions, setDoctorOptions] = useState<DoctorOption[]>([])

  const [patientQuery, setPatientQuery] = useState('')
  const [patientResults, setPatientResults] = useState<PatientOption[]>([])
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null)

  const [form, setForm] = useState({ doctorId: '', date: '', time: '', type: 'general', notes: '' })

  const [viewing, setViewing]           = useState<Appointment | null>(null)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [statusError, setStatusError]   = useState('')

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  const load = useCallback(async () => {
    const res = await fetch('/api/appointments')
    if (!res.ok) { setLoading(false); return }
    const { appointments: raw } = await res.json()
    const mapped: Appointment[] = (raw ?? []).map((a: any) => ({
      id:          a.id,
      appointmentNumber: a.appointment_number ?? null,
      patientName: a.patients?.name ?? '—',
      patientPhone: a.patients?.phone ?? '',
      age:         calcAge(a.patients?.date_of_birth ?? null),
      doctor:      a.staff_members?.name ?? '—',
      department:  a.staff_members?.department ?? '—',
      date:        a.appointment_date ?? '',
      time:        fmtTime(a.appointment_time),
      type:        (a.type ?? 'general') as AppointmentType,
      status:      (a.status ?? 'scheduled') as AppointmentStatus,
      notes:       a.notes,
    }))
    setAppointments(mapped)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const doctors = (data?.staff ?? []).filter((s: any) => s.role === 'doctor' && s.status !== 'inactive')
        setDoctorOptions(doctors.map((d: any) => ({ id: d.id, name: d.name })))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const q = patientQuery.trim()
    if (q.length < 2) { setPatientResults([]); return }
    const handle = setTimeout(() => {
      fetch(`/api/patients?search=${encodeURIComponent(q)}`)
        .then(r => r.ok ? r.json() : { patients: [] })
        .then(d => setPatientResults(d.patients ?? []))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(handle)
  }, [patientQuery])

  const doctorNames = ['All Doctors', ...Array.from(new Set(appointments.map(a => a.doctor).filter(d => d !== '—'))).sort()]

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return appointments.filter(a => {
      const matchQ      = !q || a.patientName.toLowerCase().includes(q) || a.doctor.toLowerCase().includes(q)
      const matchDoc    = doctorFilter === 'All Doctors' || a.doctor === doctorFilter
      const matchStatus = statusFilter === 'All' || a.status === statusFilter
      return matchQ && matchDoc && matchStatus
    })
  }, [query, doctorFilter, statusFilter, appointments])

  const total     = appointments.length
  const confirmed = appointments.filter(a => a.status === 'confirmed').length
  const completed = appointments.filter(a => a.status === 'completed').length
  const pending   = appointments.filter(a => a.status === 'scheduled').length

  function resetForm() {
    setForm({ doctorId: '', date: '', time: '', type: 'general', notes: '' })
    setSelectedPatient(null)
    setPatientQuery('')
    setPatientResults([])
    setBookError('')
  }

  async function bookAppointment() {
    if (!selectedPatient || !form.doctorId || !form.date || !form.time) return
    setSubmitting(true)
    setBookError('')
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          doctorId:  form.doctorId,
          date:      form.date,
          time:      form.time,
          type:      form.type,
          reason:    form.notes,
        }),
      })
      if (res.ok) {
        const bookedDate = form.date
        setShowForm(false)
        resetForm()
        load()
        const todayStr = new Date().toISOString().split('T')[0]
        setBookSuccess(
          bookedDate === todayStr
            ? 'Appointment booked.'
            : `Appointment booked for ${bookedDate} — it won't appear in today's list below until that date.`
        )
        setTimeout(() => setBookSuccess(''), 6000)
      }
      else {
        const { error } = await res.json().catch(() => ({ error: null }))
        setBookError(error ?? `Failed to book appointment (${res.status}).`)
      }
    } catch {
      setBookError('Could not reach the server. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function updateStatus(appointmentId: string, status: AppointmentStatus) {
    setStatusUpdating(true)
    setStatusError('')
    try {
      const res = await fetch('/api/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, status }),
      })
      if (res.ok) {
        setViewing(v => (v && v.id === appointmentId ? { ...v, status } : v))
        load()
      } else {
        const { error } = await res.json().catch(() => ({ error: null }))
        setStatusError(error ?? `Failed to update status (${res.status}).`)
      }
    } catch {
      setStatusError('Could not reach the server. Check your connection and try again.')
    } finally {
      setStatusUpdating(false)
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
              <h1 className="text-base font-bold text-gray-900 hidden sm:block">Appointments</h1>
              <p className="text-xs text-gray-500 hidden md:block">{today}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Book Appointment</span>
            </button>
            <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all">
              <RefreshCw className="w-4 h-4" />
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
            <p className="text-blue-200 text-sm">Admin · Appointments</p>
            <h2 className="text-white font-bold text-2xl md:text-3xl mt-0.5">Appointments</h2>
            <p className="text-blue-300 text-sm mt-1">Manage and track all patient appointments</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 text-center border border-white/20">
              <p className="text-blue-200 text-xs font-medium">Total Today</p>
              <p className="text-white font-black text-xl">{total}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 text-center border border-white/20">
              <p className="text-blue-200 text-xs font-medium">Confirmed</p>
              <p className="text-white font-black text-xl">{confirmed}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 text-center border border-white/20">
              <p className="text-blue-200 text-xs font-medium">Completed</p>
              <p className="text-white font-black text-xl">{completed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-14 md:-mt-16 lg:-mt-20 pb-6 space-y-4 md:space-y-6">

        {bookSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />{bookSuccess}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Today', value: String(total), icon: Calendar, bg: 'bg-blue-50', iconColor: 'text-blue-700', border: 'border-blue-100' },
            { label: 'Confirmed', value: String(confirmed), icon: CheckCircle2, bg: 'bg-emerald-50', iconColor: 'text-emerald-700', border: 'border-emerald-100' },
            { label: 'Pending', value: String(pending), icon: Clock, bg: 'bg-amber-50', iconColor: 'text-amber-700', border: 'border-amber-100' },
            { label: 'Cancelled / No-show', value: String(appointments.filter(a => a.status === 'cancelled' || a.status === 'no-show').length), icon: XCircle, bg: 'bg-red-50', iconColor: 'text-red-700', border: 'border-red-100' },
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

        {/* Book appointment form (collapsible) */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Book New Appointment</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            {bookError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{bookError}</div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="relative">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Patient</label>
                {selectedPatient ? (
                  <div className="w-full h-10 px-3 rounded-xl border border-blue-200 bg-blue-50 flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900 truncate">{selectedPatient.name} · {selectedPatient.phone}</span>
                    <button onClick={() => { setSelectedPatient(null); setPatientQuery('') }} className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <input value={patientQuery} onChange={e => setPatientQuery(e.target.value)} placeholder="Search by name or phone…"
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40" />
                    {patientResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {patientResults.map(p => (
                          <button key={p.id} onClick={() => { setSelectedPatient(p); setPatientResults([]) }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0">
                            <span className="font-semibold text-gray-900">{p.name}</span>
                            <span className="text-gray-400 ml-2">{p.phone}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {patientQuery.trim().length >= 2 && patientResults.length === 0 && (
                      <p className="text-xs text-gray-400 mt-1">No matching patient found. Patients must be registered before booking.</p>
                    )}
                  </>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Doctor</label>
                <select value={form.doctorId} onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40">
                  <option value="">Select doctor…</option>
                  {doctorOptions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Time</label>
                <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40">
                  {(['general', 'follow-up', 'consultation', 'emergency'] as AppointmentType[]).map(t => (
                    <option key={t} value={t}>{typeMeta[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Notes</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
            </div>
            {(() => {
              const missing = [
                !selectedPatient && 'select a patient from the search results',
                doctorOptions.length === 0 ? 'add a doctor in Settings first' : !form.doctorId && 'choose a doctor',
                !form.date && 'pick a date',
                !form.time && 'pick a time',
              ].filter(Boolean) as string[]
              return (
                <div className="mt-4">
                  <div className="flex gap-3">
                    <button onClick={bookAppointment} disabled={submitting || missing.length > 0}
                      className="h-10 px-6 bg-blue-700 text-white rounded-xl font-semibold text-sm hover:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}Book Appointment
                    </button>
                    <button onClick={() => { setShowForm(false); resetForm() }} className="h-10 px-6 border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all">Cancel</button>
                  </div>
                  {!submitting && missing.length > 0 && (
                    <p className="text-xs text-amber-600 mt-2">Before booking: {missing.join(', ')}.</p>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {/* Appointments table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-900">Today&apos;s Appointments</h3>
                <p className="text-xs text-gray-500">{filtered.length} appointments · {today}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search patient or doctor..."
                    className="pl-9 pr-3 h-9 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div className="relative">
                  <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={doctorFilter}
                    onChange={e => setDoctorFilter(e.target.value)}
                    className="pl-9 pr-3 h-9 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    {doctorNames.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3 h-9 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Status' : statusMeta[s as AppointmentStatus]?.label ?? s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['#', 'Time', 'Patient', 'Doctor', 'Department', 'Type', 'Status', 'Notes'].map(h => (
                    <th key={h} className="text-left px-5 py-3 font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-400 text-sm">Loading appointments…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-400 text-sm">No appointments found.</td></tr>
                ) : null}
                {!loading && filtered.map(a => (
                  <tr key={a.id} onClick={() => { setStatusError(''); setViewing(a) }}
                    className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors cursor-pointer">
                    <td className="px-5 py-4 text-gray-500 text-xs font-mono">{a.appointmentNumber ?? '—'}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-gray-900">{a.time}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-blue-700" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{a.patientName}</p>
                          {a.age != null && <p className="text-xs text-gray-500">Age {a.age}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-700">{a.doctor}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-xs">{a.department}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2.5 py-1 text-xs font-semibold">
                        {typeMeta[a.type]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${statusMeta[a.status].cls}`}>
                        {statusMeta[a.status].label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{a.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              Showing <span className="font-semibold text-gray-700">{filtered.length}</span> of{' '}
              <span className="font-semibold text-gray-700">{appointments.length}</span> appointments
            </p>
          </div>
        </div>

        {/* Doctor schedule summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-5">
          <h3 className="font-bold text-gray-900 mb-4">Doctor Schedule Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {doctorNames.filter(d => d !== 'All Doctors').slice(0, 8).map(doc => {
              const docAppts  = appointments.filter(a => a.doctor === doc)
              const doneCount = docAppts.filter(a => a.status === 'completed').length
              return (
                <div key={doc} className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center">
                      <Stethoscope className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-sm font-bold text-gray-900">{doc}</p>
                  </div>
                  <div className="flex justify-between text-xs mt-2">
                    <span className="text-gray-600">Total: <strong className="text-gray-900">{docAppts.length}</strong></span>
                    <span className="text-emerald-700">Done: <strong>{doneCount}</strong></span>
                  </div>
                </div>
              )
            })}
            {doctorNames.filter(d => d !== 'All Doctors').length === 0 && (
              <p className="col-span-4 text-center text-sm text-gray-400 py-4">No doctor data yet.</p>
            )}
          </div>
        </div>

      </div>

      {/* Appointment detail modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setViewing(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-mono text-gray-400">{viewing.appointmentNumber ?? '—'}</p>
                <h3 className="font-bold text-gray-900 text-lg">{viewing.patientName}</h3>
              </div>
              <button onClick={() => setViewing(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${statusMeta[viewing.status].cls}`}>
                {statusMeta[viewing.status].label}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2.5 text-gray-700">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{fmtDate(viewing.date)}</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-700">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{viewing.time}</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-700">
                <Stethoscope className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>Dr. {viewing.doctor} · {viewing.department}</span>
              </div>
              {viewing.patientPhone && (
                <div className="flex items-center gap-2.5 text-gray-700">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{viewing.patientPhone}</span>
                </div>
              )}
              {viewing.age != null && (
                <div className="flex items-center gap-2.5 text-gray-700">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>Age {viewing.age}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-gray-700">
                <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2.5 py-1 text-xs font-semibold">
                  {typeMeta[viewing.type]}
                </span>
              </div>
              {viewing.notes && (
                <div className="flex items-start gap-2.5 text-gray-700">
                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>{viewing.notes}</span>
                </div>
              )}
            </div>

            {statusError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{statusError}</div>
            )}

            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Update Status</p>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_ACTIONS.map(({ status, label, icon: Icon, cls }) => {
                  const isCurrent = viewing.status === status
                  return (
                    <button
                      key={status}
                      onClick={() => updateStatus(viewing.id, status)}
                      disabled={statusUpdating || isCurrent}
                      className={`h-10 px-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 ${cls}`}
                    >
                      {statusUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                      {isCurrent ? 'Current' : label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
