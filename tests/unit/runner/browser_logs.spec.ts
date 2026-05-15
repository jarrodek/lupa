/* eslint-disable no-console */
import { test } from 'node:test'
import assert from 'node:assert'
import { BrowserLogs } from '../../../src/runner/brower_logs.js'

test('BrowserLogs', async (t) => {
  const originalLog = console.log
  const originalError = console.error
  const originalWarn = console.warn
  const originalDir = console.dir
  const originalTable = console.table

  t.afterEach(() => {
    console.log = originalLog
    console.error = originalError
    console.warn = originalWarn
    console.dir = originalDir
    console.table = originalTable
  })

  await t.test('filters messages if verbose is false', async () => {
    const logs: any[][] = []
    console.log = (...args) => logs.push(args)

    let consoleHandler: any
    const dummyPage = {
      on: (event: string, handler: any) => {
        if (event === 'console') consoleHandler = handler
      },
    }

    const browserLogs = new BrowserLogs(dummyPage as any, false)
    browserLogs.boot()

    const dummyMessage = {
      type: () => 'log',
      text: () => 'Hello',
      args: () => [],
    }

    await consoleHandler(dummyMessage)

    assert.strictEqual(logs.length, 0)
  })

  await t.test('prints simple text message when there are no args', async () => {
    const logs: any[][] = []
    console.log = (...args) => logs.push(args)

    let consoleHandler: any
    const dummyPage = {
      on: (event: string, handler: any) => {
        if (event === 'console') consoleHandler = handler
      },
    }

    const browserLogs = new BrowserLogs(dummyPage as any, true)
    browserLogs.boot()

    const dummyMessage = {
      type: () => 'log',
      text: () => 'Hello world',
      args: () => [],
    }

    await consoleHandler(dummyMessage)

    assert.strictEqual(logs.length, 1)
    assert.deepStrictEqual(logs[0], ['[Browser Console]', 'Hello world'])
  })

  await t.test('prints multiline messages with prefix on a separate line', async () => {
    const logs: any[][] = []
    console.log = (...args) => logs.push(args)

    let consoleHandler: any
    const dummyPage = {
      on: (event: string, handler: any) => {
        if (event === 'console') consoleHandler = handler
      },
    }

    const browserLogs = new BrowserLogs(dummyPage as any, true)
    browserLogs.boot()

    const dummyMessage = {
      type: () => 'log',
      text: () => 'line1\nline2',
      args: () => [
        {
          evaluate: async () => ({ __lupa_type: 'json', value: 'line1\nline2' }),
        },
      ],
    }

    await consoleHandler(dummyMessage)

    assert.strictEqual(logs.length, 1)
    // The first argument to console.log is the prefix, second is newline, third is formatted text
    assert.strictEqual(logs[0][0], '[Browser Console]')
    assert.strictEqual(logs[0][1], '\n')
    assert.strictEqual(logs[0][2], 'line1\nline2')
  })

  await t.test('evaluates node and element correctly', async () => {
    const logs: any[][] = []
    console.log = (...args) => logs.push(args)

    let consoleHandler: any
    const dummyPage = {
      on: (event: string, handler: any) => {
        if (event === 'console') consoleHandler = handler
      },
    }

    const browserLogs = new BrowserLogs(dummyPage as any, true)
    browserLogs.boot()

    const dummyMessage = {
      type: () => 'log',
      text: () => 'DOM elements',
      args: () => [
        {
          evaluate: async () => ({ __lupa_type: 'element', value: '<div id="test"></div>' }),
        },
        {
          evaluate: async () => ({ __lupa_type: 'node', value: '#text' }),
        },
      ],
    }

    await consoleHandler(dummyMessage)

    assert.strictEqual(logs.length, 1)
    assert.deepStrictEqual(logs[0], ['[Browser Console]', '<div id="test"></div>', '#text'])
  })

  await t.test('routes different types of logs to the correct console method', async () => {
    const errors: any[][] = []
    console.error = (...args) => errors.push(args)

    let consoleHandler: any
    const dummyPage = {
      on: (event: string, handler: any) => {
        if (event === 'console') consoleHandler = handler
      },
    }

    const browserLogs = new BrowserLogs(dummyPage as any, true)
    browserLogs.boot()

    const dummyMessage = {
      type: () => 'error',
      text: () => 'Oh no!',
      args: () => [
        {
          evaluate: async () => ({ __lupa_type: 'json', value: 'Oh no!' }),
        },
      ],
    }

    await consoleHandler(dummyMessage)

    assert.strictEqual(errors.length, 1)
    assert.deepStrictEqual(errors[0], ['[Browser Console]', 'Oh no!'])
  })
})
