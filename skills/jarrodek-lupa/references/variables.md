# Variables & Constants

## assert

### `default`
Browser test plugin for assertion support.

Usage in config:
```typescript
testPlugins: ['@jarrodek/lupa/assert']
```
```ts
const default: WebPluginFn
```

## testing

### `html`
`html` template tag from `lit-html`.
Used for creating DOM templates to be rendered by fixture.
```ts
const html: (strings: TemplateStringsArray, values: unknown[]) => TemplateResult<1>
```

## reporters

### `spec`
Create an instance of the spec reporter
```ts
const spec: (options?: BaseReporterOptions) => NamedReporterContract
```

### `dot`
Create an instance of the dot reporter
```ts
const dot: (options?: BaseReporterOptions) => NamedReporterContract
```

### `ndjson`
Create an instance of the ndjson reporter
```ts
const ndjson: (options?: BaseReporterOptions) => NamedReporterContract
```

### `github`
Create an instance of the github reporter
```ts
const github: (options?: BaseReporterOptions) => NamedReporterContract
```
