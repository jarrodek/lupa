import type { Assert } from './assert.js'

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
}
