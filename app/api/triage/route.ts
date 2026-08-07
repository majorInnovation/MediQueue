import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles').select('clinic_id').eq('id', user.id).single()
  const clinicId = profile?.clinic_id
  if (!clinicId) return NextResponse.json({ error: 'No clinic' }, { status: 403 })

  const today = new Date().toISOString().split('T')[0]
  const PRIORITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }

  // Pending: waiting queue records without a triage assessment today
  const { data: pending } = await supabase
    .from('queue_records')
    .select(`
      id, queue_number, status, priority, department, symptoms, created_at,
      patients(id, name, phone, date_of_birth, allergies, medical_history)
    `)
    .eq('clinic_id', clinicId)
    .eq('status', 'waiting')
    .gte('created_at', `${today}T00:00:00`)
    .is('triage_notes', null)
    .order('created_at', { ascending: true })

  // .order('priority') sorts alphabetically (critical, high, low, medium) which is
  // clinically wrong — re-sort by actual severity rank instead.
  const sortedPending = [...(pending ?? [])].sort(
    (a, b) => (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99)
  )

  // Recent assessments today (scoped to this clinic via the queue record it belongs to —
  // triage_assessments has no clinic_id column of its own)
  const { data: recent } = await supabase
    .from('triage_assessments')
    .select(`
      id, priority, blood_pressure, temperature, heart_rate, oxygen_saturation, notes, assessed_at,
      patients(id, name),
      staff_members(id, name),
      queue_records!inner(id, queue_number, department, symptoms, clinic_id)
    `)
    .eq('queue_records.clinic_id', clinicId)
    .gte('assessed_at', `${today}T00:00:00`)
    .order('assessed_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ pending: sortedPending, recent: recent ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles').select('clinic_id').eq('id', user.id).single()
  if (!profile?.clinic_id) return NextResponse.json({ error: 'No clinic' }, { status: 403 })

  const { queueRecordId, priority, bloodPressure, temperature, heartRate, oxygenSaturation, weight, notes } =
    await request.json()

  if (!queueRecordId || !priority) {
    return NextResponse.json({ error: 'queueRecordId and priority are required' }, { status: 400 })
  }

  // Get queue record + patient
  const { data: qr } = await supabase
    .from('queue_records').select('id, patient_id, clinic_id').eq('id', queueRecordId).single()
  if (!qr || qr.clinic_id !== profile.clinic_id) {
    return NextResponse.json({ error: 'Record not found' }, { status: 404 })
  }

  // Get staff member record for this user
  const { data: staff } = await supabase
    .from('staff_members').select('id').eq('user_id', user.id).single()

  // Insert assessment
  const { data: assessment, error } = await supabase
    .from('triage_assessments')
    .insert({
      queue_record_id: queueRecordId,
      patient_id: qr.patient_id,
      assessed_by: staff?.id ?? null,
      priority,
      blood_pressure: bloodPressure,
      temperature,
      heart_rate: heartRate,
      oxygen_saturation: oxygenSaturation,
      weight,
      notes,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update queue record priority + triage_notes
  await supabase.from('queue_records').update({
    priority,
    triage_notes: notes ?? null,
  }).eq('id', queueRecordId)

  // Activity log
  await supabase.from('activity_logs').insert({
    clinic_id: profile.clinic_id,
    user_id: user.id,
    action: 'triage_assessed',
    description: `Triage completed — priority set to ${priority}`,
    entity_type: 'triage_assessment',
    entity_id: assessment.id,
  })

  return NextResponse.json({ assessment })
}
