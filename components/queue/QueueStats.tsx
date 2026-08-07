import { Activity, CheckCircle2, Clock3, Users, AlertTriangle, TimerReset } from 'lucide-react'

interface QueueStatsProps {
  waiting: number
  serving: number
  completed: number
  total: number
  averageWait: number
  highPriority: number
  loading: boolean
}

const stats = [
  { key: 'waiting', label: 'Waiting', value: 'waiting', icon: Users, accent: 'bg-amber-50 text-amber-700' },
  { key: 'serving', label: 'Now Serving', value: 'serving', icon: Activity, accent: 'bg-blue-50 text-blue-700' },
  { key: 'completed', label: 'Completed', value: 'completed', icon: CheckCircle2, accent: 'bg-emerald-50 text-emerald-700' },
  { key: 'total', label: 'Total Patients', value: 'total', icon: Clock3, accent: 'bg-violet-50 text-violet-700' },
  { key: 'averageWait', label: 'Average Wait', value: 'averageWait', icon: TimerReset, accent: 'bg-sky-50 text-sky-700' },
  { key: 'highPriority', label: 'High Priority', value: 'highPriority', icon: AlertTriangle, accent: 'bg-red-50 text-red-700' },
]

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours} hr ${mins} min`
}

export function QueueStats({ waiting, serving, completed, total, averageWait, highPriority, loading }: QueueStatsProps) {
  const values = { waiting, serving, completed, total, averageWait, highPriority }

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {stats.map(({ key, label, icon: Icon, accent }) => {
        const value = values[key as keyof typeof values]
        const display = key === 'averageWait' ? formatMinutes(value as number) : value

        return (
          <div key={key} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {loading ? '—' : display}
                </p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        )
      })}
    </section>
  )
}
