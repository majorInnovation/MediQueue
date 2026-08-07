// Smart Features - AI-like recommendations and predictive analytics

export interface QueuePrediction {
  estimatedWaitTime: number // in minutes
  peakTimeWarning: boolean
  recommendedArrivalTime: string
  confidenceScore: number
}

export interface ClinicInsight {
  title: string
  description: string
  severity: 'info' | 'warning' | 'success'
  action?: string
  icon: string
}

export interface StaffRecommendation {
  staffId: string
  staffName: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  estimatedImpact: number // percentage
}

export interface TriageRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low'
  reason: string
  suggestedRoomType: string
  estimatedConsultationTime: number // in minutes
  aiConfidence: number // 0-100
}

// Predict queue wait time based on hour and day
export function predictQueueWaitTime(hour: number, dayOfWeek: number): QueuePrediction {
  // Simulate AI prediction based on historical patterns
  const baseWaitTime = 15
  const isPeakHour = hour >= 9 && hour <= 11 || hour >= 14 && hour <= 16
  const isPeakDay = dayOfWeek >= 1 && dayOfWeek <= 4 // Mon-Thu
  
  let estimatedWaitTime = baseWaitTime
  if (isPeakHour) estimatedWaitTime += 10
  if (isPeakDay) estimatedWaitTime += 5

  const peakTimeWarning = estimatedWaitTime > 25

  // Calculate optimal arrival time (30 mins before low traffic)
  const optimalHour = hour < 9 ? 8 : hour > 16 ? 17 : hour - 2
  const recommendedArrivalTime = `${String(optimalHour).padStart(2, '0')}:00`

  return {
    estimatedWaitTime,
    peakTimeWarning,
    recommendedArrivalTime,
    confidenceScore: 0.87,
  }
}

// Generate clinic insights based on current data
export function generateClinicInsights(
  totalPatients: number,
  waitingPatients: number,
  avgWaitTime: number,
  staffOnDuty: number,
): ClinicInsight[] {
  const insights: ClinicInsight[] = []

  // High queue insight
  if (waitingPatients > 20) {
    insights.push({
      title: 'High Patient Volume Detected',
      description: `You have ${waitingPatients} patients waiting. Consider calling additional staff.`,
      severity: 'warning',
      action: 'Call Additional Staff',
      icon: 'AlertCircle',
    })
  }

  // Long wait time insight
  if (avgWaitTime > 30) {
    insights.push({
      title: 'Extended Wait Times',
      description: `Average wait time is ${avgWaitTime} minutes. Staff allocation may need adjustment.`,
      severity: 'warning',
      action: 'Optimize Schedule',
      icon: 'Clock',
    })
  }

  // Optimal performance insight
  if (avgWaitTime < 15 && waitingPatients < 10) {
    insights.push({
      title: 'Excellent Performance',
      description: 'Your clinic is operating at optimal efficiency with minimal wait times.',
      severity: 'success',
      icon: 'Zap',
    })
  }

  // Staff efficiency insight
  const patientsPerStaff = totalPatients / Math.max(staffOnDuty, 1)
  if (patientsPerStaff > 30) {
    insights.push({
      title: 'Staff Workload High',
      description: `Each staff member is handling ${Math.round(patientsPerStaff)} patients. Consider overtime or additional staff.`,
      severity: 'warning',
      action: 'Add Staff',
      icon: 'Users',
    })
  }

  // Positive staffing insight
  if (patientsPerStaff < 15 && totalPatients > 0) {
    insights.push({
      title: 'Optimal Staff Allocation',
      description: 'Your staff-to-patient ratio is excellent, ensuring quality care.',
      severity: 'success',
      icon: 'CheckCircle',
    })
  }

  return insights
}

// Recommend staff members for specific tasks
export function recommendStaffForTask(
  availableStaff: Array<{
    id: string
    name: string
    role: string
    tasksCompleted: number
    avgRating: number
    specializations: string[]
  }>,
  taskType: string,
): StaffRecommendation[] {
  const recommendations: StaffRecommendation[] = []

  const filteredStaff = availableStaff
    .filter((s) => {
      if (taskType === 'triage' && s.role !== 'Nurse') return false
      if (taskType === 'consultation' && s.role === 'Receptionist') return false
      return true
    })
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 3)

  filteredStaff.forEach((staff, index) => {
    recommendations.push({
      staffId: staff.id,
      staffName: staff.name,
      reason:
        index === 0
          ? `Highest rated for ${taskType} tasks (${staff.avgRating.toFixed(1)}/5)`
          : `Experienced with ${taskType}`,
      priority: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
      estimatedImpact: 100 - index * 10,
    })
  })

  return recommendations
}

