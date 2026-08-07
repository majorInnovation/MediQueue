'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, MapPin, Phone, Settings, User, ChevronRight,
  ChevronLeft, CheckCircle, AlertCircle, Clock,
} from 'lucide-react'

const FACILITY_TYPES = [
  'Health Post', 'Health Centre', 'General Hospital',
  'District Hospital', 'Provincial Hospital', 'Central Hospital',
  'Private Clinic', 'Specialist Clinic',
]

const OWNERSHIPS = ['Government (MoH)', 'Mission / Faith-Based', 'NGO', 'Private']

const PROVINCES = [
  'Central', 'Copperbelt', 'Eastern', 'Luapula',
  'Lusaka', 'Muchinga', 'North-Western', 'Northern', 'Southern', 'Western',
]

type Step = 1 | 2 | 3 | 4

const STEPS = [
  { number: 1, label: 'Clinic Identity',  icon: Building2 },
  { number: 2, label: 'Location & Contact', icon: MapPin },
  { number: 3, label: 'Operations',       icon: Settings },
  { number: 4, label: 'Admin Profile',    icon: User },
]

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
const selectCls = inputCls + ' appearance-none'

export default function ClinicSetupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ── Form state ──────────────────────────────────────────────────
  const [f, setF] = useState({
    // Step 1 — Clinic Identity
    clinicName: '',
    clinicCode: '',
    facilityType: '',
    ownership: '',
    mohRegistrationNumber: '',
    licenseNumber: '',
    tpin: '',
    // Step 2 — Location & Contact
    province: '',
    district: '',
    town: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    // Step 3 — Operations
    openingTime: '08:00',
    closingTime: '17:00',
    queuePrefix: 'Q',
    estimatedServiceTime: '15',
    priorityEnabled: true,
    smsEnabled: false,
    voiceEnabled: false,
    displayEnabled: false,
    // Step 4 — Admin Profile
    adminFullName: '',
    adminPosition: '',
    adminPhone: '',
    adminUsername: '',
  })

  const set = (key: keyof typeof f) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setF(prev => ({ ...prev, [key]: val }))
  }

  const toggle = (key: keyof typeof f) => () =>
    setF(prev => ({ ...prev, [key]: !prev[key as keyof typeof f] }))

  // ── Validation per step ─────────────────────────────────────────
  function validate(): string {
    if (step === 1) {
      if (!f.clinicName.trim()) return 'Clinic name is required'
      if (!f.facilityType) return 'Facility type is required'
      if (!f.ownership) return 'Ownership is required'
    }
    if (step === 2) {
      if (!f.province) return 'Province is required'
      if (!f.district.trim()) return 'District is required'
      if (!f.town.trim()) return 'Town / city is required'
      if (!f.address.trim()) return 'Physical address is required'
      if (!f.phone.trim()) return 'Phone number is required'
      if (!f.email.trim()) return 'Email address is required'
    }
    if (step === 3) {
      if (!f.openingTime) return 'Opening time is required'
      if (!f.closingTime) return 'Closing time is required'
      if (!f.queuePrefix.trim()) return 'Queue prefix is required'
    }
    if (step === 4) {
      if (!f.adminFullName.trim()) return 'Your full name is required'
      if (!f.adminPosition.trim()) return 'Your position / title is required'
    }
    return ''
  }

  function next() {
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setStep(s => (s + 1) as Step)
  }

  function back() {
    setError('')
    setStep(s => (s - 1) as Step)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f),
      })
      if (!res.ok) {
        const { error: msg } = await res.json()
        setError(msg ?? 'Setup failed. Please try again.')
        setLoading(false)
        return
      }
      router.replace('/admin/dashboard')
    } catch {
      setError('Network error. Please check your connection.')
      setLoading(false)
    }
  }

  // ── Logo ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <svg width="28" height="28" viewBox="0 0 34 34" fill="none">
              <rect x="14" y="3" width="6" height="28" rx="2.5" fill="white" />
              <rect x="3" y="14" width="28" height="6" rx="2.5" fill="white" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-blue-900 tracking-tight">Clinic Registration</h1>
          <p className="text-sm text-gray-500 mt-1">Complete your clinic profile to get started</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => {
            const done = step > s.number
            const active = step === s.number
            const Icon = s.icon
            return (
              <React.Fragment key={s.number}>
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    done ? 'bg-green-500' : active ? 'bg-blue-800' : 'bg-gray-200'
                  }`}>
                    {done
                      ? <CheckCircle className="w-5 h-5 text-white" />
                      : <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400'}`} />}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${
                    active ? 'text-blue-800' : done ? 'text-green-600' : 'text-gray-400'
                  }`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded ${step > s.number ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-8">
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-xl flex gap-2 items-start">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* ── STEP 1: Clinic Identity ─────────────────────── */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Clinic Identity</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Clinic Name" required>
                    <input value={f.clinicName} onChange={set('clinicName')} placeholder="City Health Clinic" className={inputCls} />
                  </Field>
                  <Field label="Clinic Code">
                    <input value={f.clinicCode} onChange={set('clinicCode')} placeholder="CHC-001" className={inputCls} />
                  </Field>
                  <Field label="Facility Type" required>
                    <select value={f.facilityType} onChange={set('facilityType')} className={selectCls}>
                      <option value="">Select type…</option>
                      {FACILITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                  <Field label="Ownership" required>
                    <select value={f.ownership} onChange={set('ownership')} className={selectCls}>
                      <option value="">Select ownership…</option>
                      {OWNERSHIPS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </Field>
                  <Field label="MoH Registration No.">
                    <input value={f.mohRegistrationNumber} onChange={set('mohRegistrationNumber')} placeholder="MOH/2024/XXXXX" className={inputCls} />
                  </Field>
                  <Field label="License Number">
                    <input value={f.licenseNumber} onChange={set('licenseNumber')} placeholder="LIC-XXXXX" className={inputCls} />
                  </Field>
                  <Field label="TPIN">
                    <input value={f.tpin} onChange={set('tpin')} placeholder="1234567890" className={inputCls} />
                  </Field>
                </div>
              </div>
            )}

            {/* ── STEP 2: Location & Contact ──────────────────── */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Location &amp; Contact</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Province" required>
                    <select value={f.province} onChange={set('province')} className={selectCls}>
                      <option value="">Select province…</option>
                      {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </Field>
                  <Field label="District" required>
                    <input value={f.district} onChange={set('district')} placeholder="Lusaka District" className={inputCls} />
                  </Field>
                  <Field label="Town / City" required>
                    <input value={f.town} onChange={set('town')} placeholder="Lusaka" className={inputCls} />
                  </Field>
                  <Field label="Phone Number" required>
                    <input type="tel" value={f.phone} onChange={set('phone')} placeholder="+260 XXX XXX XXX" className={inputCls} />
                  </Field>
                </div>
                <Field label="Physical Address" required>
                  <textarea value={f.address} onChange={set('address')} rows={2}
                    placeholder="Plot 12, Addis Ababa Drive, Lusaka"
                    className={inputCls.replace('py-2.5', 'py-2') + ' resize-none'} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Email Address" required>
                    <input type="email" value={f.email} onChange={set('email')} placeholder="info@clinic.zm" className={inputCls} />
                  </Field>
                  <Field label="Website">
                    <input type="url" value={f.website} onChange={set('website')} placeholder="https://clinic.zm" className={inputCls} />
                  </Field>
                </div>
              </div>
            )}

            {/* ── STEP 3: Operations ──────────────────────────── */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Operations &amp; Settings</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Opening Time" required>
                    <div className="relative">
                      <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="time" value={f.openingTime} onChange={set('openingTime')} className={inputCls + ' pl-10'} />
                    </div>
                  </Field>
                  <Field label="Closing Time" required>
                    <div className="relative">
                      <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="time" value={f.closingTime} onChange={set('closingTime')} className={inputCls + ' pl-10'} />
                    </div>
                  </Field>
                  <Field label="Queue Number Prefix" required>
                    <input value={f.queuePrefix} onChange={set('queuePrefix')} maxLength={5}
                      placeholder="Q" className={inputCls} />
                    <p className="text-xs text-gray-400 mt-1">e.g. "Q" → Q-001, "A" → A-001</p>
                  </Field>
                  <Field label="Avg. Service Time (minutes)" required>
                    <input type="number" min="1" max="120" value={f.estimatedServiceTime}
                      onChange={set('estimatedServiceTime')} className={inputCls} />
                  </Field>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700">Features</p>
                  {([
                    { key: 'priorityEnabled', label: 'Priority Queue', desc: 'Classify patients by urgency level' },
                    { key: 'smsEnabled',      label: 'SMS Notifications', desc: 'Send queue updates via SMS' },
                    { key: 'voiceEnabled',    label: 'Voice Announcements', desc: 'Announce patient numbers audibly' },
                    { key: 'displayEnabled',  label: 'Display Board', desc: 'Show queue on external screens' },
                  ] as { key: keyof typeof f; label: string; desc: string }[]).map(({ key, label, desc }) => (
                    <label key={key} className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-gray-50 cursor-pointer hover:border-blue-200 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{label}</p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                      <div
                        onClick={toggle(key)}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          f[key] ? 'bg-blue-700' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          f[key] ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 4: Admin Profile ───────────────────────── */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900 mb-1">Your Admin Profile</h2>
                <p className="text-sm text-gray-500 mb-4">This information will be recorded as the primary clinic administrator.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name" required>
                    <input value={f.adminFullName} onChange={set('adminFullName')} placeholder="Dr. John Banda" className={inputCls} />
                  </Field>
                  <Field label="Position / Title" required>
                    <input value={f.adminPosition} onChange={set('adminPosition')} placeholder="Medical Superintendent" className={inputCls} />
                  </Field>
                  <Field label="Phone Number">
                    <input type="tel" value={f.adminPhone} onChange={set('adminPhone')} placeholder="+260 XXX XXX XXX" className={inputCls} />
                  </Field>
                  <Field label="Username">
                    <input value={f.adminUsername} onChange={set('adminUsername')} placeholder="jbanda" className={inputCls} />
                  </Field>
                </div>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-xs text-blue-700 leading-relaxed">
                    By completing registration you confirm that the information provided is accurate and that you are authorised to register this facility on MediQueue.
                  </p>
                </div>
              </div>
            )}

            {/* ── Navigation ──────────────────────────────────── */}
            <div className="flex justify-between mt-8 pt-5 border-t border-gray-100">
              {step > 1
                ? <button type="button" onClick={back}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                : <span />}

              {step < 4
                ? <button type="button" onClick={next}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-sm font-semibold transition-all shadow-sm">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                : <button type="submit" disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-800 hover:bg-blue-900 disabled:bg-gray-300 text-white text-sm font-semibold transition-all shadow-sm disabled:cursor-not-allowed">
                    {isLoading
                      ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
                      : <><CheckCircle className="w-4 h-4" />Complete Registration</>}
                  </button>}
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          MediQueue — Clinic Management System
        </p>
      </div>
    </div>
  )
}
