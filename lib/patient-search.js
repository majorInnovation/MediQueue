function normalizePatientSearchText(patient) {
  const values = [
    patient?.patient_number,
    patient?.first_name,
    patient?.last_name,
    patient?.name,
    patient?.phone_number,
    patient?.phone,
  ].filter(value => value !== null && value !== undefined && value !== '')

  return values.map(value => String(value)).join(' ').toLowerCase()
}

function matchesPatientSearch(patient, query) {
  const search = (query ?? '').trim().toLowerCase()
  if (!search) return true
  return normalizePatientSearchText(patient).includes(search)
}

module.exports = {
  normalizePatientSearchText,
  matchesPatientSearch,
}
