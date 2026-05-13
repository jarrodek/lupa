# Lupa — Production Readiness Analysis

## Executive Summary

Lupa is a **well-architected prototype** with strong fundamentals. The inverted execution model (Vite + Playwright + WebSocket telemetry) works correctly, the type system is clean, and the core test lifecycle (Test → Group → Suite → Runner) is fully functional. However, there are significant gaps in **error resilience**, **test coverage of Lupa itself**, **build/distribution**, and **feature completeness** that need addressing before a public release.

**Estimated distance to production:** ~60-70% complete for a v0.1 public alpha, ~40-50% complete for a stable v1.0.

---

## What's Working Well ✅

| Area | Status | Notes |
|------|--------|-------|
| Core architecture | ✅ Solid | Clean separation: Node orchestrator ↔ WebSocket bridge ↔ Browser runner |
| Test lifecycle | ✅ Complete | Test/Group/Suite hooks, setup/teardown/cleanup, retries, timeouts, datasets |
| Assertion library | ✅ Complete | Full Chai-based Assert class (~60KB), plugin architecture via `TestContext.getter` |
| Source-mapped errors | ✅ Working | `stack_transformer.ts` resolves browser stack frames to original TS source |
| Reporters | ✅ 4 built-in | Spec, Dot, NDJSON, GitHub Actions — all functional |
| Type system | ✅ Clean | Generics simplified, `TestContext` is the canonical context |
| CLI argument parsing | ✅ Complete | Filters, tags, groups, timeout, retries, reporters, bail mode |
| Config management | ✅ Complete | CLI overrides → user config → defaults priority chain |
| Vite integration | ✅ Working | Silent logger, production mode, resolve conditions, test plugins |
| Fixture API | ✅ Working | `fixture(html\`...\`)` with lit-html rendering + frame wait |

---

## Gap Analysis

### 1. Error Handling & Resilience 🔴 Critical

| Issue | Severity | Details |
|-------|----------|---------|
| No graceful shutdown on crash | ✅ Addressed | `ExceptionsManager` catches `uncaughtException` and triggers robust async teardown. |
| No timeout on the overall run | ✅ Addressed | A global safety timeout forces shutdown if the browser test run hangs. |
| `process.exit()` in `__lupa_runner_end__` | ✅ Addressed | Replaced with telemetry-driven `runner:end` event and graceful Node.js teardown. |
| No `SIGINT`/`SIGTERM` handler | ✅ Addressed | Ctrl+C now triggers an immediate graceful Vite/Playwright shutdown via `Promise.race`. |
| `page.exposeFunction` called only once | ✅ Addressed | Watch mode isolated into `WatchManager`, which correctly manages browser lifecycles per incremental run. |
| No error boundary around test file imports | ✅ Addressed | `harness.ts` catches import errors, wraps them with the file path, and emits an `uncaught:exception` telemetry event. |

### 2. Testing Infrastructure (Lupa's Own Tests) 🔴 Critical

| Issue | Severity | Details |
|-------|----------|---------|
| No unit tests for Lupa itself | 🔴 High | Only 1 integration spec (`dummy.spec.ts`). No tests for: Refiner, ConfigManager, Planner, Tracker, Hooks, Interpolate, CliParser, Validators. |
| No CI pipeline | 🔴 High | No `.github/workflows/`, no test automation. `package.json` `test` script is `echo "Error"`. |
| No regression test for the error reporter | 🟡 Medium | The spec reporter's error printing path (`printSummary`) is only manually verified. |

### 3. Developer Experience 🟡 Medium

| Issue | Severity | Details |
|-------|----------|---------|
| Watch mode disabled | ✅ Addressed | `WatchManager` successfully implements full dependency-aware incremental test execution, focus mode, and debugging. |
| No `npx lupa` CLI entry | ✅ By Design | No `bin` field in `package.json`. Tests must be explicitly run via a user-defined script (e.g., `bin/test.ts`) with a specific configuration. |
| `[Browser Console]` logs | ✅ Addressed | Browser `console.log` output is completely suppressed by default to keep test output pristine. Logs (with prefix) only appear if the `--verbose` flag is passed. |
| Fixture cleanup | ✅ Addressed | `fixture()` automatically hooks into `activeTest.cleanup()` to remove DOM nodes. |
| No `--browser` flag documented | ✅ Addressed | Added `--browser` to `CLIArgs` typing, the parser options, and the interactive help menu. |

### 4. Build & Distribution 🔴 Critical

