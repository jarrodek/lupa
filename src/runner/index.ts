/**
 * Primary orchestrator and CLI configuration API for Lupa tests.
 *
 * @packageDocumentation
 * @module @jarrodek/lupa/runner
 */
import { resolve, dirname, join } from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createServer, createLogger, type ViteDevServer, mergeConfig, type InlineConfig } from 'vite'
import { chromium, firefox, webkit, type Browser, type Page } from 'playwright'
import { pathToFileURL } from 'node:url'

import type { Config, NormalizedConfig, CLIArgs, JsonSerializable } from './types.js'
export type * from './types.js'
import { Emitter } from '../testing/emitter.js'
import { Runner } from './runner.js'
import { CliParser } from './cli_parser.js'
import { ConfigManager } from './config_manager.js'
import { CoverageManager } from './coverage_manager.js'
import { ExceptionsManager } from './exceptions_manager.js'
import { WatchManager } from './watch_manager.js'
import debug from './debug.js'
import { ensureIsConfigured } from './validator.js'
import { Planner } from './planner.js'
import { transformBrowserStack } from './stack_transformer.js'
import { formatPinnedTest, printPinnedTests } from './helpers.js'
import { RunnerEvents } from '../types.js'
import lupaHarnessPlugin from './plugins/harness.js'
import { BrowserLogs } from './brower_logs.js'

export { SummaryBuilder } from './summary_builder.js'
export type { Config, NormalizedConfig, CLIArgs, JsonSerializable } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const harnessTs = resolve(__dirname, '../testing/harness.ts')
const harnessPath = existsSync(harnessTs) ? harnessTs : resolve(__dirname, '../testing/harness.js')

type TelemetryPayload = {
  [K in keyof RunnerEvents]: { event: K; data: RunnerEvents[K] }
}[keyof RunnerEvents]

/**
 * Default global timeout for the entire test run (in ms).
 * Prevents the process from hanging forever if the browser
 * gets stuck in an infinite loop.
 */
