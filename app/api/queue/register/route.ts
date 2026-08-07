import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateTriageScore, determinePriority } from '@/lib/utils'
import type { Priority } from '@/lib/types'
import { normalizePhone, sendSmsAndLog } from '@/lib/sms'
import { createRegistrationSMS, getClinicDisplayName } from '@/lib/sms/templates'
import { getNextPatientNumber, validateNrc } from '@/lib/patient-number'

const STAFF_ROLES = ['administrator', 'receptionist', 'nurse', 'doctor']
const PRIORITY_RANK: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 }

type Vitals = {
  bloodPressure?: string
  temperature?: number
  heartRate?: number
  oxygenSaturation?: number
}

type RegisterBody = {
  preview?: boolean
  existingPatientId?: string
  fullName?: string
  firstName?: string
  lastName?: string
  patientNumber?: string
  phone?: string
  age?: number | string
  gender?: 'male' | 'female' | 'other'
  address?: string
  nationalId?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  department?: string
  visitType?: string
  reason?: string
  chiefComplaint?: string
  symptomDuration?: string
  additionalNotes?: string
  assignedStaffId?: string
  isEmergency?: boolean
  symptoms?: string[]
  painLevel?: number
  pregnancyStatus?: 'pregnant' | 'not-pregnant' | 'unknown' | 'n/a'
  hasDisability?: boolean
  disabilityNotes?: string
  vitals?: Vitals
  sendSms?: boolean
}

function isSchemaError(error: { message?: string } | null | undefined): boolean {
  const message = error?.message ?? ''
  return /column .* does not exist|relation .* does not exist|function .* does not exist|does not exist|could not find/i.test(message)
}

async function getNextQueueNumber(supabase: any, clinicId: string, department: string) {
  const { data, error } = await supabase.rpc('get_next_queue_number', { p_clinic_id: clinicId, p_department: department })
  if (!error && typeof data === 'string' && data) return data

  const today = new Date().toISOString().split('T')[0]
  const { data: counterRow, error: counterErr } = await supabase
    .from('queue_counters')
    .select('current_count')
    .eq('clinic_id', clinicId)
    .eq('department', department)
    .eq('counter_date', today)
    .maybeSingle()

  if (counterErr && !isSchemaError(counterErr)) {
    throw counterErr
  }

  const nextCount = (counterRow?.current_count ?? 0) + 1
  await supabase.from('queue_counters').upsert({
    clinic_id: clinicId,
    department,
    counter_date: today,
    current_count: nextCount,
  }, { onConflict: 'clinic_id,department,counter_date' })

  return `${department.charAt(0).toUpperCase() || 'Q'}-${String(nextCount).padStart(3, '0')}`
}

