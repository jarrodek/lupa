# Lupa 🔎

**Lupa** is a lightning-fast, Vite-powered browser testing framework specifically designed for testing Web Components and modern web interfaces. 

It runs your tests natively in real browsers (via Playwright) while leveraging Vite's incredibly fast module graph, Hot Module Replacement (HMR), and build pipeline. It completely bridges the gap between modern Node.js testing ergonomics and genuine browser DOM execution.

---

## Why Lupa?

When building Web Components, you need a test runner that executes code in a real browser environment to correctly test Shadow DOM, custom element lifecycles, and complex CSS. 

For years, tools like [`@web/test-runner`](https://modern-web.dev/docs/test-runner/overview/) and the broader `@open-wc/testing` ecosystem have been the gold standard for this. They are fantastic projects that paved the way for modern DOM testing. However, as the ecosystem has rapidly evolved around tools like Vite, those tools have started to fall a little behind in terms of developer experience, speed, and modern tooling integration.

Lupa was built to be the spiritual successor for modern, Vite-based workflows.

**With Lupa, you get:**
- **Native Browser Execution:** Tests run inside actual browsers (Chromium, Firefox, WebKit) via Playwright. No DOM mocks.
- **Lightning Fast:** Uses Vite as the dev server. No bundling required, resulting in instant boot times.
- **Intelligent Watch Mode:** A dependency-aware incremental test watcher. Change a component, and Lupa instantly re-runs *only* the tests that import it.
- **Interactive Debugging:** Focus on a single test file and press `d` to pop open a headed browser with Chrome DevTools already open and attached.

## The Japa Connection

If the API looks familiar, that's because Lupa is heavily inspired by and based on the incredible [Japa framework](https://japa.dev/). 

A lot of Lupa's core logic, CLI parsing, and reporter architecture was directly taken from their great work. However, Lupa is inherently different. While we strive to keep the API consistent with Japa, our execution environment (the browser) and our primary goals (DOM testing) mean there are some architectural and API differences tailored specifically for front-end developers.

## Quick Start Overview

Lupa avoids injecting a massive global CLI tool into your project. Instead, tests are configured and executed via a custom script (typically `bin/test.ts`), giving you total control over the environment.

### 1. The Execution Script

Create a `bin/test.ts` file to configure and run your suite:

```typescript
import { configure, processCLIArgs, run } from '@jarrodek/lupa/runner'
import { spec } from '@jarrodek/lupa/reporters'

processCLIArgs(process.argv.slice(2))

configure({
  files: ['tests/**/*.spec.ts'],
  reporters: {
    activated: ['spec'],
    list: [spec()],
  },
})

run().catch(console.error)
```

### 2. Writing a Test

Write your tests using the beautiful, explicit Japa-style API alongside Lupa's built-in Lit fixtures:

```typescript
// tests/button.spec.ts
import { test, fixture, html } from '@jarrodek/lupa/testing'
import '../src/components/my-button.js'

test.group('My Button Component', () => {
  test('renders text correctly', async ({ assert }) => {
    // Renders the element to the DOM and waits for the next animation frame
    const el = await fixture(html`<my-button>Click Me</my-button>`)
    
    // Perform your assertions
    assert.include(el.textContent, 'Click Me')
    
    // The fixture is automatically unmounted and cleaned up after the test!
  })
})
```

### 3. Running the Tests

Execute your test script using a transpiler like `tsx`:

```bash
npx tsx bin/test.ts
```

For the ultimate developer experience, run it in **Watch Mode**:

```bash
npx tsx bin/test.ts --watch
```

## Contributing

Lupa is an open-source project and we would absolutely love your help making it the best browser testing framework available! 

If you have ideas, find bugs, or want to contribute new features (like reporters, assert plugins, or execution optimizations), please feel free to open an issue or submit a Pull Request.

## License

Apache-2.0
