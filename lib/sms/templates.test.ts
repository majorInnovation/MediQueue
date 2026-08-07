import { describe, expect, it } from 'vitest'
import {
  createAppointmentConfirmationSMS,
  createAppointmentReminderSMS,
  createPatientCalledSMS,
  createRegistrationSMS,
  createTurnApproachingSMS,
} from './templates'

describe('SMS templates', () => {
  it('builds a clinic-branded registration message', () => {
    const message = createRegistrationSMS({
      clinicName: 'Mukuba Clinic',
      patientName: 'Collins Sichalwe',
      queueNumber: 'C-001',
      estimatedTime: '5 minutes',
    })

    expect(message).toContain('Mukuba Clinic')
    expect(message).toContain('Collins Sichalwe')
    expect(message).toContain('C-001')
    expect(message).toContain('5 minutes')
  })

  it('builds an appointment confirmation message', () => {
    const message = createAppointmentConfirmationSMS({
      clinicName: 'Mukuba Clinic',
      patientName: 'Collins Sichalwe',
      appointmentDate: 'July 27, 2026',
      appointmentTime: '10:30 AM',
    })

    expect(message).toContain('Mukuba Clinic')
    expect(message).toContain('July 27, 2026')
    expect(message).toContain('10:30 AM')
  })

  it('builds reminder and queue-turn messages safely', () => {
    expect(createAppointmentReminderSMS({ clinicName: 'Mukuba Clinic', patientName: 'Collins Sichalwe' })).toContain('Mukuba Clinic')
    expect(createTurnApproachingSMS({ clinicName: 'Mukuba Clinic', patientName: 'Collins Sichalwe' })).toContain('your turn is approaching')
    expect(createPatientCalledSMS({ clinicName: 'Mukuba Clinic', patientName: 'Collins Sichalwe' })).toContain('your turn to be attended to')
  })
})
