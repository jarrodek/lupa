import { test } from 'node:test'
import assert from 'node:assert'
import { NdJSONReporter } from '../../../src/reporters/ndjson.js'
import { Emitter } from '../../../src/testing/emitter.js'
import type {
  Runner,
  TestEndNode,
  GroupStartNode,
  GroupEndNode,
  SuiteStartNode,
  SuiteEndNode,
} from '../../../src/types.js'

test('NdJSONReporter', async (t) => {
  let logs: string[] = []
  // eslint-disable-next-line no-console
  const originalLog = console.log

  t.beforeEach(() => {
    logs = []
    // eslint-disable-next-line no-console
    console.log = (...args: any[]) => {
      logs.push(args.join(' '))
    }
  })

  t.afterEach(() => {
    // eslint-disable-next-line no-console
    console.log = originalLog
  })

  await t.test('prints test:end event', async () => {
    const reporter = new NdJSONReporter()
    const emitter = new Emitter()
    reporter.boot({} as Runner, emitter)

    const payload: TestEndNode = {
      title: { expanded: 'test 1', original: 'test 1' },
      isTodo: false,
      hasError: true,
      isSkipped: false,
      isFailing: false,
      isPinned: false,
      duration: 12.34,
      errors: [{ phase: 'test', error: new Error('assertion failed') }],
      retryAttempt: 1,
    } as any

    await emitter.emit('test:end', payload)

    assert.strictEqual(logs.length, 1)
    const data = JSON.parse(logs[0])
    assert.strictEqual(data.event, 'test:end')
    assert.deepStrictEqual(data.title, { expanded: 'test 1', original: 'test 1' })
    assert.strictEqual(data.duration, 12.34)
    assert.strictEqual(data.hasError, undefined) // it doesn't serialize hasError, let's verify what it serializes
    assert.strictEqual(data.errors[0].phase, 'test')
    assert.strictEqual(data.errors[0].error.message, 'assertion failed')
  })

  await t.test('prints group:start event', async () => {
    const reporter = new NdJSONReporter()
    const emitter = new Emitter()
    reporter.boot({} as Runner, emitter)

    const payload: GroupStartNode = { title: 'Group 1' } as any
    await emitter.emit('group:start', payload)

    assert.strictEqual(logs.length, 1)
    const data = JSON.parse(logs[0])
    assert.strictEqual(data.event, 'group:start')
    assert.strictEqual(data.title, 'Group 1')
  })

  await t.test('prints group:end event', async () => {
    const reporter = new NdJSONReporter()
    const emitter = new Emitter()
    reporter.boot({} as Runner, emitter)

    const payload: GroupEndNode = { title: 'Group 1', errors: [] } as any
    await emitter.emit('group:end', payload)

    assert.strictEqual(logs.length, 1)
    const data = JSON.parse(logs[0])
    assert.strictEqual(data.event, 'group:end')
    assert.strictEqual(data.title, 'Group 1')
  })

  await t.test('prints suite:start event', async () => {
    const reporter = new NdJSONReporter()
    const emitter = new Emitter()
    reporter.boot({} as Runner, emitter)

    const payload: SuiteStartNode = { name: 'Suite 1' } as any
    await emitter.emit('suite:start', payload)

    assert.strictEqual(logs.length, 1)
    const data = JSON.parse(logs[0])
    assert.strictEqual(data.event, 'suite:start')
    assert.strictEqual(data.name, 'Suite 1')
  })

  await t.test('prints suite:end event', async () => {
    const reporter = new NdJSONReporter()
    const emitter = new Emitter()
    reporter.boot({} as Runner, emitter)

    const payload: SuiteEndNode = { name: 'Suite 1', hasError: false, errors: [] } as any
    await emitter.emit('suite:end', payload)

    assert.strictEqual(logs.length, 1)
    const data = JSON.parse(logs[0])
    assert.strictEqual(data.event, 'suite:end')
    assert.strictEqual(data.name, 'Suite 1')
  })
})
