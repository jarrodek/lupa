import type { HookHandler } from '../hooks/types.js'
import type { Refiner } from '../refiner/main.js'
import type { Emitter } from '../testing/emitter.js'
import { Runner } from './runner.js'
import type { FilteringOptions, NamedReporterContract } from '../types.js'

/**
 * Global setup hook
 */
export type SetupHookState = [[runner: Runner], [error: Error | null, runner: Runner]]
export type SetupHookHandler = HookHandler<SetupHookState[0], SetupHookState[1]>

/**
 * Global teardown hook
 */
export type TeardownHookState = [[runner: Runner], [error: Error | null, runner: Runner]]
export type TeardownHookHandler = HookHandler<TeardownHookState[0], TeardownHookState[1]>

/**
 * Global set of available hooks
 */
export interface HooksEvents {
  setup: SetupHookState
  teardown: TeardownHookState
}

/**
 * Parsed command-line arguments
 */
export type CLIArgs = {
  _?: string[]
  tags?: string | string[]
  files?: string | string[]
  tests?: string | string[]
  groups?: string | string[]
  timeout?: string
  retries?: string
  reporters?: string | string[]
  forceExit?: boolean
  failed?: boolean
  help?: boolean
  matchAll?: boolean
  listPinned?: boolean
  bail?: boolean
  bailLayer?: string
  verbose?: boolean
  browser?: string
} & Record<string, string | string[] | boolean>

/**
 * Set of filters you can apply to run only specific tests
 */
export type Filters = FilteringOptions & {
  files?: string[]
  suites?: string[]
}

/**
 * Enforces JSON-serializable values at the type level.
 * Functions, symbols, undefined, and class instances are rejected.
 */
export type JsonSerializable =
  | string
  | number
  | boolean
  | null
  | JsonSerializable[]
  | { [key: string]: JsonSerializable }

/**
 * A test plugin entry for browser-side plugins. Can be:
 * - A bare module specifier string (no options)
 * - A tuple of [specifier, options] where options must be JSON-serializable
 */
export type TestPluginEntry = string | [specifier: string, options: JsonSerializable]

/**
 * Runner plugin function. Receives the Node runner, emitter, and config.
 * Executed in the Node.js orchestrator process.
 */
export type RunnerPluginFn = (context: {
  config: NormalizedConfig
  cliArgs: CLIArgs
  runner: Runner
  emitter: Emitter
}) => void | Promise<void>

/**
 * Base configuration options
 */
export interface BaseConfig {
  /**
   * Current working directory. It is required to search for
   * the test files
   */
  cwd?: string

  /**
   * The timeout to apply on all the tests, unless overwritten explicitly
   */
  timeout?: number

  /**
   * The retries to apply on all the tests, unless overwritten explicitly
   */
  retries?: number

  /**
   * Test filters to apply
   */
  filters?: Filters

  /**
   * A hook to configure suites. The callback will be called for each
   * suite before it gets executed.
   * A collection of registered reporters. Reporters are not activated by
   * default. Either you have to activate them using the commandline,
   * or using the `activated` property.
   */
  reporters?: {
    activated: string[]
    list?: NamedReporterContract[]
  }

  /**
   * Browser-side test plugins. Module specifiers that export a default
   * setup function conforming to WebPluginFn. Executed in the browser
   * before test files load. Plugins receive the WebRunner, Emitter,
   * and config.
   *
   * @example
   * testPlugins: ['@jarrodek/lupa/assert']
   * testPlugins: [['@jarrodek/lupa/assert', { openApi: false }]]
   */
  testPlugins?: TestPluginEntry[]

  /**
   * Node-side runner plugins. Functions executed in the Node.js
   * orchestrator. Receive the Node Runner, Emitter, and config.
   */
  runnerPlugins?: RunnerPluginFn[]

  /**
   * A custom implementation to import test files.
   */
  importer?: (filePath: URL) => void | Promise<void>

  /**
   * Overwrite tests refiner. Check documentation for refiner
   * usage
   */
  refiner?: Refiner

  /**
   * Enable/disable force exiting.
   */
  forceExit?: boolean

  /**
   * Global hooks to execute before importing
   * the test files
   */
  setup?: SetupHookHandler[]

  /**
   * Global hooks to execute on teardown
   */
  teardown?: TeardownHookHandler[]

  /**
   * An array of directories to exclude when searching
   * for test files.
   *
   * For example, if you search for test files inside the entire
   * project, you might want to exclude "node_modules"
   */
  exclude?: string[]
}

/**
 * A collection of test files defined as a glob or a callback
 * function that returns an array of URLs
 */
export type TestFiles = string | string[] | (() => URL[] | Promise<URL[]>)

/**
 * A test suite to register tests under a named suite
 */
export interface TestSuite {
  /**
   * A unique name for the suite
   */
  name: string

  /**
   * Collection of files associated with the suite. Files should be
   * defined as a glob or a callback function that returns an array of URLs
   */
  files: TestFiles

  /**
   * The timeout to apply on all the tests in this suite, unless overwritten explicitly
   */
  timeout?: number

  /**
   * The retries to apply on all the tests in this suite, unless overwritten explicitly
   */
  retries?: number
}

/**
 * BaseConfig after normalized by the config manager
 */
export type NormalizedBaseConfig = Required<Omit<BaseConfig, 'reporters'>> & {
  reporters: {
    activated: string[]
    list: NamedReporterContract[]
  }
}

/**
 * Configuration options
 */
export type Config = BaseConfig &
  (
    | {
        files: TestFiles
      }
    | {
        suites: TestSuite[]
      }
  )

/**
 * Config after normalized by the config manager
 */
export type NormalizedConfig = NormalizedBaseConfig &
  (
    | {
        files: TestFiles
      }
    | {
        suites: Required<TestSuite>[]
      }
  )
