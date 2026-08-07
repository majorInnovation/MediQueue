'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, Phone, User, BadgeCheck, Clock3, ClipboardList, Activity, FileText, History, CircleDot } from 'lucide-react'

interface QueueSummary {
  id: string
  queue_number: string
  status: string
  priority: string
  estimated_wait: number | null
  created_at: string
}

interface VisitSummary {
  id: string
  chief_complaint: string | null
  symptoms: string[] | null
  symptom_duration: string | null
  pain_level: number | null
  additional_notes: string | null
  triage_priority: string | null
  created_at: string
  queue: QueueSummary | null
}

interface PatientDetail {
  id: string
  patient_number: string | null
  first_name: string | null
  last_name: string | null
  phone_number: string | null
  gender: string | null
  age: number | null
  date_of_birth: string | null
  national_id: string | null
  address: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  created_at: string | null
  updated_at: string | null
  patient_visits: VisitSummary[] | null
}

function calculateAge(dob: string | null) {
  if (!dob) return null

  const birthDate = new Date(dob)
  if (Number.isNaN(birthDate.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1
  }

  return age
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatList(items?: string[] | null) {
  if (!items?.length) return '—'
  return items.join(', ')
}

export default function PatientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [patient, setPatient] = useState<PatientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [id, setId] = useState<string>('')

  useEffect(() => {
    params.then(({ id }) => setId(id))
  }, [params])

  useEffect(() => {
    if (!id) return
    fetch(`/api/patients/${id}`)
      .then(res => res.json())
      .then(data => {
        setPatient(data.patient)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading patient details…</div>
  if (!patient) return <div className="p-6 text-sm text-gray-500">Patient not found.</div>

  const fullName = [patient.first_name, patient.last_name].filter(Boolean).join(' ') || 'Unknown patient'
  const visits = (patient.patient_visits ?? []).slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const latestVisit = visits[0]

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/queue" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600">
            <ArrowLeft className="w-4 h-4" /> Back to queue
          </Link>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Patient details</p>
              <h1 className="mt-2 text-3xl font-semibold text-gray-900">{fullName}</h1>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-600">
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
                  <BadgeCheck className="w-4 h-4" /> {patient.patient_number || '0001/26'}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700">
                  <Clock3 className="w-4 h-4" /> {latestVisit?.queue?.queue_number || 'No queue'}
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
              <p className="font-semibold text-gray-900">Current visit</p>
              <p className="mt-2">Priority: {latestVisit?.triage_priority || '—'}</p>
              <p className="mt-1">Status: {latestVisit?.queue?.status || '—'}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <User className="w-5 h-5 text-blue-600" /> Patient information
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs uppercase tracking-wide text-gray-500">Patient number</p><p className="mt-2 font-semibold text-gray-900">{patient.patient_number || '—'}</p></div>
              <div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs uppercase tracking-wide text-gray-500">Full name</p><p className="mt-2 font-semibold text-gray-900">{fullName}</p></div>
              <div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs uppercase tracking-wide text-gray-500">Phone</p><p className="mt-2 font-semibold text-gray-900">{patient.phone_number || '—'}</p></div>
              <div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs uppercase tracking-wide text-gray-500">Gender</p><p className="mt-2 font-semibold text-gray-900">{patient.gender || '—'}</p></div>
              <div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs uppercase tracking-wide text-gray-500">Age</p><p className="mt-2 font-semibold text-gray-900">{patient.age ?? calculateAge(patient.date_of_birth) ?? '—'}</p></div>
              <div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs uppercase tracking-wide text-gray-500">Date registered</p><p className="mt-2 font-semibold text-gray-900">{formatDate(patient.created_at)}</p></div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <ClipboardList className="w-5 h-5 text-blue-600" /> Current visit
            </div>
            <div className="mt-6 space-y-4 text-sm text-gray-700">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Chief complaint</p>
                <p className="mt-2 font-semibold text-gray-900">{latestVisit?.chief_complaint || '—'}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Symptoms</p>
                <p className="mt-2 font-semibold text-gray-900">{formatList(latestVisit?.symptoms ?? [])}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Pain level</p>
                <p className="mt-2 font-semibold text-gray-900">{latestVisit?.pain_level ?? '—'}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Additional notes</p>
                <p className="mt-2 font-semibold text-gray-900">{latestVisit?.additional_notes || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <History className="w-5 h-5 text-blue-600" /> Visit history
            </div>
            <div className="mt-6 space-y-4">
              {visits.length === 0 ? <p className="text-sm text-gray-500">No visits recorded yet.</p> : visits.map((visit, index) => (
                <div key={visit.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Visit {index + 1}</p>
                      <p className="mt-1 text-sm text-gray-600">{formatDate(visit.created_at)}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">{visit.triage_priority || '—'}</span>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-gray-700">
                    <p><span className="font-semibold text-gray-900">Symptoms:</span> {formatList(visit.symptoms ?? [])}</p>
                    <p><span className="font-semibold text-gray-900">Priority:</span> {visit.triage_priority || '—'}</p>
                    <p><span className="font-semibold text-gray-900">Status:</span> {visit.queue?.status || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Activity className="w-5 h-5 text-blue-600" /> Queue history
            </div>
            <div className="mt-6 space-y-4">
              {visits.filter(visit => visit.queue).length === 0 ? <p className="text-sm text-gray-500">No queue history yet.</p> : visits.filter(visit => visit.queue).map(visit => (
                <div key={visit.queue?.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{visit.queue?.queue_number || '—'}</p>
                      <p className="mt-1 text-sm text-gray-600">{formatDate(visit.queue?.created_at)}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">{visit.queue?.priority || '—'}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-700">
                    <span className="inline-flex items-center gap-2"><CircleDot className="w-4 h-4 text-blue-600" />{visit.queue?.status || '—'}</span>
                    <span className="inline-flex items-center gap-2"><Clock3 className="w-4 h-4 text-blue-600" />{visit.queue?.estimated_wait ?? '—'} mins</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
