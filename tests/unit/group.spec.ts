import { test } from 'node:test'
import assert from 'node:assert'
import { Group } from '../../src/testing/group/main.js'
import { Test } from '../../src/testing/test/main.js'
import { Emitter } from '../../src/testing/emitter.js'
import { Refiner } from '../../src/refiner/main.js'

function createTest(title: string, emitter: Emitter, refiner: Refiner) {
  const context = {} as any
  const t = new Test(title, context, emitter, refiner)
  t.run(() => {
    // ...
  })
  return t
}

test('Group', async (t) => {
  await t.test('adds test to group and mutates test properties based on group.each configuration', async () => {
    const emitter = new Emitter()
    const refiner = new Refiner()
    const group = new Group('Math', emitter, refiner)

    group.each.timeout(100)
    group.each.retry(2)
    group.each.skip(true, 'Skipped by group')

    let setupCalled = false
    group.each.setup(() => {
      setupCalled = true
    })

    const testItem = createTest('2+2', emitter, refiner)
    group.add(testItem)

    assert.strictEqual(testItem.options.timeout, 100)
    assert.strictEqual(testItem.options.retries, 2)
    assert.strictEqual(testItem.options.isSkipped, true)

    // A skipped test doesn't run its hooks
    await testItem.exec()
    assert.strictEqual(setupCalled, false)
  })

  await t.test('executes group setup and teardown hooks', async () => {
    const emitter = new Emitter()
    const refiner = new Refiner()
    const group = new Group('Math', emitter, refiner)

    const calls: string[] = []
    group.setup(() => {
      calls.push('setup')
    })
    group.teardown(() => {
      calls.push('teardown')
    })

    const testItem = createTest('2+2', emitter, refiner)
    group.add(testItem)

    await group.exec()

    assert.deepStrictEqual(calls, ['setup', 'teardown'])
  })

  await t.test('executes tests within the group', async () => {
    const emitter = new Emitter()
    const refiner = new Refiner()
    const group = new Group('Math', emitter, refiner)

    let executed = false
    const testItem = createTest('2+2', emitter, refiner)
    testItem.run(() => {
      executed = true
    })
    group.add(testItem)

    await group.exec()

    assert.strictEqual(executed, true)
  })

  await t.test('bails when test fails if bail is enabled', async () => {
    const emitter = new Emitter()
    const refiner = new Refiner()
    const group = new Group('Math', emitter, refiner)
    group.bail(true)

    let t2Executed = false

    const t1 = createTest('T1', emitter, refiner)
    t1.run(() => {
      throw new Error('Failed')
    })

    const t2 = createTest('T2', emitter, refiner)
    t2.run(() => {
      t2Executed = true
    })

    group.add(t1)
    group.add(t2)

    await group.exec()

    assert.strictEqual(t1.failed, true)
    assert.strictEqual(t2Executed, false) // T2 should be skipped due to bail
    assert.strictEqual(group.failed, true)
  })
})
