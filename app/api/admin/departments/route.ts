import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) } as const

  const { data: profile } = await supabase
    .from('user_profiles').select('clinic_id, role').eq('id', user.id).single()

  if (!profile?.clinic_id || profile.role !== 'administrator') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) } as const
  }

  return { clinicId: profile.clinic_id as string } as const
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const { clinicId } = auth

  const body = await req.json()
  const name = (body.name as string | undefined)?.trim()
  const description = (body.description as string | undefined)?.trim() || null

  if (!name) return NextResponse.json({ error: 'Department name is required' }, { status: 400 })

  const service = createServiceClient()

  const { data: existing } = await service
    .from('departments').select('id').eq('clinic_id', clinicId).ilike('name', name).maybeSingle()
  if (existing) return NextResponse.json({ error: 'A department with this name already exists' }, { status: 400 })

  const { data: department, error } = await service.from('departments').insert({
    clinic_id: clinicId, name, description, is_active: true,
  }).select('id, name, description, is_active').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ department })
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const { clinicId } = auth

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing department id' }, { status: 400 })

  const service = createServiceClient()

  const { data: existing } = await service
    .from('departments').select('id, clinic_id').eq('id', id).single()

  if (!existing || existing.clinic_id !== clinicId) {
    return NextResponse.json({ error: 'Department not found' }, { status: 404 })
  }

  await service.from('departments').delete().eq('id', id)

  return NextResponse.json({ success: true })
}
