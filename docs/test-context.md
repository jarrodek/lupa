# Test context

An instance of the `TestContext` class is shared with all the tests and the test hooks. Lupa creates an isolated instance of `TestContext` for every test. Therefore, a developer can add custom properties without worrying about them leaking to other tests.

Based on your installed plugins, you may access different properties via the `ctx` object.

Example:

```typescript
import { test } from '@jarrodek/lupa/testing'

test('add two numbers', (ctx) => {
  console.log(ctx)
})
```

Access context inside hooks:

```typescript
import { test } from '@jarrodek/lupa/testing'

test.group('Maths.add', (group) => {
  group.each.setup(($test) => {
    console.log($test.context)
  })

  group.each.teardown(($test) => {
    console.log($test.context)
  })

  test('add two number', (ctx) => {
    console.log(ctx)
  })
})
```

## TestContext properties

### assert

The assert property is shared by the `@jarrodek/lupa/assert` plugin, available in the default package.

```typescript
import { test } from '@jarrodek/lupa/testing'

test('add two numbers', ({ assert }) => {
  assert.equal(2 + 2, 4)
})
```

More properties will be added in the future based on plugin system.
