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

  const { data: logs, error } = await supabase
    .from('activity_logs')
    .select('id, user_id, action, description, entity_type, created_at')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const userIds = Array.from(new Set((logs ?? []).map(l => l.user_id).filter(Boolean)))
  const { data: actors } = userIds.length
    ? await supabase.from('user_profiles').select('id, name').in('id', userIds)
    : { data: [] as { id: string; name: string }[] }

  const nameById = new Map((actors ?? []).map(a => [a.id, a.name]))

  return NextResponse.json({
    activity: (logs ?? []).map(l => ({
      id: l.id,
      user: (l.user_id && nameById.get(l.user_id)) ?? 'System',
      action: l.description,
      timestamp: l.created_at,
    })),
  })
}
