import type { CleanupHandler, HookHandler } from './hooks/types.js'
import type { AssertionError } from 'assertion-error'

import type { Test } from './testing/test/main.js'
import type { Group } from './testing/group/main.js'
import type { Suite } from './testing/suite/main.js'
import type { Emitter } from './testing/emitter.js'
import type { Runner } from './runner/runner.js'
import type { TestContext } from './testing/test_context.js'

export { Runner }

export type TestError = AssertionError<unknown> | Error

/**
 * Summary reporters are registered with the SummaryBuilder to
 * add information to the tests summary output
 */
export type SummaryReporter = () => { key: string; value: string | string[] }[]

/**
 * Shape of test data set. Should be an array of a function that
 * returns an array
 */
export type DataSetNode = undefined | any[] | (() => any[] | Promise<any[]>)

/**
 * The data given to the setup and the teardown test
 * hooks
 */
export type TestHooksData = [[test: Test<any>], [hasError: boolean, test: Test<any>]]

/**
 * The function that can be registered as a test hook
 */
export type TestHooksHandler = HookHandler<TestHooksData[0], TestHooksData[1]>

/**
 * The function that can be registered as a cleanup handler
 */
export type TestHooksCleanupHandler = CleanupHandler<TestHooksData[1]>

/**
 * Hooks available on a test
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type TestHooks = {
  setup: TestHooksData
  teardown: TestHooksData
  cleanup: [TestHooksData[1], []]
}

/**
 * The data given to the setup and the teardown group
 * hooks
 */
export type GroupHooksData = [[group: Group], [hasError: boolean, group: Group]]

/**
 * The callback function given to the "setup" and the "teardown"
 * methods on a group
 */
export type GroupHooksHandler = HookHandler<GroupHooksData[0], GroupHooksData[1]>

/**
 * Hooks available on a group
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type GroupHooks = {
  setup: GroupHooksData
  teardown: GroupHooksData
}

/**
 * The data given to the setup and the teardown suite
 * hooks
 */
export type SuiteHooksData = [[suite: Suite], [hasError: boolean, suite: Suite]]

/**
 * The function that can be registered as a suite hook
 */
export type SuiteHooksHandler = HookHandler<SuiteHooksData[0], SuiteHooksData[1]>

/**
 * Hooks available on a suite
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type SuiteHooks = {
  setup: SuiteHooksData
  teardown: SuiteHooksData
}

/**
 * The function to execute the test
 */
export type TestExecutor<DataSet> = DataSet extends any[]
  ? (context: TestContext, value: DataSet[number], done: (error?: any) => void) => void | Promise<void>
  : DataSet extends () => infer A
    ? (
        context: TestContext,
        value: Awaited<A> extends any[] ? Awaited<A>[number] : Awaited<A>,
        done?: (error?: any) => void
      ) => void | Promise<void>
    : (context: TestContext, done: (error?: any) => void) => void | Promise<void>

/**
 * Test configuration options.
 */
export interface TestOptions {
  title: string
  tags: string[]
  timeout: number
  waitsForDone?: boolean
  executor?: TestExecutor<any>
  isTodo?: boolean
  isSkipped?: boolean
  isFailing?: boolean
  skipReason?: string
  failReason?: string
  retries?: number
  retryAttempt?: number
  meta: TestMetadata
}

/**
 * Data shared during "test:start" event
 */
export type TestStartNode = Omit<TestOptions, 'title'> & {
  title: {
    original: string
    expanded: string
  }
  isPinned: boolean
  dataset?: {
    size: number
    index: number
    row: any
  }
  meta: TestMetadata
}

/**
 * Data shared during "test:end" event
 */
export type TestEndNode = Omit<TestOptions, 'title'> & {
  title: {
    original: string
    expanded: string
  }
  isPinned: boolean
  duration: number
  hasError: boolean
  errors: {
    phase: 'setup' | 'test' | 'setup:cleanup' | 'teardown' | 'teardown:cleanup' | 'test:cleanup'
    error: TestError
  }[]
  retryAttempt?: number
  dataset?: {
    size: number
    index: number
    row: any
  }
}

