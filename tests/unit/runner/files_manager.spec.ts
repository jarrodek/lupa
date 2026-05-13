import { test } from 'node:test'
import assert from 'node:assert'
import { FilesManager } from '../../../src/runner/files_manager.js'

test('FilesManager', async (t) => {
  await t.test('getFiles supports glob patterns and returns absolute URLs', async () => {
    const manager = new FilesManager()
    const cwd = process.cwd()
    const files = await manager.getFiles(cwd, 'tests/unit/runner/*.spec.ts', [])

    assert.ok(files.length > 0)
    assert.strictEqual(files[0].href.startsWith('file://'), true)
    assert.ok(files.some((f) => f.href.endsWith('files_manager.spec.ts')))
  })

  await t.test('getFiles supports implementation function', async () => {
    const manager = new FilesManager()
    const files = await manager.getFiles('/home/test', async () => [new URL('file:///home/test/c.spec.ts')], [])

    assert.strictEqual(files.length, 1)
    assert.strictEqual(files[0].href, 'file:///home/test/c.spec.ts')
  })

  await t.test('grep filters by exact filename match', () => {
    const manager = new FilesManager()
    const files = [
      new URL('file:///home/test/a.spec.ts'),
      new URL('file:///home/test/b.spec.ts'),
      new URL('file:///home/test/c.spec.ts'),
    ]

    const filtered = manager.grep(files, ['a.spec.ts'])
    assert.strictEqual(filtered.length, 1)
    assert.strictEqual(filtered[0].href, files[0].href)
  })

  await t.test('grep filters by path segments wildcard', () => {
    const manager = new FilesManager()
    const files = [
      new URL('file:///home/test/user/auth.spec.ts'),
      new URL('file:///home/test/user/profile.spec.ts'),
      new URL('file:///home/test/billing/invoice.spec.ts'),
    ]

    const filtered = manager.grep(files, ['user/*'])
    assert.strictEqual(filtered.length, 2)
    assert.strictEqual(filtered[0].href, files[0].href)
    assert.strictEqual(filtered[1].href, files[1].href)
  })

  await t.test('grep correctly strips extensions before segment matching', () => {
    const manager = new FilesManager()
    const files = [new URL('file:///home/test/user/auth.spec.ts')]

    // Because FILE_SUFFIX_EXPRESSION removes .spec.ts, 'user/auth' matches.
    const filtered = manager.grep(files, ['user/auth'])
    assert.strictEqual(filtered.length, 1)
    assert.strictEqual(filtered[0].href, files[0].href)
  })
})
