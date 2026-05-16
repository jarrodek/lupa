/**
 * Primary orchestrator and CLI configuration API for Lupa tests.
 *
 * @packageDocumentation
 * @module @jarrodek/lupa/runner
 */
import type { Config, NormalizedConfig, CLIArgs } from './types.js'
export type * from './types.js'

import { CliParser } from './cli_parser.js'
import { ConfigManager } from './config_manager.js'
import debug from './debug.js'
import { ensureIsConfigured } from './validator.js'
import { Planner } from './planner.js'
import { Orchestrator } from './orchestrator.js'

export { SummaryBuilder } from './summary_builder.js'
export type { Config, NormalizedConfig, CLIArgs, JsonSerializable } from './types.js'

/**
 * Hydrated config
 */
let runnerConfig: NormalizedConfig | undefined

let cliArgs: CLIArgs = {}

/**
 * Configure the Lupa test runner.
 *
 * This is the primary entry point for configuring your test environment.
 * It hydrates the provided configuration options and merges them with parsed CLI arguments.
 *
 * You must call this function before calling {@link run}.
 *
 * @category Configuration
 * @useWhen Setting up your test runner execution script.
 * @avoidWhen You are already inside a running test or suite.
 *
 * @param options - The configuration object. You must provide either a top-level `files` array
 *                  or a `suites` array to define your test files.
 *
 * @example
 * **Basic Configuration**
 * ```ts
 * import { configure, run } from '@jarrodek/lupa/runner'
 *
 * configure({
 *   files: ['tests/**\/*.spec.ts'],
 *   testPlugins: ['@jarrodek/lupa/assert']
 * })
 *
 * run()
 * ```
 *
 * @example
 * **Using Test Suites**
 * ```ts
 * import { configure, run } from '@jarrodek/lupa/runner'
 *
 * configure({
 *   suites: [
 *     { name: 'components', files: ['tests/components/**\/*.spec.ts'] },
 *     { name: 'e2e', files: ['tests/e2e/**\/*.spec.ts'] }
 *   ],
 *   timeout: 5000,
 *   forceExit: true
 * })
 *
 * run()
 * ```
 */
export function configure(options: Config) {
  runnerConfig = new ConfigManager(options, cliArgs).hydrate()
}

/**
 * Process command line arguments. Later the parsed output
 * will be used by Lupa to compute the configuration
 *
 * @param argv - The command line arguments to parse.
 *
 * @example
 * ```ts
 * import { processCLIArgs, configure, run } from '@jarrodek/lupa/runner'
 *
 * processCLIArgs(['--spec', 'tests/**\/*.spec.ts'])
 * configure({})
 *
 * run()
 * ```
 */
export function processCLIArgs(argv: string[]) {
  cliArgs = new CliParser().parse(argv)
}

/**
 * Run the test suite.
 *
 * This is the primary entry point for running your tests. It uses the configuration
 * provided by {@link configure} and the CLI arguments parsed by {@link processCLIArgs}.
 *
 * @returns A Promise that resolves when the test run is complete,
 *          or rejects if the test run encounters an error (e.g., uncaught exceptions).
 *
 * @category Execution
 * @never NEVER call this inside a test suite or hook. Fix: Call it only once at the end of your execution script.
 * @throws {Error} Throws if configuration is missing or invalid.
 *
 * @example
 * ```ts
 * import { configure, run } from '@jarrodek/lupa/runner'
 *
 * configure({
 *   files: ['tests/**\/*.spec.ts'],
 *   forceExit: true
 * })
 *
 * run()
 * ```
 */
export async function run() {
  /**
   * Display help when help flag is used
   */
  if (cliArgs.help) {
    console.log(new CliParser().getHelp())
    return
  }

  ensureIsConfigured(runnerConfig)

  const { config, reporters, suites, refinerFilters } = await new Planner(runnerConfig).plan()

  const orchestrator = new Orchestrator(config, cliArgs, reporters, suites, refinerFilters)

  /**
   * Signal handlers for clean shutdown on Ctrl+C / kill
   */
  const onSignal = async (signal: string) => {
    debug('received %s signal', signal)
    console.log() // clear the ^C line
    await orchestrator.shutdown(1)
  }

  process.once('SIGINT', () => onSignal('SIGINT'))
  process.once('SIGTERM', () => onSignal('SIGTERM'))

  try {
    await orchestrator.boot()

    if (orchestrator.isWatchMode) {
      orchestrator.cli.start()
    }

    // Initial execution
    await orchestrator.executeTests()
  } catch (error) {
    orchestrator.exceptionsManager.notifyException(error)
    await orchestrator.shutdown(1)
  }
}
