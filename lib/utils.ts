import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { priorityStyles, statusStyles } from './colors'
import type { Priority, QueueStatus } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

// Format time
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d)
}

// Format datetime
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`
}

// Calculate age from DOB
export function calculateAge(dob: Date): number {
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  return age
}

// Get priority label
export function getPriorityLabel(priority: Priority): string {
  const labels: Record<Priority, string> = {
    critical: 'Critical',
    high: 'High Priority',
    medium: 'Medium',
    low: 'Low',
  }
  return labels[priority]
}

// Get priority styles
export function getPriorityClasses(priority: Priority) {
  return priorityStyles[priority]
}

// Get status label
export function getStatusLabel(status: QueueStatus): string {
  const labels: Record<QueueStatus, string> = {
    waiting: 'Waiting',
    called: 'Called',
    inConsultation: 'In Consultation',
    completed: 'Completed',
    missed: 'Missed',
    cancelled: 'Cancelled',
  }
  return labels[status]
}

// Get status styles
export function getStatusClasses(status: QueueStatus): string {
  return statusStyles[status]
}

// Generate queue number
export function generateQueueNumber(sequence: number): string {
  return `Q${String(sequence).padStart(4, '0')}`
}

// Calculate risk score based on patient data
export function calculateRiskScore(
  age: number,
  isPregnant: boolean,
  hasChronicConditions: boolean,
  isEmergency: boolean,
): number {
  let score = 0
  if (isEmergency) score += 40
  if (isPregnant) score += 30
  if (hasChronicConditions) score += 20
  if (age > 65 || age < 5) score += 10
  return Math.min(100, score)
}

// Smart-triage score used by the front-desk patient registration form.
// Weighs emergency flag, pain, pregnancy, disability, age extremes, symptom
// load, and vitals (any one of which can independently push a patient into
// a higher priority band even if the others look normal).
export function calculateTriageScore(input: {
  age?: number
  isEmergency: boolean
  symptomsCount: number
  painLevel: number // 0-10
  pregnancyStatus: 'pregnant' | 'not-pregnant' | 'unknown' | 'n/a'
  hasDisability: boolean
  vitals?: {
    temperature?: number
    heartRate?: number
    oxygenSaturation?: number
  }
}): number {
  let score = 0
  if (input.isEmergency) score += 40
  if (input.pregnancyStatus === 'pregnant') score += 15
  if (input.hasDisability) score += 10
  if (input.painLevel >= 7) score += 20
  else if (input.painLevel >= 4) score += 10
  if (typeof input.age === 'number' && (input.age >= 65 || input.age <= 5)) score += 10
  score += Math.min(10, input.symptomsCount * 2)

  const v = input.vitals
  if (v?.oxygenSaturation != null && v.oxygenSaturation < 92) score += 20
  if (v?.heartRate != null && (v.heartRate > 120 || v.heartRate < 50)) score += 10
  if (v?.temperature != null && v.temperature >= 39) score += 10

  return Math.min(100, score)
}

// Determine priority level based on risk score
export function determinePriority(riskScore: number): Priority {
  if (riskScore >= 70) return 'critical'
  if (riskScore >= 50) return 'high'
  if (riskScore >= 25) return 'medium'
  return 'low'
}

// Calculate waiting time
export function calculateWaitingTime(arrivalTime: Date): number {
  const now = new Date()
  const diff = now.getTime() - arrivalTime.getTime()
  return Math.floor(diff / (1000 * 60))
}

// Format minutes to readable time
export function formatMinutesToTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}min`
}

// Generate initials
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
