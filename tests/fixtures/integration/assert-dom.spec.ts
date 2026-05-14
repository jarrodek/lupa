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

  test('equal', async ({ assert }) => {
    const el = await fixture(html`<div class="foo" id="bar">Hello World</div>`)
    assert.dom.equal(el, '<div class="foo" id="bar">Hello World</div>')
    assert.throws(() => assert.dom.equal(el, '<div class="foo">Hello World</div>'))
  })

  test('notEqual', async ({ assert }) => {
    const el = await fixture(html`<div class="foo">Hello</div>`)
    assert.dom.notEqual(el, '<div>Hello</div>')
    assert.throws(() => assert.dom.notEqual(el, '<div class="foo">Hello</div>'))
  })

  test('lightEqual', async ({ assert }) => {
    const el = await fixture(html`<div><p>Light</p></div>`)
    assert.dom.lightEqual(el, '<p>Light</p>')
    assert.throws(() => assert.dom.lightEqual(el, '<div><p>Light</p></div>'))
  })

  test('notLightEqual', async ({ assert }) => {
    const el = await fixture(html`<div><p>Light</p></div>`)
    assert.dom.notLightEqual(el, '<p>Dark</p>')
    assert.throws(() => assert.dom.notLightEqual(el, '<p>Light</p>'))
  })

  test('shadowEqual', async ({ assert }) => {
    class MyEl extends HTMLElement {
      constructor() {
        super()
        this.attachShadow({ mode: 'open' })
      }
      connectedCallback() {
        this.shadowRoot!.innerHTML = '<p>Shadow</p>'
      }
    }
    if (!customElements.get('my-test-el')) {
      customElements.define('my-test-el', MyEl)
    }
    const el = await fixture(html`<my-test-el></my-test-el>`)
    assert.dom.shadowEqual(el, '<p>Shadow</p>')
    assert.dom.notShadowEqual(el, '<p>Light</p>')
  })

  test('ignoredAttributes option', async ({ assert }) => {
    const el = await fixture(html`<div class="foo" data-id="123"></div>`)
    assert.dom.equal(el, '<div></div>', { ignoredAttributes: '*' })
    assert.dom.equal(el, '<div data-id="123"></div>', { ignoredAttributes: ['class'] })
    assert.dom.equal(el, '<div data-id="123"></div>', { ignoredAttributes: [{ tags: ['div'], attributes: ['class'] }] })
    assert.throws(() =>
      assert.dom.equal(el, '<div data-id="123"></div>', {
        ignoredAttributes: [{ tags: ['span'], attributes: ['class'] }],
      })
    )
  })

  test('ignoreAttributeValueFor option', async ({ assert }) => {
    const el = await fixture(html`<div data-id="123" aria-label="test"></div>`)
    assert.dom.equal(el, '<div data-id="456" aria-label="test"></div>', { ignoreAttributeValueFor: ['data-id'] })
    assert.dom.equal(el, '<div data-id="456" aria-label="test"></div>', {
      ignoreAttributeValueFor: [{ tags: ['div'], attributes: ['data-id'] }],
    })
  })

  test('ignoreTags option', async ({ assert }) => {
    const el = await fixture(
      html`<div>
        <span class="foo">bar</span>
        <p>baz</p>
      </div>`
    )
    assert.dom.equal(el, '<div><p>baz</p></div>', { ignoreTags: ['span'] })
  })

  test('ignoreChildren option', async ({ assert }) => {
    const el = await fixture(
      html`<div>
        <p class="foo">bar</p>
        <p class="baz">qux</p>
      </div>`
    )
    assert.dom.equal(el, '<div><p class="baz">qux</p></div>', { ignoreChildren: ['.foo'] })
  })

  test('ignoreTextContent option', async ({ assert }) => {
    const el = await fixture(html`<div><p>Foo</p></div>`)
    assert.dom.equal(el, '<div><p>Bar</p></div>', { ignoreTextContent: true })
    assert.dom.equal(el, '<div><p></p></div>', { ignoreTextContent: true })
  })
})
