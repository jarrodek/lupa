/*
 * @japa/assert
 *
 * (c) Japa.dev
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { type assert } from 'chai'

/**
 * Unnecessary similar methods have been removed
 */
export type ChaiAssert = { [K in keyof typeof assert]: (typeof assert)[K] }

/**
 * Assert contract
 */
export type AssertContract = Omit<
  ChaiAssert,
  | 'deepStrictEqual'
  | 'nestedInclude'
  | 'notNestedInclude'
  | 'deepNestedInclude'
  | 'notDeepNestedInclude'
  | 'ifError'
  | 'changes'
  | 'changesBy'
  | 'doesNotChange'
  | 'changesButNotBy'
  | 'increases'
  | 'increasesBy'
  | 'doesNotIncrease'
  | 'increasesButNotBy'
  | 'decreases'
  | 'decreasesBy'
  | 'doesNotDecrease'
  | 'doesNotDecreaseBy'
  | 'decreasesButNotBy'
  | 'extensible'
  | 'isExtensible'
  | 'notExtensible'
  | 'isNotExtensible'
  | 'deepProperty'
  | 'notDeepProperty'
  | 'nestedProperty'
  | 'nestedPropertyVal'
  | 'notNestedProperty'
  | 'notNestedPropertyVal'
  | 'deepNestedProperty'
  | 'notDeepNestedProperty'
  | 'deepNestedPropertyVal'
  | 'notDeepNestedPropertyVal'
  | 'hasAnyKeys'
  | 'hasAllKeys'
  | 'containsAllKeys'
  | 'doesNotHaveAnyKeys'
  | 'doesNotHaveAllKeys'
  | 'throw'
  | 'Throw'
  | 'doesNotThrow'
  | 'hasAnyDeepKeys'
  | 'hasAllDeepKeys'
  | 'containsAllDeepKeys'
  | 'doesNotHaveAnyDeepKeys'
  | 'doesNotHaveAllDeepKeys'
  | 'closeTo'
  | 'operator'
  | 'oneOf'
  | 'ownInclude'
  | 'notOwnInclude'
  | 'deepOwnInclude'
  | 'notDeepOwnInclude'
>

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PluginConfig {
  // ...
}

/**
 * A more flexible error constructor than `ErrorConstructor` type that allows custom
 * error classes with any constructor signature
 */
export type AnyErrorConstructor = new (...args: any[]) => Error

/**
 * Options for Semantic DOM assertions
 */
export interface SemanticDomOptions {
  /**
   * Completely ignore specific attributes.
   * - `'*'`: Ignores ALL attributes on all elements.
   * - `['class', 'id']`: Ignores these attributes globally.
   * - `[{ tags: ['input'], attributes: ['id'] }]`: Ignores specific attributes on specific tags.
   */
  ignoredAttributes?: '*' | (string | AttributeMatcher)[]

  /**
   * The attribute MUST exist, but we ignore its value during comparison.
   * Example: `['data-id', 'aria-describedby']`
   * Or target specific tags: `[{ tags: ['input'], attributes: ['id'] }]`
   */
  ignoreAttributeValueFor?: (string | AttributeMatcher)[]

  /**
   * Ignores specific tags completely from the comparison (removes them from the tree).
   * Example: `['my-custom-element']`
   */
  ignoreTags?: string[]

  /**
   * Ignores elements that match the given CSS selectors (removes them from the tree).
   * Example: `['.item', '#dynamic-child']`
   */
  ignoreChildren?: string[]

  /**
   * If true, all text nodes (inner text content) are ignored in the comparison.
   */
  ignoreTextContent?: boolean
}

/**
 * Only the combination of tag and attribute names will be used to match the attribute.
 */
export interface AttributeMatcher {
  /**
   * The list of element tags to match.
   */
  tags: string[]

  /**
   * The list of attributes to match.
   */
  attributes: string[]
}
