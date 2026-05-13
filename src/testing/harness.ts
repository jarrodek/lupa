/* eslint-disable no-console */
/// <reference types="vite/client" />
import { WebRunner } from './web_runner.js'
import { Suite } from './suite/main.js'
import { Emitter } from './emitter.js'
import { Refiner } from '../refiner/main.js'
import { setActiveInstances, setActiveFile } from './api.js'
import { BrowserExceptionsManager } from './exceptions_manager.js'
import type { WebPluginContext } from './web_plugin.js'

// We expect window.__lupa__ to be injected by the Node.js runner
declare global {
  interface Window {
    __lupa__: {
      suites: {
        name: string
        timeout?: number
        retries?: number
        files: string[]
      }[]
      config: {
        timeout?: number
        retries?: number
        filters?: any
      }
      testPlugins?: (string | [string, any])[]
    }
    __lupa_runner_end__: () => Promise<void>
    __lupa_testing_mode__?: boolean
  }
}

export async function boot() {
  const emitter = new Emitter()
  const runner = new WebRunner(emitter)
  const refiner = new Refiner(window.__lupa__.config?.filters || {})

  // Relay all emitter events back to the Node.js orchestrator via Vite HMR
  const events = [
    'runner:start',
    'runner:end',
    'suite:start',
    'suite:end',
    'group:start',
    'group:end',
    'test:start',
    'test:end',
    'uncaught:exception',
    'runner:pinned_tests',
  ] as const

  const isDebug = new URLSearchParams(window.location.search).get('debug') === '1'

  for (const eventName of events) {
    emitter.on(eventName, (data) => {
      if (import.meta.hot && !isDebug) {
        // Serialize Error objects because JSON.stringify drops them
        let payload = data
        if (data && Array.isArray((data as any).errors)) {
          payload = {
            ...data,
            errors: (data as any).errors.map((e: any) => ({
              ...e,
              error:
                e.error instanceof Error
                  ? {
                      message: e.error.message,
                      stack: e.error.stack,
                      name: e.error.name,
                    }
                  : e.error,
            })),
          }
        } else if (eventName === 'uncaught:exception' && data && (data as any).error instanceof Error) {
          payload = {
            ...(data as any),
            error: {
              message: (data as any).error.message,
              stack: (data as any).error.stack,
              name: (data as any).error.name,
            },
          }
        }
        import.meta.hot.send('lupa:telemetry', { event: eventName, data: payload })
      }
    })
  }

  // Load test plugins before suites
  const pluginContext: WebPluginContext = { runner, emitter, config: window.__lupa__.config }
  const testPlugins = window.__lupa__.testPlugins || []
  for (const entry of testPlugins) {
    const [specifier, options] = Array.isArray(entry) ? entry : [entry, undefined]
    try {
      const mod = await import(/* @vite-ignore */ specifier)
      if (typeof mod.default === 'function') {
        await mod.default(pluginContext, options)
      } else {
        console.warn(`Test plugin "${specifier}" does not have a default export`)
      }
    } catch (error) {
      console.error(`Failed to load test plugin: ${specifier}`, error)
    }
  }

  // Iterate over suites configured by the planner
  const suites = window.__lupa__.suites || []
  for (const suiteDef of suites) {
    const suite = new Suite(suiteDef.name, emitter, refiner)
    runner.add(suite)

    const { timeout, retries } = suiteDef

    if (typeof timeout === 'number') {
      suite.onTest((test) => test.timeout(timeout))
      suite.onGroup((group) => group.each.timeout(timeout))
    }

    if (typeof retries === 'number') {
      suite.onTest((test) => test.retry(retries))
      suite.onGroup((group) => group.each.retry(retries))
    }
    setActiveInstances(runner, suite, emitter, refiner)

    // Dynamically import all test files for this suite
    for (const file of suiteDef.files) {
      try {
        setActiveFile(file)
        const prefix = window.__lupa_testing_mode__ ? 'file://' : '/@fs'
        await import(/* @vite-ignore */ prefix + file)
      } catch (error) {
        const importError = error instanceof Error ? error : new Error(String(error))
        importError.message = `Failed to load test file: ${file}\n${importError.message}`
        console.error(importError.message, importError)
        emitter.emit('uncaught:exception', { error: importError, type: 'error' })
      } finally {
        setActiveFile(undefined)
      }
    }
  }

  // Start exception manager AFTER files are imported, so that test setup runs
  // Or actually, we should start it as early as possible so file imports are caught if they throw asynchronously.
  const exceptionsManager = new BrowserExceptionsManager(emitter)
  exceptionsManager.monitor()

  // Execute the runner
  await runner.start()
  await runner.exec()
  await runner.end()

  // Notify Node.js that we are done
  if (window.__lupa_runner_end__ && !isDebug) {
    await window.__lupa_runner_end__()
  }
}

if (typeof window !== 'undefined' && !window.__lupa_testing_mode__) {
  boot().catch(console.error)
}
