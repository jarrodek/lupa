import { test, fixture, html } from '../../../src/testing/api.js'

test.group('Accessibility (axe-core)', () => {
  test('isAccessible passes for accessible content', async ({ assert }) => {
    const el = await fixture(html`
      <main>
        <h1>Main Heading</h1>
        <button aria-label="Close">X</button>
      </main>
    `)
    await assert.isAccessible(el)
  })

  test('isAccessible fails for inaccessible content', async ({ assert }) => {
    // Buttons must have discernible text
    const el = await fixture(html`<button></button>`)

    let error: Error | undefined
    try {
      await assert.isAccessible(el)
    } catch (e: any) {
      error = e
    }

    assert.isDefined(error)
    assert.include(error!.message, 'Accessibility violations found')
    assert.include(error!.message, 'button-name')
  })

  test('intentionally failing', async ({ assert }) => {
    // Buttons must have discernible text
    const el = await fixture(html`<button></button>`)
    await assert.isAccessible(el)
  }).skip(true, 'Skipping intentionally failing test')
})
