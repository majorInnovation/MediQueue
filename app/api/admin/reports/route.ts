import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const RANGE_DAYS: Record<string, number> = {
  today: 1,
  week: 7,
  month: 30,
  quarter: 90,
}

function startOfRange(range: string) {
  const days = RANGE_DAYS[range] ?? 1
  const start = new Date()
  start.setDate(start.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)
  return start
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles').select('clinic_id').eq('id', user.id).single()
  const clinicId = profile?.clinic_id
  if (!clinicId) return NextResponse.json({ error: 'No clinic' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const range = searchParams.get('range') ?? 'today'
  const since = startOfRange(range).toISOString()

  const [queueRes, smsRes] = await Promise.all([
    supabase.from('queue_records')
      .select('id, status, priority, department, wait_time, created_at')
      .eq('clinic_id', clinicId)
      .gte('created_at', since),
    supabase.from('sms_logs')
      .select('id, status, sent_at')
      .eq('clinic_id', clinicId)
      .gte('sent_at', since),
  ])

  const queue = queueRes.data ?? []
  const sms   = smsRes.data   ?? []

  const completed = queue.filter(q => q.status === 'completed').length
  const waitTimes = queue.filter(q => q.wait_time).map(q => q.wait_time as number)
  const avgWait   = waitTimes.length ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : 0
  const smsDelivered = sms.filter(s => s.status === 'delivered').length

  // Daily volume (registered vs completed), most recent 14 days max for readability
  const byDay = new Map<string, { patients: number; completed: number }>()
  for (const q of queue) {
    const day = new Date(q.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    const entry = byDay.get(day) ?? { patients: 0, completed: 0 }
    entry.patients += 1
    if (q.status === 'completed') entry.completed += 1
    byDay.set(day, entry)
  }

  // Peak hours (queue volume + avg wait by hour)
  const byHour = new Map<number, { count: number; waitSum: number; waitN: number }>()
  for (const q of queue) {
    const hour = new Date(q.created_at).getHours()
    const entry = byHour.get(hour) ?? { count: 0, waitSum: 0, waitN: 0 }
    entry.count += 1
    if (q.wait_time) { entry.waitSum += q.wait_time; entry.waitN += 1 }
    byHour.set(hour, entry)
  }

  // SMS by hour
  const smsByHour = new Map<number, { sent: number; delivered: number; failed: number }>()
  for (const s of sms) {
    const hour = new Date(s.sent_at).getHours()
    const entry = smsByHour.get(hour) ?? { sent: 0, delivered: 0, failed: 0 }
    entry.sent += 1
    if (s.status === 'delivered') entry.delivered += 1
    if (s.status === 'failed') entry.failed += 1
    smsByHour.set(hour, entry)
  }

  // Department + priority distribution
  const byDepartment = new Map<string, number>()
  const byPriority   = new Map<string, number>()
  for (const q of queue) {
    byDepartment.set(q.department, (byDepartment.get(q.department) ?? 0) + 1)
    byPriority.set(q.priority, (byPriority.get(q.priority) ?? 0) + 1)
  }

  const fmtHour = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 === 0 ? 12 : h % 12
    return `${h12}${period}`
  }

  return NextResponse.json({
    kpis: {
      patientsServed: queue.length,
      avgWait,
      smsSent: sms.length,
      completionRate: queue.length ? Math.round((completed / queue.length) * 100) : 0,
      smsDeliveryRate: sms.length ? Math.round((smsDelivered / sms.length) * 100) : 0,
    },
    dailyVolume: Array.from(byDay.entries()).map(([day, v]) => ({ day, ...v })),
    peakHours: Array.from(byHour.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([hour, v]) => ({ hour: fmtHour(hour), count: v.count, avgWait: v.waitN ? Math.round(v.waitSum / v.waitN) : 0 })),
    smsHourly: Array.from(smsByHour.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([hour, v]) => ({ hour: fmtHour(hour), ...v })),
    departmentDistribution: Array.from(byDepartment.entries()).map(([name, value]) => ({ name, value })),
    priorityDistribution: Array.from(byPriority.entries()).map(([priority, count]) => ({ priority, count })),
  })
}
