import { test } from 'node:test'
import assert from 'node:assert'
import { Refiner } from '../../src/refiner/main.js'
import { Group } from '../../src/testing/group/main.js'
import { Test } from '../../src/testing/test/main.js'
import { Emitter } from '../../src/testing/emitter.js'
import type { TestContext } from '../../src/testing/test_context.js'

function createGroup(title: string) {
  const emitter = new Emitter()
  const refiner = new Refiner()
  return new Group(title, emitter, refiner)
}

function createTest(title: string, group?: Group) {
  const emitter = new Emitter()
  const refiner = new Refiner()
  const t = new Test(title, {} as unknown as TestContext, emitter, refiner)
  if (group) {
    t.parent = group
    group.add(t)
  }
  return t
}

test('Refiner', async (t) => {
  await t.test('filters by test title', () => {
    const refiner = new Refiner({ tests: ['Math works'] })
    const allowedTest = createTest('Math works')
    const deniedTest = createTest('Physics works')

    assert.strictEqual(refiner.allows(allowedTest), true)
    assert.strictEqual(refiner.allows(deniedTest), false)
  })

  await t.test('filters by tags', () => {
    const refiner = new Refiner({ tags: ['@math'] })
    const allowedTest = createTest('Math works')
    allowedTest.options.tags = ['@math']
    const deniedTest = createTest('Physics works')
    deniedTest.options.tags = ['@physics']

    assert.strictEqual(refiner.allows(allowedTest), true)
    assert.strictEqual(refiner.allows(deniedTest), false)
  })

  await t.test('filters by negated tags', () => {
    const refiner = new Refiner({ tags: ['~@slow'] })
    const allowedTest = createTest('Math works')
    allowedTest.options.tags = ['@fast']
    const deniedTest = createTest('Physics works')
    deniedTest.options.tags = ['@slow']

    assert.strictEqual(refiner.allows(allowedTest), true)
    assert.strictEqual(refiner.allows(deniedTest), false)
  })

  await t.test('filters by multiple tags (some)', () => {
    const refiner = new Refiner({ tags: ['@math', '@physics'] })
    const t1 = createTest('T1')
    t1.options.tags = ['@math']
    const t2 = createTest('T2')
    t2.options.tags = ['@physics']
    const t3 = createTest('T3')
    t3.options.tags = ['@chemistry']

    assert.strictEqual(refiner.allows(t1), true)
    assert.strictEqual(refiner.allows(t2), true)
    assert.strictEqual(refiner.allows(t3), false)
  })

  await t.test('filters by multiple tags (matchAll)', () => {
    const refiner = new Refiner({ tags: ['@math', '@slow'] })
    refiner.matchAllTags(true)
    const t1 = createTest('T1')
    t1.options.tags = ['@math', '@slow']
    const t2 = createTest('T2')
    t2.options.tags = ['@math']

    assert.strictEqual(refiner.allows(t1), true)
    assert.strictEqual(refiner.allows(t2), false)
  })

  await t.test('filters by pinned tests', () => {
    const refiner = new Refiner()
    const pinned = createTest('pinned')
    const notPinned = createTest('not pinned')

    refiner.pinTest(pinned)

    assert.strictEqual(refiner.allows(pinned), true)
    assert.strictEqual(refiner.allows(notPinned), false)
  })

  await t.test('filters by groups', () => {
    const refiner = new Refiner({ groups: ['Math'] })

    const allowedGroup = createGroup('Math')
    createTest('T1', allowedGroup)

    const deniedGroup = createGroup('Physics')
    createTest('T2', deniedGroup)

    const loneTest = createTest('T3')

    // Only testing the group level here, since runner checks group first.
    // If the test has no parent, it's explicitly rejected by groups filter.
    assert.strictEqual(refiner.allows(loneTest), false)

    assert.strictEqual(refiner.allows(allowedGroup), true)
    assert.strictEqual(refiner.allows(deniedGroup), false)
  })

  await t.test('allows group if child test is allowed by test filter', () => {
    const refiner = new Refiner({ tests: ['T1'] })
    const group = createGroup('Math')
    createTest('T1', group)
    createTest('T2', group)

    // The group itself doesn't match 'T1', but one of its children does,
    // so the group should be allowed.
    assert.strictEqual(refiner.allows(group), true)
  })
})
