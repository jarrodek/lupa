import { test, fixture, html } from '../../../src/testing/api.js'

test.group('Assert.dom', () => {
  test('hasText', async ({ assert }) => {
    const el = await fixture(html`<div>Hello World</div>`)
    assert.dom.hasText(el, 'Hello')
    assert.dom.hasText(el, 'World')
    assert.throws(() => assert.dom.hasText(el, 'Goodbye'))
  })

  test('hasClass', async ({ assert }) => {
    const el = await fixture(html`<div class="foo bar"></div>`)
    assert.dom.hasClass(el, 'foo')
    assert.dom.hasClass(el, 'bar')
    assert.throws(() => assert.dom.hasClass(el, 'baz'))
  })

  test('hasAttribute', async ({ assert }) => {
    const el = await fixture(html`<input type="text" required data-id="123" />`)
    assert.dom.hasAttribute(el, 'required')
    assert.dom.hasAttribute(el, 'data-id', '123')
    assert.throws(() => assert.dom.hasAttribute(el, 'disabled'))
    assert.throws(() => assert.dom.hasAttribute(el, 'data-id', '456'))
  })

  test('isVisible', async ({ assert }) => {
    const el1 = await fixture(html`<div style="width: 10px; height: 10px;">Visible</div>`)
    const el2 = await fixture(html`<div style="display: none;">Hidden</div>`)

    assert.dom.isVisible(el1 as HTMLElement)
    assert.throws(() => assert.dom.isVisible(el2 as HTMLElement))
  })

  test('isFocused', async ({ assert }) => {
    const el = await fixture(html`<input type="text" />`)

    assert.throws(() => assert.dom.isFocused(el))
    ;(el as HTMLElement).focus()
    assert.dom.isFocused(el)
  })

  test('hasTagName', async ({ assert }) => {
    const el = await fixture(html`<section></section>`)
    assert.dom.hasTagName(el, 'section')
    assert.dom.hasTagName(el, 'SECTION')
    assert.throws(() => assert.dom.hasTagName(el, 'div'))
  })
})
