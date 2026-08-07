import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { data: profile } = await supabase.from('user_profiles').select('clinic_id').eq('id', user.id).single()
  if (!profile?.clinic_id) return NextResponse.json({ error: 'No clinic' }, { status: 403 })

  const { data, error } = await supabase
    .from('patients')
    .select(`
      id,
      patient_number,
      first_name,
      last_name,
      phone_number,
      gender,
      age,
      date_of_birth,
      national_id,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      created_at,
      updated_at,
      patient_visits (
        id,
        chief_complaint,
        symptoms,
        symptom_duration,
        pain_level,
        additional_notes,
        triage_priority,
        created_at,
        queue_id,
        queue:queue_id (
          id,
          queue_number,
          status,
          priority,
          estimated_wait,
          created_at,
          clinic_id
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ patient: data })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const relatedQueue = await supabase.from('queue_records').select('id').eq('patient_id', id)
    const queueIds = (relatedQueue.data ?? []).map((row: { id: string }) => row.id)

    if (queueIds.length > 0) {
      await supabase.from('triage_assessments').delete().in('queue_record_id', queueIds)
      await supabase.from('sms_logs').delete().in('queue_record_id', queueIds)
    }

    await supabase.from('sms_logs').delete().eq('patient_id', id)
    await supabase.from('appointments').delete().eq('patient_id', id)
    await supabase.from('queue_records').delete().eq('patient_id', id)
    await supabase.from('patient_visits').delete().eq('patient_id', id)
    await supabase.from('patient_health_records').delete().eq('patient_id', id)
    await supabase.from('messages').delete().eq('patient_id', id)

    const { error } = await supabase.from('patients').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete patient' }, { status: 500 })
  }
}
