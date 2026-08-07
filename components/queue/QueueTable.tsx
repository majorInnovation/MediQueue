import { ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react'
import { QueueRow } from './QueueRow'
import { EmptyState } from './EmptyState'
import { LoadingSkeleton } from './LoadingSkeleton'

type QueueStatus = 'waiting' | 'called' | 'inConsultation' | 'completed' | 'missed' | 'cancelled'
type Priority = 'critical' | 'high' | 'medium' | 'low'

type QueueRowData = {
  id: string
  queue_number: string
  status: QueueStatus
  priority: Priority
  department: string
  symptoms: string[]
  created_at: string
  called_at: string | null
  assigned_doctor_id: string | null
  patients: { id: string; patient_number?: string | null; first_name?: string | null; last_name?: string | null; name?: string | null; phone?: string | null; phone_number?: string | null; date_of_birth: string | null } | null
  staff_members: { id: string; name: string; role: string } | null
}

interface QueueTableProps {
  rows: QueueRowData[]
  loading: boolean
  currentRows: QueueRowData[]
  page: number
  totalPages: number
  pageSize: number
  filteredCount: number
  actionLoading: string | null
  staffList: Array<{ id: string; name: string; role: string; department: string | null }>
  onAssignStaff: (queueRecordId: string, staffId: string) => Promise<void>
  onAction: (queueRecordId: string, action: string, staffId?: string | null) => Promise<void>
  onPageChange: (page: number) => void
  onRegister: () => void
  onView?: (id: string) => void
}

export function QueueTable({
  rows,
  loading,
  currentRows,
  page,
  totalPages,
  pageSize,
  filteredCount,
  actionLoading,
  staffList,
  onAssignStaff,
  onAction,
  onPageChange,
  onRegister,
  onView,
}: QueueTableProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Queue Overview</h2>
          <p className="text-sm text-slate-500">Clinical workflow and patient progression in one place.</p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
          {filteredCount} records
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-4 sm:p-6">
            <LoadingSkeleton />
          </div>
        ) : currentRows.length === 0 ? (
          <div className="p-6 sm:p-8">
            <EmptyState onRegister={onRegister} />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Queue Number', 'Patient', 'Department', 'Assigned Staff', 'Priority / Status', 'Waiting Time', 'Actions'].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left font-semibold text-slate-600 sm:px-5">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {currentRows.map((row) => (
                <QueueRow
                  key={row.id}
                  row={row}
                  staffList={staffList}
                  actionLoading={actionLoading}
                  onAssignStaff={onAssignStaff}
                  onAction={onAction}
                  onView={onView}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && rows.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="text-sm text-slate-500">
            Showing {Math.min(pageSize, filteredCount)} of {filteredCount} patients
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-16 text-center text-sm font-semibold text-slate-700">{page}/{totalPages}</span>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
