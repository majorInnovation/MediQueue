import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const STAFF_ROLES = ['administrator', 'receptionist', 'nurse', 'doctor'] as const

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

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
  const email = (body.email as string | undefined)?.trim().toLowerCase()
  const role = body.role as string | undefined
  const phone = (body.phone as string | undefined)?.trim() || null
  const department = (body.department as string | undefined)?.trim() || null

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
  }
  if (!role || !STAFF_ROLES.includes(role as typeof STAFF_ROLES[number])) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const service = createServiceClient()
  const tempPassword = generateTempPassword()

  const { data: created, error: createErr } = await service.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { role, name, setup_completed: true },
  })

  if (createErr || !created?.user) {
    const message = createErr?.message?.includes('already been registered')
      ? 'A staff account with this email already exists'
      : createErr?.message ?? 'Failed to create staff account'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const userId = created.user.id

  const rollback = async (message: string) => {
    await service.auth.admin.deleteUser(userId).catch(() => {})
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const { error: profileErr } = await service.from('user_profiles').insert({
    id: userId, email, name, role, clinic_id: clinicId, phone,
  })
  if (profileErr) return rollback(profileErr.message)

  const { data: staffRow, error: staffErr } = await service.from('staff_members').insert({
    clinic_id: clinicId, user_id: userId, name, role, email, phone, department, status: 'active',
  }).select('id, name, role, email, phone, department, status, join_date').single()

  if (staffErr) {
    await service.from('user_profiles').delete().eq('id', userId)
    return rollback(staffErr.message)
  }

  return NextResponse.json({ staff: staffRow, tempPassword })
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error
  const { clinicId } = auth

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing staff id' }, { status: 400 })

  const service = createServiceClient()

  const { data: existing } = await service
    .from('staff_members').select('id, user_id, clinic_id').eq('id', id).single()

  if (!existing || existing.clinic_id !== clinicId) {
    return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
  }

  await service.from('staff_members').delete().eq('id', id)
  if (existing.user_id) {
    await service.from('user_profiles').delete().eq('id', existing.user_id)
    await service.auth.admin.deleteUser(existing.user_id).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
