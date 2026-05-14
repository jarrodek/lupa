import { Assert } from '../src/assert/assert.js'

declare module '../src/testing/test_context.js' {
  interface TestContext {
    assert: Assert
  }
}
