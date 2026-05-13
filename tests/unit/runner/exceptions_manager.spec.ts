/* eslint-disable no-console */
import { test } from 'node:test'
import assert from 'node:assert'
import { ExceptionsManager } from '../../../src/runner/exceptions_manager.js'

test('ExceptionsManager', async (t) => {
  let logs: string[] = []
  const originalLog = console.log
  const originalError = console.error
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  let processEvents: Record<string, Function> = {}
  const originalOn = process.on
  let originalExitCode = process.exitCode

  t.beforeEach(() => {
    logs = []
    const logFn = (...args: any[]) => {
      logs.push(args.join(' '))
    }
    console.log = logFn
    console.error = logFn

    processEvents = {}
    process.on = (event: string, listener: any) => {
      processEvents[event] = listener
      return process
    }

    originalExitCode = process.exitCode
  })

  t.afterEach(() => {
    console.log = originalLog
    console.error = originalError
    process.on = originalOn
    process.exitCode = originalExitCode
  })

  await t.test('monitors process uncaught errors and buffers them when watching', async () => {
    const manager = new ExceptionsManager()
    manager.monitor()

    assert.strictEqual(typeof processEvents['uncaughtException'], 'function')
    assert.strictEqual(typeof processEvents['unhandledRejection'], 'function')

    await processEvents['uncaughtException'](new Error('uncaught error'))
    await processEvents['unhandledRejection'](new Error('unhandled rejection'))

    assert.strictEqual(manager.hasErrors, true)
    // they should be buffered, so no logs yet
    assert.strictEqual(logs.length, 0)
  })

  await t.test('prints process errors immediately if not watching', async () => {
    const manager = new ExceptionsManager()
    manager.monitor()
    await manager.report() // flips state to reporting

    await processEvents['uncaughtException'](new Error('immediate uncaught'))
    const output = logs.join('\n')
    assert.match(output, /immediate uncaught/)
    assert.strictEqual(process.exitCode, 1)

    logs.length = 0 // clear
    process.exitCode = 0 // reset
    await processEvents['unhandledRejection'](new Error('immediate rejection'))
    const output2 = logs.join('\n')
    assert.match(output2, /immediate rejection/)
    assert.strictEqual(process.exitCode, 1)
  })

  await t.test('buffers browser exceptions when watching', () => {
    const manager = new ExceptionsManager()
    manager.handleBrowserException(new Error('browser err1'), 'error')
    manager.handleBrowserException(new Error('browser err2'), 'rejection')

    assert.strictEqual(manager.hasErrors, true)
    assert.strictEqual(logs.length, 0)
  })

  await t.test('prints browser exceptions immediately if not watching', async () => {
    const manager = new ExceptionsManager()
    await manager.report() // flip state

    manager.handleBrowserException(new Error('immediate browser error'), 'error')
    await new Promise((r) => setTimeout(r, 50))
    assert.match(logs.join('\n'), /Browser Unhandled Error/)
    assert.match(logs.join('\n'), /immediate browser error/)
    assert.strictEqual(process.exitCode, 1)

    logs.length = 0
    process.exitCode = 0
    manager.handleBrowserException(new Error('immediate browser rej'), 'rejection')
    await new Promise((r) => setTimeout(r, 50))
    assert.match(logs.join('\n'), /Browser Unhandled Rejection/)
    assert.match(logs.join('\n'), /immediate browser rej/)
    assert.strictEqual(process.exitCode, 1)
  })

  await t.test('report flushes buffers', async () => {
    const manager = new ExceptionsManager()
    manager.handleBrowserException(new Error('err1'), 'error')
    manager.handleBrowserException(new Error('err2'), 'error')
    manager.handleBrowserException(new Error('rej1'), 'rejection')

    await manager.report()

    const output = logs.join('\n')
    assert.match(output, /err1/)
    assert.match(output, /err2/)
    assert.match(output, /\[1\/2\]/) // border counter
    assert.match(output, /\[2\/2\]/) // border counter

    assert.match(output, /Unhandled Rejections/)
    assert.match(output, /rej1/)
    assert.match(output, /\[1\/1\]/) // border counter
  })
})
