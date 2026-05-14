/**
 * Returns a promise that resolves after the specified number of milliseconds.
 */
export function aTimeout(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Returns a promise that resolves after the next browser animation frame.
 */
export function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

/**
 * Returns a promise that resolves when the specified event is dispatched on the element.
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
