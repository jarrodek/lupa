import { test, fixture, html } from '../../../src/testing/api.js'

test('fixture adds style', async ({ assert }) => {
  const el = await fixture(html`<div class="a-special-style-tag"></div>`)
  // this is only possible if the harness stylesheet is loaded
  assert.equal(getComputedStyle(el).borderRadius, '4px')
})

test('fixture adds inline style', async ({ assert }) => {
  const el = await fixture(html`<div class="a-special-inlined-style-tag"></div>`)
  // this is only possible if the harness stylesheet is loaded
  assert.equal(getComputedStyle(el).borderRadius, '8px')
})
