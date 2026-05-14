# Installation and Usage

Lupa requires Node.js >= 22.0.0 and works seamlessly with the ES module system.

## Installation

Install the `@jarrodek/lupa` package as a development dependency using your preferred package manager:

```bash
npm install --save-dev @jarrodek/lupa
```

## Configuring Lupa

Because Lupa avoids heavy CLI wrappers, you configure and run your tests via a simple entry point file. This allows you to easily inject configuration, environment variables, or other backend setup code before your tests boot.

Create a `bin/test.ts` file in the root of your project:

```ts
import { configure, processCLIArgs, run } from '@jarrodek/lupa/runner'
import type { Assert } from '@jarrodek/lupa/assert'
import '@jarrodek/lupa/testing'

// 1. Process command line arguments
processCLIArgs(process.argv.slice(2))

// 2. Configure Lupa
configure({
  files: ['tests/browser/**/*.spec.ts'],
  testPlugins: ['@jarrodek/lupa/assert'],
})

// 3. Run the orchestrator
run().catch((error) => {
  console.error(error)
  process.exit(1)
})

// 4. Augment TestContext for strong typing
declare module '@jarrodek/lupa/testing' {
  interface TestContext {
    assert: Assert
  }
}
```

### `processCLIArgs`
The `processCLIArgs` method intercepts command line arguments (like `--watch` or `--reporters`) and automatically tweaks the Lupa configuration.

### `configure`
The `configure` method sets up the Lupa runner. You must provide the `files` array (glob patterns pointing to your tests) and any required `testPlugins`.

### `run`
The `run` method boots the Vite server, spins up Playwright, and executes your tests in the browser. 

## Writing your first test

As per your configuration above, your tests should be placed in `tests/browser/` and end with `.spec.ts`.

Let's create our first test:

```ts
import { test, fixture, html } from '@jarrodek/lupa/testing'

test('renders text correctly', async ({ assert }) => {
  const el = await fixture(html`<div>Hello World</div>`)
  assert.equal(el.textContent, 'Hello World')
})
```

The test callback function receives a `TestContext`. We destructure `assert` from this context to run expectations against the DOM.

## Creating test groups

You can logically group related tests together using the `test.group` method. Groups allow you to define lifecycle hooks that run before or after every test in the group.

```ts
import { test, fixture, html } from '@jarrodek/lupa/testing'

test.group('My Component', (group) => {
  
  group.setup(() => {
    // Runs once before all tests in this group
  })

  test('button click works', async ({ assert }) => {
    const btn = await fixture(html`<button>Click me</button>`)
    assert.equal(btn.textContent, 'Click me')
  })
})
```

## Running tests

You can run your tests by simply executing your entry point file using Node or `tsx`!

```bash
npx tsx bin/test.ts
```

Lupa's orchestrator also acts as a CLI application, allowing you to pass standard arguments:

```bash
# Run in watch mode with visual DevTools
npx tsx bin/test.ts --watch

# Use a specific Vite config
npx tsx bin/test.ts --vite-config=vite.test.config.ts

# See all available options
npx tsx bin/test.ts --help
```

## Writing assertions

Lupa comes bundled with a powerful assertion plugin built on top of Chai. 

Since you registered the `@jarrodek/lupa/assert` plugin in your `bin/test.ts` file and augmented the `TestContext` interface, the `assert` object is automatically typed and available in every test context.

```ts
test('testing values', ({ assert }) => {
  assert.equal(2 + 2, 4)
  assert.deepEqual({ a: 1 }, { a: 1 })
  assert.isTrue(true)
  assert.match('hello world', /world/)
})
```
