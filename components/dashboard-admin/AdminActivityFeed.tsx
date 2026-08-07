'use client'

import React from 'react'
import { Clock, Activity } from 'lucide-react'

export type ActivityEvent = {
  id: string
  user: string
  action: string
  timestamp: string
}

export function AdminActivityFeed({ events }: { events: ActivityEvent[] }) {
  const shown = events.slice(0, 7)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h3 className="font-bold text-gray-900">Recent Activity</h3>
        <p className="text-xs text-gray-500">Real-time queue and workflow events</p>
      </div>

      <div className="p-5">
        <div className="space-y-3">
          {shown.length === 0 ? (
            <div className="text-sm text-gray-500">No activity yet.</div>
          ) : (
            shown.map((e) => (
              <div key={e.id} className="flex items-start gap-3">
                <div className="mt-1 w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{e.action}</p>
                    <div className="inline-flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      {e.timestamp}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">By {e.user}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
