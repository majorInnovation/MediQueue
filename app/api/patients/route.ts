import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function normalizePatientPayload(patient: Record<string, any>) {
  const rawName = patient?.name ?? patient?.full_name ?? ''
  const firstName = patient?.first_name ?? ''
  const lastName = patient?.last_name ?? ''
  const nameParts = [firstName, lastName].filter(Boolean).join(' ').trim()
  const displayName = patient?.full_name || patient?.name || nameParts || '—'
  const displayFirstName = firstName || (typeof rawName === 'string' && rawName.includes(' ') ? rawName.split(' ')[0] : rawName) || null
  const displayLastName = lastName || (typeof rawName === 'string' && rawName.includes(' ') ? rawName.replace(displayFirstName ?? '', '').trim() : null) || null
  const phone = patient?.phone || patient?.phone_number || null

  return {
    ...patient,
    patient_number: patient?.patient_number ?? null,
    name: displayName,
    full_name: displayName,
    first_name: displayFirstName,
    last_name: displayLastName,
    phone,
    phone_number: phone,
    gender: patient?.gender ?? null,
    age: typeof patient?.age === 'number' && !Number.isNaN(patient.age) ? patient.age : null,
    date_of_birth: patient?.date_of_birth ?? null,
  }
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles').select('clinic_id').eq('id', user.id).single()
  if (!profile?.clinic_id) return NextResponse.json({ error: 'No clinic' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const search = (searchParams.get('search') ?? '').trim().replace(/[,()%]/g, '')

  const buildQuery = (selectColumns: string) => {
    const query = supabase
      .from('patients')
      .select(selectColumns)
      .order('created_at', { ascending: false })

    if (!search) return query.limit(50)

    return query
      .or(`patient_number.ilike.%${search}%,name.ilike.%${search}%,phone.ilike.%${search}%,phone_number.ilike.%${search}%`)
      .limit(100)
  }

  const { data, error } = await buildQuery('id, patient_number, name, phone, phone_number, gender, age, created_at')

  if (error) {
    const fallback = await buildQuery('id, patient_number, name, phone, phone_number, gender, age, created_at')
    if (fallback.error) return NextResponse.json({ error: fallback.error.message }, { status: 500 })
    return NextResponse.json({ patients: (fallback.data ?? []).map(patient => normalizePatientPayload(patient as Record<string, any>)) })
  }

  return NextResponse.json({ patients: (data ?? []).map(patient => normalizePatientPayload(patient as Record<string, any>)) })
}
