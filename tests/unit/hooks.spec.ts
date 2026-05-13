import { test } from 'node:test'
import assert from 'node:assert'
import { Hooks } from '../../src/hooks/main.js'

test('Hooks', async (t) => {
  await t.test('executes hook handlers', async () => {
    const hooks = new Hooks<{ saving: [[string], []] }>()
    const calls: string[] = []

    hooks.add('saving', (name) => {
      calls.push(`saving ${name}`)
    })

    const runner = hooks.runner('saving')
    await runner.run('user')

    assert.deepStrictEqual(calls, ['saving user'])
  })

  await t.test('executes handlers in order', async () => {
    const hooks = new Hooks<{ saving: [[], []] }>()
    const calls: number[] = []

    hooks.add('saving', () => {
      calls.push(1)
    })
    hooks.add('saving', () => {
      calls.push(2)
    })

    const runner = hooks.runner('saving')
    await runner.run()

    assert.deepStrictEqual(calls, [1, 2])
  })

  await t.test('executes handlers in reverse order', async () => {
    const hooks = new Hooks<{ saving: [[], []] }>()
    const calls: number[] = []

    hooks.add('saving', () => {
      calls.push(1)
    })
    hooks.add('saving', () => {
      calls.push(2)
    })

    const runner = hooks.runner('saving')
    await runner.runReverse()

    assert.deepStrictEqual(calls, [2, 1])
  })

  await t.test('executes cleanup handlers in reverse order', async () => {
    const hooks = new Hooks<{ saving: [[], [string]] }>()
    const calls: number[] = []
    const cleanups: string[] = []

    hooks.add('saving', () => {
      calls.push(1)
      return (val) => {
        cleanups.push(`cleanup 1: ${val}`)
      }
    })
    hooks.add('saving', () => {
      calls.push(2)
      return (val) => {
        cleanups.push(`cleanup 2: ${val}`)
      }
    })

    const runner = hooks.runner('saving')
    await runner.run()
    assert.deepStrictEqual(calls, [1, 2])

    await runner.cleanup('done')
    assert.deepStrictEqual(cleanups, ['cleanup 2: done', 'cleanup 1: done'])
  })

  await t.test('can skip handlers', async () => {
    const hooks = new Hooks<{ saving: [[], []] }>()
    const calls: string[] = []

    const handler1 = () => {
      calls.push('h1')
    }
    Object.defineProperty(handler1, 'name', { value: 'h1' })

    const handler2 = () => {
      calls.push('h2')
    }
    Object.defineProperty(handler2, 'name', { value: 'h2' })

    hooks.add('saving', handler1)
    hooks.add('saving', handler2)

    const runner = hooks.runner('saving')
    runner.without(['h1'])
    await runner.run()

    assert.deepStrictEqual(calls, ['h2'])
  })

  await t.test('can skip all handlers', async () => {
    const hooks = new Hooks<{ saving: [[], []] }>()
    const calls: string[] = []

    hooks.add('saving', () => {
      calls.push('h1')
    })
    hooks.add('saving', () => {
      calls.push('h2')
    })

    const runner = hooks.runner('saving')
    runner.without()
    await runner.run()

    assert.deepStrictEqual(calls, [])
  })
})
