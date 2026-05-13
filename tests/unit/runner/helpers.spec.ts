import { test } from 'node:test'
import assert from 'node:assert'
import { formatPinnedTest, dateTimeDoubles } from '../../../src/runner/helpers.js'

test('Helpers', async (t) => {
  await t.test('formatPinnedTest captures location and formats pinned test string', () => {
    // Generate a raw stack trace to simulate what error.stack gives
    const fakeError = new Error('Finding pinned test location')

    // Check that it contains the test title
    const formatted = formatPinnedTest('My Pinned Test', fakeError.stack || '')

    assert.match(formatted, /My Pinned Test/)

    // Check that it resolved the stack trace. Because we generated the error synchronously in the test,
    // the top non-node stack frame is actually helpers.spec.ts itself.
    assert.match(formatted, /helpers\.spec\.ts/)
  })

  await t.test('dateTimeDoubles exposes timekeeper methods', () => {
    const start = new Date('2023-01-01T00:00:00Z')

    dateTimeDoubles.freeze(start)
    assert.strictEqual(new Date().toISOString(), start.toISOString())

    dateTimeDoubles.travelTo('2 hours')
    const traveled = new Date()
    assert.strictEqual(traveled.getUTCHours(), 2)

    dateTimeDoubles.reset()
    assert.notStrictEqual(new Date().toISOString(), start.toISOString())
  })
})
