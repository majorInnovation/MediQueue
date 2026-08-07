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

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const today  = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('queue_records')
    .select(`
      id, queue_number, status, priority, department, symptoms, triage_notes,
      created_at, called_at, started_at, completed_at, wait_time, assigned_doctor_id,
      patients(id, patient_number, first_name, last_name, name, phone_number, phone, date_of_birth),
      staff_members(id, name, role)
    `)
    .eq('clinic_id', clinicId)
    .or(`created_at.gte.${today}T00:00:00,status.in.(waiting,called,inConsultation)`)
    .order('created_at', { ascending: true })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const [{ data, error }, { data: attendingStaff }] = await Promise.all([
    query,
    supabase
      .from('staff_members')
      .select('id, name, role, department')
      .eq('clinic_id', clinicId)
      .eq('status', 'active')
      .in('role', ['doctor', 'nurse'])
      .order('name'),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ queue: data, staff: attendingStaff ?? [] })
}
