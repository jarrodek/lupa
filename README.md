# Lupa 🔎

Lupa is a lightning-fast, Vite-powered browser testing framework for Web Components with an elegant, Japa-inspired API.

Lupa runs your tests natively in real browsers (via Playwright) while leveraging Vite's incredibly fast module graph, HMR, and build pipeline. It completely bridges the gap between modern Node.js testing ergonomics and genuine browser DOM execution.

## Features

- **Native Browser Execution:** Tests run inside actual browsers (Chromium, Firefox, WebKit) for accurate DOM behavior.
- **Lightning Fast:** Uses Vite as the dev server. No bundling required.
- **Japa API:** Brings the beautiful, modular, and explicit API of [Japa](https://japa.dev/) to the browser.
- **Intelligent Watch Mode:** Dependency-aware incremental test re-runs. If you change a component, only the tests that import it are re-run.
- **Focus & Debug Modes:** Interactively focus on a single test file and instantly pop open a headed browser for native DevTools debugging.
- **Built-in Fixtures:** Effortlessly mount Lit templates (`html`) to the DOM, with automatic clean-up between tests.
- **TypeScript First:** First-class TypeScript support with accurate, source-mapped stack traces.

## Usage

Lupa tests are meant to be configured and run via a custom execution script (typically `bin/test.ts`). There is no global CLI.

### 1. Create a `bin/test.ts` file

```typescript
import { configure, processCLIArgs, run } from '@jarrodek/lupa/runner'
import { spec } from '@jarrodek/lupa/reporters'

// 1. Process any command line arguments (e.g. --watch, --timeout)
processCLIArgs(process.argv.slice(2))

// 2. Configure the runner
configure({
  cwd: import.meta.dirname,
  files: ['../tests/**/*.spec.ts'],
  timeout: 5000,
  reporters: {
    activated: ['spec'],
    list: [spec()],
  },
})

// 3. Execute!
run().catch((error) => {
  console.error(error)
  process.exit(1)
})
```

### 2. Write your tests

```typescript
// tests/button.spec.ts
import { test, fixture, html } from '@jarrodek/lupa/testing'
import '../src/components/my-button.js' // Import your component definition

test.group('My Button Component', () => {
  test('renders correctly', async ({ assert }) => {
    // Renders the element to the DOM and waits for it to paint
    const el = await fixture(html`<my-button>Click Me</my-button>`)
    
    // Test logic here
    assert.include(el.textContent, 'Click Me')
    
    // The fixture is automatically cleaned up after the test!
  })
})
```

### 3. Run the tests

Execute your test script using standard Node.js (if compiling to JS) or via a transpiler like `tsx`:

```bash
# Running compiled JavaScript natively
node bin/test.js

# Or, running TypeScript directly
npx tsx bin/test.ts
```

#### Watch Mode

Lupa comes with an interactive, dependency-aware watch mode. Pass the `--watch` flag to start it:

```bash
npx tsx bin/test.ts --watch
```

* **Targeted Re-runs:** When you modify a source file, Lupa uses Vite's module graph to find exactly which test files depend on it, and *only* re-runs those tests.
* **Focus Mode (`f`):** Press `f` to pick a single test file to focus on. All other tests will be hidden.
* **Debug Mode (`d`):** While focused on a file, press `d` to instantly open a headed browser window. You can open DevTools and set breakpoints directly in your source code.

## License

Apache-2.0
