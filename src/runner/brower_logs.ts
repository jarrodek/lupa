import { inspect } from 'node:util'
import type { ConsoleMessage, JSHandle, Page } from 'playwright'

type LogType =
  | 'log'
  | 'debug'
  | 'info'
  | 'error'
  | 'warning'
  | 'dir'
  | 'dirxml'
  | 'table'
  | 'trace'
  | 'startGroup'
  | 'startGroupCollapsed'
  | 'assert'
  | 'profile'
  | 'profileEnd'
  | 'count'
  | 'timeEnd'

/**
 * A class that specializes in collecting and processing browser logs.
 */
export class BrowserLogs {
  protected readonly page: Page

  /**
   * When not set, all messages are suppressed, only errors are reported.
   */
  verbose = false

  /**
   * The list of prefixes to ignore messages containing.
   * @default ['[vite]']
   */
  ignorePrefix = ['[vite]']

  /**
   * The default prefix to use when logging messages.
   */
  messagePrefix = '[Browser Console]'

  /**
   * Creates an instance of BrowserLogs.
   *
   * @param page - The Playwright page to capture logs from.
   */
  constructor(page: Page, verbose = false) {
    this.page = page
    this.verbose = verbose

    this.handleConsoleMessage = this.handleConsoleMessage.bind(this)
    this.handlePageError = this.handlePageError.bind(this)
  }

  /**
   * Starts capturing browser logs.
   */
  boot(): void {
    this.page.on('console', this.handleConsoleMessage)
    this.page.on('pageerror', this.handlePageError)
  }

  protected canShow(message: string): boolean {
    if (!this.verbose) {
      return false
    }

    const trimmed = message.trim()
    const startsWithAnyPrefix = this.ignorePrefix.some((prefix) => trimmed.startsWith(prefix))
    return !startsWithAnyPrefix
  }

  protected async handleConsoleMessage(message: ConsoleMessage): Promise<void> {
    const type = message.type()
    if (type === 'clear' || type === 'time' || type === 'endGroup') {
      return
    }
    const text = message.text()
    if (!this.canShow(text)) return

    const args = message.args()
    if (!args.length) {
      console.log(this.messagePrefix, text)
      return
    }

    try {
      const processedArgs = await this.processArguments(args)
      this.print(type, ...processedArgs)
    } catch {
      // If args processing fails, fall back to text-only logging
      this.print(type, text)
    }
  }

  protected print(type: LogType, ...args: any[]): void {
    const isMultiline = args.some((v) => {
      if (typeof v !== 'string') return false
      return v.includes('\n')
    })

    if (type === 'table') {
      console.log(this.messagePrefix)
      console.table(...args)
      return
    }

    if (type === 'dir' || type === 'dirxml') {
      console.log(this.messagePrefix)
      console.dir(...args)
      return
    }

    type ValidType = Exclude<LogType, 'table' | 'dir' | 'dirxml'>
    const prefixes: Record<ValidType, (message: string, ...args: any[]) => void> = {
      error: console.error,
      warning: console.warn,
      info: console.info,
      log: console.log,
      debug: console.debug,
      startGroup: console.group,
      startGroupCollapsed: console.groupCollapsed,
      assert: console.log,
      profile: console.profile,
      profileEnd: console.profileEnd,
      trace: console.log,
      timeEnd: console.log,
      count: console.log,
    }
    let formatted: any[]
    if (['table'].includes(type)) {
      formatted = args
    } else {
      formatted = this.format(args)
    }

    if (isMultiline) {
      prefixes[type as ValidType](this.messagePrefix, '\n', ...formatted)
    } else {
      prefixes[type as ValidType](this.messagePrefix, ...formatted)
    }
  }

  protected async handlePageError(error: Error): Promise<void> {
    console.error(this.messagePrefix, error)
  }

  protected async processArguments(args: JSHandle[]): Promise<any[]> {
    return Promise.all(args.map((arg) => this.processArgument(arg)))
  }

  protected async processArgument(arg: JSHandle): Promise<any> {
    try {
      const result = await arg.evaluate((n: any) => {
        // eslint-disable-next-line no-restricted-globals
        if (n instanceof Element) {
          return { __lupa_type: 'element', value: n.outerHTML }
        }
        // eslint-disable-next-line no-restricted-globals
        if (n instanceof Node) {
          return { __lupa_type: 'node', value: n.nodeName }
        }
        return { __lupa_type: 'json', value: n }
      })

      if (result && typeof result === 'object' && '__lupa_type' in result) {
        return result.value
      }

      return result
    } catch {
      return arg.toString()
    }
  }

  protected format(messages: any[]): any[] {
    return messages.map((a) => (typeof a === 'string' ? a : inspect(a, { colors: true, depth: null })))
  }
}
