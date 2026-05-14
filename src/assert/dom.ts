import type { Assert } from './assert.js'
import type { SemanticDomOptions } from './types.js'
import { normalizeDom } from './semantic_dom.js'

/**
 * DOM-specific assertion methods
 */
export class AssertDom {
  #assert: Assert

  constructor(assertInstance: Assert) {
    this.#assert = assertInstance
  }

  /**
   * Asserts that an element contains the specified text content.
   * Traverses all child nodes to extract text content, trims whitespace,
   * and checks for substring inclusion.
   *
   * @param element The DOM element to check
   * @param text The text string expected to be contained
   * @param message - Optional message to display when the assertion fails
   */
  hasText(element: Element, text: string, message?: string) {
    const actualText = element.textContent?.trim() || ''
    this.#assert.evaluate(actualText.includes(text), message || `expected element to contain text '${text}'`, {
      actual: actualText,
      expected: text,
      operator: 'contains',
      showDiff: true,
    })
  }

  /**
   * Asserts that an element has the specified class name.
   *
   * @param element The DOM element to check
   * @param className The expected class name
   * @param message - Optional message to display when the assertion fails
   */
  hasClass(element: Element, className: string, message?: string) {
    const hasClass = element.classList.contains(className)
    this.#assert.evaluate(hasClass, message || `expected element to have class '${className}'`, {
      actual: Array.from(element.classList).join(' '),
      expected: className,
      operator: 'includes',
      showDiff: false,
    })
  }

  /**
   * Asserts that an element has a specific attribute. If the `value` argument
   * is provided, it will also assert that the attribute equals that value.
   *
   * @param element The DOM element to check
   * @param name The attribute name
   * @param value Optional expected value of the attribute
   * @param message - Optional message to display when the assertion fails
   */
  hasAttribute(element: Element, name: string, value?: string, message?: string) {
    const hasAttr = element.hasAttribute(name)
    const actualValue = element.getAttribute(name)

    if (value === undefined) {
      this.#assert.evaluate(hasAttr, message || `expected element to have attribute '${name}'`, {
        actual: hasAttr ? name : null,
        expected: name,
        operator: 'hasAttribute',
        showDiff: false,
      })
    } else {
      this.#assert.evaluate(
        hasAttr && actualValue === value,
        message || `expected element to have attribute '${name}' with value '${value}'`,
        {
          actual: actualValue,
          expected: value,
          operator: 'strictEqual',
          showDiff: true,
        }
      )
    }
  }

  /**
   * Asserts that an element is visible in the DOM.
   * Visibility is determined by offsetParent (for layout visibility) or
   * having getBoundingClientRect dimensions.
   * Note: This does not account for opacity: 0 or visibility: hidden.
   *
   * @param element The DOM element to check
   * @param message - Optional message to display when the assertion fails
   */
  isVisible(element: HTMLElement, message?: string) {
    const isVisible = !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length)
    this.#assert.evaluate(isVisible, message || 'expected element to be visible', {
      actual: isVisible ? 'visible' : 'hidden',
      expected: 'visible',
      operator: 'isVisible',
      showDiff: false,
    })
  }

  /**
   * Asserts that an element is currently focused (i.e. document.activeElement).
   *
   * @param element The DOM element to check
   * @param message - Optional message to display when the assertion fails
   */
  isFocused(element: Element, message?: string) {
    const active = element.ownerDocument?.activeElement
    const isFocused = active === element
    this.#assert.evaluate(isFocused, message || 'expected element to be focused', {
      actual: active ? `<${active.tagName.toLowerCase()}>` : 'none',
      expected: `<${element.tagName.toLowerCase()}>`,
      operator: 'strictEqual',
      showDiff: false,
    })
  }

  /**
   * Asserts that an element has the specified tag name (case-insensitive).
   *
   * @param element The DOM element to check
   * @param tag The expected tag name (e.g. 'div', 'button')
   * @param message - Optional message to display when the assertion fails
   */
  hasTagName(element: Element, tag: string, message?: string) {
    const actualTag = element.tagName.toLowerCase()
    const expectedTag = tag.toLowerCase()
    this.#assert.evaluate(actualTag === expectedTag, message || `expected element to have tag name '${expectedTag}'`, {
      actual: actualTag,
      expected: expectedTag,
      operator: 'strictEqual',
      showDiff: false,
    })
  }

  /**
   * Asserts that an element has the specified computed style property and value.
   *
   * @param element The DOM element to check
   * @param property The CSS property name (e.g. 'color', 'background-color')
   * @param value The expected computed style value
   * @param message - Optional message to display when the assertion fails
   */
  hasStyle(element: Element, property: string, value: string, message?: string) {
    const computedStyle = window.getComputedStyle(element)
    const actualValue = computedStyle.getPropertyValue(property)
    this.#assert.evaluate(
      actualValue === value,
      message || `expected element to have style '${property}' with value '${value}'`,
      {
        actual: actualValue,
        expected: value,
        operator: 'strictEqual',
        showDiff: false,
      }
    )
  }

  /**
   * Asserts that an element's outer DOM matches the expected HTML string semantically.
   *
   * See {@link SemanticDomOptions} for options on how to control the comparison.
   *
   * @param element - The element whose DOM should be compared
   * @param expectedHtml - The expected HTML string
   * @param options - Optional options to control the comparison
   * @param message - Optional message to display when the assertion fails
   */
  equal(element: Element, expectedHtml: string, options?: SemanticDomOptions, message?: string) {
    const actual = normalizeDom(element.outerHTML, options)
    const expected = normalizeDom(expectedHtml, options)
    this.#assert.evaluate(actual === expected, message || 'expected DOM to semantically equal the provided HTML', {
      actual,
      expected,
      operator: 'strictEqual',
      showDiff: true,
    })
  }

  /**
   * Asserts that an element's outer DOM does NOT match the expected HTML string semantically.
   *
   * @param element - The element whose DOM should be compared
   * @param expectedHtml - The expected HTML string
   * @param options - Optional options to control the comparison
   * @param message - Optional message to display when the assertion fails
   */
  notEqual(element: Element, expectedHtml: string, options?: SemanticDomOptions, message?: string) {
    const actual = normalizeDom(element.outerHTML, options)
    const expected = normalizeDom(expectedHtml, options)
    this.#assert.evaluate(
      actual !== expected,
      message || 'expected DOM to differ from the provided HTML, but they were semantically identical',
      {
        actual,
        expected,
        operator: 'notStrictEqual',
        // No diff is shown for negative assertions because the values are identical when the assertion fails.
        showDiff: false,
      }
    )
  }

  /**
   * Asserts that an element's Light DOM (innerHTML) matches the expected HTML string semantically.
   *
   * @param element - The element whose DOM should be compared
   * @param expectedHtml - The expected HTML string
   * @param options - Optional options to control the comparison
   * @param message - Optional message to display when the assertion fails
   */
  lightEqual(element: Element, expectedHtml: string, options?: SemanticDomOptions, message?: string) {
    const actual = normalizeDom(element.innerHTML, options)
    const expected = normalizeDom(expectedHtml, options)
    this.#assert.evaluate(
      actual === expected,
      message || 'expected Light DOM to semantically equal the provided HTML',
      {
        actual,
        expected,
        operator: 'strictEqual',
        showDiff: true,
      }
    )
  }

  /**
   * Asserts that an element's Light DOM (innerHTML) does NOT match the expected HTML string semantically.
   *
   * @param element - The element whose DOM should be compared
   * @param expectedHtml - The expected HTML string
   * @param options - Optional options to control the comparison
   * @param message - Optional message to display when the assertion fails
   */
  notLightEqual(element: Element, expectedHtml: string, options?: SemanticDomOptions, message?: string) {
    const actual = normalizeDom(element.innerHTML, options)
    const expected = normalizeDom(expectedHtml, options)
    this.#assert.evaluate(
      actual !== expected,
      message || 'expected Light DOM to differ from the provided HTML, but they were semantically identical',
      {
        actual,
        expected,
        operator: 'notStrictEqual',
        // No diff is shown for negative assertions because the values are identical when the assertion fails.
        showDiff: false,
      }
    )
  }

  /**
   * Asserts that an element's Shadow DOM matches the expected HTML string semantically.
   *
   * @param element - The element whose DOM should be compared
   * @param expectedHtml - The expected HTML string
   * @param options - Optional options to control the comparison
   * @param message - Optional message to display when the assertion fails
   */
  shadowEqual(element: Element, expectedHtml: string, options?: SemanticDomOptions, message?: string) {
    const actual = normalizeDom(element.shadowRoot?.innerHTML || '', options)
    const expected = normalizeDom(expectedHtml, options)
    this.#assert.evaluate(
      actual === expected,
      message || 'expected Shadow DOM to semantically equal the provided HTML',
      {
        actual,
        expected,
        operator: 'strictEqual',
        showDiff: true,
      }
    )
  }

  /**
   * Asserts that an element's Shadow DOM does NOT match the expected HTML string semantically.
   *
   * @param element - The element whose DOM should be compared
   * @param expectedHtml - The expected HTML string
   * @param options - Optional options to control the comparison
   * @param message - Optional message to display when the assertion fails
   */
  notShadowEqual(element: Element, expectedHtml: string, options?: SemanticDomOptions, message?: string) {
    const actual = normalizeDom(element.shadowRoot?.innerHTML || '', options)
    const expected = normalizeDom(expectedHtml, options)
    this.#assert.evaluate(
      actual !== expected,
      message || 'expected Shadow DOM to differ from the provided HTML, but they were semantically identical',
      {
        actual,
        expected,
        operator: 'notStrictEqual',
        // No diff is shown for negative assertions because the values are identical when the assertion fails.
        showDiff: false,
      }
    )
  }
}
