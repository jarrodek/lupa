# Testing API

The testing API is the API that is used to define tests. All the code is executed in the browser, not in Node.js.

## Test files

Similarly to Japa runner, we have an opinionated approach to the test files structure. For example, we do not allow nested groups in test files.

### Folders over groups for organization

A common use case for nested groups is organization of tests. For example:

- A developer might want to create a top-level group for users tests.
  - A nested group to list all users.
  - A nested group to create a new user:
    - Another level of nesting to create a new user as admin
    - A sibling group to create a new user via registration form

The same level of organization can be achieved through nested files and folders. In fact, creating nested folders offers better filtering capabilities and makes it easy to visualize the depth of the tests by looking at the folder structure.

### We prefer duplication over wrong abstractions
Another use-case for nested groups is to use layers of lifecycle hooks and avoid duplication at all costs. For example, creating some state in a top-level group so that you do not have to redefine it in every group.


```ts
// THIS IS WRONG!
let user

test.group('A top level group', (group) => {
  group.setup(() => {
    user = await getUserForTesting()
  })
  
  test.group('a nested group', () => {
    test.group('another level of testing', () => {
      test('use the user in the test', () => {
        console.log(user)
      })
    })
  })
})
```

While writing the code to get the user in just one place sounds good in theory, it can be problematic when you have long test files and want to track every usage of the user variable to ensure that you are not overwriting it somewhere in between.

## Basic test

A test is defined using the `test` function.

```typescript
import { test } from '@jarrodek/lupa/testing'

function sum(a, b) {
  return a + b
}

test('add two numbers', ({ assert }) => {
  assert.equal(sum(2, 2), 4)
})
```

The `test` function accepts two arguments:

1. Test title: string
2. Test function: (context: TestContext) => void | Promise<void>

More on the test context object in the [test context](test-context.md) page.
More on the test object in the [test](test.md) page.

## Grouped tests

```typescript
import { test } from '@jarrodek/lupa/testing'

test.group('arithmetic operations', (group) => {
  group.setup(() => {
    console.log('setting up')
  })

  group.teardown(() => {
    console.log('tearing down')
  })

  test('addition', ({ assert }) => {
    assert.equal(2 + 2, 4)
  })

  test('subtraction', ({ assert }) => {
    assert.equal(2 - 2, 0)
  })
})
```

The `test.group` function accepts two arguments:

1. Group title: string
2. Group function: (group: TestGroup) => void

More on the test group object in the [test group](test-group.md) page.

## Test Fixtures

The developer can use our toolset for defining test fixtures. We provide them with the `fixture` function and `html` template tag. It creates a test fixture by parsing the template and returning the rendered element. Under the hood, it is using the [lit-html](https://lit.dev/docs/api/lit-html/) library to render the template.

Example usage:

```typescript
import { test, fixture, html } from '@jarrodek/lupa/testing'

// import component
import '../../src/my-element.js'

test('renders the element', async ({ assert }) => {
  const el = await fixture(html`<my-element></my-element>`)
  assert.ok(el.shadowRoot?.firstElementChild)
})
```

## Lifecycle hooks

Hooks are registered using the `setup` and the `teardown` methods.

```typescript
import { test } from '@jarrodek/lupa/testing'

test('add two numbers', () => {
  console.log('executed in the test')
})
.setup(() => {
  console.log('executed before the test')
})
.teardown(() => {
  console.log('executed after the test')
})
```

### Group hooks

```typescript
test.group('arithmetic operations', (group) => {
  group.setup(() => {
    console.log('setting up')
  })

  group.teardown(() => {
    console.log('tearing down')
  })

  group.each.setup(() => {
    console.log('executed before the test')
  })

  group.each.teardown(() => {
    console.log('executed after the test')
  })
})
```

### Cleanup functions

We allow developers to return cleanup functions from hooks. The sole purpose of a cleanup function is to clear the state created by the hook.

For example, if a developer create database tables inside the setup hook, they can use the cleanup function to delete those tables.

```typescript
import { test } from '@jarrodek/lupa/testing'

test.group('arithmetic operations', (group) => {
  group.setup(() => {
    console.log('setting up')
    return () => {
      console.log('tearing down')
    }
  })

  test('addition', ({ assert }) => {
    assert.equal(2 + 2, 4)
  })

  test('subtraction', ({ assert }) => {
    assert.equal(2 - 2, 0)
  })
})
```

#### Shouldn't I use the teardown hook to drop tables?
Teardown hooks are meant to run standalone functions after a test. Cleanup functions are intended to clean up the state created by the setup function.


### Test hooks parameters

The test lifecycle hooks receive an instance of the `Test` class as the only argument.

```typescript
import { test } from '@jarrodek/lupa/testing'

test.group((group) => {
  group.each.setup((test) => {
  })

  group.each.teardown((test) => {
  })
})

```

The cleanup functions receive a total of two arguments. The first is a boolean to know if the underlying test has failed, and the second is an instance of the test class.

```typescript
import { test } from '@jarrodek/lupa/testing'

test.group((group) => {
  group.each.setup(() => {
    return (hasError, test) => {
      // 
    }
  })
})
```
