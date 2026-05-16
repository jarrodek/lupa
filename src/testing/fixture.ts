import { render, html as litHtml, type TemplateResult, type RenderOptions } from 'lit-html'
import { getActiveTest, getActiveExecutingGroup } from './api.js'

/**
 * Type alias for a template that can be rendered by the fixture function.
 *
 * @example
 * ```ts
 * test('renders lit template', async ({ assert }) => {
 *   const el = await fixture<HTMLButtonElement>(html`<button>Click me</button>`)
 *   assert.equal(el.textContent, 'Click me')
 * })
 *
 * test('renders string template', async ({ assert }) => {
 *   const el = await fixture<HTMLDivElement>('<div id="test"></div>')
 *   assert.equal(el.id, 'test')
 * })
 * ```
 */
export type TemplateTypes = string | ReturnType<typeof litHtml> | TemplateResult

/**
 * Options for the `fixture` function.
 */
export interface FixtureRenderOptions extends RenderOptions {
  /**
   * By default `fixture` waits for the next animation frame to ensure
   * elements are upgraded and connected. Set this to `true` to skip this wait.
   */
  noWait?: boolean
}

/**
 * Renders a HTML string or a Lit template into a dedicated fixture container and mounts it to the DOM.
 *
 * The fixture is automatically cleaned up and removed from the DOM
 * when the current test or group finishes.
 *
 * @param template - A string of HTML or a `lit-html` template created using the `html` tag.
 * @returns A promise that resolves to the rendered DOM Element.
 *
 * @category DOM
 * @useWhen Rendering templates and Custom Elements into the DOM for interaction
 * @avoidWhen Testing pure logic or functions that do not require a DOM
 *
 * @example
 * ```ts
 * test('renders lit template', async ({ assert }) => {
 *   const el = await fixture<HTMLButtonElement>(html`<button>Click me</button>`)
 *   assert.equal(el.textContent, 'Click me')
 * })
 *
 * test('renders string template', async ({ assert }) => {
 *   const el = await fixture<HTMLDivElement>('<div id="test"></div>')
 *   assert.equal(el.id, 'test')
 * })
 * ```
 */
export async function fixture<T extends Element = Element>(
  template: TemplateTypes,
  options?: FixtureRenderOptions
): Promise<T> {
  const activeTest = getActiveTest()
  const activeExecutingGroup = getActiveExecutingGroup()

  const isInsideTest = !!activeTest
  const isInsideGroup = !!activeExecutingGroup

  if (!isInsideTest && !isInsideGroup) {
    throw new Error('Cannot render fixture outside of a test or group hook')
  }

  const container = document.createElement('div')
  container.className = 'lupa-fixture'
  document.body.appendChild(container)

  if (isInsideTest) {
    // Automatically clean up the fixture when the test finishes
    activeTest?.cleanup(() => {
      container.remove()
    })
  } else if (isInsideGroup) {
    // Automatically clean up the fixture when the group finishes
    activeExecutingGroup?.teardown(() => {
      container.remove()
    })
  }

  if (typeof template === 'string') {
    container.innerHTML = template
  } else {
    render(template, container, options)
  }

  // Wait for next frame to ensure elements are upgraded and connected
  if (!options?.noWait) {
    await new Promise((resolve) => requestAnimationFrame(resolve))
  }

  return container.firstElementChild as T
}
