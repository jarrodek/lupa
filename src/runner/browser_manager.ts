import { chromium, firefox, webkit, type Browser, type Page } from 'playwright'
import { BrowserLogs } from './brower_logs.js'
import { CommandsHandler } from '../commands/rpc_handler.js'
import type { CoverageManager } from './coverage_manager.js'
import type { TestPoolManager } from './test_pool_manager.js'
import debug from './debug.js'
import type { Emitter } from '../testing/emitter.js'
import type { RunnerEvents } from '../types.js'

export type BrowserName = 'chromium' | 'firefox' | 'webkit'

export class BrowserManager {
  #browsers = new Map<BrowserName, Browser>()
  #pages = new Map<string, Page>() // keyed by chunkId
  #browserNames: BrowserName[]
  #verboseLogs: boolean
  #emitter: Emitter<RunnerEvents>

  constructor(browserNames: BrowserName[], verboseLogs: boolean, emitter: Emitter<RunnerEvents>) {
    this.#browserNames = browserNames
    this.#verboseLogs = verboseLogs
    this.#emitter = emitter
  }

  async boot(testPoolManager: TestPoolManager, onRunnerEnd: () => Promise<void>) {
    const finishedPages = new Set<Page>()

    for (const name of this.#browserNames) {
      debug('launching browser: %s', name)
      let browser: Browser
      if (name === 'firefox') browser = await firefox.launch()
      else if (name === 'webkit') browser = await webkit.launch()
      else browser = await chromium.launch()

      this.#browsers.set(name, browser)

      const chunkIds = testPoolManager.getChunkIdsForBrowser(name)

      for (const chunkId of chunkIds) {
        const page = await browser.newPage()
        this.#pages.set(chunkId, page)

        const logs = new BrowserLogs(page, this.#verboseLogs, this.#emitter)
        logs.boot()

        const commandsHandler = new CommandsHandler(page)
        await commandsHandler.boot()

        await page.exposeFunction('__lupa_runner_end__', async () => {
          finishedPages.add(page)
          if (finishedPages.size === this.#pages.size) {
            await onRunnerEnd()
            finishedPages.clear() // Reset for next watch mode run
          }
        })
      }
    }
  }

  async goto(urlBase: string) {
    await Promise.all(
      Array.from(this.#pages.entries()).map(([chunkId, page]) => {
        const url = new URL(urlBase)
        url.searchParams.set('chunkId', chunkId)
        return page.goto(url.href)
      })
    )
  }

  async extractCoverage(coverageManager: CoverageManager) {
    for (const [chunkId, page] of this.#pages.entries()) {
      try {
        debug('extracting coverage for chunk %s', chunkId)
        await coverageManager.extractAndReport(page)
      } catch (err) {
        console.error(`Failed to extract coverage for chunk ${chunkId}:`, err)
      }
    }
  }

  async close() {
    for (const [name, browser] of this.#browsers.entries()) {
      try {
        debug('closing browser: %s', name)
        await Promise.race([browser.close(), new Promise((r) => setTimeout(r, 1000))])
      } catch (error) {
        debug('error closing browser %s: %O', name, error)
      }
    }
    this.#browsers.clear()
    this.#pages.clear()
  }
}
