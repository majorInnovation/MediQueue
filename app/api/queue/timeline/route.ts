import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: patient } = await supabase
    .from('patients').select('id').eq('user_id', user.id).single()
  if (!patient) return NextResponse.json({ timeline: [] })

  const today = new Date().toISOString().split('T')[0]
  const { data: qr } = await supabase
    .from('queue_records')
    .select('queue_number, status, created_at, called_at, started_at, completed_at')
    .eq('patient_id', patient.id).gte('created_at', `${today}T00:00:00`)
    .order('created_at', { ascending: false }).limit(1).maybeSingle()

  if (!qr) return NextResponse.json({ timeline: [] })

  const timeline = [
    { event: 'Queue registered',     time: qr.created_at,    status: 'done' },
    qr.called_at    ? { event: 'Called to counter',   time: qr.called_at,    status: 'done' } : null,
    qr.started_at   ? { event: 'Consultation started', time: qr.started_at,  status: 'done' } : null,
    qr.completed_at ? { event: 'Visit completed',      time: qr.completed_at, status: 'done' } : null,
  ].filter(Boolean)

  return NextResponse.json({ timeline })
}
