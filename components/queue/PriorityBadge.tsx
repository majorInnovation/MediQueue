import { cn } from '@/lib/utils'

type Priority = 'critical' | 'high' | 'medium' | 'low'

const priorityMeta: Record<Priority, { label: string; cls: string }> = {
  critical: { label: 'Emergency', cls: 'bg-red-50 text-red-700 border-red-200' },
  high: { label: 'Urgent', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  medium: { label: 'High', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  low: { label: 'Normal', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const meta = priorityMeta[priority] ?? priorityMeta.low

  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold', meta.cls)}>
      {meta.label}
    </span>
  )
}
