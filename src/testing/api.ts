import { html as litHtml, render } from 'lit-html'
import { Test } from './test/main.js'
import { Group } from './group/main.js'
import { Suite } from './suite/main.js'
import { WebRunner } from './web_runner.js'
import { Emitter } from './emitter.js'
import { Refiner } from '../refiner/main.js'
import { TestContext } from './test_context.js'
import { createTest, createTestGroup } from './create_test.js'

// We will initialize these from harness.ts when booting
export let activeRunner: WebRunner | undefined
export let activeSuite: Suite | undefined
export let activeGroup: Group | undefined
export let activeEmitter: Emitter | undefined
export let activeRefiner: Refiner | undefined

type OmitFirstArg<F> = F extends [_: any, ...args: infer R] ? R : never

/**
 * The current active test
 */
let activeTest: Test | undefined

/**
 * The current test file being imported
 */
let activeFile: string | undefined

export function setActiveInstances(runner: WebRunner, suite: Suite, emitter: Emitter, refiner: Refiner) {
  activeRunner = runner
  activeSuite = suite
  activeEmitter = emitter
  activeRefiner = refiner
}

/**
 * Set the current file being imported. Called by the harness
 * before importing each test file.
 */
export function setActiveFile(file: string | undefined) {
  activeFile = file
}

/**
 * Define a test
 */
export function test(title: string, callback?: (context: TestContext) => void | Promise<void>) {
  if (!activeEmitter || !activeRefiner || !activeSuite) {
    throw new Error('Test API is not initialized. Ensure tests are executed via Lupa harness.')
  }

  const debuggingError = new Error()

  const testInstance = createTest(title, activeEmitter, activeRefiner, debuggingError, {
    group: activeGroup,
    suite: activeSuite,
    file: activeFile,
  })

  // Ensure context is properly instantiated so macros (like assert) are available
  // const context = new TestContext()
  // const testInstance = new Test<TestContext>(title, context, activeEmitter, activeRefiner, activeGroup)

  testInstance.setup((t) => {
    activeTest = t
    return () => {
      activeTest = undefined
    }
  })

  if (callback) {
    testInstance.run(callback, debuggingError)
  }

  return testInstance
}

/**
 * Create a test group
 */
test.group = function (title: string, callback: (group: Group) => void) {
  if (!activeEmitter || !activeRefiner || !activeSuite) {
    throw new Error('Test API is not initialized. Ensure tests are executed via Lupa harness.')
  }

  const groupInstance = createTestGroup(title, activeEmitter, activeRefiner, {
    group: activeGroup,
    suite: activeSuite,
    file: activeFile,
  })

  // set active group so tests defined inside the callback are attached to it
  const previousGroup = activeGroup
  activeGroup = groupInstance

  callback(groupInstance)

  activeGroup = previousGroup
}

/**
 * Create a test bound macro. Within the macro, you can access the
 * currently executed test to read its context values or define
 * cleanup hooks
 */
test.macro = function <T extends (test: Test<any>, ...args: any[]) => any>(
  callback: T
): (...args: OmitFirstArg<Parameters<T>>) => ReturnType<T> {
  return (...args) => {
    if (!activeTest) {
      throw new Error('Cannot invoke macro outside of the test callback')
    }
    return callback(activeTest, ...args)
  }
}

/**
 * Lit HTML template literal
 */
export const html = litHtml

/**
 * Renders a Lit template into a test fixture element and mounts it to the DOM
 */
export async function fixture(template: ReturnType<typeof litHtml>): Promise<Element> {
  if (!activeTest) {
    throw new Error('Cannot render fixture outside of a test')
  }

  const container = document.createElement('div')
  container.className = 'lupa-fixture'
  document.body.appendChild(container)

  // Automatically clean up the fixture when the test finishes
  activeTest.cleanup(() => {
    container.remove()
  })

  render(template, container)

  // Wait for next frame to ensure elements are upgraded and connected
  await new Promise((resolve) => requestAnimationFrame(resolve))

  return container.firstElementChild as Element
}

/**
 * Get the test of currently running test
 */
export function getActiveTest() {
  return activeTest
}

/**
 * Get the test of currently running test or throw an error
 */
export function getActiveTestOrFail() {
  if (!activeTest) throw new Error('Cannot access active test outside of a test callback')
  return activeTest
}
