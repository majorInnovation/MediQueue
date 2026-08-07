'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import type { QueueLiveStatus } from '@/lib/api/patient'

const labelMap: Record<string, string> = {
  dashboard: 'Dashboard',
  queue: 'Queue',
  triage: 'Triage',
  register: 'Register Patient',
  reports: 'Reports',
  settings: 'Settings',
  staff: 'Staff',
  patient: 'Patient Portal',
  appointments: 'Appointments',
  notifications: 'Notifications',
  'live-status': 'Live Status',
  history: 'Patient History',
}

export function BreadcrumbTrail({ status }: { status: QueueLiveStatus | null }) {
  const pathname = usePathname()

  const crumbs = useMemo(() => {
    const parts = pathname?.split('/').filter(Boolean) ?? []
    const mapped = parts.map((part) => labelMap[part] ?? part.replace(/-/g, ' ').replace(/\b\w/g, (chr) => chr.toUpperCase()))

    if (status?.emergencyMode) {
      mapped.push('Emergency Response')
    }

    if (status && parts.includes('queue') && status.currentPatient) {
      mapped.push(`${status.currentPatient.queueNumber} → ${status.currentPatient.priority}`)
    }

    return mapped
  }, [pathname, status])

  return (
    <nav aria-label="Breadcrumb" className="mb-6 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-4 shadow-sm">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        {crumbs.map((crumb, index) => (
          <li key={`${crumb}-${index}`} className="inline-flex items-center gap-2">
            <span className={index === crumbs.length - 1 ? 'font-semibold text-slate-900 dark:text-white' : undefined}>
              {crumb}
            </span>
            {index < crumbs.length - 1 ? <ChevronRight className="w-4 h-4" /> : null}
          </li>
        ))}
      </ol>
    </nav>
  )
}
