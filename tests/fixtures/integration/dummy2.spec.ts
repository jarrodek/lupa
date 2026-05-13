import { test } from '../../../src/testing/index.js'
import { multiply, divide } from '../browser/math.js'

test.group('Math Operations Group', () => {
  test('multiply two positive numbers', ({ assert }) => {
    assert.equal(multiply(5, 4), 20)
  })

  test('multiply by zero', ({ assert }) => {
    assert.equal(multiply(10, 0), 0)
  })

  test('divide exactly', ({ assert }) => {
    assert.equal(divide(10, 2), 5)
  })

  test('divide by zero throws error', ({ assert }) => {
    assert.throws(() => divide(10, 0), 'Cannot divide by zero')
  })
})