| Issue | Severity | Details |
|-------|----------|---------|
| No README.md | ✅ Addressed | Created user-facing README explaining framework goals, usage, and watch mode features. |
| No LICENSE file at root | ✅ Addressed | Added standard Apache 2.0 LICENSE file. |
| No `.npmignore` or `files` field | ✅ Addressed | Added `"files": ["dist"]` to `package.json` to prevent publishing test and source files. |
| `engines.node >= 24.0.0` | ✅ Addressed | Lowered to `>=22.0.0` in `package.json`. |
| Export map wildcards | 🟠 Low | `"./runner*.js"` and `"./testing*.js"` wildcards are unconventional and may expose internals. |
| `dist/` is committed(?) | 🟠 Low | `dist/` directory exists. Should be in `.gitignore` and built on publish. |
| No `prepublishOnly` script | 🟠 Low | No automated build before `npm publish`. |

### 5. Dead Code & Technical Debt 🟡 Medium

| Issue | Severity | Details |
|-------|----------|---------|
| Watch mode dead code | ✅ Addressed | Fully extracted and re-implemented cleanly in `src/runner/watch_manager.ts`. |
| `printPinnedTests` commented out | 🟠 Low | `helpers.ts` lines 91-116 — entire function commented out. |
| `timekeeper` dependency | 🟠 Low | `dateTimeDoubles` in `helpers.ts` imports `timekeeper` but it's unclear if this is ever used. Node-side time mocking in a browser test framework seems off. |
| `isRunningInAIAgent` import | 🟠 Low | `config_manager.ts` imports from `@poppinss/utils` to detect AI agents for reporter selection. Niche dependency for a minor feature. |
| 134 comment lines in src/ | 🟠 Low | Many are legitimate JSDoc, but some are dead code blocks. |

### 6. Feature Completeness (vs. Spec) 🟡 Medium

| Feature | Status | Gap |
|---------|--------|-----|
| Basic test/group/suite | ✅ Done | — |
| Datasets | ✅ Done | — |
| Hooks (setup/teardown/cleanup) | ✅ Done | — |
| Assertions (chai-based) | ✅ Done | — |
| Fixtures (lit-html) | ✅ Done | Included automatic DOM cleanup |
| Skip/Pin/Fail/Tags | ✅ Done | — |
| Bail mode | ✅ Done | — |
| Source-mapped errors | ✅ Done | — |
| Reporter: Spec | ✅ Done | — |
| Reporter: Dot/NDJSON/GitHub | ✅ Done | — |
| Watch mode | ✅ Done | Implemented via dependency graph traversal |
| Debug browser | ✅ Done | Active inside focus mode (`d` key) |
| Focus mode (single file) | ✅ Done | Active in watch CLI (`f` key), isolates logging |
| `configureSuite` callback | ❌ Removed | Was in spec, not yet re-implemented for browser |
| Custom Vite config | ❌ Missing | Users can't customize Vite plugins, aliases, etc. |
| Multi-browser parallel runs | ❌ Missing | Currently runs one browser instance serially |
| Snapshot testing | ❌ Missing | Not in scope but commonly expected |
| Coverage support | ❌ Missing | No integration with v8/istanbul coverage |

---

## Prioritized Roadmap to v1.0

### Phase 1: Ship-Safe Alpha (v0.1) — ~1-2 days
1. ~~Add `SIGINT`/`SIGTERM` signal handlers for clean shutdown~~ (Done)
2. ~~Add a global runner timeout (default 60s)~~ (Done)
3. ~~Replace `process.exit()` with proper async cleanup~~ (Done)
4. ~~Add fixture DOM cleanup between tests~~ (Done)
5. ~~Create `README.md`~~ (Done)
6. ~~Add `LICENSE` file~~ (Done)
7. ~~Add `files` field to `package.json`~~ (Done)
8. ~~Lower `engines.node` to `>=22.0.0`~~ (Done)
9. ~~Wire up `"test"` script in `package.json`~~ (Done)

### Phase 2: Stability (v0.2) — ~3-5 days
1. Write unit tests for core modules (Refiner, ConfigManager, Planner, Tracker, CliParser, Hooks, Interpolate)
2. Set up GitHub Actions CI
3. ~~Enable watch mode (uncomment + stabilize)~~ (Done)
4. ~~Add `--browser` to CLI help~~
5. Allow user Vite config passthrough
6. ~~Emit telemetry events for import failures~~ (Done)

### Phase 3: Feature Complete (v1.0) — ~1-2 weeks
1. ~~Debug browser mode~~ (Done)
2. ~~Focus mode (single file re-run)~~ (Done)
3. Coverage support (v8)
4. Custom Vite config
5. Comprehensive end-to-end test suite
6. API documentation (generated from JSDoc)
7. `CHANGELOG.md` + semantic release setup
