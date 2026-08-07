'use client'

import React from 'react'

export function ChartSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/40 ${className}`} />
  )
}

