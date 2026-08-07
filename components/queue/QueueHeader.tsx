import Link from 'next/link'
import { CalendarDays, Download, LogOut, RefreshCw, Plus, PhoneCall, Circle } from 'lucide-react'

interface QueueHeaderProps {
  todayLabel: string
  lastSynced: string
  loading: boolean
  onRefresh: () => void
  onExport: () => void
  onCallNext: () => void
  onRegister: () => void
}

export function QueueHeader({
  todayLabel,
  lastSynced,
  loading,
  onRefresh,
  onExport,
  onCallNext,
  onRegister,
}: QueueHeaderProps) {
  return (
    <header className="rounded-[28px] border border-slate-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-600">Queue Management</p>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Manage today&apos;s patient flow</h1>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-500">Monitor arrivals, calls, and completion stages in real time.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">{todayLabel}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500" />
              <span>Live</span>
              <span>•</span>
              <span>Last synced: {loading ? 'syncing...' : lastSynced}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onRegister}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <Plus className="h-4 w-4" /> Register Patient
          </button>
          <button
            type="button"
            onClick={onCallNext}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 lg:sticky lg:top-4"
          >
            <PhoneCall className="h-4 w-4" /> Call Next
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-100"
            aria-label="Refresh queue"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <Link
            href="/api/auth/logout"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Link>
        </div>
      </div>
    </header>
  )
}
