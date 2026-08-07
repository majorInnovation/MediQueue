import { sendSMS, type SmsResult } from '@/lib/twilio'

const defaultCountryCode = process.env.DEFAULT_COUNTRY_CODE?.trim() || process.env.AT_DEFAULT_COUNTRY_CODE?.trim() || '260'

export type SmsLogInsertClient = {
  from(table: string): {
    insert(values: Record<string, unknown>): Promise<{ error: { message?: string } | null }>
  }
}

export type SmsDispatchParams = {
  phone: string
  message: string
  clinicId?: string | null
  patientId?: string | null
  messageType?: string
  queueRecordId?: string | null
  appointmentId?: string | null
}

// Converts a local Zambia-style number like "0977123456" to E.164 (+260977123456).
// Leaves numbers that already start with "+" untouched.
export function normalizePhone(phone: string): string {
  const trimmed = phone.trim().replace(/[\s-]/g, '')
  if (!trimmed) return ''
  if (trimmed.startsWith('+')) return trimmed
  if (trimmed.startsWith('00')) return `+${trimmed.slice(2)}`
  if (trimmed.startsWith('260')) return `+${trimmed}`
  if (/^0\d{9}$/.test(trimmed)) return `+${defaultCountryCode}${trimmed.slice(1)}`
  return `+${trimmed}`
}

export function isValidE164(phone: string): boolean {
  return /^\+\d{8,15}$/.test(phone)
}

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  const normalizedPhone = normalizePhone(to)
  const message = String(body ?? '').trim()

  if (!normalizedPhone || !isValidE164(normalizedPhone)) {
    return { status: 'failed', failureReason: 'Phone number is invalid or could not be normalized to E.164' }
  }

  if (!message) {
    return { status: 'failed', failureReason: 'SMS message body is required' }
  }

  return sendSMS({ phoneNumber: normalizedPhone, message })
}

export async function sendSmsAndLog(
  supabase: SmsLogInsertClient,
  params: SmsDispatchParams,
): Promise<SmsResult> {
  const result = await sendSms(params.phone, params.message)

  await persistSmsLog(supabase, {
    clinic_id: params.clinicId ?? null,
    patient_id: params.patientId ?? null,
    phone: normalizePhone(params.phone),
    message: params.message,
    message_type: params.messageType ?? 'general',
    status: result.status,
    external_id: result.status === 'sent' ? result.externalId : null,
    failure_reason: result.status === 'failed' ? result.failureReason : null,
    queue_record_id: params.queueRecordId ?? null,
    appointment_id: params.appointmentId ?? null,
  })

  return result
}

async function persistSmsLog(supabase: SmsLogInsertClient, values: Record<string, unknown>): Promise<void> {
  try {
    const { error } = await supabase.from('sms_logs').insert(values)
    if (error) {
      console.error('[sms] Failed to persist sms log', {
        error: error.message,
        values: {
          ...values,
          message: String(values.message ?? ''),
        },
      })
    }
  } catch (error) {
    console.error('[sms] Unexpected error while persisting sms log', { error })
  }
}
