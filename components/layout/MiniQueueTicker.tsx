'use client'

import { ArrowRight, Zap } from 'lucide-react'
import type { QueueLiveStatus, QueuePatientPreview } from '@/lib/api/patient'
import { cn } from '@/lib/utils'

const priorityStyles: Record<string, string> = {
  normal: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  urgent: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  emergency: 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300',
}

export function MiniQueueTicker({ status }: { status: QueueLiveStatus | null }) {
  const patients = status
    ? [status.currentPatient, ...(status.nextPatients ?? []).slice(0, 3)].filter((item): item is QueuePatientPreview => item != null)
    : []

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Live queue preview</p>
          <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Serving now</h2>
        </div>
        <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      </div>

      <div className="space-y-3">
        {status ? (
          patients.map((item, index) => (
            <div
              key={`${item.queueNumber}-${index}`}
              className={cn(
                'rounded-3xl border p-3 flex items-center justify-between gap-3',
                index === 0 ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.queueNumber}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.displayName}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('rounded-full px-2 py-1 text-[11px] font-semibold', priorityStyles[item.priority])}>
                  {item.priority}
                </span>
                {index === 0 ? <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-300" /> : null}
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-2">
            <div className="h-10 rounded-3xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
            <div className="h-10 rounded-3xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
            <div className="h-10 rounded-3xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  )
}
