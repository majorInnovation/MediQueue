'use client'

import React from 'react'
import { Clock, BadgeCheck, BadgeX, Send } from 'lucide-react'

type SmsStatus = 'sent' | 'delivered' | 'failed' | 'pending'

export type AdminSmsPreview = {
  id: string
  type: string
  message: string
  status: SmsStatus
  timestamp: string
}

function statusMeta(status: SmsStatus) {
  switch (status) {
    case 'delivered':
      return { icon: BadgeCheck, cls: 'bg-emerald-50 text-emerald-700', ring: 'ring-emerald-200/60' }
    case 'failed':
      return { icon: BadgeX, cls: 'bg-rose-50 text-rose-700', ring: 'ring-rose-200/60' }
    case 'pending':
      return { icon: Clock, cls: 'bg-amber-50 text-amber-700', ring: 'ring-amber-200/60' }
    case 'sent':
    default:
      return { icon: Send, cls: 'bg-blue-50 text-blue-700', ring: 'ring-blue-200/60' }
  }
}

export function AdminSmsNotificationCenter({ items }: { items: AdminSmsPreview[] }) {
  const shown = items.slice(0, 4)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h3 className="font-bold text-gray-900">SMS Notification Center</h3>
        <p className="text-xs text-gray-500">Message previews with delivery state</p>
      </div>

      <div className="p-5 space-y-3">
        {shown.length === 0 ? (
          <div className="text-sm text-gray-500">No SMS activity yet.</div>
        ) : (
          shown.map((it) => {
            const meta = statusMeta(it.status)
            const Icon = meta.icon
            return (
              <div key={it.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4 hover:bg-white transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4" />
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{it.type}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2">{it.message}</p>
                  </div>

                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ring-1 ${meta.cls} ${meta.ring}`}>{it.status}</span>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  {it.timestamp}
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
        <div className="text-xs text-gray-500">Showing latest message previews</div>
        <button className="text-sm font-semibold text-blue-700 hover:text-blue-800 transition-colors">
          View SMS Logs
        </button>
      </div>
    </div>
  )
}
