import type { QueueStatus } from '@/lib/types'

export type PatientPriority = 'normal' | 'urgent' | 'emergency'
export type PatientStage = 'registered' | 'waiting' | 'called' | 'inConsultation' | 'completed'

export interface PatientStatus {
  patientId: string
  patientName: string
  queueNumber: string
  position: number
  totalInQueue: number
  estimatedWait: number
  status: QueueStatus
  priority: PatientPriority
  priorityReason: string
  clinicName: string
  assignedDoctor: string
  stage: PatientStage
  arrivalTime: string
  registrationTime: string
  estimatedConsultationTime: string
  consultationStartTime?: string
  completionTime?: string
  nextStage: string
  ticketId: string
}

export interface PatientProgress {
  currentStep: PatientStage
  completedSteps: number
  totalSteps: number
  nextStep: string
  queueRatio: number
}

export interface TimelineEvent {
  id: string
  title: string
  description: string
  timestamp: string
  completed: boolean
}

export interface LiveUpdate {
  id: string
  message: string
  category: 'queue' | 'system' | 'sms' | 'alert'
  timestamp: string
}

export interface NotificationItem {
  id: string
  title: string
  subtitle: string
  type: 'sms' | 'queue' | 'system' | 'alert' | 'appointment' | 'info'
  read: boolean
  timestamp: string
}

export interface TicketInfo {
  ticketId: string
  queueNumber: string
  patientName: string
  clinicName: string
  priority: PatientPriority
  issuedAt: string
  validUntil: string
}

export interface QueuePatientPreview {
  queueNumber: string
  displayName: string
  priority: PatientPriority
}

export interface QueueLiveStatus {
  clinicStatus: 'Operational' | 'Busy' | 'Overloaded'
  activeQueue: number
  avgWait: number
  unreadAlerts: number
  emergencyMode: boolean
  currentPatient: QueuePatientPreview
  nextPatients: QueuePatientPreview[]
}

const apiFetch = async <T>(route: string): Promise<T> => {
  const response = await fetch(route, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`Request failed ${route}`)
  }
  return response.json() as Promise<T>
}

const fallbackStatus: PatientStatus = {
  patientId: 'P-1001',
  patientName: 'John Doe',
  queueNumber: 'Q-0247',
  position: 3,
  totalInQueue: 12,
  estimatedWait: 9,
  status: 'waiting',
  priority: 'normal',
  priorityReason: 'Routine consultation request',
  clinicName: 'Central Medical Clinic',
  assignedDoctor: 'Dr. Sarah Chen',
  stage: 'waiting',
  arrivalTime: new Date(Date.now() - 17 * 60000).toISOString(),
  registrationTime: new Date(Date.now() - 22 * 60000).toISOString(),
  estimatedConsultationTime: new Date(Date.now() + 33 * 60000).toISOString(),
  consultationStartTime: undefined,
  completionTime: undefined,
  nextStage: 'Called',
  ticketId: 'TCK-202406-247',
}

const fallbackProgress: PatientProgress = {
  currentStep: 'waiting',
  completedSteps: 2,
  totalSteps: 5,
  nextStep: 'Called',
  queueRatio: 0.25,
}

const fallbackTimeline: TimelineEvent[] = [
  {
    id: 'step-1',
    title: 'Registration Received',
    description: 'Your details were submitted and verified at reception.',
    timestamp: new Date(Date.now() - 22 * 60000).toISOString(),
    completed: true,
  },
  {
    id: 'step-2',
    title: 'Assigned to Queue',
    description: 'You were assigned your queue number and waiting area.',
    timestamp: new Date(Date.now() - 17 * 60000).toISOString(),
    completed: true,
  },
  {
    id: 'step-3',
    title: 'Estimated Consultation',
    description: 'Your consultation is estimated to start soon.',
    timestamp: new Date(Date.now() + 33 * 60000).toISOString(),
    completed: false,
  },
]

