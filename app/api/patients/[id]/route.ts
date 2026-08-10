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
    // Gather related queue record ids
    const relatedQueue = await supabase.from('queue_records').select('id').eq('patient_id', id)
    if (relatedQueue.error) {
      console.error('[patients DELETE] failed to query related queue_records', relatedQueue.error)
      return NextResponse.json({ error: relatedQueue.error.message }, { status: 500 })
    }

    const queueIds = (relatedQueue.data ?? []).map((row: { id: string }) => row.id)

    // Delete dependent rows, checking for errors each time so RLS/permission issues surface
    if (queueIds.length > 0) {
      const triageDel = await supabase.from('triage_assessments').delete().in('queue_record_id', queueIds)
      if (triageDel.error) {
        console.error('[patients DELETE] triage_assessments delete failed', triageDel.error)
        return NextResponse.json({ error: triageDel.error.message }, { status: 500 })
      }

      const queueSmsDel = await supabase.from('sms_logs').delete().in('queue_record_id', queueIds)
      if (queueSmsDel.error) {
        console.error('[patients DELETE] sms_logs (queue) delete failed', queueSmsDel.error)
        return NextResponse.json({ error: queueSmsDel.error.message }, { status: 500 })
      }
    }

    const smsDel = await supabase.from('sms_logs').delete().eq('patient_id', id)
    if (smsDel.error) {
      console.error('[patients DELETE] sms_logs delete failed', smsDel.error)
      return NextResponse.json({ error: smsDel.error.message }, { status: 500 })
    }

    const apptDel = await supabase.from('appointments').delete().eq('patient_id', id)
    if (apptDel.error) {
      console.error('[patients DELETE] appointments delete failed', apptDel.error)
      return NextResponse.json({ error: apptDel.error.message }, { status: 500 })
    }

    const queueDel = await supabase.from('queue_records').delete().eq('patient_id', id)
    if (queueDel.error) {
      console.error('[patients DELETE] queue_records delete failed', queueDel.error)
      return NextResponse.json({ error: queueDel.error.message }, { status: 500 })
    }

    const visitsDel = await supabase.from('patient_visits').delete().eq('patient_id', id)
    if (visitsDel.error) {
      console.error('[patients DELETE] patient_visits delete failed', visitsDel.error)
      return NextResponse.json({ error: visitsDel.error.message }, { status: 500 })
    }

    const healthDel = await supabase.from('patient_health_records').delete().eq('patient_id', id)
    if (healthDel.error) {
      console.error('[patients DELETE] patient_health_records delete failed', healthDel.error)
      return NextResponse.json({ error: healthDel.error.message }, { status: 500 })
    }

    const messagesDel = await supabase.from('messages').delete().eq('patient_id', id)
    if (messagesDel.error) {
      console.error('[patients DELETE] messages delete failed', messagesDel.error)
      return NextResponse.json({ error: messagesDel.error.message }, { status: 500 })
    }

    const { error } = await supabase.from('patients').delete().eq('id', id)
    if (error) {
      console.error('[patients DELETE] patients delete failed', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to delete patient' }, { status: 500 })
  }
}
