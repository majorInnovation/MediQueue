import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles').select('clinic_id').eq('id', user.id).single()
  const clinicId = profile?.clinic_id
  if (!clinicId) return NextResponse.json({ error: 'No clinic' }, { status: 403 })

  const today = new Date().toISOString().split('T')[0]

  const [queueRes, smsRes, apptRes] = await Promise.all([
    supabase.from('queue_records')
      .select('id, status, priority, department, wait_time, created_at')
      .eq('clinic_id', clinicId)
      .gte('created_at', `${today}T00:00:00`),
    supabase.from('sms_logs')
      .select('id, status')
      .eq('clinic_id', clinicId)
      .gte('sent_at', `${today}T00:00:00`),
    supabase.from('appointments')
      .select('id, status')
      .eq('clinic_id', clinicId)
      .eq('appointment_date', today),
  ])

  const queue   = queueRes.data  ?? []
  const sms     = smsRes.data    ?? []
  const appts   = apptRes.data   ?? []

  const waiting     = queue.filter(q => q.status === 'waiting').length
  const serving     = queue.filter(q => q.status === 'inConsultation').length
  const completed   = queue.filter(q => q.status === 'completed').length
  const totalToday  = queue.length
  const waitTimes   = queue.filter(q => q.wait_time).map(q => q.wait_time as number)
  const avgWait     = waitTimes.length ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : 0
  const smsSent     = sms.length
  const smsDelivered = sms.filter(s => s.status === 'delivered').length
  const smsDeliveryRate = smsSent ? Math.round((smsDelivered / smsSent) * 100) : 0

  const waitingQueue = queue.filter(q => q.status === 'waiting')
  const byPriority = {
    high:   waitingQueue.filter(q => q.priority === 'high' || q.priority === 'critical').length,
    medium: waitingQueue.filter(q => q.priority === 'medium').length,
    low:    waitingQueue.filter(q => q.priority === 'low').length,
  }

  const byDepartment: Record<string, number> = {}
  for (const q of queue) {
    byDepartment[q.department] = (byDepartment[q.department] ?? 0) + 1
  }

  const byHour: Record<number, number> = {}
  for (const q of queue) {
    const hour = new Date(q.created_at).getHours()
    byHour[hour] = (byHour[hour] ?? 0) + 1
  }

  return NextResponse.json({
    waiting, serving, completed, totalToday, avgWait,
    smsSent, smsDeliveryRate, byPriority,
    departmentDistribution: Object.entries(byDepartment).map(([name, value]) => ({ name, value })),
    hourlyVolume: Object.entries(byHour).map(([hour, count]) => ({ hour: Number(hour), count })).sort((a, b) => a.hour - b.hour),
    appointments: { total: appts.length, confirmed: appts.filter(a => a.status === 'confirmed').length },
  })
}