const fallbackLiveUpdates: LiveUpdate[] = [
  {
    id: 'live-1',
    message: 'Patient Q-0245 has been called to consultation',
    category: 'queue',
    timestamp: new Date(Date.now() - 90 * 1000).toISOString(),
  },
  {
    id: 'live-2',
    message: 'Your queue position updated to 3',
    category: 'queue',
    timestamp: new Date(Date.now() - 20 * 1000).toISOString(),
  },
  {
    id: 'live-3',
    message: 'Doctor Chen is attending patient Q-0243',
    category: 'system',
    timestamp: new Date(Date.now() - 300 * 1000).toISOString(),
  },
]

const fallbackNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Status update',
    subtitle: 'You are next in line. Please stay close to reception.',
    type: 'queue',
    read: false,
    timestamp: new Date(Date.now() - 180 * 1000).toISOString(),
  },
  {
    id: 'notif-2',
    title: 'SMS reminder sent',
    subtitle: 'Appointment reminder sent to +260-XXX-XXX-XXXX',
    type: 'sms',
    read: true,
    timestamp: new Date(Date.now() - 1200 * 1000).toISOString(),
  },
  {
    id: 'notif-3',
    title: 'Clinic alert',
    subtitle: 'Please keep your phone nearby for fast updates.',
    type: 'alert',
    read: true,
    timestamp: new Date(Date.now() - 2400 * 1000).toISOString(),
  },
]

const fallbackTicket: TicketInfo = {
  ticketId: 'TCK-202406-247',
  queueNumber: 'Q-0247',
  patientName: 'John Doe',
  clinicName: 'Central Medical Clinic',
  priority: 'normal',
  issuedAt: new Date(Date.now() - 22 * 60000).toISOString(),
  validUntil: new Date(Date.now() + 3 * 60 * 60000).toISOString(),
}

export async function fetchPatientStatus(): Promise<PatientStatus> {
  try {
    return await apiFetch<PatientStatus>('/api/patient/status/')
  } catch {
    return fallbackStatus
  }
}

export async function fetchQueueProgress(): Promise<PatientProgress> {
  try {
    return await apiFetch<PatientProgress>('/api/queue/progress/')
  } catch {
    return fallbackProgress
  }
}

export async function fetchTimeline(): Promise<TimelineEvent[]> {
  try {
    return await apiFetch<TimelineEvent[]>('/api/queue/timeline/')
  } catch {
    return fallbackTimeline
  }
}

export async function fetchLiveUpdates(): Promise<LiveUpdate[]> {
  try {
    return await apiFetch<LiveUpdate[]>('/api/queue/live-updates/')
  } catch {
    return fallbackLiveUpdates
  }
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  try {
    const data = await apiFetch<{ notifications: any[] }>('/api/notifications/')
    const list: any[] = Array.isArray(data) ? data : (data.notifications ?? [])
    return list.map(n => ({
      id: n.id,
      title: n.title ?? '',
      subtitle: n.message ?? n.subtitle ?? '',
      type: n.type ?? 'info',
      read: n.is_read ?? n.read ?? false,
      timestamp: n.created_at ?? n.timestamp ?? new Date().toISOString(),
    }))
  } catch {
    return fallbackNotifications
  }
}

export async function fetchLiveStatus(): Promise<QueueLiveStatus> {
  try {
    return await apiFetch<QueueLiveStatus>('/api/queue/live-status/')
  } catch {
    return {
      clinicStatus: 'Operational',
      activeQueue: 12,
      avgWait: 10,
      unreadAlerts: 2,
      emergencyMode: false,
      currentPatient: {
        queueNumber: 'Q-0244',
        displayName: 'Jane Tekaxi',
        priority: 'urgent',
      },
      nextPatients: [
        { queueNumber: 'Q-0245', displayName: 'Mark N.', priority: 'normal' },
        { queueNumber: 'Q-0246', displayName: 'Lina M.', priority: 'normal' },
        { queueNumber: 'Q-0247', displayName: 'Derek S.', priority: 'emergency' },
      ],
    }
  }
}

export async function fetchTicketInfo(): Promise<TicketInfo> {
  try {
    return await apiFetch<TicketInfo>('/api/patient/ticket/')
  } catch {
    return fallbackTicket
  }
}
