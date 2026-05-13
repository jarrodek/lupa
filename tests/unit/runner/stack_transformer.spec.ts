import { test } from 'node:test'
import assert from 'node:assert'
import { transformBrowserStack } from '../../../src/runner/stack_transformer.js'

test('StackTransformer', async (t) => {
  await t.test('filters framework internal files', async () => {
    const stack = `Error: foo
    at Test.run (http://localhost:3000/src/testing/test/main.ts:10:1)
    at Object.test (http://localhost:3000/src/assert/assert.ts:20:2)
    at run (http://localhost:3000/@fs/home/user/app.spec.ts:50:10)`

    const transformed = await transformBrowserStack({} as any, '/home/user', stack)
    const lines = transformed.split('\n')
    assert.strictEqual(lines.length, 2)
    assert.match(lines[0], /Error: foo/)
    assert.match(lines[1], /\/home\/user\/app\.spec\.ts:50:10/)
  })

  await t.test('resolves /@fs/ prefixed absolute paths', async () => {
    const stack = `Error: foo
    at myFunc (http://localhost:3000/@fs/absolute/path/file.spec.ts:10:15)`
    const transformed = await transformBrowserStack({} as any, '/cwd', stack)
    assert.match(transformed, /\/absolute\/path\/file\.spec\.ts:10:15/)
  })

  await t.test('resolves /@fs prefixed relative paths', async () => {
    const stack = `Error: foo
    at myFunc (http://localhost:3000/@fsrelative/path/file.spec.ts:10:15)`
    const transformed = await transformBrowserStack({} as any, '/cwd', stack)
    assert.match(transformed, /\/cwd\/relative\/path\/file\.spec\.ts:10:15/)
  })

  await t.test('resolves normal relative prefixed paths', async () => {
    const stack = `Error: foo
    at myFunc (http://localhost:3000/relative/path/file.spec.ts:10:15)`
    const transformed = await transformBrowserStack({} as any, '/cwd', stack)
    assert.match(transformed, /\/cwd\/relative\/path\/file\.spec\.ts:10:15/)
  })

  await t.test('ignores lines without at prefix', async () => {
    const stack = `Error: foo\nSome description`
    const transformed = await transformBrowserStack({} as any, '/cwd', stack)
    assert.strictEqual(transformed, stack)
  })
})
