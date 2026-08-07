export type SmsResult =
  | { status: 'sent'; externalId: string }
  | { status: 'failed'; failureReason: string }

function getTwilioAccountSid(): string {
  return (process.env.TWILIO_ACCOUNT_SID || '').trim()
}

function getTwilioAuthToken(): string {
  return (process.env.TWILIO_AUTH_TOKEN || '').trim()
}

function isE164(phone: string): boolean {
  return /^\+\d{8,15}$/.test(phone)
}

function getTwilioPhoneNumber(): string {
  const number = (process.env.TWILIO_PHONE_NUMBER || '').trim()
  return isE164(number) ? number : ''
}

function getTwilioMessagingServiceSid(): string {
  const sid = (process.env.TWILIO_MESSAGING_SERVICE_SID || '').trim()
  return sid.startsWith('MG') ? sid : ''
}

function getTwilioBasicAuth(): string {
  const accountSid = getTwilioAccountSid()
  const authToken = getTwilioAuthToken()
  const credentials = `${accountSid}:${authToken}`

  if (typeof btoa === 'function') {
    return `Basic ${btoa(credentials)}`
  }

  return `Basic ${Buffer.from(credentials).toString('base64')}`
}

export async function sendSMS(params: { phoneNumber: string; message: string }): Promise<SmsResult> {
  const phoneNumber = String(params.phoneNumber || '').trim()
  const message = String(params.message || '').trim()
  const accountSid = getTwilioAccountSid()
  const authToken = getTwilioAuthToken()
  const fromNumber = getTwilioPhoneNumber()
  const messagingServiceSid = getTwilioMessagingServiceSid()
  const useMessagingServiceSid = Boolean(messagingServiceSid)

  if (!phoneNumber) {
    return { status: 'failed', failureReason: 'Phone number is required' }
  }

  if (!message) {
    return { status: 'failed', failureReason: 'SMS message body is required' }
  }

  if (!accountSid || !authToken || (!fromNumber && !useMessagingServiceSid)) {
    return { status: 'failed', failureReason: 'Twilio is not fully configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER (valid E.164) or a valid TWILIO_MESSAGING_SERVICE_SID (MG...).'}
  }

  if (fromNumber && fromNumber === phoneNumber) {
    return { status: 'failed', failureReason: 'Recipient cannot be the same as the Twilio sender phone number.' }
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`
  const body = new URLSearchParams({
    To: phoneNumber,
    Body: message,
  })

  if (useMessagingServiceSid) {
    body.set('MessagingServiceSid', messagingServiceSid)
  } else {
    body.set('From', fromNumber)
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: getTwilioBasicAuth(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  const rawBody = await response.text()
  let data: Record<string, unknown> = {}
  try {
    data = rawBody ? JSON.parse(rawBody) : {}
  } catch {
    data = { rawBody }
  }

  if (!response.ok) {
    const failureReason = String(
      data.message ?? data.error ?? data.error_message ?? rawBody ?? 'Twilio send failed',
    )
    console.error('[twilio] send failed', { status: response.status, phoneNumber, message, rawBody })
    return { status: 'failed', failureReason }
  }

  return {
    status: 'sent',
    externalId: String(data.sid ?? data.messageSid ?? 'unknown'),
  }
}
