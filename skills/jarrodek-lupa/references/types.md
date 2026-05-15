# Types & Enums

## assert

### `ChaiAssert`
Unnecessary similar methods have been removed
```ts
{ [K in keyof typeof assert]: typeof assert[K] }
```

### `AssertContract`
Assert contract
```ts
Omit<ChaiAssert, "deepStrictEqual" | "nestedInclude" | "notNestedInclude" | "deepNestedInclude" | "notDeepNestedInclude" | "ifError" | "changes" | "changesBy" | "doesNotChange" | "changesButNotBy" | "increases" | "increasesBy" | "doesNotIncrease" | "increasesButNotBy" | "decreases" | "decreasesBy" | "doesNotDecrease" | "doesNotDecreaseBy" | "decreasesButNotBy" | "extensible" | "isExtensible" | "notExtensible" | "isNotExtensible" | "deepProperty" | "notDeepProperty" | "nestedProperty" | "nestedPropertyVal" | "notNestedProperty" | "notNestedPropertyVal" | "deepNestedProperty" | "notDeepNestedProperty" | "deepNestedPropertyVal" | "notDeepNestedPropertyVal" | "hasAnyKeys" | "hasAllKeys" | "containsAllKeys" | "doesNotHaveAnyKeys" | "doesNotHaveAllKeys" | "throw" | "Throw" | "doesNotThrow" | "hasAnyDeepKeys" | "hasAllDeepKeys" | "containsAllDeepKeys" | "doesNotHaveAnyDeepKeys" | "doesNotHaveAllDeepKeys" | "closeTo" | "operator" | "oneOf" | "ownInclude" | "notOwnInclude" | "deepOwnInclude" | "notDeepOwnInclude">
```

### `AnyErrorConstructor`
A more flexible error constructor than `ErrorConstructor` type that allows custom
error classes with any constructor signature
```ts
(args: any[]) => Error
```

### `AttributeMatcher`
Only the combination of tag and attribute names will be used to match the attribute.
**Properties:**
- `tags: string[]` — The list of element tags to match.
- `attributes: string[]` — The list of attributes to match.

## runner

### `SetupHookState`
Global setup hook state
```ts
[[runner: Runner], [error: Error | null, runner: Runner]]
```

### `SetupHookHandler`
Global setup hook handler
```ts
HookHandler<SetupHookState[0], SetupHookState[1]>
```

### `TeardownHookState`
Global teardown hook state
```ts
[[runner: Runner], [error: Error | null, runner: Runner]]
```

### `TeardownHookHandler`
Global teardown hook handler
```ts
HookHandler<TeardownHookState[0], TeardownHookState[1]>
```

### `HooksEvents`
Global set of available hooks
**Properties:**
- `setup: SetupHookState` — Global setup hook
- `teardown: TeardownHookState` — Global teardown hook

### `Filters`
Set of filters you can apply to run only specific tests
```ts
FilteringOptions & { files?: string[]; suites?: string[] }
```

### `TestPluginEntry`
A test plugin entry for browser-side plugins. Can be:
- A bare module specifier string (no options)
- A tuple of [specifier, options] where options must be JSON-serializable
```ts
string | [specifier: string, options: JsonSerializable]
```

### `RunnerPluginFn`
Runner plugin function. Receives the Node runner, emitter, and config.
Executed in the Node.js orchestrator process.
```ts
(context: { config: NormalizedConfig; cliArgs: CLIArgs; runner: Runner; emitter: Emitter }) => void | Promise<void>
```

### `TestFiles`
A collection of test files defined as a glob or a callback
function that returns an array of URLs
```ts
string | string[] | (() => URL[] | Promise<URL[]>)
```

### `TestSuite`
A test suite to register tests under a named suite
**Properties:**
- `name: string` — A unique name for the suite
- `files: TestFiles` — Collection of files associated with the suite. Files should be
defined as a glob or a callback function that returns an array of URLs
- `timeout: number` (optional) — The timeout to apply on all the tests in this suite, unless overwritten explicitly
- `retries: number` (optional) — The retries to apply on all the tests in this suite, unless overwritten explicitly

