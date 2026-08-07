import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSmsAndLog } from '@/lib/sms'
import { createAppointmentConfirmationSMS, getClinicDisplayName } from '@/lib/sms/templates'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles').select('clinic_id').eq('id', user.id).single()
  if (!profile?.clinic_id) return NextResponse.json({ error: 'No clinic' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const dateFrom = searchParams.get('from') ?? new Date().toISOString().split('T')[0]
  const dateTo   = searchParams.get('to')   ?? new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id, appointment_date, appointment_time, duration, type, status, reason, notes,
      appointment_number, created_at,
      patients(id, name, phone),
      staff_members(id, name, specialization, department)
    `)
    .eq('clinic_id', profile.clinic_id)
    .gte('appointment_date', dateFrom)
    .lte('appointment_date', dateTo)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ appointments: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles').select('clinic_id').eq('id', user.id).single()
  if (!profile?.clinic_id) return NextResponse.json({ error: 'No clinic' }, { status: 403 })
  const clinicId = profile.clinic_id

  const body = await request.json()
  const { patientId, doctorId, date, time, type = 'consultation', reason } = body

  if (!patientId || !doctorId || !date || !time) {
    return NextResponse.json({ error: 'patientId, doctorId, date, time are required' }, { status: 400 })
  }

  const { data: patient } = await supabase
    .from('patients').select('id, name, phone').eq('id', patientId).single()
  if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })

  const { data: doctor } = await supabase
    .from('staff_members').select('id, name').eq('id', doctorId).single()
  if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

  const { data: appointmentNumberResult, error: rpcErr } = await supabase
    .rpc('get_next_appointment_number', { p_clinic_id: clinicId })
  if (rpcErr || !appointmentNumberResult) {
    return NextResponse.json({ error: rpcErr?.message ?? 'Failed to assign appointment number' }, { status: 500 })
  }
  const appointmentNumber = appointmentNumberResult as string

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      clinic_id: clinicId, patient_id: patient.id, doctor_id: doctorId,
      appointment_date: date, appointment_time: time, type, reason,
      notes: reason ?? null,
      status: 'scheduled',
      appointment_number: appointmentNumber,
    })
    .select(`
      id, appointment_date, appointment_time, type, status, reason, appointment_number,
      staff_members(id, name, specialization)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Activity log
  await supabase.from('activity_logs').insert({
    clinic_id: clinicId,
    user_id: user.id,
    action: 'appointment_booked',
    description: `Booked appointment for ${patient.name} on ${date} at ${time}`,
    entity_type: 'appointment',
    entity_id: appointment.id,
  })

  // SMS log
  if (patient.phone) {
    const clinicName = await getClinicDisplayName(supabase, clinicId)
    const day = new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    })
    const message = createAppointmentConfirmationSMS({
      clinicName,
      patientName: patient.name,
      appointmentDate: day,
      appointmentTime: time,
    })
    await sendSmsAndLog(supabase, {
      phone: patient.phone,
      message,
      clinicId,
      patientId: patient.id,
      messageType: 'Appointment Confirmation',
      appointmentId: appointment.id,
    })
  }

  return NextResponse.json({ appointment })
}

const VALID_STATUSES = ['scheduled', 'confirmed', 'cancelled', 'completed', 'no-show']

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles').select('clinic_id').eq('id', user.id).single()
  if (!profile?.clinic_id) return NextResponse.json({ error: 'No clinic' }, { status: 403 })

  const { appointmentId, status, notes } = await request.json()
  if (!appointmentId || !status) {
    return NextResponse.json({ error: 'appointmentId and status are required' }, { status: 400 })
  }
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 })
  }

  const updates: { status: string; notes?: string } = { status }
  if (notes !== undefined) updates.notes = notes

  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', appointmentId)
    .eq('clinic_id', profile.clinic_id)
    .select(`
      id, appointment_date, appointment_time, type, status, reason, notes, appointment_number,
      patients(id, name, phone),
      staff_members(id, name, specialization)
    `)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.from('activity_logs').insert({
    clinic_id: profile.clinic_id,
    user_id: user.id,
    action: 'appointment_status_updated',
    description: `Appointment ${data.appointment_number ?? appointmentId} marked ${status}`,
    entity_type: 'appointment',
    entity_id: appointmentId,
  })

  return NextResponse.json({ appointment: data })
}