export interface GroupMetadata {
  /**
   * File path in which the group is defined
   */
  fileName?: string
  /**
   * Suite name in which the group is defined
   */
  suite?: string
}

export interface TestMetadata {
  /**
   * File path in which the test is defined
   */
  fileName?: string
  /**
   * Suite name in which the test is defined
   */
  suite?: string
  /**
   * Group name in which the test is defined
   */
  group?: string
  /**
   * Abort the test if the condition is met
   */
  abort?: (message: string) => any
}

/**
 * Group options
 */
export interface GroupOptions {
  title: string
  meta: GroupMetadata
}

/**
 * Data shared with "group:start" event
 */
export type GroupStartNode = GroupOptions

/**
 * Data shared with "group:end" event
 */
export type GroupEndNode = GroupOptions & {
  hasError: boolean
  errors: {
    phase: 'setup' | 'setup:cleanup' | 'teardown' | 'teardown:cleanup'
    error: TestError
  }[]
}

/**
 * Data shared with "suite:start" event
 */
export interface SuiteStartNode {
  name: string
}

/**
 * Data shared with "suite:end" event
 */
export interface SuiteEndNode {
  name: string
  hasError: boolean
  errors: {
    phase: 'setup' | 'setup:cleanup' | 'teardown' | 'teardown:cleanup'
    error: TestError
  }[]
}

/**
 * Data shared with "runner:start" event
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface RunnerStartNode {}

/**
 * Data shared with "runner:end" event
 */
export interface RunnerEndNode {
  hasError: boolean
}

/**
 * Options for filtering and running on selected tests
 */
export interface FilteringOptions {
  tags?: string[]
  groups?: string[]
  tests?: string[]
}

/**
 * Uncaught exception
 */
export interface UncaughtExceptionNode {
  error: TestError
  type: 'error' | 'rejection'
}

/**
 * Runner pinned tests
 */
export interface RunnerPinnedTestsNode {
  /**
   * Pinned tests metadata
   */
  tests: {
    /**
     * Test title
     */
    title: string
    /**
     * Test stack trace
     */
    stack: string
  }[]
}

/**
 * Events emitted by the runner emitter. These can be extended as well
 */
export interface RunnerEvents {
  'test:start': TestStartNode
  'test:end': TestEndNode
  'group:start': GroupStartNode
  'group:end': GroupEndNode
  'suite:start': SuiteStartNode
  'suite:end': SuiteEndNode
  'runner:start': RunnerStartNode
  'runner:end': RunnerEndNode
  'uncaught:exception': UncaughtExceptionNode
  'runner:pinned_tests': RunnerPinnedTestsNode
}

/**
 * Type for the reporter handler function
 */
export type ReporterHandlerContract = (runner: Runner, emitter: Emitter) => void | Promise<void>

/**
 * Type for a named reporter object.
 */
export interface NamedReporterContract {
  readonly name: string
  handler: ReporterHandlerContract
}

/**
 * Test reporters must adhere to the following contract
 */
export type ReporterContract = ReporterHandlerContract | NamedReporterContract

/**
 * The test node inside the failure tree
 */
export interface FailureTreeTestNode {
  title: string
  type: 'test'
  errors: TestEndNode['errors']
}

/**
 * The group node inside the failure tree
 */
export interface FailureTreeGroupNode {
  name: string
  type: 'group'
  errors: GroupEndNode['errors']
  children: FailureTreeTestNode[]
}

/**
 * The suite node inside the failure tree
 */
export interface FailureTreeSuiteNode {
  name: string
  type: 'suite'
  errors: SuiteEndNode['errors']
  children: (FailureTreeTestNode | FailureTreeGroupNode)[]
}

/**
 * Runner summary properties
 */
export interface RunnerSummary {
  aggregates: {
    total: number
    failed: number
    passed: number
    regression: number
    skipped: number
    todo: number
  }
  duration: number
  hasError: boolean
  failureTree: FailureTreeSuiteNode[]
  failedTestsTitles: string[]
}

export interface BaseReporterOptions {
  framesMaxLimit?: number
}