### `Config`
Configuration options
```ts
BaseConfig & ({ files: TestFiles } | { suites: TestSuite[] })
```

### `CLIArgs`
Parsed command-line arguments
```ts
{ _?: string[]; tags?: string | string[]; files?: string | string[]; tests?: string | string[]; groups?: string | string[]; timeout?: string; retries?: string; reporters?: string | string[]; forceExit?: boolean; failed?: boolean; help?: boolean; matchAll?: boolean; listPinned?: boolean; bail?: boolean; bailLayer?: string; verbose?: boolean; browser?: string; viteConfig?: string; coverage?: boolean } & Record<string, string | string[] | boolean>
```

### `JsonSerializable`
Enforces JSON-serializable values at the type level.
Functions, symbols, undefined, and class instances are rejected.
```ts
string | number | boolean | null | JsonSerializable[] | { [key: string]: JsonSerializable }
```

## types

### `TestError`
One of the predefined types of errors that can happen during test execution
```ts
AssertionError<unknown> | Error
```

### `SummaryReporter`
Summary reporters are registered with the SummaryBuilder to
add information to the tests summary output
```ts
() => { key: string; value: string | string[] }[]
```

### `DataSetNode`
Shape of test data set. Should be an array of a function that
returns an array
```ts
undefined | any[] | (() => any[] | Promise<any[]>)
```

### `TestHooksData`
The data given to the setup and the teardown test
hooks
```ts
[[test: Test<any>], [hasError: boolean, test: Test<any>]]
```

### `TestHooksHandler`
The function that can be registered as a test hook
```ts
HookHandler<TestHooksData[0], TestHooksData[1]>
```

### `TestHooksCleanupHandler`
The function that can be registered as a cleanup handler
```ts
CleanupHandler<TestHooksData[1]>
```

### `TestHooks`
Hooks available on a test

### `GroupHooksData`
The data given to the setup and the teardown group
hooks
```ts
[[group: Group], [hasError: boolean, group: Group]]
```

### `GroupHooksHandler`
The callback function given to the "setup" and the "teardown"
methods on a group
```ts
HookHandler<GroupHooksData[0], GroupHooksData[1]>
```

### `GroupHooks`
Hooks available on a group

### `SuiteHooksData`
The data given to the setup and the teardown suite
hooks
```ts
[[suite: Suite], [hasError: boolean, suite: Suite]]
```

### `SuiteHooksHandler`
The function that can be registered as a suite hook
```ts
HookHandler<SuiteHooksData[0], SuiteHooksData[1]>
```

### `SuiteHooks`
Hooks available on a suite

### `TestExecutor`
The function to execute the test
```ts
DataSet extends any[] ? (context: TestContext, value: DataSet[number], done: (error?: any) => void) => void | Promise<void> : DataSet extends () => infer A ? (context: TestContext, value: Awaited<A> extends any[] ? Awaited<A>[number] : Awaited<A>, done?: (error?: any) => void) => void | Promise<void> : (context: TestContext, done: (error?: any) => void) => void | Promise<void>
```

### `TestStartNode`
Data shared during "test:start" event
```ts
Omit<TestOptions, "title"> & { title: { original: string; expanded: string }; isPinned: boolean; dataset?: { size: number; index: number; row: any }; meta: TestMetadata }
```

### `TestEndNode`
Data shared during "test:end" event
```ts
Omit<TestOptions, "title"> & { title: { original: string; expanded: string }; isPinned: boolean; duration: number; hasError: boolean; errors: { phase: "setup" | "test" | "setup:cleanup" | "teardown" | "teardown:cleanup" | "test:cleanup"; error: TestError }[]; retryAttempt?: number; dataset?: { size: number; index: number; row: any } }
```

### `GroupMetadata`
The metadata object associated with a group events.
**Properties:**
- `fileName: string` (optional) — File path in which the group is defined
- `suite: string` (optional) — Suite name in which the group is defined

### `TestMetadata`
The metadata object associated with a test events.
**Properties:**
- `fileName: string` (optional) — File path in which the test is defined
- `suite: string` (optional) — Suite name in which the test is defined
- `group: string` (optional) — Group name in which the test is defined
- `abort: (message: string) => any` (optional) — Abort the test if the condition is met

