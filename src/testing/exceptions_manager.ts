import type { Emitter } from './emitter.js'

/**
 * Monitors the browser for unhandled exceptions and unhandled
 * promise rejections, passing them to the telemetry emitter
 * so they can be reported by the Node.js orchestrator.
 */
export class BrowserExceptionsManager {
  #emitter: Emitter
  #isMonitoring = false

  constructor(emitter: Emitter) {
    this.#emitter = emitter
  }

  /**
   * Start listening to window global errors.
   */
  monitor() {
    if (this.#isMonitoring) {
      return
    }
    this.#isMonitoring = true

    window.addEventListener('error', (event) => {
      // Avoid reporting errors we've already caught or if it's missing
      if (!event.error) return
      this.#emitError(event.error, 'error')
    })

    window.addEventListener('unhandledrejection', (event) => {
      this.#emitError(event.reason, 'rejection')
    })
  }

  /**
   * Stop listening to window global errors.
   */
  stop() {
    this.#isMonitoring = false
    // Since we're in the browser, testing framework usually runs once per page load.
    // If needed, removeEventListener logic can be added here.
  }

  #emitError(error: any, type: 'error' | 'rejection') {
    this.#emitter.emit('uncaught:exception', {
      error,
      type,
    })
  }
}
