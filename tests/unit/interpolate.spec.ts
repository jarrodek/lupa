import { test } from 'node:test'
import assert from 'node:assert'
import { interpolate } from '../../src/testing/interpolate.js'

test('interpolate', async (t) => {
  await t.test('interpolates basic values', () => {
    assert.strictEqual(interpolate('hello { username }', { username: 'virk' }, 0), 'hello virk')
  })

  await t.test('interpolates nested properties', () => {
    assert.strictEqual(interpolate('hello { user.name }', { user: { name: 'virk' } }, 0), 'hello virk')
  })

  await t.test('handles missing properties', () => {
    assert.strictEqual(interpolate('hello { missing }', { username: 'virk' }, 0), 'hello undefined')
  })

  await t.test('interpolates index using $i', () => {
    assert.strictEqual(interpolate('Test {$i}', null, 5), 'Test 5')
  })

  await t.test('interpolates self using $self', () => {
    assert.strictEqual(interpolate('Value is {$self}', 'foo', 0), 'Value is foo')
  })

  await t.test('escapes curly braces', () => {
    assert.strictEqual(interpolate('hello \\{username}', { username: 'virk' }, 0), 'hello {username}')
  })

  await t.test('handles null data', () => {
    assert.strictEqual(interpolate('hello {prop}', null, 0), 'hello undefined')
  })
})
