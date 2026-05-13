import { test } from 'node:test'
import assert from 'node:assert'
import { Emitter } from '../../src/testing/emitter.js'

test('Emitter', async (t) => {
  await t.test('emits events and listeners can receive them', async () => {
    const emitter = new Emitter()
    let received: any

    emitter.on('runner:start', (data) => {
      received = data
    })

    await emitter.emit('runner:start', { some: 'data' } as any)
    assert.deepStrictEqual(received, { some: 'data' })
  })

  await t.test('calls onError handler when emit fails', async () => {
    const emitter = new Emitter()
    let errorReceived: any

    emitter.on('runner:start', () => {
      throw new Error('Listener failed')
    })

    emitter.onError((error) => {
      errorReceived = error
    })

    await emitter.emit('runner:start', undefined as any)

    assert.ok(errorReceived)
    assert.strictEqual(errorReceived.name, 'AggregateError')
    assert.strictEqual(errorReceived.errors[0].message, 'Listener failed')
  })

  await t.test('throws error when emit fails and no onError handler is defined', async () => {
    const emitter = new Emitter()

    emitter.on('runner:start', () => {
      throw new Error('Listener failed')
    })

    await assert.rejects(async () => {
      await emitter.emit('runner:start', undefined as any)
    }, /One or more listeners threw an error/)
  })
})
