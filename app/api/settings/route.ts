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

  const [clinicRes, settingsRes, smsSettingsRes, staffRes, deptRes] = await Promise.all([
    supabase.from('clinics').select('*').eq('id', clinicId).single(),
    supabase.from('clinic_settings').select('*').eq('clinic_id', clinicId).single(),
    supabase.from('sms_settings').select('id, sender_id, is_enabled, api_key, templates').eq('clinic_id', clinicId).single(),
    supabase.from('staff_members').select('id, name, role, department, status, email, phone, join_date').eq('clinic_id', clinicId).order('name'),
    supabase.from('departments').select('id, name, is_active').eq('clinic_id', clinicId).order('name'),
  ])

  return NextResponse.json({
    clinic:      clinicRes.data,
    settings:    settingsRes.data,
    smsSettings: smsSettingsRes.data,
    staff:       staffRes.data ?? [],
    departments: deptRes.data ?? [],
  })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles').select('clinic_id, role').eq('id', user.id).single()
  if (!profile?.clinic_id || profile.role !== 'administrator') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const clinicId = profile.clinic_id

  const body = await request.json()
  const { section, data } = body

  if (section === 'clinic') {
    await supabase.from('clinics').update(data).eq('id', clinicId)
  } else if (section === 'queue_settings') {
    const { data: existing } = await supabase.from('clinic_settings').select('queue_settings').eq('clinic_id', clinicId).single()
    await supabase.from('clinic_settings')
      .upsert({ clinic_id: clinicId, queue_settings: { ...existing?.queue_settings, ...data } })
  } else if (section === 'notification_channels') {
    const { data: existing } = await supabase.from('clinic_settings').select('notification_channels').eq('clinic_id', clinicId).single()
    await supabase.from('clinic_settings')
      .upsert({ clinic_id: clinicId, notification_channels: { ...existing?.notification_channels, ...data } })
  } else if (section === 'sms_settings') {
    await supabase.from('sms_settings')
      .upsert({ clinic_id: clinicId, ...data })
  } else if (section === 'staff_status') {
    await supabase.from('staff_members').update({ status: data.status }).eq('id', data.staffId)
  } else if (section === 'department_status') {
    await supabase.from('departments').update({ is_active: data.is_active }).eq('id', data.departmentId)
  }

  return NextResponse.json({ success: true })
}
