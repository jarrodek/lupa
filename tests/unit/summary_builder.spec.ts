import test from 'node:test'
import assert from 'node:assert/strict'
import { SummaryBuilder } from '../../src/runner/summary_builder.js'

test('SummaryBuilder', async (t) => {
  await t.test('builds summary with single values', () => {
    const builder = new SummaryBuilder()

    builder.use(() => [
      { key: 'tests', value: '4' },
      { key: 'pass', value: '3' },
      { key: 'failed', value: '1' },
    ])

    const summary = builder.build()

    // "tests" is 5 chars, "pass" is 4, "failed" is 6
    // Max length is 6.
    assert.deepStrictEqual(summary, [' tests  4', '  pass  3', 'failed  1'])
  })

  await t.test('builds summary with multiple values (array)', () => {
    const builder = new SummaryBuilder()

    builder.use(() => [
      { key: 'tests', value: '10' },
      { key: 'errors', value: ['error 1', 'error 2'] },
    ])

    const summary = builder.build()

    // "tests" is 5 chars, "errors" is 6 chars. Max 6.
    assert.deepStrictEqual(summary, [' tests  10', 'errors  error 1\n        error 2'])
  })

  await t.test('combines multiple reporters', () => {
    const builder = new SummaryBuilder()

    builder.use(() => [{ key: 'tests', value: '2' }])

    builder.use(() => [{ key: 'duration', value: '10ms' }])

    const summary = builder.build()
    // "tests" is 5, "duration" is 8. Max 8.
    assert.deepStrictEqual(summary, ['   tests  2', 'duration  10ms'])
  })
})
