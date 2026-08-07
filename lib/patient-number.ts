export function buildPatientNumber(sequence: number, year: number = new Date().getFullYear()): string {
  const suffix = String(year).slice(-2)
  return `${String(sequence).padStart(4, '0')}/${suffix}`
}

export function formatNrcInput(value: string): string {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 9)
  if (digits.length <= 6) return digits
  if (digits.length <= 8) return `${digits.slice(0, 6)}/${digits.slice(6)}`
  return `${digits.slice(0, 6)}/${digits.slice(6, 8)}/${digits.slice(8, 9)}`
}

export function validateNrc(value: string | null | undefined): boolean {
  return /^\d{6}\/\d{2}\/\d$/.test(String(value ?? '').trim())
}

function isSchemaError(error: { message?: string } | null | undefined): boolean {
  const message = error?.message ?? ''
  return /column .* does not exist|relation .* does not exist|function .* does not exist|does not exist|could not find/i.test(message)
}

export async function getNextPatientNumber(supabase: any, year: number = new Date().getFullYear()): Promise<string> {
  const { data, error } = await supabase.rpc('get_next_patient_number', { p_year: year })
  if (!error && typeof data === 'string' && data) return data

  if (error && !isSchemaError(error)) {
    console.warn('[patient-number] RPC failed, falling back to legacy scan', error.message)
  }

  const { count, error: queryError } = await supabase
    .from('patients')
    .select('id', { count: 'exact', head: true })

  if (queryError && !isSchemaError(queryError)) throw queryError

  const nextSequence = (typeof count === 'number' ? count : 0) + 1
  return buildPatientNumber(nextSequence, year)
}
