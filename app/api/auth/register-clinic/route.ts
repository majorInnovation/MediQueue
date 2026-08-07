import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const REQUIRED_FIELDS = [
  'userId', 'clinicName', 'clinicType', 'province', 'district', 'town', 'address',
  'adminFullName', 'adminPosition', 'adminPhone', 'adminEmail',
] as const

function extOf(file: File): string {
  const fromName = file.name.split('.').pop()
  if (fromName && fromName.length <= 5) return fromName.toLowerCase()
  return (file.type.split('/').pop() || 'bin').toLowerCase()
}

export async function POST(req: NextRequest) {
  const form = await req.formData()

  const get = (key: string) => (form.get(key) as string | null)?.trim() ?? ''

  for (const field of REQUIRED_FIELDS) {
    if (!get(field)) {
      return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
    }
  }

  const userId = get('userId')
  const service = createServiceClient()

  let workingDays: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  try {
    const raw = get('workingDays')
    if (raw) workingDays = JSON.parse(raw)
  } catch {
    // keep default
  }

  const smsEnabled = get('smsEnabled') === 'true'
  const voiceEnabled = get('voiceEnabled') === 'true'
  const displayEnabled = get('displayEnabled') === 'true'

  // 1. Create the clinic record
  const { data: clinic, error: clinicErr } = await service
    .from('clinics')
    .insert({
      name: get('clinicName'),
      facility_type: get('clinicType'),
      registration_number: get('registrationNumber') || null,
      province: get('province'),
      district: get('district'),
      town: get('town'),
      address: get('address'),
      email: get('adminEmail'),
      phone: get('adminPhone'),
      opening_time: get('openingTime') || null,
      closing_time: get('closingTime') || null,
      working_days: workingDays,
      sms_enabled: smsEnabled,
      voice_enabled: voiceEnabled,
      display_enabled: displayEnabled,
      status: 'pending_verification',
      verified: false,
      setup_completed: true,
    })
    .select('id')
    .single()

  if (clinicErr || !clinic) {
    return NextResponse.json({ error: clinicErr?.message ?? 'Failed to create clinic' }, { status: 500 })
  }

  const clinicId = clinic.id as string

  const rollback = async (message: string) => {
    await service.from('clinics').delete().eq('id', clinicId)
    await service.auth.admin.deleteUser(userId).catch(() => {})
    return NextResponse.json({ error: message }, { status: 500 })
  }

  // 2. Upload logo (public bucket) — best-effort, doesn't block registration
  const logo = form.get('logo') as File | null
  if (logo && logo.size > 0) {
    const path = `${clinicId}/logo.${extOf(logo)}`
    const { error: uploadErr } = await service.storage
      .from('clinic-logos')
      .upload(path, await logo.arrayBuffer(), { contentType: logo.type, upsert: true })
    if (!uploadErr) {
      const { data: pub } = service.storage.from('clinic-logos').getPublicUrl(path)
      await service.from('clinics').update({ logo_url: pub.publicUrl }).eq('id', clinicId)
    }
  }

  // 3. Upload license document (private bucket)
  const license = form.get('license') as File | null
  if (license && license.size > 0) {
    const path = `${clinicId}/license.${extOf(license)}`
    const { error: uploadErr } = await service.storage
      .from('clinic-licenses')
      .upload(path, await license.arrayBuffer(), { contentType: license.type, upsert: true })
    if (!uploadErr) {
      await service.from('clinics').update({ license_document_url: path }).eq('id', clinicId)
    }
  }

  // 4. Link the auth user to the clinic as its administrator
  const { error: profileErr } = await service.from('user_profiles').insert({
    id: userId,
    email: get('adminEmail'),
    name: get('adminFullName'),
    role: 'administrator',
    clinic_id: clinicId,
    phone: get('adminPhone'),
  })
  if (profileErr) return rollback(profileErr.message)

  // 5. Clinic admin record + starting statistics row
  await service.from('clinic_admins').upsert({
    clinic_id: clinicId,
    full_name: get('adminFullName'),
    position: get('adminPosition'),
    email: get('adminEmail'),
    phone: get('adminPhone'),
    last_login: new Date().toISOString(),
  }, { onConflict: 'email' })

  await service.from('clinic_statistics').upsert({
    clinic_id: clinicId,
    patients_today: 0,
    average_wait_time: 0,
    doctors_available: 0,
    nurses_available: 0,
    rooms_available: 0,
  }, { onConflict: 'clinic_id' })

  if (smsEnabled) {
    await service.from('sms_settings').upsert({
      clinic_id: clinicId,
      provider: '',
      sender_id: 'MediQueue',
      api_key: '',
      api_secret: '',
      daily_limit: 100,
      is_enabled: false,
    }, { onConflict: 'clinic_id' })
  }

  // Mark setup complete in JWT metadata so proxy.ts can read it without a DB call
  await service.auth.admin.updateUserById(userId, {
    user_metadata: { role: 'administrator', name: get('adminFullName'), setup_completed: true },
  })

  return NextResponse.json({ success: true, clinicId })
}
