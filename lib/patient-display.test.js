const test = require('node:test')
const assert = require('node:assert/strict')
const { calculateAge, normalizePatientRecord } = require('./patient-display')

test('calculateAge derives age from date of birth', () => {
  const RealDate = Date
  const fixedDate = new RealDate('2026-07-28T12:00:00.000Z')

  global.Date = class extends RealDate {
    constructor(value) {
      if (value) {
        super(value)
        return
      }
      return new RealDate(fixedDate)
    }

    static now() {
      return fixedDate.getTime()
    }
  }

  try {
    assert.equal(calculateAge('2000-07-27'), 26)
    assert.equal(calculateAge('2000-07-29'), 25)
  } finally {
    global.Date = RealDate
  }
})

test('normalizePatientRecord exposes a consistent display payload', () => {
  const normalized = normalizePatientRecord({
    id: '1',
    patient_number: '1885/26',
    first_name: 'John',
    last_name: 'Banda',
    phone_number: '+260977000000',
    gender: 'male',
    date_of_birth: '2000-07-27',
  })

  assert.equal(normalized.name, 'John Banda')
  assert.equal(normalized.phone, '+260977000000')
  assert.equal(normalized.gender, 'Male')
  assert.equal(normalized.patient_number, '1885/26')
})
