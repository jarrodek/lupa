import { test } from 'node:test'
import assert from 'node:assert'
import { Tracker } from '../../src/testing/tracker.js'
import type { SuiteStartNode, SuiteEndNode, GroupStartNode, GroupEndNode, TestEndNode } from '../../src/types.js'

test('Tracker', async (t) => {
  await t.test('tracks test events and aggregates correctly', () => {
    const tracker = new Tracker()
    tracker.processEvent('runner:start', undefined as any)

    tracker.processEvent('suite:start', { name: 'unit' } as SuiteStartNode)

    tracker.processEvent('group:start', { title: 'Math' } as GroupStartNode)

    tracker.processEvent('test:end', {
      title: { original: '2+2', expanded: '2+2' },
      isSkipped: false,
      isTodo: false,
      hasError: false,
      isFailing: false,
      errors: [],
    } as unknown as TestEndNode)

    tracker.processEvent('test:end', {
      title: { original: '2+3', expanded: '2+3' },
      isSkipped: false,
      isTodo: false,
      hasError: true,
      isFailing: false,
      errors: [{ phase: 'test', error: new Error('Wrong') }],
    } as unknown as TestEndNode)

    tracker.processEvent('test:end', {
      title: { original: 'skipped', expanded: 'skipped' },
      isSkipped: true,
      isTodo: false,
      hasError: false,
      isFailing: false,
      errors: [],
    } as unknown as TestEndNode)

    tracker.processEvent('test:end', {
      title: { original: 'todo', expanded: 'todo' },
      isSkipped: false,
      isTodo: true,
      hasError: false,
      isFailing: false,
      errors: [],
    } as unknown as TestEndNode)

    tracker.processEvent('test:end', {
      title: { original: 'regression', expanded: 'regression' },
      isSkipped: false,
      isTodo: false,
      hasError: false,
      isFailing: true,
      errors: [],
    } as unknown as TestEndNode)

    tracker.processEvent('group:end', { hasError: false, errors: [] } as unknown as GroupEndNode)
    tracker.processEvent('suite:end', { hasError: false, errors: [] } as unknown as SuiteEndNode)
    tracker.processEvent('runner:end', undefined as any)

    const summary = tracker.getSummary()

    assert.strictEqual(summary.aggregates.total, 5)
    assert.strictEqual(summary.aggregates.passed, 1)
    assert.strictEqual(summary.aggregates.failed, 1)
    assert.strictEqual(summary.aggregates.skipped, 1)
    assert.strictEqual(summary.aggregates.todo, 1)
    assert.strictEqual(summary.aggregates.regression, 1)

    assert.strictEqual(summary.hasError, true)
    assert.strictEqual(summary.failureTree.length, 1)
    assert.strictEqual(summary.failureTree[0].name, 'unit')
    assert.strictEqual(summary.failureTree[0].children.length, 1)
    assert.strictEqual((summary.failureTree[0].children[0] as any).name, 'Math')
    assert.strictEqual((summary.failureTree[0].children[0] as any).children.length, 1)
    assert.strictEqual((summary.failureTree[0].children[0] as any).children[0].title, '2+3')

    assert.deepStrictEqual(summary.failedTestsTitles, ['2+3'])
  })

  await t.test('tracks errors on suite and group directly', () => {
    const tracker = new Tracker()
    tracker.processEvent('runner:start', undefined as any)

    tracker.processEvent('suite:start', { name: 'unit' } as SuiteStartNode)
    tracker.processEvent('group:start', { title: 'Math' } as GroupStartNode)

    tracker.processEvent('group:end', {
      hasError: true,
      errors: [{ phase: 'setup', error: new Error('Group Setup Failed') }],
    } as unknown as GroupEndNode)
    tracker.processEvent('suite:end', {
      hasError: true,
      errors: [{ phase: 'setup', error: new Error('Suite Setup Failed') }],
    } as unknown as SuiteEndNode)

    const summary = tracker.getSummary()

    assert.strictEqual(summary.hasError, true)
    assert.strictEqual(summary.failureTree.length, 1)
    assert.strictEqual(summary.failureTree[0].errors.length, 1)
    assert.strictEqual(summary.failureTree[0].children[0].errors.length, 1)
  })
})
