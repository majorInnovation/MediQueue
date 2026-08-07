'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { Priority } from '@/lib/types'

const styles: Record<Priority, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-700 dark:text-red-300', border: 'border-red-200/80 dark:border-red-500/30' },
  high: { bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200/80 dark:border-orange-500/30' },
  medium: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-200/80 dark:border-amber-500/30' },
  low: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200/80 dark:border-emerald-500/30' },
}

export function AdminPriorityPill({ priority }: { priority: Priority }) {
  const s = styles[priority]
  return (
    <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border', s.bg, s.text, s.border)}>
      {priority === 'critical' ? 'High' : priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  )
}

