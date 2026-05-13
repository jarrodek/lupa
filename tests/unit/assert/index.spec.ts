import { test } from 'node:test'
import assertNode from 'node:assert'
import setup from '../../../src/assert/index.js'
import { Test } from '../../../src/testing/test/main.js'
import { TestContext } from '../../../src/testing/test_context.js'
import { Assert } from '../../../src/assert/assert.js'
import type { WebPluginContext } from '../../../src/testing/web_plugin.js'

const context = {} as unknown as WebPluginContext

test('Assert Plugin', async (t) => {
  t.beforeEach(() => {
    // Clear global state to avoid pollution
    ;(Test as any).executedCallbacks = []
    ;(TestContext as any).getters = new Map()
  })

  await t.test('setup registers assert getter on TestContext', () => {
    setup(context)
    const ctx = new TestContext({} as any)
    assertNode.ok(ctx.assert instanceof Assert)
  })

  await t.test('Test.executed callback validates assertions', () => {
    setup(context)
    const callback = (Test as any).executedCallbacks[0]

    let validateCalled = false
    const mockTest = {
      options: { isFailing: false },
      context: {
        assert: {
          assertions: {
            validate() {
              validateCalled = true
            },
          },
        },
      },
    }

    callback(mockTest, false)
    assertNode.strictEqual(validateCalled, true)
  })

  await t.test('callback skips validation if test has errors', () => {
    setup(context)
    const callback = (Test as any).executedCallbacks[0]

    let validateCalled = false
    const mockTest = {
      options: { isFailing: false },
      context: {
        assert: {
          assertions: {
            validate() {
              validateCalled = true
            },
          },
        },
      },
    }

    callback(mockTest, true) // hasError = true
    assertNode.strictEqual(validateCalled, false)
  })

  await t.test('callback skips validation for regression tests', () => {
    setup(context)
    const callback = (Test as any).executedCallbacks[0]

    let validateCalled = false
    const mockTest = {
      options: { isFailing: true }, // Regression test
      context: {
        assert: {
          assertions: {
            validate() {
              validateCalled = true
            },
          },
        },
      },
    }

    callback(mockTest, false)
    assertNode.strictEqual(validateCalled, false)
  })
})
