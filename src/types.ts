import type { CleanupHandler, HookHandler } from './hooks/types.js'
import type { AssertionError } from 'assertion-error'

import type { Test } from './testing/test/main.js'
import type { Group } from './testing/group/main.js'
import type { Suite } from './testing/suite/main.js'
import type { Emitter } from './testing/emitter.js'
import type { Runner } from './runner/runner.js'
import type { TestContext } from './testing/test_context.js'

export { Runner }

/**
 * One of the predefined types of errors that can happen during test execution
 */
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
  /**
   * Setup hook
   */
  setup: TestHooksData
  /**
   * Teardown hook
   */
  teardown: TestHooksData
  /**
   * Cleanup hook
   */
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
  /**
   * Setup hook
   */
  setup: GroupHooksData
  /**
   * Teardown hook
   */
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
  /**
   * Setup hook
   */
  setup: SuiteHooksData
  /**
   * Teardown hook
   */
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
  /**
   * Test title
   */
  title: string
  /**
   * Test tags
   */
  tags: string[]
  /**
   * Test timeout
   */
  timeout: number
  /**
   * Whether the test waits for done
   */
  waitsForDone?: boolean
  /**
   * Test executor
   */
  executor?: TestExecutor<any>
  /**
   * Whether the test is a todo
   */
  isTodo?: boolean
  /**
   * Whether the test is skipped
   */
  isSkipped?: boolean
  /**
   * Whether the test is failing
   */
  isFailing?: boolean
  /**
   * Skip reason
   */
  skipReason?: string
  /**
   * Fail reason
   */
  failReason?: string
  /**
   * Number of retries
   */
  retries?: number
  /**
   * Retry attempt number
   */
  retryAttempt?: number
  /**
   * Test metadata
   */
  meta: TestMetadata
}

/**
 * Data shared during "test:start" event
 */
export type TestStartNode = Omit<TestOptions, 'title'> & {
  /**
   * Test title
   */
  title: {
    /**
     * Original title
     */
    original: string
    /**
     * Expanded title
     */
    expanded: string
  }
  /**
   * Whether the test is pinned
   */
  isPinned: boolean
  /**
   * Dataset information
   */
  dataset?: {
    /**
     * Dataset size
     */
    size: number
    /**
     * Dataset index
     */
    index: number
    /**
     * Dataset row
     */
    row: any
  }
  /**
   * Test metadata
   */
  meta: TestMetadata
}

/**
 * Data shared during "test:end" event
 */
export type TestEndNode = Omit<TestOptions, 'title'> & {
  /**
   * Test title
   */
  title: {
    /**
     * Original title
     */
    original: string
    /**
     * Expanded title
     */
    expanded: string
  }
  /**
   * Whether the test is pinned
   */
  isPinned: boolean
  /**
   * Test duration in milliseconds
   */
  duration: number
  /**
   * Whether the test has any errors
   */
  hasError: boolean
  /**
   * Errors that occurred during the test execution
   */
  errors: {
    /**
     * Phase in which the error occurred
     */
    phase: 'setup' | 'test' | 'setup:cleanup' | 'teardown' | 'teardown:cleanup' | 'test:cleanup'
    /**
     * The error that occurred
     */
    error: TestError
  }[]
  /**
   * Retry attempt number
   */
  retryAttempt?: number
  /**
   * Dataset information
   */
  dataset?: {
    /**
     * Dataset size
     */
    size: number
    /**
     * Dataset index
     */
    index: number
    /**
     * Dataset row
     */
    row: any
  }
}

/**
 * The metadata object associated with a group events.
 */
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

/**
 * The metadata object associated with a test events.
 */
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
  /**
   * Group title
   */
  title: string
  /**
   * Group metadata
   */
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
  /**
   * Whether the group has any errors
   */
  hasError: boolean
  /**
   * Errors that occurred during the group execution
   */
  errors: {
    phase: 'setup' | 'setup:cleanup' | 'teardown' | 'teardown:cleanup'
    error: TestError
  }[]
}

/**
 * Data shared with "suite:start" event
 */
export interface SuiteStartNode {
  /**
   * Suite name
   */
  name: string
}

/**
 * Data shared with "suite:end" event
 */
export interface SuiteEndNode {
  /**
   * Suite name
   */
  name: string
  /**
   * Whether the suite has any errors
   */
  hasError: boolean
  /**
   * Errors that occurred during the suite execution
   */
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
  /**
   * Whether the runner has any errors
   */
  hasError: boolean
}

/**
 * Options for filtering and running on selected tests
 */
export interface FilteringOptions {
  /**
   * Test tags to filter by
   */
  tags?: string[]
  /**
   * Test groups to filter by
   */
  groups?: string[]
  /**
   * Test names to filter by
   */
  tests?: string[]
}

/**
 * Uncaught exception
 */
export interface UncaughtExceptionNode {
  /**
   * The error that occurred
   */
  error: TestError
  /**
   * Type of exception
   */
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
  /**
   * Test start event
   */
  'test:start': TestStartNode
  /**
   * Test end event
   */
  'test:end': TestEndNode
  /**
   * Group start event
   */
  'group:start': GroupStartNode
  /**
   * Group end event
   */
  'group:end': GroupEndNode
  /**
   * Suite start event
   */
  'suite:start': SuiteStartNode
  /**
   * Suite end event
   */
  'suite:end': SuiteEndNode
  /**
   * Runner start event
   */
  'runner:start': RunnerStartNode
  /**
   * Runner end event
   */
  'runner:end': RunnerEndNode
  /**
   * Uncaught exception event
   */
  'uncaught:exception': UncaughtExceptionNode
  /**
   * Runner pinned tests event
   */
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
  /**
   * Reporter name
   */
  readonly name: string
  /**
   * Reporter handler
   */
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
  /**
   * Test title
   */
  title: string
  /**
   * Test type
   */
  type: 'test'
  /**
   * Test errors
   */
  errors: TestEndNode['errors']
}

/**
 * The group node inside the failure tree
 */
export interface FailureTreeGroupNode {
  /**
   * Group name
   */
  name: string
  /**
   * Group type
   */
  type: 'group'
  /**
   * Group errors
   */
  errors: GroupEndNode['errors']
  /**
   * Group children
   */
  children: FailureTreeTestNode[]
}

/**
 * The suite node inside the failure tree
 */
export interface FailureTreeSuiteNode {
  /**
   * Suite name
   */
  name: string
  /**
   * Suite type
   */
  type: 'suite'
  /**
   * Suite errors
   */
  errors: SuiteEndNode['errors']
  /**
   * Suite children
   */
  children: (FailureTreeTestNode | FailureTreeGroupNode)[]
}

/**
 * Runner summary properties
 */
export interface RunnerSummary {
  /**
   * Test aggregates
   */
  aggregates: {
    /**
     * Total tests
     */
    total: number
    /**
     * Failed tests
     */
    failed: number
    /**
     * Passed tests
     */
    passed: number
    /**
     * Regression tests
     */
    regression: number
    /**
     * Skipped tests
     */
    skipped: number
    /**
     * Todo tests
     */
    todo: number
  }
  /**
   * Total duration in milliseconds
   */
  duration: number
  /**
   * Whether the runner has any errors
   */
  hasError: boolean
  /**
   * Failure tree
   */
  failureTree: FailureTreeSuiteNode[]
  /**
   * Failed tests titles
   */
  failedTestsTitles: string[]
}

/**
 * Base reporter options
 */
export interface BaseReporterOptions {
  /**
   * Maximum number of frames to capture
   */
  framesMaxLimit?: number
}
