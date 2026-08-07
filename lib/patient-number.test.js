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
