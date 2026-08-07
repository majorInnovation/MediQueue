import { Plus, Users } from 'lucide-react'

export function EmptyState({ onRegister }: { onRegister?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
        <Users className="h-7 w-7 text-slate-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">No patients in queue</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500">The queue is currently clear. Register a new patient to begin the next visit.</p>
      <button
        type="button"
        onClick={onRegister}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
      >
        <Plus className="h-4 w-4" /> Register Patient
      </button>
    </div>
  )
}
