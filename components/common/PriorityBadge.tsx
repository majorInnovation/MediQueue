'use client'

import React from 'react'
import type { Priority } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PriorityBadgeProps {
  priority: Priority
  size?: 'sm' | 'md' | 'lg'
}

export function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const priorityStyles = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    low: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  }

  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  const labelMap = {
    critical: 'CRITICAL',
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW',
  }

  return (
    <span
      className={cn(
        'font-semibold rounded-full inline-block',
        priorityStyles[priority],
        sizeStyles[size]
      )}
    >
      {labelMap[priority]}
    </span>
  )
}
