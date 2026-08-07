import { Activity, AlertCircle, Clock3, UserPlus, Users } from 'lucide-react'

interface QueueSidebarProps {
  waiting: number
  completed: number
  total: number
  highPriority: number
  averageWait: number
  departments: Array<{ name: string; value: number; color: string }>
}

export function QueueSidebar({ waiting, completed, total, highPriority, averageWait, departments }: QueueSidebarProps) {
  return (
    <aside className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-4 lg:h-fit">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {[
          { label: 'Patients Registered', value: total, icon: UserPlus, accent: 'text-blue-700 bg-blue-50' },
          { label: 'Completed', value: completed, icon: Activity, accent: 'text-emerald-700 bg-emerald-50' },
          { label: 'Waiting', value: waiting, icon: Users, accent: 'text-amber-700 bg-amber-50' },
          { label: 'Emergency Cases', value: highPriority, icon: AlertCircle, accent: 'text-red-700 bg-red-50' },
        ].map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${accent}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="text-xl font-semibold text-slate-900">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-slate-500" />
          <p className="text-sm font-semibold text-slate-800">Average Wait</p>
        </div>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{averageWait} min</p>
        <p className="mt-1 text-sm text-slate-500">Estimated time for patients currently in the queue.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-800">Department Distribution</p>
        <div className="mt-4 space-y-3">
          {departments.map((department) => (
            <div key={department.name}>
              <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                <span>{department.name}</span>
                <span>{department.value}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200">
                <div className={`h-2 rounded-full ${department.color}`} style={{ width: `${Math.max(8, department.value * 12)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
