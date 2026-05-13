import { test } from 'node:test'
import assert from 'node:assert'
import { DotReporter } from '../../../src/reporters/dot.js'
import { Emitter } from '../../../src/testing/emitter.js'
import type { Runner, TestEndNode } from '../../../src/types.js'
import { icons } from '../../../src/runner/helpers.js'

test('DotReporter', async (t) => {
  let stdoutData: string[] = []
  const originalStdoutWrite = process.stdout.write.bind(process.stdout)

  t.beforeEach(() => {
    stdoutData = []
    process.stdout.write = (buffer: Uint8Array | string, cb?: any) => {
      stdoutData.push(buffer.toString())
      if (typeof cb === 'function') cb()
      return true
    }
  })

  t.afterEach(() => {
    process.stdout.write = originalStdoutWrite
  })

  await t.test('prints tick for passed test', async () => {
    const reporter = new DotReporter()
    const emitter = new Emitter()
    reporter.boot({} as Runner, emitter)

    const payload: TestEndNode = {
      isTodo: false,
      hasError: false,
      isSkipped: false,
      isFailing: false,
    } as any

    await emitter.emit('test:end', payload)

    const output = stdoutData.join('')
    assert.match(output, new RegExp(icons.tick.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  })

  await t.test('prints cross for failed test', async () => {
    const reporter = new DotReporter()
    const emitter = new Emitter()
    reporter.boot({} as Runner, emitter)

    const payload: TestEndNode = {
      hasError: true,
    } as any

    await emitter.emit('test:end', payload)

    const output = stdoutData.join('')
    assert.match(output, new RegExp(icons.cross.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  })

  await t.test('prints bullet for skipped test', async () => {
    const reporter = new DotReporter()
    const emitter = new Emitter()
    reporter.boot({} as Runner, emitter)

    const payload: TestEndNode = {
      isSkipped: true,
    } as any

    await emitter.emit('test:end', payload)

    const output = stdoutData.join('')
    assert.match(output, new RegExp(icons.bullet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  })

  await t.test('prints info for todo test', async () => {
    const reporter = new DotReporter()
    const emitter = new Emitter()
    reporter.boot({} as Runner, emitter)

    const payload: TestEndNode = {
      isTodo: true,
    } as any

    await emitter.emit('test:end', payload)

    const output = stdoutData.join('')
    assert.match(output, new RegExp(icons.info.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  })

  await t.test('prints square for failing test', async () => {
    const reporter = new DotReporter()
    const emitter = new Emitter()
    reporter.boot({} as Runner, emitter)

    const payload: TestEndNode = {
      isFailing: true,
    } as any

    await emitter.emit('test:end', payload)

    const output = stdoutData.join('')
    assert.match(output, new RegExp(icons.squareSmallFilled.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  })
})
