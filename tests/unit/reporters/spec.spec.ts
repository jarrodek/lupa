import { test } from 'node:test'
import assert from 'node:assert'
import { SpecReporter } from '../../../src/reporters/spec.js'
import { Emitter } from '../../../src/testing/emitter.js'
import type { TestEndNode, GroupStartNode, TestStartNode } from '../../../src/types.js'
import type { Runner } from '../../../src/runner/runner.js'

test('SpecReporter', async (t) => {
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

  await t.test('prints test success', async () => {
    const reporter = new SpecReporter()
    const emitter = new Emitter()
    reporter.boot({} as Runner, emitter)

    const payload: TestEndNode = {
      title: { expanded: 'test 1', original: 'test 1' },
      isTodo: false,
      hasError: false,
      isSkipped: false,
      isFailing: false,
      isPinned: false,
      duration: 12.34,
      errors: [],
      retryAttempt: 1,
    } as any

    await emitter.emit('test:end', payload)

    const output = logs.join('\n')
    assert.match(output, /test 1/)
    assert.match(output, /12.34ms/)
  })

  await t.test('prints test error with error message as subtext when marked as failing', async () => {
    const reporter = new SpecReporter()
    const emitter = new Emitter()
    reporter.boot({} as Runner, emitter)

    const payload: TestEndNode = {
      title: { expanded: 'test 2', original: 'test 2' },
      hasError: true,
      isFailing: true,
      duration: 12.34,
      errors: [{ phase: 'test', error: new Error('assertion failed') }],
    } as any

    await emitter.emit('test:end', payload)

    const output = logs.join('\n')
    assert.match(output, /test 2/)
    assert.match(output, /assertion failed/)
  })

  await t.test('prints skipped test with reason', async () => {
    const reporter = new SpecReporter()
    const emitter = new Emitter()
    reporter.boot({} as Runner, emitter)

    const payload: TestEndNode = {
      title: { expanded: 'test 3', original: 'test 3' },
      isSkipped: true,
      skipReason: 'WIP',
      duration: 0,
      errors: [],
    } as any

    await emitter.emit('test:end', payload)

    const output = logs.join('\n')
    assert.match(output, /test 3/)
    assert.match(output, /WIP/)
  })

  await t.test('prints group title on group start', async () => {
    const reporter = new SpecReporter()
    const emitter = new Emitter()
    reporter.boot({} as Runner, emitter)

    const payload: GroupStartNode = {
      title: 'Group 1',
      meta: { fileName: 'test/math.spec.ts' },
    } as any

    await emitter.emit('group:start', payload)

    const output = logs.join('\n')
    assert.match(output, /Group 1/)
    assert.match(output, /math\.spec\.ts/) // prints relative filename
  })

  await t.test('prints filename on test start if it is a lone test', async () => {
    const reporter = new SpecReporter()
    const emitter = new Emitter()
    reporter.boot({} as Runner, emitter)

    const payload: TestStartNode = {
      title: { expanded: 'test 1', original: 'test 1' },
      meta: { fileName: 'test/lone.spec.ts' },
    } as any

    await emitter.emit('test:start', payload)

    const output = logs.join('\n')
    assert.match(output, /lone\.spec\.ts/)
  })
})
