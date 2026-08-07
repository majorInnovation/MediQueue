'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export type QueueStatusBadge = 'now-serving' | 'waiting' | 'completed' | 'cancelled'

const badgeByStatus: Record<QueueStatusBadge, { base: string; ring: string }> = {
  'now-serving': { base: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300', ring: 'ring-blue-200/70 dark:ring-blue-500/30' },
  waiting: { base: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300', ring: 'ring-amber-200/70 dark:ring-amber-500/30' },
  completed: { base: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300', ring: 'ring-emerald-200/70 dark:ring-emerald-500/30' },
  cancelled: { base: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300', ring: 'ring-rose-200/70 dark:ring-rose-500/30' },
}

export function AdminStatusBadge({ status, children }: { status: QueueStatusBadge; children: React.ReactNode }) {
  const cls = badgeByStatus[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border ring-1',
        cls.base,
        cls.ring,
      )}
      role="status"
      aria-label={typeof children === 'string' ? children : status}
    >
      {children}
    </span>
  )
}

