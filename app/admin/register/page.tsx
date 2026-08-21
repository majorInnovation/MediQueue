'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  LogOut, User, MapPin, Building2, Siren, Stethoscope,
  CheckCircle2, AlertCircle, Loader2, Clock, Hash, Gauge,
  Search, UserRoundPlus, UserCheck2,
} from 'lucide-react'
import { formatNrcInput, validateNrc } from '@/lib/patient-number'

type Gender = 'male' | 'female' | 'other'
type PregnancyStatus = 'pregnant' | 'not-pregnant' | 'unknown' | 'n/a'
type Priority = 'critical' | 'high' | 'medium' | 'low'

type Vitals = {
  bloodPressure: string
  temperature: string
  heartRate: string
  oxygenSaturation: string
}

type FormState = {
  firstName: string
  lastName: string
  phone: string
  age: string
  gender: Gender
  address: string
  nationalId: string
  emergencyContactName: string
  emergencyContactPhone: string
  department: string
  visitType: string
  reason: string
  chiefComplaint: string
  symptomDuration: string
  additionalNotes: string
  assignedStaff: string
  isEmergency: boolean
  symptoms: string[]
  otherSymptom: string
  painLevel: number
  pregnancyStatus: PregnancyStatus
  hasDisability: boolean
  disabilityNotes: string
  vitals: Vitals
  sendSms: boolean
}

type PatientSearchResult = {
  id: string
  patient_number: string | null
  first_name: string | null
  last_name: string | null
  name: string | null
  phone_number: string | null
  phone: string | null
  gender: string | null
  age: number | null
}

const initialForm: FormState = {
  firstName: '', lastName: '', phone: '', age: '', gender: 'male', address: '',
  nationalId: '', emergencyContactName: '', emergencyContactPhone: '', department: '',
  visitType: 'walk-in', reason: '', chiefComplaint: '', symptomDuration: '', additionalNotes: '',
  isEmergency: false, symptoms: [], otherSymptom: '', painLevel: 0,
  pregnancyStatus: 'n/a', hasDisability: false, disabilityNotes: '',
  vitals: { bloodPressure: '', temperature: '', heartRate: '', oxygenSaturation: '' },
  assignedStaff: '',
  sendSms: true,
}

const commonSymptoms = [
  'Fever', 'Cough', 'Headache', 'Sore throat', 'Chest pain',
  'Shortness of breath', 'Nausea', 'Body aches', 'Dizziness', 'Vomiting',
]

const visitTypes = [
  { value: 'walk-in', label: 'Walk-in' },
  { value: 'follow-up', label: 'Follow-up' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'referral', label: 'Referral' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'review', label: 'Review' },
]

