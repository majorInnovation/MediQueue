'use client'

import React from 'react'

export function AdminPriorityGuide() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h3 className="font-bold text-gray-900">Priority Guide</h3>
        <p className="text-xs text-gray-500">Triage logic for admin queue actions</p>
      </div>

      <div className="p-5 space-y-3">
        <div className="rounded-xl border border-gray-100 border-l-4 border-l-red-500 bg-gray-50/60 p-4">
          <p className="font-bold text-red-700">High Priority</p>
          <ul className="mt-2 text-sm text-gray-600 space-y-1">
            <li>Severe pain</li>
            <li>Difficulty breathing</li>
            <li>Emergency symptoms</li>
          </ul>
        </div>

        <div className="rounded-xl border border-gray-100 border-l-4 border-l-amber-500 bg-gray-50/60 p-4">
          <p className="font-bold text-amber-800">Medium Priority</p>
          <ul className="mt-2 text-sm text-gray-600 space-y-1">
            <li>Fever</li>
            <li>Persistent cough</li>
            <li>Moderate symptoms</li>
          </ul>
        </div>

        <div className="rounded-xl border border-gray-100 border-l-4 border-l-emerald-500 bg-gray-50/60 p-4">
          <p className="font-bold text-emerald-700">Low Priority</p>
          <ul className="mt-2 text-sm text-gray-600 space-y-1">
            <li>Routine check-up</li>
            <li>Follow-up visit</li>
            <li>Routine consultation</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
