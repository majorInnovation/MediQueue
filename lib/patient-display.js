function calculateAge(dob) {
  if (!dob) return null

  const birthDate = new Date(dob)
  if (Number.isNaN(birthDate.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1
  }

  return age
}

function formatGender(value) {
  if (!value) return '—'

  const normalized = String(value).trim()
  if (!normalized) return '—'

  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function formatPatientNumber(value) {
  if (!value) return '—'
  return String(value)
}

function normalizePatientRecord(patient) {
  const firstName = patient?.first_name ?? ''
  const lastName = patient?.last_name ?? ''
  const nameFromParts = [firstName, lastName].filter(Boolean).join(' ').trim()
  const displayName = patient?.full_name || patient?.name || nameFromParts || '—'
  const phone = patient?.phone || patient?.phone_number || null
  const gender = patient?.gender ? formatGender(patient.gender) : '—'
  const age = typeof patient?.age === 'number' && !Number.isNaN(patient.age)
    ? patient.age
    : calculateAge(patient?.date_of_birth)

  return {
    ...patient,
    id: patient?.id ?? '',
    patient_number: patient?.patient_number ?? null,
    name: displayName,
    full_name: displayName,
    first_name: firstName || patient?.name || null,
    last_name: lastName || null,
    phone,
    phone_number: phone,
    gender,
    age,
    date_of_birth: patient?.date_of_birth ?? null,
  }
}

module.exports = {
  calculateAge,
  formatGender,
  formatPatientNumber,
  normalizePatientRecord,
}
