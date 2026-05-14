/**
 * Core testing primitives for Lupa including tests, groups, and DOM fixtures.
 *
 * @packageDocumentation
 * @module @jarrodek/lupa/testing
 */
// All modules from this folder are executed in the browser and can only use browser APIs.
export { Test } from './test/main.js'
export { Suite } from './suite/main.js'
export { Group } from './group/main.js'
export { test, fixture, html } from './api.js'
export type { WebPluginFn, WebPluginContext } from './web_plugin.js'
export type * from '../types.js'
export type { CleanupHandler, HookHandler } from '../hooks/types.js'
export { Emitter } from './emitter.js'
export { WebRunner } from './web_runner.js'
export { SummaryBuilder } from './summary_builder.js'
export type { OmitFirstArg } from './api.js'
export { TestContext } from './test_context.js'
export { aTimeout, nextFrame, oneEvent, waitUntil } from './helpers.js'
