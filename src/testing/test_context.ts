import Macroable from '@poppinss/macroable'
import type { TestHooksCleanupHandler } from '../types.js'
import type { Test } from './test/main.js'

/**
 * A fresh copy of test context is shared with all the tests.
 * Note, this runs in the browser context.
 */
export class TestContext extends Macroable {
  cleanup: (cleanupCallback: TestHooksCleanupHandler) => void

  constructor(public test: Test) {
    super()
    this.cleanup = (cleanupCallback: TestHooksCleanupHandler) => {
      test.cleanup(cleanupCallback)
    }
  }
}
