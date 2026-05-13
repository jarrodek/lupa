---
name: lupa-testing
description: Guidelines and instructions for writing tests using the Lupa browser testing framework for Web Components and DOM elements. Use this skill whenever instructed to write tests in a repository that uses Lupa.
---

# Lupa Testing Guidelines

When writing tests for projects using the Lupa framework, follow these critical instructions to ensure your code is idiomatic and functions correctly in the native browser environment.

## 1. Core Imports
Always import the core testing utilities from `@jarrodek/lupa/testing`. Do not import from `@japa/runner` or other external test libraries like Jest, Vitest, or Playwright directly.

```typescript
import { test, fixture, html } from '@jarrodek/lupa/testing'
// Also import the component you are testing!
import '../src/components/my-component.js'
```

## 2. Test Structure
Organize your tests using `test.group` and `test` blocks. Every test that requires DOM interaction must be `async` to await the `fixture` rendering and any accessibility assertions.

```typescript
test.group('MyComponent', () => {
  test('renders with default state', async ({ assert }) => {
    // Test logic goes here
  })
})
```

## 3. DOM Fixtures
Never use `document.createElement` manually unless absolutely necessary. Instead, use Lupa's `fixture()` function combined with the `html` tag literal. This ensures the component is properly mounted to the DOM, paints successfully, and is automatically cleaned up after the test completes.

```typescript
// Correct
const el = await fixture(html`<my-component title="Hello"></my-component>`)

// Incorrect
const el = document.createElement('my-component')
document.body.appendChild(el)
```

## 4. Assertions
Lupa uses a Chai-based assertion library available on the test context (`{ assert }`).

### Standard Assertions
Use standard Chai BDD/TDD assertions for basic primitives:
- `assert.equal(actual, expected)`
- `assert.isTrue(actual)`
- `assert.deepEqual(actual, expected)`

### DOM Assertions
Use the specialized `assert.dom.*` namespace when checking DOM element states:
- `assert.dom.hasText(element, 'Expected Text')`
- `assert.dom.hasClass(element, 'active')`
- `assert.dom.hasAttribute(element, 'aria-hidden', 'true')`
- `assert.dom.isVisible(element)`
- `assert.dom.isFocused(element)`
- `assert.dom.hasTagName(element, 'my-component')`

### Accessibility Assertions
Always prioritize writing an accessibility test for new components using the asynchronous `assert.isAccessible()` method:

```typescript
test('meets accessibility guidelines', async ({ assert }) => {
  const el = await fixture(html`<my-component></my-component>`)
  // MUST be awaited!
  await assert.isAccessible(el)
})
```

## 5. Event Testing
When testing events or interactions, trigger them directly on the DOM element and `await` the next frame or microtask if necessary before asserting.

```typescript
test('fires click event', async ({ assert }, done) => {
  const el = await fixture(html`<my-button></my-button>`)
  
  el.addEventListener('custom-click', () => {
    assert.isTrue(true)
    done()
  })

  el.click()
}).waitsForDone()
```
