import { CheckCircle2, MoreHorizontal, Stethoscope, Trash2, UserRound, Clock3 } from 'lucide-react'
import { PriorityBadge } from './PriorityBadge'
import { StatusBadge } from './StatusBadge'

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

interface QueueRowProps {
  row: QueueRowData
  staffList: Array<{ id: string; name: string; role: string; department: string | null }>
  actionLoading: string | null
  onAssignStaff: (queueRecordId: string, staffId: string) => Promise<void>
  onAction: (queueRecordId: string, action: string, staffId?: string | null) => Promise<void>
  onView?: (id: string) => void
}

function calcAge(dob: string | null) {
  if (!dob) return '—'
  return String(Math.floor((Date.now() - new Date(dob).getTime()) / 3.156e10))
}

function waitMins(createdAt: string) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
}

function formatWait(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours} hr ${mins} min`
}

export function QueueRow({ row, staffList, actionLoading, onAssignStaff, onAction, onView }: QueueRowProps) {
  const patientName = row.patients?.name ?? (([row.patients?.first_name, row.patients?.last_name].filter(Boolean) as string[]).join(' ') || '—')
  const patientId = row.patients?.patient_number ?? '—'
  const phone = row.patients?.phone_number || row.patients?.phone || '—'
  const waitingMinutes = waitMins(row.created_at)
  const assignedName = row.staff_members?.name ?? 'Unassigned'
  const assignedRole = row.staff_members?.role === 'doctor' ? 'Doctor' : row.staff_members?.role === 'nurse' ? 'Nurse' : 'Staff'

  return (
    <tr className="border-b border-slate-200 bg-white text-sm transition hover:bg-slate-50">
      <td className="px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{row.queue_number}</p>
            <p className="text-xs text-slate-500">{patientId}</p>
          </div>
        </div>
      </td>

      <td className="px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <UserRound className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{patientName}</p>
            <p className="text-xs text-slate-500">{phone} • {calcAge(row.patients?.date_of_birth ?? null)} yrs</p>
          </div>
        </div>
      </td>

      <td className="px-4 py-4 sm:px-5">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{row.department}</span>
      </td>

      <td className="px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            {row.staff_members?.name ? <Stethoscope className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{assignedName}</p>
            <p className="text-xs text-slate-500">{row.staff_members ? `${assignedRole} • Room ${row.department}` : 'Unassigned'}</p>
          </div>
        </div>
      </td>

      <td className="px-4 py-4 sm:px-5">
        <div className="space-y-2">
          <PriorityBadge priority={row.priority} />
          <StatusBadge status={row.status} />
        </div>
      </td>

      <td className="px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Clock3 className="h-4 w-4 text-slate-400" />
          <span>{formatWait(waitingMinutes)}</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">Waiting since {new Date(row.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
      </td>

      <td className="px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          {row.status === 'called' && (
            <button
              type="button"
              onClick={() => onAction(row.id, 'start')}
              disabled={actionLoading === `${row.id}start`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
            >
              <Stethoscope className="h-3.5 w-3.5" /> Serve
            </button>
          )}
          {row.status === 'inConsultation' && (
            <button
              type="button"
              onClick={() => onAction(row.id, 'complete')}
              disabled={actionLoading === `${row.id}complete`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Complete
            </button>
          )}
          <button
            type="button"
            onClick={() => onView?.(row.id)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <MoreHorizontal className="h-3.5 w-3.5" /> View
          </button>
          {(row.status === 'waiting' || row.status === 'called') && (
            <button
              type="button"
              onClick={() => onAction(row.id, 'cancel')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
            >
              <Trash2 className="h-3.5 w-3.5" /> Cancel
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