const DEFAULT_GLOBAL_TIMEOUT = 120_000

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

  const cwd = runnerConfig.cwd || process.cwd()
  const { config, reporters, suites, refinerFilters } = await new Planner(runnerConfig).plan()

  /**
   * Track resources for cleanup
   */
  let vite: ViteDevServer | undefined
  let headlessBrowser: Browser | undefined
  let globalTimeout: ReturnType<typeof setTimeout> | undefined
  let isShuttingDown = false
  // eslint-disable-next-line prefer-const
  let page: Page | undefined

  const exceptionsManager = new ExceptionsManager()
  exceptionsManager.monitor()

  /**
   * Graceful shutdown — ensures Vite and Playwright are always
   * cleaned up regardless of how the process exits.
   */
  async function shutdown(exitCode: number) {
    if (isShuttingDown) return
    isShuttingDown = true
    debug('shutting down (exit code: %d)', exitCode)

    if (globalTimeout) {
      clearTimeout(globalTimeout)
      globalTimeout = undefined
    }

    // Report any buffered uncaught exceptions/rejections
    await exceptionsManager.report()

    try {
      if (watchManager?.debugBrowser) {
        debug('closing debug browser')
        await Promise.race([watchManager.debugBrowser.close(), new Promise((r) => setTimeout(r, 1000))])
        watchManager.debugBrowser = undefined
      }
    } catch (error) {
      debug('error closing debug browser: %O', error)
    }

    try {
      if (page) {
        await coverageManager.extractAndReport(page)
      }
    } catch (err) {
      console.error('Failed to extract coverage:', err)
    }

    try {
      if (headlessBrowser) {
        debug('closing headless browser')
        await Promise.race([headlessBrowser.close(), new Promise((r) => setTimeout(r, 1000))])
        headlessBrowser = undefined
      }
    } catch (error) {
      debug('error closing browser: %O', error)
    }

    try {
      if (vite) {
        debug('closing Vite server')
        await vite.close()
        vite = undefined
      }
    } catch (error) {
      debug('error closing Vite: %O', error)
    }

    if (exceptionsManager.hasErrors) {
      exitCode = 1
    }

    process.exit(exitCode)
  }

  /**
   * Signal handlers for clean shutdown on Ctrl+C / kill
   */
  const onSignal = async (signal: string) => {
    debug('received %s signal', signal)
    console.log() // clear the ^C line
    await shutdown(1)
  }

  process.once('SIGINT', () => onSignal('SIGINT'))
  process.once('SIGTERM', () => onSignal('SIGTERM'))

  // Create a custom Vite logger that suppresses all client-forwarded console messages.
  // We capture browser output via Playwright, so Vite's forwarding is redundant.
  const logger = createLogger('silent')

  const resolvedPlugins: (JsonSerializable | undefined)[][] = await Promise.all(
    (runnerConfig?.testPlugins || []).map(async (plugin) => {
      const [specifier, options] = Array.isArray(plugin) ? plugin : [plugin, undefined]
      let url = specifier
      try {
        const resolved = import.meta.resolve(specifier, pathToFileURL(cwd + '/').href)
        if (resolved.startsWith('file://')) {
          url = '/@fs' + fileURLToPath(resolved)
        } else {
          url = resolved
        }
      } catch {
        // Leave as is, let the browser fail and report it
      }
      return [url, options]
    })
  )

  const baseViteConfig: InlineConfig = {
    root: cwd,
    configFile: runnerConfig?.viteConfig,
    customLogger: logger,
    server: {
      host: true,
      port: 0, // Force dynamic port to avoid conflicts
      fs: {
        allow: [process.cwd(), join(__dirname, '../')],
      },
    },
    plugins: [lupaHarnessPlugin(suites, resolvedPlugins, runnerConfig, harnessPath)],
  }

  const finalViteConfig = runnerConfig?.vite ? mergeConfig(baseViteConfig, runnerConfig.vite) : baseViteConfig

  const coverageManager = new CoverageManager(runnerConfig?.coverage, runnerConfig?.exclude)
  await coverageManager.instrumentViteConfig(finalViteConfig)

  if (finalViteConfig.server?.middlewareMode) {
    throw new Error('Lupa cannot run with server.middlewareMode enabled in your Vite configuration.')
  }

  // Start Vite Server
  vite = await createServer(finalViteConfig)

  await vite.listen()
  const serverUrl = vite.resolvedUrls?.local[0] || `http://localhost:${vite.config.server.port}`

  // Start Playwright Headless Browser
  const browserType = (cliArgs.browser as string) || 'chromium'
  if (browserType === 'firefox') {
    headlessBrowser = await firefox.launch()
  } else if (browserType === 'webkit') {
    headlessBrowser = await webkit.launch()
  } else {
    headlessBrowser = await chromium.launch()
  }

  page = await headlessBrowser.newPage()

  const logs = new BrowserLogs(page)
  logs.verbose = !!cliArgs.verbose
  logs.boot()

  let isRunning = false
  const isWatchMode = cliArgs.watch === true
  let activeNodeRunner: Runner
  let activeNodeEmitter: Emitter | null = null

  async function replayTests(events: { eventName: string; data: any }[]) {
    if (!reporters || reporters.length === 0) return

    const replayEmitter = new Emitter()
    const replayRunner = new Runner(replayEmitter)

    replayRunner.reporterEmitter = replayEmitter

    reporters.forEach((reporter) => {
      replayRunner.registerReporter(reporter)
    })

    await replayRunner.start()

    for (const { eventName, data } of events) {
      if (eventName === 'runner:start') continue
      await replayEmitter.emit(eventName as any, data)
    }
  }

  const watchManager = new WatchManager(vite, runnerConfig, executeTests, replayTests, shutdown, browserType)

  // A queue to ensure telemetry events from the browser are processed sequentially
  let telemetryQueue = Promise.resolve()

  // Setup WebSocket Telemetry ONCE
  vite.ws.on('lupa:telemetry', ({ event, data }: TelemetryPayload) => {
    telemetryQueue = telemetryQueue.then(async () => {
      if (!activeNodeEmitter) return

      // Helper to reconstruct Error objects with source-mapped stacks
      const deserializeError = async (errPayload: any) => {
        if (!errPayload || typeof errPayload !== 'object' || !errPayload.message || errPayload instanceof Error) {
          return errPayload
        }
        const err = new Error(errPayload.message)
        // Preserve custom properties like actual, expected, and showDiff from assertions
        Object.assign(err, errPayload)
        err.name = errPayload.name || 'Error'
        err.stack = errPayload.stack
          ? await transformBrowserStack(vite as ViteDevServer, cwd, errPayload.stack)
          : errPayload.stack
        return err
      }

      if (event === 'group:end' || event === 'suite:end' || event === 'test:end') {
        if (data.errors && data.errors.length) {
          for (const e of data.errors) {
            e.error = await deserializeError(e.error)
          }
        }
      } else if (event === 'uncaught:exception') {
        if (data && data.error) {
          data.error = await deserializeError(data.error)
          exceptionsManager.handleBrowserException(data.error as Error, data.type || 'error')
          return
        }
      } else if (event === 'runner:pinned_tests') {
        if (data && data.tests) {
          const formatted = await Promise.all(
            data.tests.map(async (t) => {
              const transformed = await transformBrowserStack(vite as ViteDevServer, cwd, t.stack)
              return formatPinnedTest(t.title, transformed)
            })
          )
          printPinnedTests(formatted)
          return
        }
      }

      // Re-emit browser events in the Node.js process
      await activeNodeEmitter.emit(event, data)
    })
  })

  // Expose function to close the runner when tests are done
  await page.exposeFunction('__lupa_runner_end__', async () => {
    if (globalTimeout) {
      clearTimeout(globalTimeout)
      globalTimeout = undefined
    }

    if (activeNodeRunner) {
      await activeNodeRunner.end()
    }
    isRunning = false

    const exitCode = (activeNodeRunner && activeNodeRunner.failed) || exceptionsManager.hasErrors ? 1 : 0

    if (!isWatchMode) {
      await shutdown(exitCode)
    } else {
      watchManager.printWaitingMessage()
    }
  })

  async function executeTests() {
    if (isRunning) return
    isRunning = true

    if (isWatchMode) {
      console.clear()
    }

    activeNodeEmitter = new Emitter()
    activeNodeRunner = new Runner(activeNodeEmitter)

    // Set reporterEmitter to filtered output so reporters don't see non-focused events
    activeNodeRunner.reporterEmitter = watchManager.createFilteredEmitter(activeNodeEmitter)

    reporters.forEach((reporter) => {
      debug('registering "%s" reporter', reporter.name)
      activeNodeRunner.registerReporter(reporter)
    })

    refinerFilters.forEach((filter) => {
      debug('apply %s filters "%O" ', filter.layer, filter.filters)
      config.refiner.add(filter.layer, filter.filters)
    })

    config.refiner.matchAllTags(cliArgs.matchAll ?? false)

    // We await the reporters setup
    await activeNodeRunner.start()

    if (!isWatchMode) {
      // Set a global safety timeout — if the browser never calls
      // __lupa_runner_end__, we force shutdown to prevent hanging.
      globalTimeout = setTimeout(async () => {
        console.error('\n\nGlobal timeout reached. The test run took too long and was forcefully terminated.')
        console.error('Consider increasing the timeout or checking for infinite loops in your tests.\n')
        await shutdown(1)
      }, DEFAULT_GLOBAL_TIMEOUT)
      // Don't let the timeout keep the process alive if everything else is done
      globalTimeout.unref()
    }

    // Navigate to harness (or reload if already there)
    await page?.goto(`${serverUrl}__lupa__/runner.html`)
  }

  if (isWatchMode) {
    watchManager.start()
  }

  // Initial execution
  executeTests()
}
