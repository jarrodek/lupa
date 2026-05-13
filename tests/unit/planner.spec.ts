import { test } from 'node:test'
import assert from 'node:assert'
import { Planner } from '../../src/runner/planner.js'
import type { NormalizedConfig } from '../../src/runner/types.js'
import { dot, spec } from '../../src/reporters/index.js'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

test('Planner', async (t) => {
  await t.test('plans tests with default files', async () => {
    const config: NormalizedConfig = {
      cwd: process.cwd(),
      files: ['tests/unit/planner.spec.ts'],
      exclude: [],
      filters: {},
      importer: (p: URL) => import(p.href),
      timeout: 2000,
      retries: 0,
      forceExit: false,
      reporters: { activated: ['spec'], list: [spec(), dot()] },
      testPlugins: [],
      runnerPlugins: [],
      setup: [],
      teardown: [],
    } as any

    const planner = new Planner(config)
    const plan = await planner.plan()

    assert.strictEqual(plan.suites.length, 1)
    assert.strictEqual(plan.suites[0].name, 'default')
    assert.strictEqual(plan.suites[0].filesURLs.length, 1)

    const resolvedFile = fileURLToPath(plan.suites[0].filesURLs[0])
    assert.ok(resolvedFile.endsWith(path.normalize('tests/unit/planner.spec.ts')))

    assert.strictEqual(plan.reporters.length, 1)
    assert.strictEqual(plan.reporters[0].name, 'spec')
  })

  await t.test('filters suites', async () => {
    const config: NormalizedConfig = {
      cwd: process.cwd(),
      suites: [
        { name: 'unit', files: ['tests/unit/planner.spec.ts'], timeout: 2000, retries: 0 },
        { name: 'e2e', files: ['tests/browser/*.ts'], timeout: 2000, retries: 0 },
      ],
      exclude: [],
      filters: { suites: ['unit'] },
      importer: (p: URL) => import(p.href),
      timeout: 2000,
      retries: 0,
      forceExit: false,
      reporters: { activated: ['spec'], list: [spec()] },
      testPlugins: [],
      runnerPlugins: [],
      setup: [],
      teardown: [],
    } as any

    const planner = new Planner(config)
    const plan = await planner.plan()

    assert.strictEqual(plan.suites.length, 1)
    assert.strictEqual(plan.suites[0].name, 'unit')
  })

  await t.test('collects refiner filters correctly', async () => {
    const config: NormalizedConfig = {
      cwd: process.cwd(),
      files: [],
      exclude: [],
      filters: { tags: ['@slow'], tests: ['Math works'] },
      importer: (p: URL) => import(p.href),
      timeout: 2000,
      retries: 0,
      forceExit: false,
      reporters: { activated: ['spec'], list: [spec()] },
      testPlugins: [],
      runnerPlugins: [],
      setup: [],
      teardown: [],
    } as any

    const planner = new Planner(config)
    const plan = await planner.plan()

    assert.strictEqual(plan.refinerFilters.length, 2)
    const tagsFilter = plan.refinerFilters.find((f) => f.layer === 'tags')
    assert.deepStrictEqual(tagsFilter?.filters, ['@slow'])
  })
})
