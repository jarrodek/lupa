/*
 * @japa/core
 *
 * (c) Japa
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import Emittery, { UnsubscribeFunction } from 'emittery'
import { type RunnerEvents } from '../types.js'

/**
 * Runner emitter
 */
export class Emitter extends Emittery<RunnerEvents> {
  /**
   * The handler to call when an error is emitted.
   */
  #errorHandler?: (error: any) => void | Promise<void>

  /**
   * Define onError handler invoked when `emit` fails
   * @param errorHandler - The error handler to call when an error is emitted
   */
  onError(errorHandler: (error: any) => void | Promise<void>) {
    this.#errorHandler = errorHandler
  }

  /**
   * Override Emittery's `on` to unwrap the `{ name, data }` payload that Emittery v1 passes.
   * Japa reporters expect the raw data object, not the wrapped one.
   */
  // @ts-expect-error - Narrower signature than base Emittery class to provide strict Japa runner event types
  on<Name extends keyof RunnerEvents>(
    eventName: Name | readonly Name[],
    listener: (eventData: RunnerEvents[Name]) => void | Promise<void>
  ): UnsubscribeFunction {
    return super.on(eventName, (data: any) => {
      // Emittery v1 passes an object `{ name, data }` to listeners.
      const actualData = data && data.name && data.data ? data.data : data
      return listener(actualData)
    })
  }

  /**
   * Emit event
   */
  async emit<Name extends keyof RunnerEvents>(
    eventName: Name,
    eventData?: RunnerEvents[Name],
    allowMetaEvents?: boolean
  ): Promise<void> {
    try {
      // @todo: this makes no sense, the `super.emit` does not handle 3rd argument.
      // I checked the source code of `emittery` and it only accepts 2 arguments,
      // nor it checks the `arguments` object. This is, however, used by the original
      // Japa emitter. When I have time, I will investigate whether this can be removed.
      await (super.emit as any)(eventName, eventData, allowMetaEvents)
    } catch (error) {
      if (this.#errorHandler) {
        await this.#errorHandler(error)
      } else {
        throw error
      }
    }
  }
}
