'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, UserPlus, Eye, PencilLine, Trash2, Users, Filter, Loader2 } from 'lucide-react'
import { matchesPatientSearch } from '@/lib/patient-search'

interface PatientRow {
  id: string
  patient_number: string | null
  name: string | null
  full_name: string | null
  first_name: string | null
  last_name: string | null
  phone_number: string | null
  phone: string | null
  gender: string | null
  age: number | null
  created_at: string | null
  date_of_birth: string | null
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

export default function PatientsPage() {
  const [search, setSearch] = useState('')
  const [genderFilter, setGenderFilter] = useState('all')
  const [patients, setPatients] = useState<PatientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshCount, setRefreshCount] = useState(0)
  const fetchRequestId = useRef(0)

  const retryLoadPatients = () => setRefreshCount((count) => count + 1)

  useEffect(() => {
    const query = search.trim()
    const controller = new AbortController()
    const requestId = ++fetchRequestId.current

    setLoading(true)
    setError(null)

    const timeout = window.setTimeout(() => {
      fetch(`/api/patients?search=${encodeURIComponent(query)}`, { signal: controller.signal, cache: 'no-store' })
        .then(async res => {
          if (!res.ok) {
            const body = await res.json().catch(() => null)
            throw new Error(body?.error || `Failed to load patients (${res.status})`)
          }
          return res.json()
        })
        .then(data => {
          if (requestId !== fetchRequestId.current) return
          const normalized = (data.patients ?? []).map((patient: PatientRow) => ({
            ...patient,
            name: patient.name || [patient.first_name, patient.last_name].filter(Boolean).join(' ').trim() || '—',
            phone_number: patient.phone_number || patient.phone || null,
            gender: patient.gender ? String(patient.gender).charAt(0).toUpperCase() + String(patient.gender).slice(1) : '—',
            age: typeof patient.age === 'number' ? patient.age : calculateAge(patient.date_of_birth ?? null),
          }))
          setPatients(normalized)
          setError(null)
        })
        .catch(error => {
          if (controller.signal.aborted || requestId !== fetchRequestId.current) return
          console.error('[patients] failed to load patients', error)
          setError(error instanceof Error ? error.message : 'Unable to load patients.')
        })
        .finally(() => {
          if (requestId === fetchRequestId.current) setLoading(false)
        })
    }, 250)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [search, refreshCount])

  const filtered = useMemo(() => {
    return patients.filter(patient => {
      const searchMatches = matchesPatientSearch(patient, search)
      const genderMatches = genderFilter === 'all' || String(patient.gender || '—').toLowerCase() === genderFilter.toLowerCase()
      return searchMatches && genderMatches
    })
  }, [patients, search, genderFilter])

  const handleDelete = async (patientId: string) => {
    const confirmed = window.confirm('Delete this patient record?')
    if (!confirmed) return

    try {
      const response = await fetch(`/api/patients/${patientId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Unable to delete patient')
      setPatients(prev => prev.filter(patient => patient.id !== patientId))
    } catch (error) {
      console.error('Failed to delete patient', error)
      window.alert('Unable to delete patient right now.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Patient management</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Patient Management</h1>
            <p className="mt-2 text-sm text-slate-600">Manage registered patients and their clinic information</p>
          </div>
          <Link href="/admin/register" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800">
            <UserPlus className="h-4 w-4" /> Register patient
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total patients</p>
                <p className="mt-1 text-3xl font-semibold text-slate-900">{loading ? <Loader2 className="h-7 w-7 animate-spin text-blue-700" /> : filtered.length}</p>
              </div>
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Filter className="h-4 w-4 text-blue-600" /> Filter by gender
            </div>
            <select
              value={genderFilter}
              onChange={e => setGenderFilter(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400"
            >
              <option value="all">All genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by patient number, name, or phone"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="p-4">
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    {patients.length > 0
                      ? 'Unable to refresh patients. Showing previously loaded results.'
                      : 'Unable to load patients. Please check your connection and try again.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setLoading(true)
                      retryLoadPatients()
                    }}
                    className="self-start rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-slate-100 sm:self-auto"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Patient Number</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Gender</th>
                  <th className="px-4 py-3">Age</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-4 py-4"><div className="h-4 w-24 rounded bg-slate-200" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-32 rounded bg-slate-200" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-28 rounded bg-slate-200" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-16 rounded bg-slate-200" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-10 rounded bg-slate-200" /></td>
                      <td className="px-4 py-4"><div className="h-8 w-24 rounded-full bg-slate-200" /></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-slate-500">
                        <Users className="h-8 w-8 text-slate-300" />
                        <p className="text-base font-semibold text-slate-700">No patients found</p>
                        <p className="text-sm">Try a different search or register a new patient.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(patient => (
                    <tr key={patient.id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-4 font-semibold text-blue-700">{patient.patient_number || '—'}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
                            {(patient.name || 'P').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{patient.name || '—'}</p>
                            <p className="text-xs text-slate-500">{patient.patient_number || 'No number'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{patient.phone_number || '—'}</td>
                      <td className="px-4 py-4 text-slate-600">{patient.gender || '—'}</td>
                      <td className="px-4 py-4 text-slate-600">{patient.age ?? '—'}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/patients/${patient.id}`} className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700" title="View patient details">
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link href={`/admin/register?patientId=${patient.id}`} className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700" title="Edit patient">
                            <PencilLine className="h-4 w-4" />
                          </Link>
                          <button type="button" onClick={() => handleDelete(patient.id)} className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700" title="Delete patient">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
