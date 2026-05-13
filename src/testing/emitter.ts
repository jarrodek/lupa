/*
 * @japa/core
 *
 * (c) Japa
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import Emittery, { type UnsubscribeFunction } from 'emittery'
import { type RunnerEvents } from '../types.js'

/**
 * Runner emitter
 */
export class Emitter extends Emittery<RunnerEvents> {
  #errorHandler?: (error: any) => void | Promise<void>

  /**
   * Define onError handler invoked when `emit` fails
   */
  onError(errorHandler: (error: any) => void | Promise<void>) {
    this.#errorHandler = errorHandler
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
      await (super.emit as any)(eventName, eventData, allowMetaEvents)
    } catch (error) {
      if (this.#errorHandler) {
        await this.#errorHandler(error)
      } else {
        throw error
      }
    }
  }

  // on<Name extends keyof RunnerEvents>(
  //   eventName: Name | readonly Name[],
  //   listener: (eventData: RunnerEvents[Name]) => void | Promise<void>
  // ): import('emittery').UnsubscribeFunction
  on(eventName: any, listener: (eventData: any) => void | Promise<void>): UnsubscribeFunction {
    return super.on(eventName, (data: any) => {
      const actualData = data && data.name && data.data ? data.data : data
      return listener(actualData)
    })
  }
}
