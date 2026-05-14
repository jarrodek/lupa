# Classes

## runner

### `Runner`
The Runner class exposes the API to manage the node process telemetry
and reporters for Lupa tests running in the browser.
*extends `default`*
```ts
constructor(emitter: Emitter): Runner
```
**Properties:**
- `summaryBuilder: SummaryBuilder` — Summary builder is used to create the tests summary reported by
multiple reporters. Each report contains a key-value pair
- `reporters: Set<ReporterContract>` — Registered tests reporter
- `reporterEmitter: Emitter` (optional) — Optional emitter to use for reporters. If not set, the main emitter is used.
Useful for watch mode filtering.
**Methods:**
- `macro<T, K>(this: T, name: K, value: InstanceType<T>[K]): void` — Adds a macro (property or method) to the class prototype.
Macros are standard properties that get added to the class prototype,
making them available on all instances of the class.
- `instanceProperty<T, K>(this: T, name: K, value: InstanceType<T>[K]): void` — Adds an instance property that will be assigned to each instance during construction.
Unlike macros which are added to the prototype, instance properties are unique to each instance.
- `getter<T, K>(this: T, name: K, accumulator: () => InstanceType<T>[K], singleton?: boolean): void` — Adds a getter property to the class prototype using Object.defineProperty.
Getters are computed properties that are evaluated each time they are accessed,
unless the singleton flag is enabled.
- `registerReporter(reporter: ReporterContract): this` — Register a tests reporter
- `getSummary(): RunnerSummary` — Get tests summary
- `start(): Promise<void>` — Start the test runner process
- `end(): Promise<void>` — End the runner process
