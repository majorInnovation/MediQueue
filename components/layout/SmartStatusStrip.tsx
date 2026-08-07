'use client'

import { Activity, AlertTriangle, Bell, Clock } from 'lucide-react'
import type { QueueLiveStatus } from '@/lib/api/patient'
import { cn } from '@/lib/utils'

const statusStyles: Record<string, string> = {
  Operational: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Busy: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Overloaded: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
}

export function SmartStatusStrip({ status }: { status: QueueLiveStatus | null }) {
  const currentStatus = status?.clinicStatus ?? 'Operational'
  const badgeClass = statusStyles[currentStatus] ?? statusStyles.Operational

  return (
    <div
      className={cn(
        'rounded-3xl border px-4 py-3 shadow-sm bg-white/90 dark:bg-slate-950/85 border-slate-200 dark:border-slate-800 backdrop-blur',
        status?.emergencyMode ? 'ring-2 ring-rose-500/20 border-rose-200 dark:border-rose-900' : ''
      )}
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-3">
          <span className={cn('inline-flex h-10 w-10 items-center justify-center rounded-2xl', badgeClass)}>
            <Clock className="w-5 h-5" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Clinic status</p>
            <p className="font-semibold text-slate-900 dark:text-white">{currentStatus}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200">
            <Activity className="w-5 h-5" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Active queue</p>
            <p className="font-semibold text-slate-900 dark:text-white">{status?.activeQueue ?? '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200">
            <AlertTriangle className="w-5 h-5" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Avg wait</p>
            <p className="font-semibold text-slate-900 dark:text-white">{status ? `${status.avgWait} min` : '—'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200">
            <Bell className="w-5 h-5" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Alerts</p>
            <p className="font-semibold text-slate-900 dark:text-white">{status?.unreadAlerts ?? 0}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
