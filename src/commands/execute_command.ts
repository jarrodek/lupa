import type { CommandNames } from './types.js'

/**
 * Global interface for the Lupa RPC bridge.
 */
declare global {
  interface Window {
    /**
     * The Lupa RPC bridge.
     */
    __lupa_command__<R = void>(command: CommandNames, payload?: any): Promise<R>
  }
}

/**
 * Executes a command in the browser.
 * @param command - The command to execute.
 * @param payload - The payload to send to the command.
 * @returns A promise that resolves when the command is executed.
 */
export function executeCommand<R = void>(command: CommandNames, payload?: any): Promise<R> {
  if (typeof window === 'undefined' || typeof window.__lupa_command__ !== 'function') {
    throw new Error(
      // eslint-disable-next-line max-len
      'The __lupa_command__ RPC bridge is not available. Ensure you are running tests inside the Lupa browser environment.'
    )
  }
  return window.__lupa_command__<R>(command, payload)
}
