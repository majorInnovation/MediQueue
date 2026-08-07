'use client'

import React from 'react'
import { Clock } from 'lucide-react'
import type { TriageCategory } from '@/lib/types'

export type RecentTriageRow = {
  id: string
  time: string
  patientName: string
  symptoms: string
  priority: TriageCategory
}

function badge(priority: TriageCategory) {
  switch (priority) {
    case 'critical':
      return 'bg-red-50 text-red-700 border-red-200'
    case 'urgent':
      return 'bg-orange-50 text-orange-700 border-orange-200'
    case 'standard':
      return 'bg-amber-50 text-amber-800 border-amber-200'
    case 'minor':
    default:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }
}

export function AdminRecentTriageTable({ rows }: { rows: RecentTriageRow[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h3 className="font-bold text-gray-900">Recent Triage</h3>
        <p className="text-xs text-gray-500">Latest assessments and triage outcomes</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Time', 'Patient', 'Symptoms', 'Priority'].map((h) => (
                <th key={h} className="text-left px-5 py-3 font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-gray-500">
                  No triage records.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="inline-flex items-center gap-2 text-xs text-gray-600">
                      <Clock className="w-4 h-4" />
                      {r.time}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-gray-900">{r.patientName}</td>
                  <td className="px-5 py-4 text-gray-700">{r.symptoms}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${badge(r.priority)}`}>
                      {r.priority.charAt(0).toUpperCase() + r.priority.slice(1)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
