import { resolve, dirname } from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createServer, createLogger, type ViteDevServer } from 'vite'
import { chromium, firefox, webkit, type Browser } from 'playwright'

import type { Config, NormalizedConfig, CLIArgs } from './types.js'
import { Emitter } from '../testing/emitter.js'
import { Runner } from './runner.js'
import { CliParser } from './cli_parser.js'
import { ConfigManager } from './config_manager.js'
import { ExceptionsManager } from './exceptions_manager.js'
import { WatchManager } from './watch_manager.js'
import debug from './debug.js'
import { ensureIsConfigured } from './validator.js'

import { Planner } from './planner.js'
import { transformBrowserStack } from './stack_transformer.js'
import { formatPinnedTest, printPinnedTests } from './helpers.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const harnessTs = resolve(__dirname, '../testing/harness.ts')
const harnessPath = existsSync(harnessTs) ? harnessTs : resolve(__dirname, '../testing/harness.js')

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

export function configure(options: Config) {
  runnerConfig = new ConfigManager(options, cliArgs).hydrate()
}

/**
 * Process command line arguments. Later the parsed output
 * will be used by Lupa to compute the configuration
 */
export function processCLIArgs(argv: string[]) {
  cliArgs = new CliParser().parse(argv)
}

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

  // Start Vite Server
  vite = await createServer({
    root: cwd,
    mode: 'production',
    customLogger: logger,
    resolve: {
      // Don't resolve "development" export conditions — forces libraries like
      // Lit to use their production builds (smaller, no dev warnings).
      conditions: ['browser', 'module', 'import', 'default'],
    },
    server: {
      host: true,
    },
    plugins: [
      {
        name: 'lupa-harness',
        configureServer(server) {
          server.middlewares.use('/__lupa__/runner.html', async (_req, res) => {
            res.setHeader('Content-Type', 'text/html')
            res.end(`
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <title>Lupa Test Runner</title>
                </head>
                <body>
                  <script>
                    window.__lupa__ = ${JSON.stringify({
                      suites: suites.map((s) => ({
                        name: s.name,
                        timeout: s.timeout,
                        retries: s.retries,
                        files: s.filesURLs.map((u) => u.pathname),
                      })),
                      testPlugins: runnerConfig?.testPlugins || [],
                      config: {
                        filters: runnerConfig?.filters,
                        timeout: runnerConfig?.timeout,
                        retries: runnerConfig?.retries,
                      },
                    })}
                  </script>
                  <script type="module" src="/@fs${harnessPath}"></script>
                </body>
              </html>
            `)
          })
        },
      },
    ],
  })

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

  const page = await headlessBrowser.newPage()

  page.on('console', (msg) => {
    const text = msg.text()
    // Suppress Vite internal messages (HMR lifecycle, optimizations, etc.)
    if (text.startsWith('[vite]')) return
    if (cliArgs.verbose) {
      console.log('[Browser Console]', text)
    }
  })
  page.on('pageerror', (err) => console.error('[Browser Error]', err))

  let isRunning = false
  const isWatchMode = cliArgs.watch === true
  let activeNodeRunner: Runner
  let activeNodeEmitter: Emitter | null = null

  const watchManager = new WatchManager(vite, runnerConfig, executeTests, shutdown, browserType)

  // A queue to ensure telemetry events from the browser are processed sequentially
  let telemetryQueue = Promise.resolve()

  // Setup WebSocket Telemetry ONCE
  vite.ws.on('lupa:telemetry', (payload) => {
    telemetryQueue = telemetryQueue.then(async () => {
      if (!activeNodeEmitter) return

      // Emittery seems to wrap event data in { name, data } sometimes
      const actualData =
        payload.data && payload.data.name === payload.event && payload.data.data ? payload.data.data : payload.data

      // Reconstruct Error objects with source-mapped stacks
      if (actualData && Array.isArray(actualData.errors)) {
        for (const e of actualData.errors) {
          if (e.error && typeof e.error === 'object' && e.error.message && !(e.error instanceof Error)) {
            const err = new Error(e.error.message)
            err.name = e.error.name
            err.stack = e.error.stack
              ? await transformBrowserStack(vite as ViteDevServer, cwd, e.error.stack)
              : e.error.stack
            e.error = err
          }
        }
      } else if (payload.event === 'uncaught:exception' && actualData && actualData.error) {
        const errPayload = actualData.error
        if (typeof errPayload === 'object' && errPayload.message && !(errPayload instanceof Error)) {
          const err = new Error(errPayload.message)
          err.name = errPayload.name || 'Error'
          err.stack = errPayload.stack
            ? await transformBrowserStack(vite as ViteDevServer, cwd, errPayload.stack)
            : errPayload.stack
          exceptionsManager.handleBrowserException(err, actualData.type || 'error')
          return
        }
      } else if (payload.event === 'runner:pinned_tests' && actualData && actualData.tests) {
        const tests = actualData.tests as { title: string; stack: string }[]
        const formatted = await Promise.all(
          tests.map(async (t) => {
            const transformed = await transformBrowserStack(vite as ViteDevServer, cwd, t.stack)
            return formatPinnedTest(t.title, transformed)
          })
        )
        printPinnedTests(formatted)
        return
      }

      // Re-emit browser events in the Node.js process
      await activeNodeEmitter.emit(payload.event, actualData)
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

    // Set a global safety timeout — if the browser never calls
    // __lupa_runner_end__, we force shutdown to prevent hanging.
    globalTimeout = setTimeout(async () => {
      console.error('\n\nGlobal timeout reached. The test run took too long and was forcefully terminated.')
      console.error('Consider increasing the timeout or checking for infinite loops in your tests.\n')
      await shutdown(1)
    }, DEFAULT_GLOBAL_TIMEOUT)

    // Don't let the timeout keep the process alive if everything else is done
    globalTimeout.unref()

    // Navigate to harness (or reload if already there)
    await page.goto(`${serverUrl}__lupa__/runner.html`)
  }

  if (isWatchMode) {
    watchManager.start()
  }

  // Initial execution
  executeTests()
}
