import { test } from 'node:test'
import assert from 'node:assert'
import { Runner } from '../../../src/runner/runner.js'
import { Emitter } from '../../../src/testing/emitter.js'

test('Runner', async (t) => {
  await t.test('boot initializes tracker and listens to events', async () => {
    const emitter = new Emitter()
    const runner = new Runner(emitter)

    let reporterCalled = false
    runner.registerReporter(async () => {
      reporterCalled = true
    })

    await runner.start()
    assert.strictEqual(reporterCalled, true)
    assert.strictEqual(runner.failed, false)

    // Emit start events so Tracker doesn't throw when finding nodes
    await emitter.emit('suite:start', { name: 'S1' } as any)
    await emitter.emit('test:start', { title: 'T1', isFailing: false } as any)
    // Test failure tracking - emitting test:end with hasError
    await emitter.emit('test:end', { title: 'T1', hasError: true, errors: [] } as any)
    assert.strictEqual(runner.failed, true)

    // Test summary
    const summary = runner.getSummary()
    assert.ok(summary)
    assert.strictEqual(summary.hasError, true)
  })

  await t.test('suite:end also flags runner as failed', async () => {
    const emitter = new Emitter()
    const runner = new Runner(emitter)
    await runner.start()

    await emitter.emit('suite:start', { name: 'S1' } as any)
    await emitter.emit('suite:end', { name: 'S1', hasError: true, errors: [] } as any)
    assert.strictEqual(runner.failed, true)
  })

  await t.test('group:end also flags runner as failed', async () => {
    const emitter = new Emitter()
    const runner = new Runner(emitter)
    await runner.start()

    await emitter.emit('suite:start', { name: 'S1' } as any)
    await emitter.emit('group:start', { title: 'G1' } as any)
    await emitter.emit('group:end', { title: 'G1', hasError: true, errors: [] } as any)
    assert.strictEqual(runner.failed, true)
  })

  await t.test('calls object-based reporters handler', async () => {
    const emitter = new Emitter()
    const runner = new Runner(emitter)

    let reporterCalled = false
    const reporter = {
      name: 'object-reporter',
      handler: async () => {
        reporterCalled = true
      },
    }

    runner.registerReporter(reporter as any)
    await runner.start()

    assert.strictEqual(reporterCalled, true)
  })

  await t.test('getSummary throws if not booted', () => {
    const emitter = new Emitter()
    const runner = new Runner(emitter)

    assert.throws(() => {
      runner.getSummary()
    }, /Invalid state: Tracker not initialized/)
  })

  await t.test('end method works without throwing', async () => {
    const emitter = new Emitter()
    const runner = new Runner(emitter)
    await runner.end()
    assert.ok(true)
  })
})
