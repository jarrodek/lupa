# Assertions

Lupa doesn't force a specific assertion library onto you. You are free to use any browser-compatible assertion library you like (such as Chai, expect, or standard Node `assert` polyfills) simply by importing them directly into your test files.

However, Lupa does ship with an officially supported, first-party assertion plugin: `@jarrodek/lupa/assert`. It provides a clean, chainable API built on top of Chai, and seamlessly integrates with Lupa's test context.

## Installing the Assert Plugin

To use the built-in assert library, you need to register it as a test plugin inside your runner configuration.

Update your `bin/test.ts` file to include `@jarrodek/lupa/assert` in the `testPlugins` array:

```ts
import { configure, processCLIArgs, run } from '@jarrodek/lupa/runner'
import { spec } from '@jarrodek/lupa/reporters'

processCLIArgs(process.argv.slice(2))

configure({
  suites: [
    {
      name: 'unit',
      files: ['tests/**/*.test.ts'],
    },
  ],
  testPlugins: ['@jarrodek/lupa/assert'], // Register the assert plugin
  reporters: {
    activated: ['spec'],
    list: [spec()],
  },
})

run()
```

## TypeScript Configuration

Because plugins extend the base `TestContext` dynamically at runtime, TypeScript doesn't automatically know that the `assert` property exists on the context object.

To tell the TypeScript compiler about the `assert` property, you must use **Module Augmentation**. You can place this declaration directly at the bottom of your `bin/test.ts` file, or inside a dedicated `global.d.ts` file in your project.

```ts
import type { Assert } from '@jarrodek/lupa/assert'

// ... your configure() and run() logic ...

declare module '@jarrodek/lupa/testing' {
  interface TestContext {
    assert: Assert
  }
}
```

Once you've added this augmentation, your editor will provide full autocomplete and type safety for the `assert` object inside all of your tests.

## Using Assertions

With the plugin registered and TypeScript configured, the `assert` object is injected into the context of every test.

```ts
import { test } from '@jarrodek/lupa/testing'

test('validates user input', ({ assert }) => {
  const username = 'jarrodek'

  // You now have full autocomplete on the assert object!
  assert.equal(username, 'jarrodek')
  assert.isString(username)
  assert.lengthOf(username, 8)
})
```

For a comprehensive list of all available assertion methods, you can rely on your IDE's autocomplete, as the `Assert` type provides extensive JSDoc descriptions and examples for every available assertion.