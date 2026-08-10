const test = require('node:test')
const assert = require('node:assert/strict')

async function loadModule() {
  const mod = await import('./patient-number.ts')
  return mod
}

test('buildPatientNumber formats sequential values with yearly suffixes', async () => {
  const { buildPatientNumber } = await loadModule()
  assert.equal(buildPatientNumber(1, 2026), '0001/26')
  assert.equal(buildPatientNumber(12, 2026), '0012/26')
  assert.equal(buildPatientNumber(142, 2026), '0142/26')
  assert.equal(buildPatientNumber(1, 2027), '0001/27')
})

test('formatNrcInput inserts the Zambian NRC separators while typing', async () => {
  const { formatNrcInput } = await loadModule()
  assert.equal(formatNrcInput('652260671'), '652260/67/1')
  assert.equal(formatNrcInput('123456102'), '123456/10/2')
})

test('validateNrc accepts the official Zambian format', async () => {
  const { validateNrc } = await loadModule()
  assert.equal(validateNrc('652260/67/1'), true)
  assert.equal(validateNrc('123456/10/2'), true)
  assert.equal(validateNrc('652260671'), false)
  assert.equal(validateNrc('652260-67-1'), false)
})

test('getNextPatientNumber uses RPC and throws if sequence function is unavailable', async () => {
  const { getNextPatientNumber } = await loadModule()
  const supabase = {
    rpc: async () => ({ data: null, error: { message: 'function get_next_patient_number does not exist' } })
  }
  await assert.rejects(
    async () => getNextPatientNumber(supabase, 2026),
    {
      message: 'Patient number generator is unavailable. Confirm the database migration and stored function are deployed.'
    }
  )
})

test('getNextPatientNumber returns RPC value when available', async () => {
  const { getNextPatientNumber } = await loadModule()
  const supabase = {
    rpc: async () => ({ data: '0001/26', error: null })
  }
  const value = await getNextPatientNumber(supabase, 2026)
  assert.equal(value, '0001/26')
})
