import { cn } from '@/lib/utils'

type QueueStatus = 'waiting' | 'called' | 'inConsultation' | 'completed' | 'missed' | 'cancelled'

const statusMeta: Record<QueueStatus, { label: string; cls: string }> = {
  waiting: { label: 'Waiting', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  called: { label: 'Called', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  inConsultation: { label: 'Serving', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  completed: { label: 'Completed', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  missed: { label: 'Missed', cls: 'bg-red-50 text-red-700 border-red-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
}

export function StatusBadge({ status }: { status: QueueStatus }) {
  const meta = statusMeta[status] ?? statusMeta.waiting

  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold', meta.cls)}>
      {meta.label}
    </span>
  )
}
