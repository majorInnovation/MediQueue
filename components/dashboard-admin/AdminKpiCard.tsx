'use client'

import React from 'react'
import type { LucideIcon } from 'lucide-react'

export type KpiAccent = 'blue' | 'emerald' | 'amber' | 'indigo' | 'violet'

const accentStyles: Record<KpiAccent, string> = {
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  violet: 'bg-violet-50 text-violet-600',
}

interface AdminKpiCardProps {
  label: string
  value: string
  change?: string
  icon: LucideIcon
  accent: KpiAccent
}

export function AdminKpiCard({ label, value, change, icon: Icon, accent }: AdminKpiCardProps) {
  return (
    <div
      className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-gray-200 transition-all"
      aria-label={label}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
          {change ? (
            <p className="text-xs font-medium text-gray-500">{change}</p>
          ) : null}
        </div>

        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accentStyles[accent]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}
