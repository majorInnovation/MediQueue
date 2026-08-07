import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSms } from '@/lib/sms'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles').select('clinic_id').eq('id', user.id).single()
  const clinicId = profile?.clinic_id
  if (!clinicId) return NextResponse.json({ error: 'No clinic' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const type   = searchParams.get('type')
  const today  = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('sms_logs')
    .select(`
      id, phone, message, message_type, status, sent_at, delivered_at, failure_reason, external_id,
      patients(id, name),
      queue_records(department, queue_number)
    `)
    .eq('clinic_id', clinicId)
    .gte('sent_at', `${today}T00:00:00`)
    .order('sent_at', { ascending: false })

  if (status && status !== 'All') query = query.eq('status', status)
  if (type   && type   !== 'All') query = query.eq('message_type', type)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ logs: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { smsLogId } = await request.json()

  const { data: existing, error: fetchError } = await supabase
    .from('sms_logs').select('phone, message').eq('id', smsLogId).single()
  if (fetchError || !existing) return NextResponse.json({ error: fetchError?.message ?? 'Log not found' }, { status: 404 })

  try {
    const result = await sendSms(existing.phone, existing.message)

    const { data, error } = await supabase
      .from('sms_logs')
      .update({
        status: result.status,
        external_id: result.status === 'sent' ? result.externalId : null,
        failure_reason: result.status === 'failed' ? result.failureReason : null,
        sent_at: new Date().toISOString(),
      })
      .eq('id', smsLogId)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ log: data })
  } catch (error) {
    console.error('[sms-logs] Retry failed', { smsLogId, error })
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to retry SMS' }, { status: 500 })
  }
}
