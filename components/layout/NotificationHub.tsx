'use client'

import { X, Bell, MessageSquare, AlertTriangle, Clock } from 'lucide-react'
import type { NotificationItem } from '@/lib/api/patient'
import { formatTime } from '@/lib/utils'

export function NotificationHub({
  open,
  onClose,
  notifications,
}: {
  open: boolean
  onClose: () => void
  notifications: NotificationItem[] | null
}) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative ml-auto w-full max-w-md bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Notification hub</p>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Live alerts</h2>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 rounded-3xl bg-slate-50 dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800">
            <Bell className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Review recent SMS, system and patient alerts.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
            <p className="text-sm font-medium text-slate-900 dark:text-white mb-3">Summary</p>
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-3xl bg-white dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800">
                <p className="font-semibold text-slate-900 dark:text-white">{notifications?.length ?? 0}</p>
                <p className="text-slate-500 dark:text-slate-400">Total</p>
              </div>
              <div className="rounded-3xl bg-white dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800">
                <p className="font-semibold text-slate-900 dark:text-white">{notifications?.filter((item) => !item.read).length ?? 0}</p>
                <p className="text-slate-500 dark:text-slate-400">Unread</p>
              </div>
              <div className="rounded-3xl bg-white dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800">
                <p className="font-semibold text-slate-900 dark:text-white">{notifications?.filter((item) => item.type === 'sms').length ?? 0}</p>
                <p className="text-slate-500 dark:text-slate-400">SMS logs</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {(notifications?.length ?? 0) > 0 ? (
              notifications?.map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{item.subtitle}</p>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{formatTime(item.timestamp)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-slate-500 dark:text-slate-400">
                <MessageSquare className="mx-auto mb-3 h-8 w-8 text-slate-400" />
                No recent alerts. Everything looks calm for now.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-slate-500" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Updates refresh every 10 seconds.</p>
          </div>
        </div>
      </aside>
    </div>
  )
}
