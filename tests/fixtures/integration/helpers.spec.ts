import { test } from '../../../src/testing/index.js'
import { aTimeout, nextFrame, oneEvent, waitUntil } from '../../../src/testing/helpers.js'

test.group('Testing Helpers', () => {
  test('aTimeout resolves after specified time', async ({ assert }) => {
    const start = Date.now()
    await aTimeout(50)
    const end = Date.now()
    assert.isAtLeast(end - start, 45) // allow small timing jitter
  })

  test('nextFrame resolves', async ({ assert }) => {
    let resolved = false
    nextFrame().then(() => {
      resolved = true
    })
    assert.isFalse(resolved)
    await aTimeout(50) // wait to ensure frame passes
    assert.isTrue(resolved)
  })

  test('oneEvent resolves when event fires', async ({ assert }) => {
    const el = document.createElement('div')
    setTimeout(() => {
      el.dispatchEvent(new CustomEvent('custom-event', { detail: { foo: 'bar' } }))
    }, 10)
    const event = (await oneEvent(el, 'custom-event')) as CustomEvent
    assert.equal(event.type, 'custom-event')
    assert.equal(event.detail.foo, 'bar')
  })

  test('waitUntil resolves when condition is true', async ({ assert }) => {
    let value = false
    setTimeout(() => {
      value = true
    }, 20)
    await waitUntil(() => value === true, 'value should become true')
    assert.isTrue(value)
  })

  test('waitUntil throws on timeout', async ({ assert }) => {
    try {
      await waitUntil(() => false, 'should timeout', { timeout: 20, interval: 10 })
      assert.fail('should have thrown')
    } catch (err: any) {
      assert.equal(err.message, 'Timeout: should timeout')
    }
  })
})
