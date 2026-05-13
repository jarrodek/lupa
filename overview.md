# Lupa: AI Agent Implementation Guide

This document serves as the foundational knowledge base for implementing the **Lupa** testing framework. Read this carefully to understand the product vision, the core problem it solves, and the strict architectural constraints before writing any code.

## 1. WHAT are we building?

We are building **Lupa**, a modern, TypeScript-first, browser-native testing framework specifically designed for Web Components. 

It combines the elegant, declarative Developer Experience (DX) of modern Node runners (specifically inspired by Japa testing framework for node) with the rendering accuracy of a real browser DOM. It works with plain JavaScript files, as well as TypeScript files.

**Key deliverables for this project:**

1. A zero-config CLI orchestrator with reasonable defaults, but allowing full configuration of the test runner, Vite, and Playwright.
2. A Japa and @web/test-runner inspired, chainable testing API (`test.group`, `test`, `fixture`).
3. Rich, modern terminal reporting with actionable error states.

## 2. WHY are we building it? (The Problem)

Testing Web Components is currently a compromised experience for developers. We are building Lupa to solve two distinct failures in the current ecosystem:

* **The Node.js Runner Problem:** Modern, high-DX tools (Japa, Vitest, Jest) run in Node.js. Node lacks a real DOM. To test Web Components, developers must use heavy, imperfect simulators (like JSDOM or happy-dom) which often fail on complex Custom Element lifecycles, CSS properties, or Shadow DOM encapsulations.
* **The Browser Runner Problem:** Tools that *do* run in the browser (like `@web/test-runner`) feel outdated. They suffer from slow cold starts, their APIs are legacy, and their terminal output is noisy, non-interactive, and difficult to parse.

**The Mission:** Give developers the blazing speed and beautiful CLI experience of Japa, but execute the code natively in a real Chromium/WebKit instance so Web Components behave perfectly without simulation.

## 3. HOW does it work? (The Architecture)
To achieve this, Lupa must use an **inverted execution architecture**. 
**CRITICAL CONSTRAINT:** The user's test files are NOT executed by Node.js. They are treated as browser modules.

### The System Flow:
1. **The Orchestrator (Node.js):** The developer runs `node bin/test.js`. The Lupa CLI starts up and immediately spins up a **Vite Dev Server** programmatically.
2. **The Bundler (Vite):** Vite acts purely as the host. It resolves and bundles the developer's TypeScript test files and Web Component source code on the fly using esbuild for instant cold starts.
3. **The Sandbox (Playwright):** The Node orchestrator boots up a headless browser via Playwright. Playwright is directed to navigate to a specialized HTML harness page served by Vite (e.g., `http://localhost:3000/__lupa__/runner.html`).
4. **The Execution (Browser):** The core testing framework logic (the code powering `test`, `assert`, `fixture`) is injected into this browser page alongside the compiled test files. The tests execute natively in the browser's V8 engine. Because they are in a real browser environment, `customElements.define()` and standard DOM APIs work flawlessly without polyfills.
5. **The Telemetry Bridge (WebSocket):** As tests execute in the browser, the runner does *not* log results to the browser console. Instead, it fires telemetry events (`test:start`, `assert:fail`, `suite:done`) over a WebSocket connection back to the Node CLI process.
6. **The Reporter (Node CLI):** The Node process catches these WebSocket events and drives a rich, interactive terminal UI. When a test fails, the UI should ideally print syntax-highlighted snippets of the actual HTML DOM state compared to the expected state.
7. **Focusing on a single test suite (file)**: When using interactive terminal, the user should be able to "focus" on a single test suite (a test file) and only see tests from that file. They can also open a playwright browser window to manually inspect the DOM state or debug the code.

## 4. Target API Design

### Test suite declaration

This is the vision of how the test suite will be declared:

```typescript
// tests/unit/my-component.test.ts
import { test, fixture, html } from '@jarrodek/lupa/testing'

// This import works natively because the file is executed in the browser, not Node.
import '../../src/my-component.js' 

// without groups
test('it renders the default state correctly', async ({ assert }) => {
  // Standard DOM APIs are natively available
  const el = await fixture(html`<my-component></my-component>`)
  assert.equal(el.shadowRoot.querySelector('.title').textContent, 'Hello World')
})

// with groups
test.group('My Web Component', () => {
  test('it handles user interactions seamlessly', async ({ assert }) => {
    const el = await fixture(html`<my-component active="false"></my-component>`)
    // Dispatch native events directly
    el.shadowRoot.querySelector('button').click()
    assert.isTrue(el.active)
  })
})
```

See the [Testing API](docs/testing-api.md) page for more details.

## 5. CLI Design

The developer can define a custom test runner script and execute it like a regular node script.

```shell
# Run with a specified test configuration
node bin/test.js

# TypeScript with native Node.js support
node bin/test.ts

# TypeScript with ts-exec (install the package separately)
npx @poppinss/ts-exec bin/tests.js
```

See the [CLI Design](docs/cli-design.md) page for more details.

## 6. the bin/test.js / bin/test.ts script

The developer uses the script to configure the tests.

```typescript
import { configure, processCLIArgs, run } from '@jarrodek/lupa/runner'
import { assert } from '@jarrodek/lupa/assert'

processCLIArgs(process.argv.splice(2))

configure({
  files: ['tests/**/*.spec.js'],
  plugins: [
    assert(),
    // other plugins.
  ],
})

run()
```

See the [Runner API](docs/runner-api.md) page for more details.
