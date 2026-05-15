import type { AttributeMatcher, SemanticDomOptions } from './types.js'

/**
 * Checks if an attribute should be ignored based on the configuration rules
 * @param el - The element to check
 * @param name - The name of the attribute to check
 * @param rules - The rules to use for checking
 * @returns True if the attribute should be ignored, false otherwise
 */
function matchesAttributeRule(el: Element, name: string, rules?: (string | AttributeMatcher)[] | '*'): boolean {
  if (!rules) return false
  if (rules === '*') return true

  for (const rule of rules) {
    if (typeof rule === 'string') {
      if (rule === name) return true
    } else {
      const matchesTag = rule.tags.includes(el.tagName.toLowerCase()) || rule.tags.includes('*')
      if (matchesTag && rule.attributes.includes(name)) return true
    }
  }
  return false
}

/**
 * Normalizes a DOM element or HTML string into a deterministic HTML string
 * for semantic comparison, applying all ignore rules.
 *
 * @example
 * const normalized = normalizeDom(document.body, {
 *   ignoreTextContent: true,
 *   ignoreAttributeValueFor: [
 *     {
 *       tags: ['*'],
 *       attributes: ['class', 'data-testid'],
 *     },
 *   ],
 * })
 *
 * @param html - The HTML string or DOM element to normalize
 * @param options - Optional options to control the normalization process
 *
 * @returns The normalized HTML string
 */
export function normalizeDom(html: string | Element | DocumentFragment, options: SemanticDomOptions = {}): string {
  const container = document.createElement('div')

  if (typeof html === 'string') {
    container.innerHTML = html
  } else if (html instanceof DocumentFragment) {
    container.appendChild(html.cloneNode(true))
  } else {
    container.appendChild(html.cloneNode(true))
  }

  // 1. Remove comments
  const removeComments = (node: Node) => {
    for (let i = node.childNodes.length - 1; i >= 0; i--) {
      const child = node.childNodes[i]
      if (child.nodeType === Node.COMMENT_NODE) {
        node.removeChild(child)
      } else {
        removeComments(child)
      }
    }
  }
  removeComments(container)

  // 2. Remove ignored tags & children
  if (options.ignoreTags) {
    options.ignoreTags.forEach((tag) => {
      container.querySelectorAll(tag).forEach((el) => el.remove())
    })
  }
  if (options.ignoreChildren) {
    options.ignoreChildren.forEach((selector) => {
      container.querySelectorAll(selector).forEach((el) => el.remove())
    })
  }

  // 3. Process text nodes
  const processTextNodes = (node: Node) => {
    for (let i = node.childNodes.length - 1; i >= 0; i--) {
      const child = node.childNodes[i]
      if (child.nodeType === Node.TEXT_NODE) {
        if (options.ignoreTextContent) {
          node.removeChild(child)
        } else {
          child.textContent = child.textContent?.replace(/\s+/g, ' ').trim() || ''
          if (child.textContent === '') {
            node.removeChild(child)
          }
        }
      } else {
        processTextNodes(child)
      }
    }
  }
  processTextNodes(container)

  // 4. Process attributes
  const processAttributes = (el: Element) => {
    // Collect attributes
    const attrs = Array.from(el.attributes)

    attrs.forEach((attr) => {
      const name = attr.name

      // Check if ignored completely
      if (matchesAttributeRule(el, name, options.ignoredAttributes)) {
        el.removeAttribute(name)
        return
      }

      // Check if value should be ignored
      if (matchesAttributeRule(el, name, options.ignoreAttributeValueFor)) {
        el.setAttribute(name, '__IGNORED__')
      }
    })

    // Recursively process children
    Array.from(el.children).forEach((child) => processAttributes(child))
  }
  Array.from(container.children).forEach((child) => processAttributes(child))

  // 5. Sort attributes for deterministic output
  const sortAttributes = (el: Element) => {
    const attrs = Array.from(el.attributes).sort((a, b) => a.name.localeCompare(b.name))
    // Remove all and re-add in sorted order
    attrs.forEach((attr) => el.removeAttribute(attr.name))
    attrs.forEach((attr) => el.setAttribute(attr.name, attr.value))

    Array.from(el.children).forEach((child) => sortAttributes(child))
  }
  Array.from(container.children).forEach((child) => sortAttributes(child))

  return container.innerHTML
}
