import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles').select('clinic_id, role').eq('id', user.id).single()

  if (profile?.role === 'patient') return NextResponse.json({ setupNeeded: false })

  const { data: clinic } = await supabase
    .from('clinics').select('setup_completed').eq('id', profile?.clinic_id).single()

  return NextResponse.json({ setupNeeded: !clinic?.setup_completed })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles').select('clinic_id').eq('id', user.id).single()

  if (!profile?.clinic_id)
    return NextResponse.json({ error: 'No clinic linked to this account' }, { status: 400 })

  const body = await req.json()
  const service = createServiceClient()
  const clinicId = profile.clinic_id

  // Update clinic with full registration details
  const { error: clinicErr } = await service.from('clinics').update({
    name:                    body.clinicName,
    clinic_code:             body.clinicCode,
    facility_type:           body.facilityType,
    ownership:               body.ownership,
    moh_registration_number: body.mohRegistrationNumber,
    license_number:          body.licenseNumber,
    tpin:                    body.tpin,
    province:                body.province,
    district:                body.district,
    town:                    body.town,
    address:                 body.address,
    phone:                   body.phone,
    email:                   body.email,
    website:                 body.website || null,
    opening_time:            body.openingTime,
    closing_time:            body.closingTime,
    queue_prefix:            body.queuePrefix || 'Q',
    priority_enabled:        body.priorityEnabled ?? true,
    sms_enabled:             body.smsEnabled ?? false,
    voice_enabled:           body.voiceEnabled ?? false,
    display_enabled:         body.displayEnabled ?? false,
    estimated_service_time:  Number(body.estimatedServiceTime) || 15,
    setup_completed:         true,
    status:                  'active',
    updated_at:              new Date().toISOString(),
  }).eq('id', clinicId)

  if (clinicErr) return NextResponse.json({ error: clinicErr.message }, { status: 500 })

  // Upsert clinic admin profile
  await service.from('clinic_admins').upsert({
    clinic_id:  clinicId,
    full_name:  body.adminFullName,
    position:   body.adminPosition,
    email:      user.email ?? '',
    phone:      body.adminPhone || null,
    username:   body.adminUsername || null,
    last_login: new Date().toISOString(),
  }, { onConflict: 'email' })

  // Upsert initial statistics
  await service.from('clinic_statistics').upsert({
    clinic_id:          clinicId,
    patients_today:     0,
    average_wait_time:  0,
    doctors_available:  0,
    nurses_available:   0,
    rooms_available:    0,
  }, { onConflict: 'clinic_id' })

  // Upsert SMS config if SMS enabled
  if (body.smsEnabled) {
    await service.from('sms_settings').upsert({
      clinic_id:   clinicId,
      provider:    '',
      sender_id:   'MediQueue',
      api_key:     '',
      api_secret:  '',
      daily_limit: 100,
      is_enabled:  false,
    }, { onConflict: 'clinic_id' })
  }

  // Mark setup complete in user JWT metadata so proxy.ts can read it without a DB call
  await service.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, setup_completed: true },
  })

  return NextResponse.json({ success: true })
}
