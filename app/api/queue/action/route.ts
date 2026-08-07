import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizePhone, sendSmsAndLog } from '@/lib/sms'
import { createPatientCalledSMS, getClinicDisplayName } from '@/lib/sms/templates'

type Action = 'call' | 'skip' | 'complete' | 'emergency' | 'cancel' | 'start' | 'assign'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles').select('clinic_id, role').eq('id', user.id).single()
  if (!profile?.clinic_id) return NextResponse.json({ error: 'No clinic' }, { status: 403 })

  const { queueRecordId, action, staffId }: { queueRecordId: string; action: Action; staffId?: string | null } = await request.json()
  if (!queueRecordId || !action) return NextResponse.json({ error: 'queueRecordId and action required' }, { status: 400 })

  const now = new Date().toISOString()
  let updates: Record<string, unknown> = {}
  let logDescription = ''
  let attendingStaff: { id: string; name: string; role: string } | null = null

  switch (action) {
    case 'call':
      updates = { status: 'called', called_at: now }
      logDescription = 'Called patient to counter'
      break
    case 'start':
      updates = { status: 'inConsultation', started_at: now }
      logDescription = 'Started consultation'
      break
    case 'complete':
      updates = { status: 'completed', completed_at: now }
      logDescription = 'Marked consultation as completed'
      break
    case 'skip':
      updates = { status: 'waiting', called_at: null }
      logDescription = 'Skipped — patient returned to queue'
      break
    case 'cancel':
      updates = { status: 'cancelled' }
      logDescription = 'Cancelled queue entry'
      break
    case 'emergency':
      updates = { priority: 'critical' }
      logDescription = 'Escalated to emergency priority'
      break
    case 'assign':
      if (staffId) {
        const { data: staffRow } = await supabase
          .from('staff_members').select('id, name, role')
          .eq('id', staffId).eq('clinic_id', profile.clinic_id).single()
        if (!staffRow) return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
        attendingStaff = staffRow
        updates = { assigned_doctor_id: staffId }
        logDescription = `Assigned ${staffRow.name} to attend this patient`
      } else {
        updates = { assigned_doctor_id: null }
        logDescription = 'Unassigned attending staff'
      }
      break
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  // Verify the record belongs to this clinic
  const { data: existing } = await supabase
    .from('queue_records')
    .select('id, patient_id, queue_number, clinic_id, created_at, called_at')
    .eq('id', queueRecordId)
    .eq('clinic_id', profile.clinic_id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Record not found' }, { status: 404 })

  // Compute wait_time on completion
  if (action === 'complete' && existing.called_at) {
    const waitMs = new Date(now).getTime() - new Date(existing.called_at).getTime()
    updates.wait_time = Math.round(waitMs / 60000)
  }

  const { data: updated, error } = await supabase
    .from('queue_records')
    .update(updates)
    .eq('id', queueRecordId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Activity log
  await supabase.from('activity_logs').insert({
    clinic_id: profile.clinic_id,
    user_id: user.id,
    action,
    description: logDescription,
    entity_type: 'queue_record',
    entity_id: queueRecordId,
    metadata: { queue_number: existing.queue_number },
  })

  // Notify patient if called
  if (action === 'call') {
    const { data: patientUser } = await supabase
      .from('patients').select('user_id, name, phone').eq('id', existing.patient_id).single()
    if (patientUser?.user_id) {
      await supabase.from('notifications').insert({
        user_id: patientUser.user_id,
        type: 'queue_update',
        title: 'It\'s almost your turn!',
        message: `Queue ${existing.queue_number} has been called. Please proceed to the counter.`,
        metadata: { queueRecordId, queueNumber: existing.queue_number },
      })
    }
    if (patientUser?.phone) {
      const normalizedPhone = normalizePhone(patientUser.phone)
      const clinicName = await getClinicDisplayName(supabase, profile.clinic_id)
      const message = createPatientCalledSMS({
        clinicName,
        patientName: patientUser.name,
      })
      await sendSmsAndLog(supabase, {
        phone: normalizedPhone,
        message,
        clinicId: profile.clinic_id,
        patientId: existing.patient_id,
        messageType: 'Patient Called',
        queueRecordId,
      })
    }
  }

  return NextResponse.json({ record: updated })
}
