/*
 * @japa/core
 *
 * (c) Japa
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import Macroable from '@poppinss/macroable'

import debug from './debug.js'
import { type Suite } from './suite/main.js'
import { type Emitter } from './emitter.js'
import { Group } from './group/main.js'

/**
 * The WebRunner class exposes the API to register test suites and execute
 * them sequentially in the browser.
 */
export class WebRunner extends Macroable {
  #emitter: Emitter
  #failed = false
  #bail = false

  /**
   * Callbacks to invoke on every suite
   */
  #configureSuiteCallbacks: ((suite: Suite) => void)[] = []

  /**
   * A collection of suites
   */
  suites: Suite[] = []

  constructor(emitter: Emitter) {
    super()
    this.#emitter = emitter
  }

  /**
   * Notify the reporter about the runner start
   */
  #notifyStart() {
    return this.#emitter.emit('runner:start', {})
  }

  /**
   * Notify the reporter about the runner end
   */
  #notifyEnd() {
    return this.#emitter.emit('runner:end', {
      hasError: this.#failed,
    })
  }

  /**
   * Know if one or more suites have failed
   */
  get failed(): boolean {
    return this.#failed
  }

  /**
   * Add a suite to the runner
   */
  add(suite: Suite): this {
    this.#configureSuiteCallbacks.forEach((callback) => callback(suite))
    this.suites.push(suite)
    debug('registering suite %s', suite.name)
    return this
  }

  /**
   * Tap into each suite and configure it
   */
  onSuite(callback: (suite: Suite) => void): this {
    this.suites.forEach((suite) => callback(suite))
    this.#configureSuiteCallbacks.push(callback)
    return this
  }

  /**
   * Enable/disable the bail mode. In bail mode, all
   * upcoming suites/groups/tests will be skipped
   * when the current test fails
   */
  bail(toggle = true) {
    this.#bail = toggle
    this.onSuite((suite) => suite.bail(toggle))
    return this
  }

  /**
   * Start the test runner process. The method emits
   * "runner:start" event
   */
  async start() {
    debug('starting to run tests')
    await this.#notifyStart()
  }

  /**
   * Execute runner suites
   */
  async exec() {
    for (const suite of this.suites) {
      /**
       * Skip tests in bail mode when there is an error
       */
      if (this.#bail && this.#failed) {
        suite.stack.forEach((groupOrTest) => {
          if (groupOrTest instanceof Group) {
            groupOrTest.tap((t) => t.skip(true, 'Skipped due to bail mode'))
          } else {
            groupOrTest.skip(true, 'Skipped due to bail mode')
          }
        })
      }

      await suite.exec()
      if (!this.#failed && suite.failed) {
        this.#failed = true
      }
    }
  }

  /**
   * End the runner process. Emits "runner:end" event
   */
  async end() {
    await this.#notifyEnd()
  }
}
