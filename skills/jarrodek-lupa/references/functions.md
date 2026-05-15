# Functions

## Configuration

### `configure`
Configure the Lupa test runner.

This is the primary entry point for configuring your test environment.
It hydrates the provided configuration options and merges them with parsed CLI arguments.

You must call this function before calling run.
```ts
configure(options: Config): void
```
**Parameters:**
- `options: Config` — The configuration object. You must provide either a top-level `files` array
                 or a `suites` array to define your test files.
**Basic Configuration**
```ts
import { configure, run } from '@jarrodek/lupa/runner'

configure({
  files: ['tests/**/*.spec.ts'],
  testPlugins: ['@jarrodek/lupa/assert']
})

run()
```
**Using Test Suites**
```ts
import { configure, run } from '@jarrodek/lupa/runner'

configure({
  suites: [
    { name: 'components', files: ['tests/components/**/*.spec.ts'] },
    { name: 'e2e', files: ['tests/e2e/**/*.spec.ts'] }
  ],
  timeout: 5000,
  forceExit: true
})

run()
```

## runner

### `processCLIArgs`
Process command line arguments. Later the parsed output
will be used by Lupa to compute the configuration
```ts
processCLIArgs(argv: string[]): void
```
**Parameters:**
- `argv: string[]` — The command line arguments to parse.
```ts
import { processCLIArgs, configure, run } from '@jarrodek/lupa/runner'

processCLIArgs(['--spec', 'tests/**/*.spec.ts'])
configure({})

run()
```

## Execution

### `run`
Run the test suite.

This is the primary entry point for running your tests. It uses the configuration
provided by configure and the CLI arguments parsed by processCLIArgs.
```ts
run(): Promise<void>
```
**Returns:** `Promise<void>` — A Promise that resolves when the test run is complete,
         or rejects if the test run encounters an error (e.g., uncaught exceptions).
**Throws:** Throws if configuration is missing or invalid.
```ts
import { configure, run } from '@jarrodek/lupa/runner'

configure({
  files: ['tests/**/*.spec.ts'],
  forceExit: true
})

run()
```

## testing

### `test`
Define a new test.

The test callback receives a TestContext which provides
access to assertions, fixtures, and other test utilities.
```ts
test(title: string, callback?: (context: TestContext) => void | Promise<void>): Test<undefined>
```
**Parameters:**
- `title: string` — The name of the test.
- `callback: (context: TestContext) => void | Promise<void>` (optional) — The function containing the test logic. Can be synchronous or asynchronous.
**Returns:** `Test<undefined>`
```ts
test('math works', ({ assert }) => {
  assert.equal(1 + 1, 2)
})
```

### `aTimeout`
Returns a promise that resolves after the specified number of milliseconds.
```ts
aTimeout(ms: number): Promise<void>
```
**Parameters:**
- `ms: number` — Number of milliseconds to wait
**Returns:** `Promise<void>` — Promise that resolves after the specified number of milliseconds
```typescript
await aTimeout(1000)
```

### `nextFrame`
Returns a promise that resolves after the next browser animation frame.
```ts
nextFrame(): Promise<void>
```
**Returns:** `Promise<void>` — Promise that resolves after the next browser animation frame
```typescript
await nextFrame()
```

### `oneEvent`
Returns a promise that resolves when the specified event is dispatched on the element.
```ts
oneEvent(element: Element | Window, eventName: string): Promise<Event>
```
**Parameters:**
- `element: Element | Window` — Element to listen for the event on
- `eventName: string` — Name of the event to wait for
**Returns:** `Promise<Event>` — Promise that resolves when the specified event is dispatched on the element
```typescript
await oneEvent(element, 'click')
```

### `waitUntil`
Polls the condition function until it returns true or the timeout is reached.

If the condition function throws an error, the error is suppressed and the polling
continues until the condition returns true or the timeout expires. The `interval`
option determines the delay between polling attempts (default is 50ms), and the
`timeout` option determines the maximum total duration before the promise rejects
with the provided `message` (default is 1000ms).
```ts
waitUntil(condition: () => boolean | Promise<boolean>, message: string, options: { timeout?: number; interval?: number }): Promise<void>
```
**Parameters:**
- `condition: () => boolean | Promise<boolean>` — Function to poll
- `message: string` — default: `'waitUntil timed out'` — Message to use when throwing an error
- `options: { timeout?: number; interval?: number }` — default: `{}` — Options for waitUntil
**Returns:** `Promise<void>` — Promise that resolves when the condition is met
```typescript
await waitUntil(() => element.textContent === 'Hello')
```

## DOM

### `fixture`
Renders a HTML string or a Lit template into a dedicated fixture container and mounts it to the DOM.

The fixture is automatically cleaned up and removed from the DOM
when the current test or group finishes.
```ts
fixture<T>(template: TemplateTypes): Promise<T>
```
**Parameters:**
- `template: TemplateTypes` — A string of HTML or a `lit-html` template created using the `html` tag.
**Returns:** `Promise<T>` — A promise that resolves to the rendered DOM Element.
```ts
test('renders lit template', async ({ assert }) => {
  const el = await fixture<HTMLButtonElement>(html`<button>Click me</button>`)
  assert.equal(el.textContent, 'Click me')
})

test('renders string template', async ({ assert }) => {
  const el = await fixture<HTMLDivElement>('<div id="test"></div>')
  assert.equal(el.id, 'test')
})
```
