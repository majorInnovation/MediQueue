import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: patient } = await supabase
    .from('patients').select('id').eq('user_id', user.id).single()
  if (!patient) return NextResponse.json({ stages: [], currentStage: null })

  const today = new Date().toISOString().split('T')[0]
  const { data: qr } = await supabase
    .from('queue_records')
    .select('id, queue_number, status, created_at, called_at, started_at, completed_at')
    .eq('patient_id', patient.id).gte('created_at', `${today}T00:00:00`)
    .order('created_at', { ascending: false }).limit(1).maybeSingle()

  if (!qr) return NextResponse.json({ stages: [], currentStage: null })

  const stages = [
    { id: 'registered',   label: 'Registered',        done: true,                      time: qr.created_at },
    { id: 'waiting',      label: 'Waiting in Queue',   done: qr.status !== 'waiting',   time: null },
    { id: 'called',       label: 'Called to Counter',  done: !!qr.called_at,            time: qr.called_at },
    { id: 'consultation', label: 'In Consultation',    done: !!qr.started_at,           time: qr.started_at },
    { id: 'completed',    label: 'Completed',          done: qr.status === 'completed', time: qr.completed_at },
  ]

  const statusToStage: Record<string, string> = {
    waiting: 'waiting', called: 'called', inConsultation: 'consultation', completed: 'completed',
  }

  return NextResponse.json({ queueNumber: qr.queue_number, currentStage: statusToStage[qr.status] ?? 'waiting', stages })
}
