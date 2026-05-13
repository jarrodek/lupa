export interface RetryOptions {
  /**
   * The maximum amount of times to retry the operation. Default is 10.
   */
  retries?: number
  /**
   * The exponential factor to use. Default is 2.
   */
  factor?: number
}

export function retry<T = void>(fn: (...args: any[]) => Promise<T>, options?: RetryOptions): Promise<T> {
  const retries = options?.retries ?? 10
  const factor = options?.factor ?? 2
  const wait = (retries: number) => Math.min(1000 * Math.pow(factor, retries), 30000)

  let lastError: Error

  return new Promise<T>((resolve, reject) => {
    let attempt = 0
    const next = async () => {
      try {
        const result = await fn()
        resolve(result)
      } catch (error) {
        lastError = error as Error
        attempt++
        if (attempt > retries) {
          reject(lastError)
          return
        }
        setTimeout(next, wait(attempt))
      }
    }
    next()
  })
}

export interface TimeEndFunction {
  /**
   * @returns Elapsed milliseconds.
   */
  (): number

  /**
   * @returns Elapsed milliseconds rounded.
   */
  rounded(): number

  /**
   * @returns Elapsed seconds.
   */
  seconds(): number

  /**
   * @returns Elapsed nanoseconds.
   */
  nanoseconds(): bigint
}

/**
 * Returns a function that can be used to measure the time elapsed
 * since the function was called.
 */
export function timeSpan(): TimeEndFunction {
  const start = performance.now()

  const end = () => performance.now() - start
  end.rounded = () => Math.round(end())
  end.seconds = () => end() / 1000
  end.nanoseconds = () => end() * 1000000

  return end as unknown as TimeEndFunction
}
