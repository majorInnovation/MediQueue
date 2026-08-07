'use client'

import React, { useMemo, useState } from 'react'
import type { Priority, QueueStatus } from '@/lib/types'
import { AdminPriorityPill } from './AdminPriorityPill'
import { AdminStatusBadge } from './AdminStatusBadge'
import { Search, Filter } from 'lucide-react'

export type AdminQueueRow = {
  id: string
  queueNumber: string
  patientName: string
  priority: Priority
  department: string
  status: QueueStatus | 'called' | 'inConsultation'
  waitingMinutes: number
  roomNumber?: string
}

function statusBadge(status: AdminQueueRow['status']) {
  switch (status) {
    case 'called':
    case 'inConsultation':
      return { key: 'now-serving' as const, label: 'Now Serving' }
    case 'waiting':
      return { key: 'waiting' as const, label: 'Waiting' }
    case 'completed':
      return { key: 'completed' as const, label: 'Completed' }
    case 'cancelled':
      return { key: 'cancelled' as const, label: 'Cancelled' }
    default:
      return { key: 'waiting' as const, label: 'Waiting' }
  }
}

export function AdminLiveQueueTable({ rows }: { rows: AdminQueueRow[] }) {
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState<string>('All')
  const [page, setPage] = useState(1)
  const pageSize = 8

  const departments = useMemo(() => {
    const set = new Set(rows.map((r) => r.department))
    return ['All', ...Array.from(set).sort()]
  }, [rows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      const matchesQuery =
        !q ||
        r.patientName.toLowerCase().includes(q) ||
        r.queueNumber.toLowerCase().includes(q) ||
        (r.roomNumber ?? '').toLowerCase().includes(q)
      const matchesDept = department === 'All' || r.department === department
      return matchesQuery && matchesDept
    })
  }, [rows, query, department])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aServing = a.status === 'called' || a.status === 'inConsultation'
      const bServing = b.status === 'called' || b.status === 'inConsultation'
      if (aServing !== bServing) return aServing ? -1 : 1
      return b.waitingMinutes - a.waitingMinutes
    })
  }, [filtered])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const current = sorted.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="font-bold text-gray-900">Live Queue</h3>
            <p className="text-xs text-gray-500">Real-time queue, priority, and waiting time</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => { setPage(1); setQuery(e.target.value) }}
                className="pl-9 pr-3 h-9 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="Search patient or queue #"
                aria-label="Search queue"
              />
            </div>

            <div className="relative">
              <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={department}
                onChange={(e) => { setPage(1); setDepartment(e.target.value) }}
                className="pl-9 pr-3 h-9 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500/40"
                aria-label="Filter by department"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Queue #', 'Patient Name', 'Priority', 'Department', 'Status', 'Waiting Time'].map((h) => (
                <th key={h} className="text-left px-5 py-3 font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {current.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                  No patients match your filters.
                </td>
              </tr>
            ) : (
              current.map((r) => {
                const b = statusBadge(r.status)
                return (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 font-semibold">
                        {r.queueNumber}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900">{r.patientName}</div>
                      <div className="text-xs text-gray-500">Room {r.roomNumber ?? '—'}</div>
                    </td>
                    <td className="px-5 py-4">
                      <AdminPriorityPill priority={r.priority} />
                    </td>
                    <td className="px-5 py-4 text-gray-700">{r.department}</td>
                    <td className="px-5 py-4">
                      <AdminStatusBadge status={b.key}>{b.label}</AdminStatusBadge>
                    </td>
                    <td className="px-5 py-4 text-gray-700">{r.waitingMinutes} min</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
        <p className="text-xs text-gray-500">
          Showing <span className="font-semibold text-gray-700">{current.length}</span> of{' '}
          <span className="font-semibold text-gray-700">{sorted.length}</span> patients
        </p>
        <div className="flex items-center gap-2">
          <button
            className="h-9 px-3 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <div className="h-9 flex items-center px-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-sm font-semibold">
            {page} / {totalPages}
          </div>
          <button
            className="h-9 px-3 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
