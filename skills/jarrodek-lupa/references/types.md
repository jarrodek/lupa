# Types & Enums

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

## types

### `TestExecutor`
The function to execute the test
```ts
DataSet extends any[] ? (context: TestContext, value: DataSet[number], done: (error?: any) => void) => void | Promise<void> : DataSet extends () => infer A ? (context: TestContext, value: Awaited<A> extends any[] ? Awaited<A>[number] : Awaited<A>, done?: (error?: any) => void) => void | Promise<void> : (context: TestContext, done: (error?: any) => void) => void | Promise<void>
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
