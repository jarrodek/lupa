import { test } from 'node:test'
import assert from 'node:assert'
import { formatPinnedTest, dateTimeDoubles } from '../../../src/runner/helpers.js'
import { Test } from '../../../src/testing/test/main.js'

import { Refiner } from '../../../src/refiner/main.js'

test('Helpers', async (t) => {
  await t.test('formatPinnedTest captures location and formats pinned test string', () => {
    const refiner = new Refiner()
    const t1 = new Test('My Pinned Test', {} as any, {} as any, refiner)
    t1.pin()

    const formatted = formatPinnedTest(t1)

    // Check that it contains the test title
    assert.match(formatted, /My Pinned Test/)

    // Check that it resolved the stack trace. Because we call it synchronously in the test,
    // the top non-node stack frame is actually formatPinnedTest inside helpers.ts itself.
    assert.match(formatted, /helpers\.ts/)
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