const priorityMeta: Record<Priority, { label: string; emoji: string; cls: string }> = {
  critical: { label: 'CRITICAL PRIORITY', emoji: '🔴', cls: 'bg-red-50 text-red-700 border-red-200' },
  high:     { label: 'HIGH PRIORITY',     emoji: '🟠', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  medium:   { label: 'MEDIUM PRIORITY',   emoji: '🟡', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  low:      { label: 'LOW PRIORITY',      emoji: '🟢', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-blue-700" />
        </div>
        <h3 className="font-bold text-gray-900">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40'

export default function RegisterPatientPage() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [departments, setDepartments] = useState<string[]>([])
  const [staffMembers, setStaffMembers] = useState<Array<{ id: string; name: string; role: string; status?: string }>>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ queueNumber: string; priority: Priority; estimatedWait: number; patientNumber?: string | null } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PatientSearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResult | null>(null)

  const [preview, setPreview] = useState<{ riskScore: number; priority: Priority; estimatedWait: number; previewQueueNumber: string } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const names = (data?.departments ?? []).filter((d: any) => d.is_active !== false).map((d: any) => d.name)
        setDepartments(names)
        setForm(prev => prev.department ? prev : { ...prev, department: names[0] ?? '' })
        const activeStaff = (data?.staff ?? [])
          .filter((staff: any) => staff.status !== 'inactive')
          .map((staff: any) => ({ id: staff.id, name: staff.name, role: staff.role, status: staff.status }))
        setStaffMembers(activeStaff)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const patientId = params.get('patientId')

    if (!patientId) return

    fetch(`/api/patients/${patientId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const patient = data?.patient
        if (!patient) return

        setSelectedPatient(patient)
        setSearchQuery(`${patient.patient_number ?? ''} ${patient.first_name ?? ''} ${patient.last_name ?? ''}`.trim())
        setForm(prev => ({
          ...prev,
          firstName: patient.first_name ?? '',
          lastName: patient.last_name ?? '',
          phone: patient.phone_number || patient.phone || prev.phone,
          age: patient.age ? String(patient.age) : prev.age,
          gender: (patient.gender as Gender) || prev.gender,
          address: patient.address ?? prev.address,
          nationalId: patient.national_id ?? prev.nationalId,
          emergencyContactName: patient.emergency_contact_name ?? prev.emergencyContactName,
          emergencyContactPhone: patient.emergency_contact_phone ?? prev.emergencyContactPhone,
        }))
      })
      .catch(() => {})
  }, [])

  const update = (updates: Partial<FormState>) => setForm(prev => ({ ...prev, ...updates }))

  const runPreview = useCallback((f: FormState) => {
    if (!f.department) { setPreview(null); return }
    setPreviewLoading(true)
    fetch('/api/queue/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preview: true,
        department: f.department,
        age: f.age,
        isEmergency: f.isEmergency,
        symptoms: [...f.symptoms, ...(f.otherSymptom.trim() ? [f.otherSymptom.trim()] : [])],
        painLevel: f.painLevel,
        pregnancyStatus: f.pregnancyStatus,
        hasDisability: f.hasDisability,
        vitals: {
          temperature: f.vitals.temperature || undefined,
          heartRate: f.vitals.heartRate || undefined,
          oxygenSaturation: f.vitals.oxygenSaturation || undefined,
        },
      }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setPreview(data) })
      .finally(() => setPreviewLoading(false))
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runPreview(form), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [
    form.department, form.age, form.isEmergency, form.symptoms, form.otherSymptom,
    form.painLevel, form.pregnancyStatus, form.hasDisability, form.vitals, runPreview,
  ])

  useEffect(() => {
    const query = searchQuery.trim()
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await fetch(`/api/patients?search=${encodeURIComponent(query)}`)
        const data = await res.json()
        setSearchResults(data.patients ?? [])
      } finally {
        setSearchLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const toggleSymptom = (s: string) => {
    update({ symptoms: form.symptoms.includes(s) ? form.symptoms.filter(x => x !== s) : [...form.symptoms, s] })
  }

  function applyExistingPatient(patient: PatientSearchResult) {
    setSelectedPatient(patient)
    setSearchQuery(`${patient.patient_number ?? ''} ${patient.first_name ?? ''} ${patient.last_name ?? ''}`.trim())
    setForm(prev => ({
      ...prev,
      firstName: patient.first_name ?? '',
      lastName: patient.last_name ?? '',
      phone: patient.phone_number || patient.phone || prev.phone,
      age: patient.age ? String(patient.age) : prev.age,
      gender: (patient.gender as Gender) || prev.gender,
    }))
  }

  async function handleSubmit() {
    setError('')
    if (!form.firstName.trim()) { setError('First name is required'); return }
    if (!form.lastName.trim()) { setError('Last name is required'); return }
    if (!form.phone.trim()) { setError('Phone number is required'); return }
    if (!form.department) { setError('Please select a department'); return }
    if (form.nationalId && !validateNrc(form.nationalId)) {
      setError('National ID must be in the format 652260/67/1')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/queue/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existingPatientId: selectedPatient?.id ?? undefined,
          firstName: form.firstName, lastName: form.lastName, phone: form.phone, age: form.age, gender: form.gender,
          address: form.address, nationalId: form.nationalId, emergencyContactName: form.emergencyContactName,
          emergencyContactPhone: form.emergencyContactPhone,
          department: form.department, visitType: form.visitType, reason: form.reason,
          chiefComplaint: form.chiefComplaint, symptomDuration: form.symptomDuration, additionalNotes: form.additionalNotes,
          assignedStaffId: form.assignedStaff || undefined,
          isEmergency: form.isEmergency,
          symptoms: [...form.symptoms, ...(form.otherSymptom.trim() ? [form.otherSymptom.trim()] : [])],
          painLevel: form.painLevel, pregnancyStatus: form.pregnancyStatus,
          hasDisability: form.hasDisability, disabilityNotes: form.disabilityNotes,
          vitals: {
            bloodPressure: form.vitals.bloodPressure || undefined,
            temperature: form.vitals.temperature || undefined,
            heartRate: form.vitals.heartRate || undefined,
            oxygenSaturation: form.vitals.oxygenSaturation || undefined,
          },
          sendSms: form.sendSms,
        }),
      })
      const result = await res.json()
      if (!res.ok) { setError(result.error ?? 'Failed to register patient'); return }
      setSuccess({ queueNumber: result.queueNumber, priority: result.priority, estimatedWait: result.estimatedWait, patientNumber: result.patient?.patientNumber })
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setSuccess(null)
    setSearchQuery('')
    setSearchResults([])
    setSelectedPatient(null)
    setForm({ ...initialForm, department: departments[0] ?? '' })
    setPreview(null)
  }

  if (success) {
    const meta = priorityMeta[success.priority]
    return (
      <div className="flex flex-col min-h-full items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Patient Registered</h2>
          <p className="text-sm text-gray-500 mb-6">Added to the queue successfully</p>

          <div className="grid grid-cols-1 gap-3 mb-6">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-600 mb-1">Patient Number</p>
              <p className="text-xl font-black text-blue-800 font-mono">{success.patientNumber ?? '0001/26'}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-600 mb-1">Queue Number</p>
              <p className="text-2xl font-black text-blue-800 font-mono">{success.queueNumber}</p>
            </div>
            <div className={`rounded-xl p-4 border ${meta.cls}`}>
              <p className="text-xs font-semibold mb-1">Priority</p>
              <p className="text-lg font-black">{meta.emoji} {meta.label}</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-500 mb-1">Estimated Wait</p>
              <p className="text-2xl font-black text-gray-900">{success.estimatedWait} Minutes</p>
            </div>
          </div>

          <button onClick={resetForm}
            className="w-full h-11 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl transition-all">
            Register Another Patient
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-gray-900 hidden sm:block">Register New Patient</h1>
            <p className="text-xs text-gray-500 hidden md:block">Front-desk intake with smart triage</p>
          </div>
          <button type="button" onClick={() => { window.location.href = '/api/auth/logout' }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
            <LogOut className="w-4 h-4" /><span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-700 px-4 sm:px-6 lg:px-8 pt-6 pb-20 md:pb-24 lg:pb-28">
        <div className="max-w-7xl mx-auto">
          <p className="text-blue-200 text-sm">Admin · Register</p>
          <h2 className="text-white font-bold text-2xl md:text-3xl mt-0.5">Register New Patient</h2>
          <p className="text-blue-300 text-sm mt-1">Capture patient, visit, and smart triage details in one step</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-14 md:-mt-16 lg:-mt-20 pb-10 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 items-start">

        {/* Left: form */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">

          <Section icon={User} title="Patient Information">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                <Search className="w-4 h-4" /> Search existing patient
              </div>
              <div className="mt-3 relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); if (!e.target.value.trim()) setSelectedPatient(null) }} placeholder="Search by patient number, phone number or name" className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/40" />
              </div>
              {searchLoading ? <p className="mt-3 text-sm text-gray-500">Searching…</p> : null}
              {selectedPatient ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white px-3 py-3 text-sm text-gray-700">
                  <div>
                    <p className="font-semibold text-gray-900">Patient found</p>
                    <p className="mt-1">{selectedPatient.patient_number || '—'} · {selectedPatient.first_name} {selectedPatient.last_name}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedPatient(null)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-600">Clear</button>
                </div>
              ) : searchQuery.trim().length >= 2 && !searchLoading && searchResults.length === 0 ? (
                <div className="mt-3 rounded-xl border border-dashed border-gray-200 bg-white px-3 py-3 text-sm text-gray-600">No patient found. You can register a new patient below.</div>
              ) : null}
              {searchResults.length > 0 && !selectedPatient ? (
                <div className="mt-3 space-y-2">
                  {searchResults.map(patient => (
                    <div key={patient.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm">
                      <div>
                        <p className="font-semibold text-gray-900">{[patient.first_name, patient.last_name].filter(Boolean).join(' ') || patient.name || 'Unknown patient'}</p>
                        <p className="text-xs text-gray-500">{patient.patient_number || '—'} · {patient.phone_number || patient.phone || '—'}</p>
                      </div>
                      <button type="button" onClick={() => applyExistingPatient(patient)} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-semibold text-white">
                        <UserCheck2 className="w-4 h-4" /> Continue
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First Name *">
                <input value={form.firstName} onChange={e => update({ firstName: e.target.value })}
                  placeholder="Jane" className={inputCls} />
              </Field>
              <Field label="Last Name *">
                <input value={form.lastName} onChange={e => update({ lastName: e.target.value })}
                  placeholder="Mwansa" className={inputCls} />
              </Field>
              <Field label="Phone Number *">
                <input value={form.phone} onChange={e => update({ phone: e.target.value })}
                  type="tel" placeholder="097000000" className={inputCls} />
              </Field>
              <Field label="Age">
                <input value={form.age} onChange={e => update({ age: e.target.value })}
                  type="number" min="0" max="120" placeholder="34" className={inputCls} />
              </Field>
              <Field label="Gender">
                <select value={form.gender} onChange={e => update({ gender: e.target.value as Gender, pregnancyStatus: e.target.value === 'male' ? 'n/a' : form.pregnancyStatus })}
                  className={inputCls}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="National ID">
                <input value={form.nationalId} onChange={e => update({ nationalId: formatNrcInput(e.target.value) })}
                  placeholder="652260/67/1" className={inputCls} />
                {form.nationalId && !validateNrc(form.nationalId) ? (
                  <p className="mt-1 text-xs text-red-600">National ID must be in the format 620000/67/1</p>
                ) : null}
              </Field>
              <div className="sm:col-span-2">
                <Field label="Address">
                  <input value={form.address} onChange={e => update({ address: e.target.value })}
                    placeholder="123 Main Street" className={inputCls} />
                </Field>
              </div>
              <Field label="Emergency Contact">
                <input value={form.emergencyContactName} onChange={e => update({ emergencyContactName: e.target.value })}
                  placeholder="John Banda" className={inputCls} />
              </Field>
              <Field label="Emergency Phone">
                <input value={form.emergencyContactPhone} onChange={e => update({ emergencyContactPhone: e.target.value })}
                  type="tel" placeholder="0970000000" className={inputCls} />
              </Field>
            </div>
          </Section>

          <Section icon={Stethoscope} title="Smart Triage">
            {/* Symptoms */}
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Symptoms</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                {commonSymptoms.map(s => (
                  <label key={s} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer text-sm text-gray-700">
                    <input type="checkbox" checked={form.symptoms.includes(s)} onChange={() => toggleSymptom(s)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    {s}
                  </label>
                ))}
              </div>
              <input value={form.otherSymptom} onChange={e => update({ otherSymptom: e.target.value })}
                placeholder="Other symptoms..." className={inputCls} />
            </div>

            {/* Pain Level */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Pain Level</label>
                <span className="text-sm font-bold text-gray-900">{form.painLevel} / 10</span>
              </div>
              <input type="range" min={0} max={10} value={form.painLevel}
                onChange={e => update({ painLevel: Number(e.target.value) })}
                className="w-full accent-blue-700" />
            </div>

            {/* Pregnancy */}
            {form.gender !== 'male' && (
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Pregnancy</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['pregnant', 'not-pregnant', 'unknown'] as const).map(status => (
                    <label key={status}
                      className={`p-2.5 rounded-xl border-2 cursor-pointer text-center text-xs font-semibold transition-all ${form.pregnancyStatus === status ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      <input type="radio" name="pregnancy" className="sr-only"
                        checked={form.pregnancyStatus === status}
                        onChange={() => update({ pregnancyStatus: status })} />
                      {status.replace('-', ' ')}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Disability */}
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Disability</label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {[{ v: false, l: 'None' }, { v: true, l: 'Has Disability' }].map(opt => (
                  <label key={String(opt.v)}
                    className={`p-2.5 rounded-xl border-2 cursor-pointer text-center text-xs font-semibold transition-all ${form.hasDisability === opt.v ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <input type="radio" name="disability" className="sr-only"
                      checked={form.hasDisability === opt.v}
                      onChange={() => update({ hasDisability: opt.v })} />
                    {opt.l}
                  </label>
                ))}
              </div>
              {form.hasDisability && (
                <input value={form.disabilityNotes} onChange={e => update({ disabilityNotes: e.target.value })}
                  placeholder="Details (e.g. wheelchair access, visual impairment)..." className={inputCls} />
              )}
            </div>

            {/* Vital Signs */}
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Vital Signs (optional)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <input value={form.vitals.bloodPressure} onChange={e => update({ vitals: { ...form.vitals, bloodPressure: e.target.value } })}
                  placeholder="BP (mmHg)" className={inputCls} />
                <input value={form.vitals.temperature} onChange={e => update({ vitals: { ...form.vitals, temperature: e.target.value } })}
                  type="number" step="0.1" placeholder="Temp (°C)" className={inputCls} />
                <input value={form.vitals.heartRate} onChange={e => update({ vitals: { ...form.vitals, heartRate: e.target.value } })}
                  type="number" placeholder="HR (bpm)" className={inputCls} />
                <input value={form.vitals.oxygenSaturation} onChange={e => update({ vitals: { ...form.vitals, oxygenSaturation: e.target.value } })}
                  type="number" placeholder="SpO2 (%)" className={inputCls} />
              </div>
            </div>

            {/* Emergency Status */}
            <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${form.isEmergency ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
              <input type="checkbox" checked={form.isEmergency} onChange={e => update({ isEmergency: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500" />
              <Siren className={`w-4 h-4 ${form.isEmergency ? 'text-red-600' : 'text-gray-400'}`} />
              <span className={`text-sm font-semibold ${form.isEmergency ? 'text-red-800' : 'text-gray-700'}`}>Mark as Emergency / Critical Case</span>
            </label>
          </Section>

          <Section icon={Building2} title="Visit Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Department">
                <select value={form.department} onChange={e => update({ department: e.target.value })} className={inputCls}>
                  {departments.length === 0 && <option value="">No departments configured</option>}
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Visit Type">
                <select value={form.visitType} onChange={e => update({ visitType: e.target.value })} className={inputCls}>
                  {visitTypes.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                </select>
              </Field>
              <Field label="Assigned Staff">
                <select value={form.assignedStaff} onChange={e => update({ assignedStaff: e.target.value })} className={inputCls}>
                  <option value="">Unassigned</option>
                  {staffMembers.length === 0 ? (
                    <option value="" disabled>No active staff available</option>
                  ) : staffMembers.map(staff => (
                    <option key={staff.id} value={staff.id}>{`${staff.name} (${staff.role.charAt(0).toUpperCase()}${staff.role.slice(1)})`}</option>
                  ))}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Chief Complaint">
                  <textarea value={form.chiefComplaint} onChange={e => update({ chiefComplaint: e.target.value, reason: e.target.value })}
                    rows={2} placeholder="Brief description of why the patient is here..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40 resize-none" />
                </Field>
              </div>
              <Field label="Symptom Duration">
                <input value={form.symptomDuration} onChange={e => update({ symptomDuration: e.target.value })}
                  placeholder="2 days" className={inputCls} />
              </Field>
              <Field label="Additional Notes">
                <input value={form.additionalNotes} onChange={e => update({ additionalNotes: e.target.value })}
                  placeholder="Any extra context" className={inputCls} />
              </Field>
            </div>
          </Section>
        </div>

        {/* Right: live summary + submit */}
        <div className="lg:sticky lg:top-20 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Registration Summary</h3>
              <p className="text-xs text-gray-500">Updates automatically as you fill the form</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5" /> Priority Score
                </p>
                {preview ? (
                  <div className={`rounded-xl border p-3 flex items-center justify-between ${priorityMeta[preview.priority].cls}`}>
                    <span className="font-bold text-sm">{priorityMeta[preview.priority].emoji} {priorityMeta[preview.priority].label}</span>
                    <span className="text-xs font-semibold opacity-80">{preview.riskScore}/100</span>
                  </div>
                ) : (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-400">
                    {previewLoading ? 'Calculating…' : 'Select a department to begin'}
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" /> Queue Number
                </p>
                <p className="text-2xl font-black text-blue-800 font-mono">
                  {preview?.previewQueueNumber ?? '—'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Estimated Wait
                </p>
                <p className="text-2xl font-black text-gray-900">
                  {preview ? `${preview.estimatedWait} Minutes` : '—'}
                </p>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                Patient Number will be generated automatically after saving.
              </div>

              <label className="flex items-center gap-2.5 pt-2 border-t border-gray-100 cursor-pointer">
                <input type="checkbox" checked={form.sendSms} onChange={e => update({ sendSms: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700">Send SMS Updates</span>
              </label>

              {error && (
                <p className="text-xs text-red-600 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}</p>
              )}

              <button onClick={handleSubmit} disabled={submitting}
                className="w-full h-11 bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Registering…</>
                  : form.sendSms ? 'Register & Send SMS' : 'Register Patient'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-4 flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500">The queue number and wait time above are a live preview — the final ticket is assigned atomically when you submit.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
