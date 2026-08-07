import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendSmsAndLog } from '@/lib/sms'
import { createAppointmentReminderSMS, getClinicDisplayName } from '@/lib/sms/templates'

// Zambia (Africa/Lusaka) is UTC+2 year-round — no DST. Override via env if a
// clinic ever operates in a different timezone.
const CLINIC_UTC_OFFSET_MINUTES = Number(process.env.CLINIC_UTC_OFFSET_MINUTES ?? 120)
const REMINDER_WINDOW_MINUTES = 60

function toUtcDate(date: string, time: string): Date {
  const sign = CLINIC_UTC_OFFSET_MINUTES >= 0 ? '-' : '+'
  const abs = Math.abs(CLINIC_UTC_OFFSET_MINUTES)
  const offset = `${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
  return new Date(`${date}T${time}:00${offset}`)
}

// Triggered by Vercel Cron (see vercel.json). Finds appointments starting within
// the next hour that haven't had their reminder SMS sent yet, sends it, and
// flags them so they're never sent twice.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = createServiceClient()
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: candidates, error } = await supabase
    .from('appointments')
    .select(`
      id, clinic_id, appointment_date, appointment_time, appointment_number,
      patients(id, name, phone),
      staff_members(name)
    `)
    .eq('reminder_sent', false)
    .in('status', ['scheduled', 'confirmed'])
    .gte('appointment_date', today)
    .lte('appointment_date', tomorrow)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let sent = 0
  let failed = 0

  for (const appt of candidates ?? []) {
    const patient = Array.isArray(appt.patients) ? appt.patients[0] : appt.patients
    const doctor = Array.isArray(appt.staff_members) ? appt.staff_members[0] : appt.staff_members
    if (!patient?.phone) continue

    const apptTime = toUtcDate(appt.appointment_date, appt.appointment_time)
    const minutesUntil = (apptTime.getTime() - now.getTime()) / 60000
    if (minutesUntil < 0 || minutesUntil > REMINDER_WINDOW_MINUTES) continue

    const clinicName = await getClinicDisplayName(supabase, appt.clinic_id)
    const message = createAppointmentReminderSMS({
      clinicName,
      patientName: patient.name,
      appointmentDate: appt.appointment_date,
      appointmentTime: appt.appointment_time,
    })

    const result = await sendSmsAndLog(supabase, {
      phone: patient.phone,
      message,
      clinicId: appt.clinic_id,
      patientId: patient.id,
      messageType: 'Appointment Reminder',
      appointmentId: appt.id,
    })

    if (result.status === 'sent') sent++
    else failed++

    // Mark as handled regardless of delivery outcome so a persistently failing
    // number doesn't get retried every cron tick for the rest of the window.
    await supabase.from('appointments').update({ reminder_sent: true }).eq('id', appt.id)
  }

  return NextResponse.json({ checked: candidates?.length ?? 0, sent, failed })
}
