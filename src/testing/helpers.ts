/**
 * Returns a promise that resolves after the specified number of milliseconds.
 * @param ms - Number of milliseconds to wait
 * @returns Promise that resolves after the specified number of milliseconds
 * @example
 * ```typescript
 * await aTimeout(1000)
 * ```
 */
export function aTimeout(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Returns a promise that resolves after the next browser animation frame.
 * @returns Promise that resolves after the next browser animation frame
 * @example
 * ```typescript
 * await nextFrame()
 * ```
 */
export function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

/**
 * Returns a promise that resolves when the specified event is dispatched on the element.
 * @param element - Element to listen for the event on
 * @param eventName - Name of the event to wait for
 * @returns Promise that resolves when the specified event is dispatched on the element
 * @example
 * ```typescript
 * await oneEvent(element, 'click')
 * ```
 */
export function oneEvent(element: Element | Window, eventName: string): Promise<Event> {
  return new Promise((resolve) => {
    const listener = (event: Event) => {
      element.removeEventListener(eventName, listener)
      resolve(event)
    }
    element.addEventListener(eventName, listener)
  })
}

/**
 * Polls the condition function until it returns true or the timeout is reached.
 *
 * @remarks
 * If the condition function throws an error, the error is suppressed and the polling
 * continues until the condition returns true or the timeout expires. The `interval`
 * option determines the delay between polling attempts (default is 50ms), and the
 * `timeout` option determines the maximum total duration before the promise rejects
 * with the provided `message` (default is 1000ms).
 *
 * @param condition - Function to poll
 * @param message - Message to use when throwing an error
 * @param options - Options for waitUntil
 * @returns Promise that resolves when the condition is met
 * @example
 * ```typescript
 * await waitUntil(() => element.textContent === 'Hello')
 * ```
 */
export async function waitUntil(
  condition: () => boolean | Promise<boolean>,
  message = 'waitUntil timed out',
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const timeout = options.timeout || 1000
  const interval = options.interval || 50
  const startTime = Date.now()

  return new Promise((resolve, reject) => {
    const check = async () => {
      try {
        if (await condition()) {
          resolve()
          return
        }
      } catch {
        // Ignore errors during evaluation, keep polling
      }

      if (Date.now() - startTime >= timeout) {
        reject(new Error(message))
        return
      }

      setTimeout(check, interval)
    }

    check()
  })
}