// Generate smart triage recommendations
export function generateTriageRecommendation(symptoms: string[], vitalSigns: {
  temperature?: number
  bloodPressure?: string
  heartRate?: number
}): TriageRecommendation {
  let priority: 'critical' | 'high' | 'medium' | 'low' = 'low'
  let aiConfidence = 0.75
  let reason = ''
  let suggestedRoomType = 'General Consultation'
  let estimatedConsultationTime = 20

  // Simple symptom-based triage logic
  const criticalSymptoms = ['chest pain', 'difficulty breathing', 'severe bleeding', 'unconscious']
  const urgentSymptoms = ['high fever', 'severe pain', 'allergic reaction']

  const hasCritical = symptoms.some((s) =>
    criticalSymptoms.some((cs) => s.toLowerCase().includes(cs)),
  )
  const hasUrgent = symptoms.some((s) =>
    urgentSymptoms.some((us) => s.toLowerCase().includes(us)),
  )

  if (hasCritical) {
    priority = 'critical'
    reason = 'Potentially life-threatening symptoms detected'
    suggestedRoomType = 'Emergency/ICU'
    estimatedConsultationTime = 45
    aiConfidence = 0.95
  } else if (hasUrgent) {
    priority = 'high'
    reason = 'Urgent symptoms requiring immediate attention'
    suggestedRoomType = 'Urgent Care'
    estimatedConsultationTime = 30
    aiConfidence = 0.88
  } else if (symptoms.length > 2) {
    priority = 'medium'
    reason = 'Multiple symptoms requiring evaluation'
    suggestedRoomType = 'Standard Consultation'
    estimatedConsultationTime = 25
    aiConfidence = 0.82
  } else {
    priority = 'low'
    reason = 'Routine check-up or minor concern'
    suggestedRoomType = 'General Consultation'
    estimatedConsultationTime = 15
    aiConfidence = 0.78
  }

  return {
    priority,
    reason,
    suggestedRoomType,
    estimatedConsultationTime,
    aiConfidence,
  }
}

// Calculate optimal clinic schedule
export function generateScheduleOptimization(
  peakHours: number[],
  currentStaff: number,
  targetWaitTime: number = 15,
): {
  recommendation: string
  staffNeeded: number
  estimatedImprovement: number
  implementationDifficulty: 'easy' | 'medium' | 'hard'
} {
  const avgPeakHours = peakHours.length
  const staffPerPeakHour = Math.ceil(avgPeakHours / 3)
  const totalStaffNeeded = currentStaff + staffPerPeakHour

  return {
    recommendation: `Increase staff by ${staffPerPeakHour} during peak hours (${peakHours.join(', ')}:00)`,
    staffNeeded: staffPerPeakHour,
    estimatedImprovement: 35, // percentage reduction in wait time
    implementationDifficulty: 'medium',
  }
}

// Patient no-show prediction
export function predictNoShowRisk(
  appointmentType: string,
  timeOfDay: string,
  dayOfWeek: number,
  patientHistory: { missedAppointments: number; totalAppointments: number },
): {
  riskLevel: 'high' | 'medium' | 'low'
  riskScore: number
  suggestedReminder: string
} {
  let baseRisk = 10 // percentage
  const patientMissRate = (patientHistory.missedAppointments / Math.max(patientHistory.totalAppointments, 1)) * 100

  // Add factors
  if (timeOfDay === 'morning') baseRisk += 5
  if (dayOfWeek === 0 || dayOfWeek === 6) baseRisk += 15 // weekend
  if (appointmentType === 'follow-up') baseRisk += 8
  
  baseRisk += patientMissRate * 0.5

  const riskScore = Math.min(100, baseRisk)
  let riskLevel: 'high' | 'medium' | 'low' = 'low'
  let suggestedReminder = 'Email reminder'

  if (riskScore > 60) {
    riskLevel = 'high'
    suggestedReminder = 'SMS + Phone call 24 hours before'
  } else if (riskScore > 30) {
    riskLevel = 'medium'
    suggestedReminder = 'SMS reminder 24 hours before'
  }

  return { riskLevel, riskScore, suggestedReminder }
}
