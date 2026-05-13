# Test class

Tests created using the `test` method are instances of the `Test` class.

## .skip()

Mark the test as skipped. The developer can either pass a boolean to the skip method or a function that is lazily evaluated to determine whether the test should be skipped.

```typescript
// Skip the test
test('add two numbers', () => {
})
.skip(true)

// Skip conditionally
test('add two numbers', () => {
})
.skip(!!process.env.CI)

// Skip lazily
test('add two numbers', () => {
})
.skip(() => {
  return findIfShouldBeSkipped()
})

// Skip with a reason
test('add two numbers', () => {
})
.skip(true, 'this test will always be skipped')
```

## .fails()

Mark the test as a regression test. Regression tests are meant to fail.

Example of a regression test is someone reporting a bug with a failing test, and once the bug has been fixed, the developer can remove the call to the fails method.

```typescript
test('add two numbers', ({ assert }) => {
  assert.equal(add(2, 2), 4)
})
.fails('add method should return 4, currently it returns 5')
```

## .timeout()

Define the timeout for the test. By default, the config.timeout value is used. However, you can override it directly on the test.

In the following example, the test will be marked as failed if it is not complete within 6 seconds.

```typescript
test('add two numbers', () => {
})
.timeout(6000)
```

## .disableTimeout()

Disable timeout for a given test.

```typescript
test('add two numbers', () => {
}) 
.disableTimeout()
```

## .resetTimeout()

Reset the timeout duration of the test. You can also call this method within the test callback.

```typescript
test('get payments list', (ctx) => {
  ctx.test.resetTimeout(60 * 10000)
  
  await getPaymentsList()
})
.timeout(2000)
```

## .tags()

Assign tags to a test. You can later use tags to filter and run only specific tests. All tags must start with `@`.

```typescript
test('add two numbers', () => {
})
.tags(['@slow', '@network'])
```

The method accepts an optional strategy for defining tags. The strategy can be `replace`, `append`, or `prepend`. Defaults to `replace`.

```typescript
// append tags
test('add two numbers', () => {
})
.tags(['@network'], 'append')
// prepend tags
test('add two numbers', () => {
})
.tags(['@network'], 'prepend')

```

## .retry()

Retry the test N times when it fails. The default value is 0.

```typescript
test('add two numbers', () => {
}) 
.retry(3)
```

## .waitForDone()

You can run asynchronous operations inside the test implementation function using async/await. For example:

```typescript
test('add two numbers', async () => {
  await someAsyncOperation()
})
```
However, there can be cases when you cannot use async/await, especially when dealing with streams and events. Therefore, you can use the waitForDone method to instruct Lupa to wait until an explicit call to the done method is made. For example:

```typescript
test('add two numbers', async (ctx, done) => {
  emitter.on('someEvent', () => {
    done()
  })
})
.waitForDone()
```

## .pin()

Pin the test. When one or more tests are pinned, Lupa will execute only the pinned tests and skip all others.

```typescript
test('add two numbers', () => {
}) 
.pin()
```

## .with()

Define the dataset for the test. The dataset must be an array, and the test will execute for each item in the array.

```typescript
test('validate email')
  .with(['virk@adonisjs.com', 'foo@bar.com'])
  .run(async (ctx, email) => {
    // executed for each email    
  })
```
You can fetch the dataset lazily by defining a function.

```typescript
async function getTestEmails () {
  return ['test@test.pl', 'foo@bar.com'] 
}

test('validate email')
  .with(getTestEmails)
  .run(async (ctx, email) => {
    // executed for each email    
  })
```

## .setup()

Define the setup hook for the test.

```typescript
test('add two numbers', () => {
}) 
.setup(() => {
  console.log('setting up')
})
```

## .teardown()

Define the teardown hook for the test. The teardown hook will run after the test has been executed.

```typescript
test('add two numbers', () => {
}) 
.teardown(() => {
  console.log('tearing down')
})
```

## .options

A reference to the properties defined on the test. You can access the test instance within the test callback and hooks using the ctx.test property.

```typescript
test('add two numbers', (ctx) => {
  console.log(ctx.test.options)
})

/**
  {
    title: string
    tags: string[]
    timeout: number
    meta: {
      suite: Suite,
      group: Group,
      fileName: string
    }
    retries?: number
    executor?: TestExecutor<any, any>
    isTodo: false
  }
*/

```

## .dataset

Reference to the test dataset. This property is defined when the `test.execute` method is called.

```typescript
test('add two numbers', (ctx) => {
  console.log(ctx.test.dataset)
})
```

## .context

Reference to the test context. The context is created once per test file.

```typescript
test('add two numbers', (ctx) => {
  console.log(ctx.test.context === ctx)
})
```

## .isPinned

A property to know if the test is pinned using the pin method.

```typescript
test('add two numbers', (ctx) => {
  console.log(ctx.test.isPinned)
})
```
