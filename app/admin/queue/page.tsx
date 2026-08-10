'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QueueHeader } from '@/components/queue/QueueHeader'
import { QueueStats } from '@/components/queue/QueueStats'
import { QueueFilters } from '@/components/queue/QueueFilters'
import { QueueTable } from '@/components/queue/QueueTable'
import { QueueSidebar } from '@/components/queue/QueueSidebar'

type QueueStatus = 'waiting' | 'called' | 'inConsultation' | 'completed' | 'missed' | 'cancelled'
type Priority = 'critical' | 'high' | 'medium' | 'low'

type QueueRow = {
  id: string
  queue_number: string
  status: QueueStatus
  priority: Priority
  department: string
  symptoms: string[]
  created_at: string
  called_at: string | null
  assigned_doctor_id: string | null
  patients: { id: string; patient_number?: string | null; first_name?: string | null; last_name?: string | null; name?: string | null; phone?: string | null; phone_number?: string | null; date_of_birth: string | null } | null
  staff_members: { id: string; name: string; role: string } | null
}

type AttendingStaff = { id: string; name: string; role: string; department: string | null }

const PAGE_SIZE = 8

function waitMins(createdAt: string) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
}

export default function QueueManagementPage() {
  const supabase = createClient()

  const [rows, setRows] = useState<QueueRow[]>([])
  const [staffList, setStaffList] = useState<AttendingStaff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [deptFilter, setDept] = useState('All')
  const [statusFilter, setStatusFilter] = useState<QueueStatus | 'All'>('All')
  const fetchRequestId = useRef(0)
  const [page, setPage] = useState(1)
  const [actionLoading, setActLoading] = useState<string | null>(null)
  const [clinicId, setClinicId] = useState<string | null>(null)
  const [selectedRow, setSelectedRow] = useState<QueueRow | null>(null)

  const waiting = rows.filter((row) => row.status === 'waiting').length
  const serving = rows.filter((row) => row.status === 'inConsultation' || row.status === 'called').length
  const completed = rows.filter((row) => row.status === 'completed').length
  const highPriority = rows.filter((row) => row.priority === 'critical' || row.priority === 'high').length
  const averageWait = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + waitMins(row.created_at), 0) / rows.length)
    : 0

  const departments = ['All', ...Array.from(new Set(rows.map((row) => row.department))).sort()]
  const departmentDistribution = Object.entries(
    rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.department] = (acc[row.department] ?? 0) + 1
      return acc
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, value]) => ({
      name,
      value,
      color: value >= 4 ? 'bg-blue-600' : value >= 2 ? 'bg-emerald-500' : 'bg-amber-500',
    }))

  const filtered = rows.filter((row) => {
    const query = search.toLowerCase()
    const matchQuery = !query || row.queue_number.toLowerCase().includes(query)
      || (row.patients?.patient_number ?? '').toLowerCase().includes(query)
      || (row.patients?.name ?? '').toLowerCase().includes(query)
      || (row.patients?.phone ?? '').includes(query)
      || (row.patients?.phone_number ?? '').includes(query)
    const matchDepartment = deptFilter === 'All' || row.department === deptFilter
    const matchStatus = statusFilter === 'All' || row.status === statusFilter
    return matchQuery && matchDepartment && matchStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search, deptFilter, statusFilter])

  const loadQueue = useCallback(async () => {
    const requestId = ++fetchRequestId.current
    setLoading(true)
    setError(null)

    try {
      console.log('[queue] fetch start', requestId)
      const res = await fetch('/api/admin/queue', { cache: 'no-store' })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || `Queue fetch failed ${res.status}`)
      }
      const { queue, staff } = await res.json()
      if (requestId !== fetchRequestId.current) {
        console.log('[queue] ignored stale response', requestId)
        return
      }
      setRows(queue ?? [])
      setStaffList(staff ?? [])
      setError(null)
      console.log('[queue] fetch success', (queue ?? []).length)
    } catch (loadError) {
      if (requestId !== fetchRequestId.current) return
      console.error('[queue] failed to load queue', loadError)
      setError(loadError instanceof Error ? loadError.message : 'Unable to load queue records.')
    } finally {
      if (requestId === fetchRequestId.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadQueue()
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      void supabase.from('user_profiles').select('clinic_id').eq('id', user.id).single()
        .then(({ data }) => setClinicId(data?.clinic_id ?? null))
    })
  }, [loadQueue, supabase])

  useEffect(() => {
    if (!clinicId) return
    const channel = supabase
      .channel('queue_admin')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'queue_records',
        filter: `clinic_id=eq.${clinicId}`,
      }, () => {
        void loadQueue()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [clinicId, loadQueue, supabase])

  async function doAction(queueRecordId: string, action: string, staffId?: string | null) {
    setActLoading(queueRecordId + action)
    await fetch('/api/queue/action', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueRecordId, action, staffId }),
    })
    setActLoading(null)
    await loadQueue()
  }

  async function assignStaff(queueRecordId: string, staffId: string) {
    await doAction(queueRecordId, 'assign', staffId || null)
  }

  async function callNext() {
    const next = rows.find((row) => row.status === 'waiting')
    if (next) await doAction(next.id, 'call')
  }

  const exportCSV = () => {
    const header = 'Queue#,Patient,Department,Status,Priority,Wait(min)\n'
    const body = filtered.map((row) => `${row.queue_number},"${row.patients?.name ?? ''}",${row.department},${row.status},${row.priority},${waitMins(row.created_at)}`).join('\n')
    const blob = new Blob([header + body], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'queue.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const resetFilters = () => {
    setSearch('')
    setDept('All')
    setStatusFilter('All')
  }

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const lastSynced = loading ? 'syncing...' : 'just now'

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#f8fbff_0%,_#f4f7fb_45%,_#f7f9fc_100%)] px-3 py-3 sm:px-4 lg:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <QueueHeader
          todayLabel={todayLabel}
          lastSynced={lastSynced}
          loading={loading}
          onRefresh={() => {
            setLoading(true)
            void loadQueue()
          }}
          onExport={exportCSV}
          onCallNext={callNext}
          onRegister={() => {
            window.location.assign('/admin/register')
          }}
        />

        <QueueStats
          waiting={waiting}
          serving={serving}
          completed={completed}
          total={rows.length}
          averageWait={averageWait}
          highPriority={highPriority}
          loading={loading}
        />

        <div className="flex flex-col gap-4 xl:flex-row">
          <div className="flex-1 space-y-4">
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    {rows.length > 0
                      ? 'Unable to refresh the queue. Showing previously loaded records.'
                      : 'Unable to load queue records. Please check your connection.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setLoading(true)
                      void loadQueue()
                    }}
                    className="self-start rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-slate-100 sm:self-auto"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : null}
            <QueueFilters
              search={search}
              onSearchChange={setSearch}
              deptFilter={deptFilter}
              onDeptChange={setDept}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              departments={departments}
              statuses={[
                { value: 'All', label: 'All Status' },
                { value: 'waiting', label: 'Waiting' },
                { value: 'called', label: 'Called' },
                { value: 'inConsultation', label: 'Serving' },
                { value: 'completed', label: 'Completed' },
                { value: 'missed', label: 'Missed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
              onReset={resetFilters}
            />

            <QueueTable
              rows={rows}
              loading={loading}
              currentRows={currentRows}
              page={page}
              totalPages={totalPages}
              pageSize={PAGE_SIZE}
              filteredCount={filtered.length}
              actionLoading={actionLoading}
              staffList={staffList}
              onAssignStaff={assignStaff}
              onAction={doAction}
              onPageChange={setPage}
              onRegister={() => {
                window.location.assign('/admin/register')
              }}
              onView={(id) => {
                const row = rows.find((row) => row.id === id)
                if (row) setSelectedRow(row)
              }}
            />
          </div>

          <QueueSidebar
            waiting={waiting}
            completed={completed}
            total={rows.length}
            highPriority={highPriority}
            averageWait={averageWait}
            departments={departmentDistribution}
          />
        </div>
      </div>

      {selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Queue record details</h2>
                <p className="mt-1 text-sm text-slate-500">Patient and appointment information for {selectedRow.queue_number}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRow(null)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Queue number</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{selectedRow.queue_number}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{selectedRow.status}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Patient</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{selectedRow.patients?.name ?? '—'}</p>
                  <p className="mt-1 text-sm text-slate-500">{selectedRow.patients?.patient_number ?? '—'}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Department</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{selectedRow.department}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Assigned staff</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{selectedRow.staff_members?.name ?? 'Unassigned'}</p>
                  <p className="mt-1 text-sm text-slate-500">{selectedRow.staff_members ? selectedRow.staff_members.role : ''}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Waiting time</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{Math.floor((Date.now() - new Date(selectedRow.created_at).getTime()) / 60000)} min</p>
                  <p className="mt-1 text-sm text-slate-500">Since {new Date(selectedRow.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Priority</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{selectedRow.priority}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Symptoms</p>
                  <p className="mt-2 text-sm text-slate-700">{Array.isArray(selectedRow.symptoms) ? selectedRow.symptoms.join(', ') : selectedRow.symptoms || '—'}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setSelectedRow(null)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={async () => {
                  await doAction(selectedRow.id, 'cancel')
                  setSelectedRow(null)
                }}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Cancel patient
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
