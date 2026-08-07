function sanitizeText(value, fallback) {
  const text = String(value ?? '').trim()
  return text || fallback
}

function compactTemplate(value) {
  return value.replace(/\s+/g, ' ').trim()
}

function createRegistrationSMS(params) {
  const clinicName = sanitizeText(params?.clinicName, 'Clinic')
  const patientName = sanitizeText(params?.patientName, 'Patient')
  const queueNumber = sanitizeText(params?.queueNumber, 'TBD')
  const estimatedTime = sanitizeText(params?.estimatedTime, 'TBD')

  return compactTemplate(
    `${clinicName}: Hello ${patientName}, your registration is complete. Queue Number: ${queueNumber}. Estimated wait time: ${estimatedTime}. You will receive an update when your turn is approaching. Thank you.`,
  )
}

function createAppointmentConfirmationSMS(params) {
  const clinicName = sanitizeText(params?.clinicName, 'Clinic')
  const patientName = sanitizeText(params?.patientName, 'Patient')
  const appointmentDate = sanitizeText(params?.appointmentDate, 'your appointment date')
  const appointmentTime = sanitizeText(params?.appointmentTime, 'your appointment time')

  return compactTemplate(
    `${clinicName}: Hello ${patientName}, your appointment has been successfully scheduled. Date: ${appointmentDate}. Time: ${appointmentTime}. Please arrive 15 minutes before your appointment. We look forward to serving you.`,
  )
}

function createAppointmentReminderSMS(params) {
  const clinicName = sanitizeText(params?.clinicName, 'Clinic')
  const patientName = sanitizeText(params?.patientName, 'Patient')
  const appointmentDate = sanitizeText(params?.appointmentDate, 'your appointment date')
  const appointmentTime = sanitizeText(params?.appointmentTime, 'your appointment time')

  return compactTemplate(
    `${clinicName} Reminder: Hello ${patientName}, this is a reminder of your appointment scheduled for ${appointmentDate} at ${appointmentTime}. Please arrive on time. Thank you for choosing ${clinicName}.`,
  )
}

function createTurnApproachingSMS(params) {
  const clinicName = sanitizeText(params?.clinicName, 'Clinic')
  const patientName = sanitizeText(params?.patientName, 'Patient')

  return compactTemplate(
    `${clinicName}: Hello ${patientName}, your turn is approaching. You are currently next in queue. Please proceed to the waiting area. Thank you.`,
  )
}

function createPatientCalledSMS(params) {
  const clinicName = sanitizeText(params?.clinicName, 'Clinic')
  const patientName = sanitizeText(params?.patientName, 'Patient')

  return compactTemplate(
    `${clinicName}: Hello ${patientName}, it is now your turn to be attended to. Please proceed to the consultation area. Thank you.`,
  )
}

async function getClinicDisplayName(supabase, clinicId) {
  if (!clinicId) return 'Clinic'

  const { data } = await supabase
    .from('clinics')
    .select('name')
    .eq('id', clinicId)
    .maybeSingle()

  return sanitizeText(data?.name, 'Clinic')
}

module.exports = {
  createRegistrationSMS,
  createAppointmentConfirmationSMS,
  createAppointmentReminderSMS,
  createTurnApproachingSMS,
  createPatientCalledSMS,
  getClinicDisplayName,
}
