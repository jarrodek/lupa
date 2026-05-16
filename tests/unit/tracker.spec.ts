import { test } from 'node:test'
import assert from 'node:assert'
import { Tracker } from '../../src/runner/tracker.js'
import type {
  SuiteStartNode,
  SuiteEndNode,
  GroupStartNode,
  GroupEndNode,
  TestEndNode,
  WithCorrelation,
} from '../../src/types.js'

test('Tracker', async (t) => {
  await t.test('tracks test events and aggregates correctly', () => {
    const tracker = new Tracker()
    tracker.processEvent('runner:start', undefined as any)

    tracker.processEvent('suite:start', {
      name: 'unit',
      browserId: 'chromium',
      file: 'test.ts',
      meta: {},
    } as unknown as WithCorrelation<SuiteStartNode>)

    tracker.processEvent('group:start', {
      title: 'Math',
      browserId: 'chromium',
      file: 'test.ts',
      meta: { suite: 'unit' },
    } as unknown as WithCorrelation<GroupStartNode>)

    tracker.processEvent('test:end', {
      title: { original: '2+2', expanded: '2+2' },
      isSkipped: false,
      isTodo: false,
      hasError: false,
      isFailing: false,
      errors: [],
      browserId: 'chromium',
      file: 'test.ts',
      meta: { suite: 'unit', group: 'Math' },
    } as unknown as WithCorrelation<TestEndNode>)

    tracker.processEvent('test:end', {
      title: { original: '2+3', expanded: '2+3' },
      isSkipped: false,
      isTodo: false,
      hasError: true,
      isFailing: false,
      errors: [{ phase: 'test', error: new Error('Wrong') }],
      browserId: 'chromium',
      file: 'test.ts',
      meta: { suite: 'unit', group: 'Math' },
    } as unknown as WithCorrelation<TestEndNode>)

    tracker.processEvent('test:end', {
      title: { original: 'skipped', expanded: 'skipped' },
      isSkipped: true,
      isTodo: false,
      hasError: false,
      isFailing: false,
      errors: [],
      browserId: 'chromium',
      file: 'test.ts',
      meta: { suite: 'unit', group: 'Math' },
    } as unknown as WithCorrelation<TestEndNode>)

    tracker.processEvent('test:end', {
      title: { original: 'todo', expanded: 'todo' },
      isSkipped: false,
      isTodo: true,
      hasError: false,
      isFailing: false,
      errors: [],
      browserId: 'chromium',
      file: 'test.ts',
      meta: { suite: 'unit', group: 'Math' },
    } as unknown as WithCorrelation<TestEndNode>)

    tracker.processEvent('test:end', {
      title: { original: 'regression', expanded: 'regression' },
      isSkipped: false,
      isTodo: false,
      hasError: false,
      isFailing: true,
      errors: [],
      browserId: 'chromium',
      file: 'test.ts',
      meta: { suite: 'unit', group: 'Math' },
    } as unknown as WithCorrelation<TestEndNode>)

    tracker.processEvent('group:end', {
      hasError: false,
      errors: [],
      browserId: 'chromium',
      file: 'test.ts',
      title: 'Math',
      meta: { suite: 'unit' },
    } as unknown as WithCorrelation<GroupEndNode>)
    tracker.processEvent('suite:end', {
      hasError: false,
      errors: [],
      browserId: 'chromium',
      file: 'test.ts',
      name: 'unit',
      meta: {},
    } as unknown as WithCorrelation<SuiteEndNode>)
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

    tracker.processEvent('suite:start', {
      name: 'unit',
      browserId: 'chromium',
      file: 'test.ts',
      meta: {},
    } as unknown as WithCorrelation<SuiteStartNode>)
    tracker.processEvent('group:start', {
      title: 'Math',
      browserId: 'chromium',
      file: 'test.ts',
      meta: { suite: 'unit' },
    } as unknown as WithCorrelation<GroupStartNode>)

    tracker.processEvent('group:end', {
      hasError: true,
      errors: [{ phase: 'setup', error: new Error('Group Setup Failed') }],
      browserId: 'chromium',
      file: 'test.ts',
      title: 'Math',
      meta: { suite: 'unit' },
    } as unknown as GroupEndNode)
    tracker.processEvent('suite:end', {
      hasError: true,
      errors: [{ phase: 'setup', error: new Error('Suite Setup Failed') }],
      browserId: 'chromium',
      file: 'test.ts',
      name: 'unit',
      meta: {},
    } as unknown as SuiteEndNode)

    const summary = tracker.getSummary()

    assert.strictEqual(summary.hasError, true)
    assert.strictEqual(summary.failureTree.length, 1)
    assert.strictEqual(summary.failureTree[0].errors.length, 1)
    assert.strictEqual(summary.failureTree[0].children[0].errors.length, 1)
  })

  await t.test('resets current group and suite after they end', () => {
    const tracker = new Tracker()
    tracker.processEvent('runner:start', undefined as any)

    // Start a suite and a group
    tracker.processEvent('suite:start', {
      name: 'unit',
      browserId: 'chromium',
      file: 'test.ts',
      meta: {},
    } as unknown as WithCorrelation<SuiteStartNode>)
    tracker.processEvent('group:start', {
      title: 'Math',
      browserId: 'chromium',
      file: 'test.ts',
      meta: { suite: 'unit' },
    } as unknown as WithCorrelation<GroupStartNode>)

    // End the group WITHOUT errors
    tracker.processEvent('group:end', {
      hasError: false,
      errors: [],
      browserId: 'chromium',
      file: 'test.ts',
      title: 'Math',
      meta: { suite: 'unit' },
    } as unknown as GroupEndNode)

    // Now fire a failing test. It should be attached to the SUITE, not the GROUP,
    // because the group has already ended.
    tracker.processEvent('test:end', {
      title: { original: '2+3', expanded: '2+3' },
      isSkipped: false,
      isTodo: false,
      hasError: true,
      isFailing: false,
      errors: [{ phase: 'test', error: new Error('Wrong') }],
      browserId: 'chromium',
      file: 'test.ts',
      meta: { suite: 'unit', group: 'Math' },
    } as unknown as TestEndNode)

    tracker.processEvent('suite:end', {
      hasError: false,
      errors: [],
      browserId: 'chromium',
      file: 'test.ts',
      name: 'unit',
      meta: {},
    } as unknown as SuiteEndNode)

    // Now fire a failing test AFTER the suite ends. It should not be attached to the suite.
    // (This scenario shouldn't happen in practice, but we test the tracker's reset logic)
    tracker.processEvent('test:end', {
      title: { original: 'leak', expanded: 'leak' },
      isSkipped: false,
      isTodo: false,
      hasError: true,
      isFailing: false,
      errors: [{ phase: 'test', error: new Error('Leak') }],
      browserId: 'chromium',
      file: 'test.ts',
      meta: { suite: 'unit' }, // no group, suite unit
    } as unknown as TestEndNode)

    const summary = tracker.getSummary()

    assert.strictEqual(summary.hasError, true)
    assert.strictEqual(summary.failureTree.length, 1)
    assert.strictEqual(summary.failureTree[0].name, 'unit')
    assert.strictEqual(summary.failureTree[0].children.length, 1) // Only '2+3', no 'Math' group or 'leak' test
    assert.strictEqual((summary.failureTree[0].children[0] as any).title, '2+3')
  })
})