### `GroupStartNode`
Data shared with "group:start" event
```ts
GroupOptions
```

### `GroupEndNode`
Data shared with "group:end" event
```ts
GroupOptions & { hasError: boolean; errors: { phase: "setup" | "setup:cleanup" | "teardown" | "teardown:cleanup"; error: TestError }[] }
```

### `SuiteStartNode`
Data shared with "suite:start" event
**Properties:**
- `name: string` — Suite name

### `SuiteEndNode`
Data shared with "suite:end" event
**Properties:**
- `name: string` — Suite name
- `hasError: boolean` — Whether the suite has any errors
- `errors: { phase: "setup" | "setup:cleanup" | "teardown" | "teardown:cleanup"; error: TestError }[]` — Errors that occurred during the suite execution

### `RunnerStartNode`
Data shared with "runner:start" event

### `RunnerEndNode`
Data shared with "runner:end" event
**Properties:**
- `hasError: boolean` — Whether the runner has any errors

### `UncaughtExceptionNode`
Uncaught exception
**Properties:**
- `error: TestError` — The error that occurred
- `type: "error" | "rejection"` — Type of exception

### `RunnerPinnedTestsNode`
Runner pinned tests
**Properties:**
- `tests: { title: string; stack: string }[]` — Pinned tests metadata

### `RunnerEvents`
Events emitted by the runner emitter. These can be extended as well
**Properties:**
- `test:start: TestStartNode` — Test start event
- `test:end: TestEndNode` — Test end event
- `group:start: GroupOptions` — Group start event
- `group:end: GroupEndNode` — Group end event
- `suite:start: SuiteStartNode` — Suite start event
- `suite:end: SuiteEndNode` — Suite end event
- `runner:start: RunnerStartNode` — Runner start event
- `runner:end: RunnerEndNode` — Runner end event
- `uncaught:exception: UncaughtExceptionNode` — Uncaught exception event
- `runner:pinned_tests: RunnerPinnedTestsNode` — Runner pinned tests event

### `ReporterHandlerContract`
Type for the reporter handler function
```ts
(runner: Runner, emitter: Emitter) => void | Promise<void>
```

### `NamedReporterContract`
Type for a named reporter object.
**Properties:**
- `name: string` — Reporter name
- `handler: ReporterHandlerContract` — Reporter handler

### `ReporterContract`
Test reporters must adhere to the following contract
```ts
ReporterHandlerContract | NamedReporterContract
```

### `FailureTreeTestNode`
The test node inside the failure tree
**Properties:**
- `title: string` — Test title
- `type: "test"` — Test type
- `errors: { phase: "setup" | "setup:cleanup" | "teardown" | "teardown:cleanup" | "test" | "test:cleanup"; error: TestError }[]` — Test errors

### `FailureTreeGroupNode`
The group node inside the failure tree
**Properties:**
- `name: string` — Group name
- `type: "group"` — Group type
- `errors: { phase: "setup" | "setup:cleanup" | "teardown" | "teardown:cleanup"; error: TestError }[]` — Group errors
- `children: FailureTreeTestNode[]` — Group children

### `FailureTreeSuiteNode`
The suite node inside the failure tree
**Properties:**
- `name: string` — Suite name
- `type: "suite"` — Suite type
- `errors: { phase: "setup" | "setup:cleanup" | "teardown" | "teardown:cleanup"; error: TestError }[]` — Suite errors
- `children: (FailureTreeGroupNode | FailureTreeTestNode)[]` — Suite children

### `RunnerSummary`
Runner summary properties
**Properties:**
- `aggregates: { total: number; failed: number; passed: number; regression: number; skipped: number; todo: number }` — Test aggregates
- `duration: number` — Total duration in milliseconds
- `hasError: boolean` — Whether the runner has any errors
- `failureTree: FailureTreeSuiteNode[]` — Failure tree
- `failedTestsTitles: string[]` — Failed tests titles

## testing

### `WebPluginFn`
The default export contract for a browser test plugin module.
```ts
(context: WebPluginContext, options?: Options) => void | Promise<void>
```

