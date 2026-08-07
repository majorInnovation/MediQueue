import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

function normalizeRecipient(raw: string): string {
  const trimmed = raw.trim().replace(/[\s-]/g, '')
  if (!trimmed) return ''
  if (trimmed.startsWith('+')) return trimmed
  if (trimmed.startsWith('00')) return `+${trimmed.slice(2)}`
  if (trimmed.startsWith('260')) return `+${trimmed}`
  if (trimmed.startsWith('0')) return `+260${trimmed.slice(1)}`
  return `+${trimmed}`
}
function getValidTwilioMessagingServiceSid(raw: string): string {
  const sid = String(raw || '').trim()
  return sid.startsWith('MG') ? sid : ''
}
serve(async (req) => {
  try {
    let requestBody: { to?: string; body?: string; from?: string } = {}
    try {
      requestBody = await req.json()
    } catch {
      requestBody = {}
    }

    const { to, body } = requestBody
    const twilioAccountSid = (Deno.env.get('TWILIO_ACCOUNT_SID') || '').trim()
    const twilioAuthToken = (Deno.env.get('TWILIO_AUTH_TOKEN') || '').trim()
    const twilioFrom = (Deno.env.get('TWILIO_PHONE_NUMBER') || '').trim()
    const twilioMessagingServiceSid = getValidTwilioMessagingServiceSid(Deno.env.get('TWILIO_MESSAGING_SERVICE_SID') || '')

    console.log('[sms] Twilio config check', {
      twilioAccountSid: Boolean(twilioAccountSid),
      twilioAuthToken: Boolean(twilioAuthToken),
      twilioFrom: Boolean(twilioFrom),
      twilioMessagingServiceSid: Boolean(twilioMessagingServiceSid),
    })

    if (!to || !body) {
      return new Response(JSON.stringify({ status: 'failed', failureReason: 'to and body are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const recipients = String(to)
      .split(',')
      .map((value) => normalizeRecipient(value))
      .filter(Boolean)

    if (!recipients.length) {
      return new Response(JSON.stringify({ status: 'failed', failureReason: 'at least one valid phone number is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!twilioAccountSid || !twilioAuthToken || (!twilioFrom && !twilioMessagingServiceSid)) {
      return new Response(JSON.stringify({ status: 'failed', failureReason: 'Twilio is not fully configured in edge function secrets' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let response: Response | undefined
    let responseText = ''
    let payload: { sid?: string; messageSid?: string; message?: string; error?: string; rawText?: string; [key: string]: unknown } = {}
    const requestPayload: Record<string, string> = {
      To: recipients[0],
      Body: String(body),
    }

    if (twilioMessagingServiceSid) {
      requestPayload.MessagingServiceSid = twilioMessagingServiceSid
    } else {
      requestPayload.From = twilioFrom
    }

    const twilioPayload = new URLSearchParams(requestPayload)
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(twilioAccountSid)}/Messages.json`

    try {
      response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: twilioPayload.toString(),
      })
      responseText = await response.text()
      try {
        payload = responseText ? JSON.parse(responseText) : {}
      } catch {
        payload = { rawText: responseText }
      }
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Unknown Twilio fetch error'
      console.error('[sms] Twilio request failed', { message, requestPayload, to, body })
      return new Response(JSON.stringify({ status: 'failed', failureReason: message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const externalId = String(payload.sid || payload.messageSid || 'unknown')

    if (!response?.ok) {
      const message = payload.message ?? payload.error ?? (typeof payload.rawText === 'string' ? payload.rawText : 'Twilio request failed')

      console.error('[sms] SMS error response', {
        status: response?.status,
        headers: Object.fromEntries(response?.headers?.entries?.() ?? []),
        body: responseText,
        errorMessage: message,
        requestPayload,
      })
      return new Response(JSON.stringify({ status: 'failed', failureReason: message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      status: 'sent',
      externalId,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[sms] handler error', { message, error })
    return new Response(JSON.stringify({ status: 'failed', failureReason: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
