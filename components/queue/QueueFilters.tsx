import { Filter, RotateCcw, Search } from 'lucide-react'

interface QueueFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  deptFilter: string
  onDeptChange: (value: string) => void
  statusFilter: string
  onStatusChange: (value: string) => void
  departments: string[]
  statuses: Array<{ value: string; label: string }>
  onReset: () => void
}

export function QueueFilters({
  search,
  onSearchChange,
  deptFilter,
  onDeptChange,
  statusFilter,
  onStatusChange,
  departments,
  statuses,
  onReset,
}: QueueFiltersProps) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search patient, phone number, queue number..."
            aria-label="Search queue"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={deptFilter}
              onChange={(event) => onDeptChange(event.target.value)}
              aria-label="Filter by department"
              className="bg-transparent text-sm text-slate-700 outline-none"
            >
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(event) => onStatusChange(event.target.value)}
              aria-label="Filter by status"
              className="bg-transparent text-sm text-slate-700 outline-none"
            >
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <RotateCcw className="h-4 w-4" /> Reset Filters
          </button>
        </div>
      </div>
    </div>
  )
}