### `WebPluginContext`
Context provided to browser-side test plugins.
**Properties:**
- `runner: WebRunner` — The browser-side test runner
- `emitter: Emitter` — The event emitter (shared with the Node orchestrator via HMR)
- `config: { timeout?: number; retries?: number; filters?: any }` — The serialized test configuration

### `OmitFirstArg`
Utility type that removes the first argument from a function's parameter list.
```ts
F extends [_: any, args: infer R] ? R : never
```

### `TemplateTypes`
Type alias for a template that can be rendered by the fixture function.
```ts
string | ReturnType<typeof litHtml> | TemplateResult
```

## hooks

### `CleanupHandler`
Shape of the cleanup handler
```ts
(args: Args) => void | Promise<void>
```

### `HookHandler`
Shape of the hook handler
```ts
(args: Args) => void | CleanupHandler<CleanUpArgs> | Promise<void> | Promise<CleanupHandler<CleanUpArgs>>
```

## commands

### `QueryByRole`
The role locator reflects how users and assistive technology perceive the page,
for example whether some element is a button or a checkbox.
When locating by role, you should usually pass the accessible name as well,
so that the locator pinpoints the exact element.
**Properties:**
- `role: string`

### `QueryByLabel`
Most form controls usually have dedicated labels that could be conveniently used
to interact with the form. In this case, you can locate the control by its associated label
using the `label` locator strategy.
**Properties:**
- `label: string`

### `QueryByPlaceholder`
Inputs may have a placeholder attribute to hint to the user what value should be entered.
You can locate such an input using the `placeholder` locator strategy.
**Properties:**
- `placeholder: string`

### `QueryByText`
Find an element by the text it contains. You can match by a substring,
exact string, or a regular expression when using the `text` locator strategy.
**Properties:**
- `text: string`

### `QueryByAltText`
All images should have an alt attribute that describes the image.
You can locate an image based on the text alternative using the `altText` locator strategy.
**Properties:**
- `altText: string`

### `QueryByTitle`
Locate an element with a matching title attribute using the `title` locator strategy.
**Properties:**
- `title: string`

### `QueryByTestId`
Use this locator to find elements by their data-testid attribute.
**Properties:**
- `testId: string`

### `QueryByCss`
Use this locator to find elements by their CSS selector.
**Properties:**
- `css: string`

### `QueryByXPath`
Use this locator to find elements by their XPath.
**Properties:**
- `xpath: string`

### `LocatorQuery`
Set of supported locator queries.
```ts
QueryByRole | QueryByText | QueryByLabel | QueryByPlaceholder | QueryByText | QueryByAltText | QueryByTitle | QueryByTestId | QueryByCss | QueryByXPath
```

### `SupportedLocatorAction`
Set of supported locator actions.
```ts
"blur" | "clear" | "check" | "click" | "dblclick" | "fill" | "hover" | "press" | "tap" | "uncheck"
```

### `LocatorActionPayload`
Payload for locator actions.
Used internally by the runner to execute locator actions.
**Properties:**
- `action: SupportedLocatorAction` — The action to perform on the element.
- `query: LocatorQuery` — The query to use to locate the element.
- `args: unknown` (optional) — Additional arguments for the action.

### `TimeoutOption`
Options that can be passed to locator actions.
**Properties:**
- `timeout: number` (optional) — Maximum time in milliseconds. Defaults to `0` - no timeout. The default value can be changed via `actionTimeout`
option in the config, or by using the
[browserContext.setDefaultTimeout(timeout)](https://playwright.dev/docs/api/class-browsercontext#browser-context-set-default-timeout)
or [page.setDefaultTimeout(timeout)](https://playwright.dev/docs/api/class-page#page-set-default-timeout) methods.

### `ForceOption`
Options that can be passed to locator actions.
**Properties:**
- `force: boolean` (optional) — Whether to bypass the [actionability](https://playwright.dev/docs/actionability) checks. Defaults to `false`.

### `StrictOption`
Options that can be passed to locator actions.
**Properties:**
- `strict: boolean` (optional) — When true, the call requires selector to resolve to a single element. If given selector resolves to more than one
element, the call throws an exception.

<!-- truncated -->