function getDisplayName(body: RegisterBody) {
  const fullName = (body.fullName ?? '').trim()
  if (fullName) return fullName
  const firstName = (body.firstName ?? '').trim()
  const lastName = (body.lastName ?? '').trim()
  return [firstName, lastName].filter(Boolean).join(' ')
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles').select('clinic_id, role').eq('id', user.id).single()
  if (!profile?.clinic_id || !STAFF_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const clinicId = profile.clinic_id as string

  const body: RegisterBody = await req.json()
  const department = (body.department ?? '').trim()
  if (!department) return NextResponse.json({ error: 'Department is required' }, { status: 400 })

  const age = body.age !== undefined && body.age !== '' ? Number(body.age) : undefined
  const painLevel = Number(body.painLevel ?? 0)
  const symptoms = Array.isArray(body.symptoms) ? body.symptoms : []
  const pregnancyStatus = body.pregnancyStatus ?? 'n/a'
  const hasDisability = !!body.hasDisability
  const isEmergency = !!body.isEmergency
  const vitals: Vitals = {
    bloodPressure: body.vitals?.bloodPressure || undefined,
    temperature: body.vitals?.temperature != null ? Number(body.vitals.temperature) : undefined,
    heartRate: body.vitals?.heartRate != null ? Number(body.vitals.heartRate) : undefined,
    oxygenSaturation: body.vitals?.oxygenSaturation != null ? Number(body.vitals.oxygenSaturation) : undefined,
  }

  const riskScore = calculateTriageScore({
    age, isEmergency, symptomsCount: symptoms.length, painLevel, pregnancyStatus, hasDisability, vitals,
  })
  const priority = determinePriority(riskScore)

  const { data: settingsRow } = await supabase
    .from('clinic_settings').select('queue_settings').eq('clinic_id', clinicId).single()
  const avgConsultTime = Number(settingsRow?.queue_settings?.averageConsultationTime) || 15

  const today = new Date().toISOString().split('T')[0]
  const { data: waitingAhead } = await supabase
    .from('queue_records')
    .select('priority')
    .eq('clinic_id', clinicId)
    .eq('department', department)
    .eq('status', 'waiting')
    .gte('created_at', `${today}T00:00:00`)

  const PRIORITY_RANK: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  const aheadCount = (waitingAhead ?? []).filter(
    r => PRIORITY_RANK[r.priority as Priority] <= PRIORITY_RANK[priority]
  ).length
  const estimatedWait = Math.max(5, aheadCount * avgConsultTime)

  if (body.preview) {
    const { data: counterRow } = await supabase
      .from('queue_counters')
      .select('current_count')
      .eq('clinic_id', clinicId)
      .eq('department', department)
      .eq('counter_date', today)
      .maybeSingle()
    const nextCount = (counterRow?.current_count ?? 0) + 1
    const previewNumber = `${department.charAt(0).toUpperCase() || 'Q'}-${String(nextCount).padStart(3, '0')}`

    return NextResponse.json({ riskScore, priority, estimatedWait, previewQueueNumber: previewNumber })
  }

  const fullName = getDisplayName(body)
  const phoneInput = (body.phone ?? '').trim()
  const phone = normalizePhone(phoneInput)
  if (!fullName) return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
  if (!phone) return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
  if (body.nationalId && !validateNrc(body.nationalId)) {
    return NextResponse.json({ error: 'National ID must be in the format 652260/67/1' }, { status: 400 })
  }

  const firstName = (body.firstName ?? fullName.split(' ')[0] ?? '').trim()
  const lastName = (body.lastName ?? fullName.replace(firstName, '').trim())

  let patientId = body.existingPatientId
  let patientNumber: string | null = null

  if (!patientId) {
    const searchPatientNumber = (body.patientNumber ?? '').trim()
    const { data: existingPatient } = searchPatientNumber
      ? await supabase.from('patients').select('id, patient_number').eq('patient_number', searchPatientNumber).maybeSingle()
      : phone
        ? await supabase.from('patients').select('id, patient_number').or(`phone_number.eq.${phone},phone.eq.${phone}`).maybeSingle()
        : { data: null }
    patientId = existingPatient?.id ?? undefined
    patientNumber = existingPatient?.patient_number ?? null
  }

  if (patientId) {
    const nextPatientNumber = patientNumber || await getNextPatientNumber(supabase, new Date().getFullYear())
    const updatePayload = {
      name: fullName,
      phone,
      gender: body.gender ?? null,
      address: body.address || null,
      updated_at: new Date().toISOString(),
    }
    const { data: updatedPatient, error: updateErr } = await supabase.from('patients').update(updatePayload).eq('id', patientId).select('id').single()
    if (updateErr && !isSchemaError(updateErr)) {
      return NextResponse.json({ error: updateErr?.message ?? 'Failed to update patient' }, { status: 500 })
    }
    if (!updatedPatient && updateErr) {
      const fallbackPayload = {
        name: fullName,
        phone,
        updated_at: new Date().toISOString(),
      }
      const { data: fallbackPatient, error: fallbackErr } = await supabase.from('patients').update(fallbackPayload).eq('id', patientId).select('id').single()
      if (fallbackErr) {
        return NextResponse.json({ error: fallbackErr?.message ?? 'Failed to update patient' }, { status: 500 })
      }
      if (fallbackPatient) {
        patientNumber = nextPatientNumber
      }
    } else {
      patientNumber = nextPatientNumber
    }
  } else {
    const nextPatientNumber = await getNextPatientNumber(supabase, new Date().getFullYear())
    const patientPayload = {
      first_name: firstName || null,
      last_name: lastName || null,
      name: fullName,
      phone_number: phone,
      phone,
      patient_number: nextPatientNumber,
      age: age ?? null,
      gender: body.gender ?? null,
      address: body.address || null,
      national_id: body.nationalId || null,
      emergency_contact_name: body.emergencyContactName || null,
      emergency_contact_phone: normalizePhone(body.emergencyContactPhone ?? '') || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_visit_at: new Date().toISOString(),
    }
    const { data: newPatient, error: patientErr } = await supabase.from('patients').insert(patientPayload).select('id').single()
    if (patientErr && isSchemaError(patientErr)) {
      const fallbackPayload = {
        name: fullName,
        phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const { data: fallbackPatient, error: fallbackPatientErr } = await supabase.from('patients').insert(fallbackPayload).select('id').single()
      if (fallbackPatientErr || !fallbackPatient) {
        return NextResponse.json({ error: fallbackPatientErr?.message ?? 'Failed to create patient' }, { status: 500 })
      }
      patientId = fallbackPatient.id
      patientNumber = nextPatientNumber
    } else if (patientErr || !newPatient) {
      return NextResponse.json({ error: patientErr?.message ?? 'Failed to create patient' }, { status: 500 })
    } else {
      patientId = newPatient.id
      patientNumber = nextPatientNumber
    }
  }

  const queueNumber = await getNextQueueNumber(supabase, clinicId, department)

  const queuePayload = {
    clinic_id: clinicId,
    patient_id: patientId,
    queue_number: queueNumber,
    status: 'waiting',
    priority,
    department,
    symptoms,
    visit_type: body.visitType || 'walk-in',
    reason: body.reason || body.chiefComplaint || null,
    pain_level: painLevel,
    has_disability: hasDisability,
    disability_notes: body.disabilityNotes || null,
    pregnancy_status: pregnancyStatus,
    vitals,
    assigned_doctor_id: body.assignedStaffId || null,
    risk_score: riskScore,
    estimated_wait: estimatedWait,
  }
  let queueRecord: any
  const { data: initialQueueRecord, error: queueErr } = await supabase
    .from('queue_records')
    .insert(queuePayload)
    .select().single()

  if (initialQueueRecord) {
    queueRecord = initialQueueRecord
  }

  if (queueErr && isSchemaError(queueErr)) {
    const fallbackQueuePayload = {
      clinic_id: clinicId,
      patient_id: patientId,
      queue_number: queueNumber,
      status: 'waiting',
      priority,
      department,
      symptoms,
    }
    const { data: fallbackQueueRecord, error: fallbackQueueErr } = await supabase
      .from('queue_records')
      .insert(fallbackQueuePayload)
      .select().single()

    if (fallbackQueueErr || !fallbackQueueRecord) {
      return NextResponse.json({ error: fallbackQueueErr?.message ?? 'Failed to assign queue number' }, { status: 500 })
    }
    queueRecord = fallbackQueueRecord
  } else if (queueErr) {
    return NextResponse.json({ error: queueErr.message }, { status: 500 })
  }

  const visitInsert = await supabase.from('patient_visits').insert({
    patient_id: patientId,
    queue_id: queueRecord.id,
    chief_complaint: body.reason || body.chiefComplaint || null,
    symptoms,
    symptom_duration: body.symptomDuration || null,
    pain_level: painLevel,
    additional_notes: body.additionalNotes || null,
    priority_score: riskScore,
    triage_priority: priority,
    registered_by: user.id,
  })
  if (visitInsert.error && !isSchemaError(visitInsert.error)) {
    console.warn('[queue-register] patient_visits insert failed', visitInsert.error.message)
  }

  const activityInsert = await supabase.from('activity_logs').insert({
    clinic_id: clinicId,
    user_id: user.id,
    action: 'patient_registered',
    description: `Registered ${fullName} (${patientNumber || 'patient'}) — queue ${queueNumber} (${priority} priority)`,
    entity_type: 'queue_record',
    entity_id: queueRecord.id,
    metadata: { queueNumber, priority, department, patientNumber },
  })
  if (activityInsert.error && !isSchemaError(activityInsert.error)) {
    console.warn('[queue-register] activity_logs insert failed', activityInsert.error.message)
  }

  if (body.sendSms && phone) {
    const clinicName = await getClinicDisplayName(supabase as never, clinicId)
    const message = createRegistrationSMS({
      clinicName,
      patientName: fullName,
      patientNumber: patientNumber || undefined,
      queueNumber,
      estimatedTime: `${estimatedWait} minutes`,
    })
    await sendSmsAndLog(supabase as never, {
      phone,
      message,
      clinicId,
      patientId,
      messageType: 'Registration',
      queueRecordId: queueRecord.id,
    })
  }

  return NextResponse.json({
    patient: { id: patientId, name: fullName, phone, patientNumber },
    queueRecord, riskScore, priority, estimatedWait, queueNumber,
  })
}
