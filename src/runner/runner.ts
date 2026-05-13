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
import { type Emitter } from '../testing/emitter.js'
import { Tracker } from '../testing/tracker.js'
import { type ReporterContract, type RunnerSummary } from '../types.js'
import { SummaryBuilder } from '../testing/summary_builder.js'

/**
 * The Runner class exposes the API to manage the node process telemetry
 * and reporters for Lupa tests running in the browser.
 */
export class Runner extends Macroable {
  #emitter: Emitter
  #failed = false

  /**
   * Reference to tests tracker
   */
  #tracker?: Tracker

  /**
   * Summary builder is used to create the tests summary reported by
   * multiple reporters. Each report contains a key-value pair
   */
  summaryBuilder = new SummaryBuilder()

  /**
   * Registered tests reporter
   */
  reporters = new Set<ReporterContract>()

  constructor(emitter: Emitter) {
    super()
    this.#emitter = emitter
  }

  #getTrackerOrThrow() {
    if (!this.#tracker) {
      throw new Error('Invalid state: Tracker not initialized')
    }
    return this.#tracker
  }

  /**
   * Boot the runner
   */
  #boot() {
    this.#tracker = new Tracker()

    const trackerEmitter = this.reporterEmitter || this.#emitter

    trackerEmitter.on('runner:start', (payload) => this.#tracker?.processEvent('runner:start', payload))
    trackerEmitter.on('runner:end', (payload) => this.#tracker?.processEvent('runner:end', payload))
    trackerEmitter.on('suite:start', (payload) => this.#tracker?.processEvent('suite:start', payload))
    trackerEmitter.on('suite:end', (payload) => {
      if (payload.hasError) {
        this.#failed = true
      }
      this.#tracker?.processEvent('suite:end', payload)
    })
    trackerEmitter.on('group:start', (payload) => this.#tracker?.processEvent('group:start', payload))
    trackerEmitter.on('group:end', (payload) => {
      if (payload.hasError) {
        this.#failed = true
      }
      this.#tracker?.processEvent('group:end', payload)
    })
    trackerEmitter.on('test:start', (payload) => this.#tracker?.processEvent('test:start', payload))
    trackerEmitter.on('test:end', (payload) => {
      if (payload.hasError) {
        this.#failed = true
      }
      this.#tracker?.processEvent('test:end', payload)
    })
  }

  /**
   * Know if one or more suites have failed
   */
  get failed(): boolean {
    return this.#failed
  }

  /**
   * Register a tests reporter
   */
  registerReporter(reporter: ReporterContract): this {
    this.reporters.add(reporter)
    return this
  }

  /**
   * Get tests summary
   */
  getSummary(): RunnerSummary {
    return this.#getTrackerOrThrow().getSummary()
  }

  /**
   * Optional emitter to use for reporters. If not set, the main emitter is used.
   * Useful for watch mode filtering.
   */
  reporterEmitter?: Emitter

  /**
   * Start the test runner process
   */
  async start() {
    this.#boot()
    debug('starting node reporters')

    const emitterToUse = this.reporterEmitter || this.#emitter

    for (const reporter of this.reporters) {
      if (typeof reporter === 'function') {
        await reporter(this, emitterToUse)
      } else {
        await reporter.handler(this, emitterToUse)
      }
    }
  }

  /**
   * End the runner process
   */
  async end() {
    debug('node runner ended')
  }
}
