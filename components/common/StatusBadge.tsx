import React from 'react'
import { getStatusClasses, getStatusLabel } from '@/lib/utils'
import type { QueueStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: QueueStatus
  variant?: 'default' | 'pill'
}

export function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
  const label = getStatusLabel(status)
  const statusClass = getStatusClasses(status)

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold text-xs',
        variant === 'pill'
          ? 'px-3 py-1.5 rounded-full'
          : 'px-2.5 py-1.5 rounded',
        statusClass
      )}
    >
      {label}
    </span>
  )
}
