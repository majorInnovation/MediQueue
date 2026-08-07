type SupabaseLikeClient = {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: unknown): {
        maybeSingle(): Promise<{ data: { name?: string | null } | null }>
      }
    }
  }
}

function sanitizeText(value: unknown, fallback: string): string {
  const text = String(value ?? '').trim()
  return text || fallback
}

function compactTemplate(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

export function createRegistrationSMS(params: {
  clinicName?: string | null
  patientName?: string | null
  patientNumber?: string | null
  queueNumber?: string | null
  estimatedTime?: string | null
}): string {
  const clinicName = sanitizeText(params.clinicName, 'Mukuba Clinic')
  const patientName = sanitizeText(params.patientName, 'Patient')
  const patientNumber = sanitizeText(params.patientNumber, '0001/26')
  const queueNumber = sanitizeText(params.queueNumber, 'C-001')
  const estimatedTime = sanitizeText(params.estimatedTime, '15 minutes')

  return [
    `${clinicName}`,
    `Hello ${patientName},`,
    'You have been successfully registered.',
    `Patient Number: ${patientNumber}`,
    `Queue Number: ${queueNumber}`,
    `Estimated Waiting Time: ${estimatedTime}`,
    'Please keep your Patient Number for future visits.',
  ].join('\n')
}

export function createAppointmentConfirmationSMS(params: {
  clinicName?: string | null
  patientName?: string | null
  appointmentDate?: string | null
  appointmentTime?: string | null
}): string {
  const clinicName = sanitizeText(params.clinicName, 'Clinic')
  const patientName = sanitizeText(params.patientName, 'Patient')
  const appointmentDate = sanitizeText(params.appointmentDate, 'your appointment date')
  const appointmentTime = sanitizeText(params.appointmentTime, 'your appointment time')

  return compactTemplate(
    `${clinicName}: Hello ${patientName}, your appointment has been successfully scheduled. Date: ${appointmentDate}. Time: ${appointmentTime}. Please arrive 15 minutes before your appointment. We look forward to serving you.`,
  )
}

export function createAppointmentReminderSMS(params: {
  clinicName?: string | null
  patientName?: string | null
  appointmentDate?: string | null
  appointmentTime?: string | null
}): string {
  const clinicName = sanitizeText(params.clinicName, 'Clinic')
  const patientName = sanitizeText(params.patientName, 'Patient')
  const appointmentDate = sanitizeText(params.appointmentDate, 'your appointment date')
  const appointmentTime = sanitizeText(params.appointmentTime, 'your appointment time')

  return compactTemplate(
    `${clinicName} Reminder: Hello ${patientName}, this is a reminder of your appointment scheduled for ${appointmentDate} at ${appointmentTime}. Please arrive on time. Thank you for choosing ${clinicName}.`,
  )
}

export function createTurnApproachingSMS(params: {
  clinicName?: string | null
  patientName?: string | null
}): string {
  const clinicName = sanitizeText(params.clinicName, 'Clinic')
  const patientName = sanitizeText(params.patientName, 'Patient')

  return compactTemplate(
    `${clinicName}: Hello ${patientName}, your turn is approaching. You are currently next in queue. Please proceed to the waiting area. Thank you.`,
  )
}

export function createPatientCalledSMS(params: {
  clinicName?: string | null
  patientName?: string | null
}): string {
  const clinicName = sanitizeText(params.clinicName, 'Clinic')
  const patientName = sanitizeText(params.patientName, 'Patient')

  return compactTemplate(
    `${clinicName}: Hello ${patientName}, it is now your turn to be attended to. Please proceed to the consultation area. Thank you.`,
  )
}

export async function getClinicDisplayName(supabase: SupabaseLikeClient, clinicId: string | null | undefined): Promise<string> {
  if (!clinicId) return 'Clinic'

  const { data } = await supabase
    .from('clinics')
    .select('name')
    .eq('id', clinicId)
    .maybeSingle()

  return sanitizeText(data?.name, 'Clinic')
}
