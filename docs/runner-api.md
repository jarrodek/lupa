# Runner API

## Configuration

Lupa runner configuration is done using the `configure` function.

Following is the list of available properties.

```typescript
configure({
  files: ['tests/**/*.spec.js'],
  exclude: [],
  suites: [{
    name: 'unit',
    files: ['tests/unit/**/*.spec.js'],
    configure: () => {},
  }],
  plugins: [assert()],
  reporters: {
    activated: [],
    list: []
  },
  filters: {
    tests: [],
    tags: [],
    groups: [],
    files: [],
  },
  timeout: 2000,
  watch: false,
  importer: (filePath) => import(filePath),
  refiner: new Refiner({})
})
```

## files

The files property can be an array of glob patterns or a function that returns an array of files to import.

```typescript
configure({
  files: ['tests/**/*.spec.js', '!tests/unit/some-test-file.js'],
})
```

You can also implement a custom function to collect test files. The function must return an array of absolute file paths.

```typescript
configure({
  files: (cwd) => {
    return [
      path.join(cwd, 'tests/**/*.spec.js'),
    ]
  }
})
```

## suites (optional)

Registers multiple test suites. Each suite is represented as an object with the following properties:

- The `name` property represents the unique name for the suite.
- The `files` property can be an array of glob patterns or a function that returns an array of files.
- The optional `configure` method allows to configure the suite instance.

```typescript
import { configure, Suite } from '@jarrodek/lupa/runner'

configure({
  suites: [
    {
      name: 'unit',
      files: ['tests/unit/**/*.spec.js'],
      configure: (suite) => {
        // configure suite
      },
    }
  ],
})
```

## exclude (optional)

Define an array of glob patterns to exclude when scanning for test files or suite files. By default, we ignore files from `node_modules`, `.git`, and the `coverage` directories. However, you may define custom glob patterns as well.

```typescript
configure({
  files: '**/*.spec.js',
  exclude: [
    'node_modules/**',
    'bower_components/**',
    'jspm_packages/**'
  ]
})
```

## plugins (optional)

The plugins property allows you to register multiple plugins.

```typescript
import { assert } from '@jarrodek/lupa/assert'

configure({
  plugins: [
    assert()
  ]
})

// Or an inline function
configure({
  plugins: [
    async function (config, runner, { Test, TestContext, Group }) {
    }
  ]
})
```

## reporters (optional)

The reporters property allows you to register multiple reporters and activate some of them. You can also activate/switch between reporters using the --reporters CLI flag.

```typescript
import { specReporter } from '@jarrodek/lupa/reporters'

configure({
  reporters: {
    list: [specReporter()],
    activated: ['spec'],
  },
})
```

## filters (optional)

The filters property accepts an object of different filtering layers to cherry-pick and run specific tests.

Usually, you will be using the CLI flags to compute the filters. However, you can also set them programmatically within the config object.

```typescript
configure({
  filters: {
    tests: [], // by tests title
    tags: [], // by tags
    groups: [], // by group titles
    files: [], // import only mentioned files
  }
})
```

## timeout (optional)

Define the timeout for all the tests. A test will be marked as failed, if it does not complete within the configured time.

You can also define the global timeout using the --timeout CLI flag.

```typescript
configure({
  timeout: 5000
})
```

## watch (optional)

The watch property enables the watch mode. When enabled, the runner will watch for changes in the test files and run the tests again when they are changed.

```typescript
configure({
  watch: true
})
```

## importer (optional)

Lupa imports the test files using the Node.js dynamic import function. However, if required, you can also supply a custom function to import test files.

```typescript
configure({
  importer: (filePath) => import(filePath),
})
```

## refiner (optional)

The refiner object applies the filters and cherry-picks tests for execution. The default implementation relies on the Refiner class. However, you can also supply your refiner to customize the filter's logic.

```typescript
import { configure } from '@jarrodek/lupa/runner'
import { Refiner } from '@jarrodek/lupa/refiner'

configure({
  refiner: {
    filters: {},
    pinnedTests: new Set(),
    
    add(layer, values) {
      this.filters[layer].push(...values)
    },
      
    pinTest(test) {
      this.pinnedTests.add(test)
    }
      
    allows(testOrGroup) {
      return true 
    }
  }
})
```

The refiner object must implement the following methods.

- `add(layer, values)`: Accepts filters for a given layer. The layer can be `test`, `tags`, or `groups`. The value is always an array of strings.
- `pinTest(test)`: Receives the test to pin.
- `allows(testOrGroup)`: Receives an instance of the group or a test and must return a boolean.
  - `true` means run the test or group.
  - `false` means skip the test or group.

## Using test suites

Test suites allow developers to organize tests by their type. For example, a developer can create a unit tests suite, and a functional tests suite. Each suite can have its own lifecycle hooks to run actions before/after all the tests.

```typescript
import { configure } from '@jarrodek/lupa/runner'

configure({
  files: ['tests/**/*.spec.js'],
  suites: [
    {
      name: 'unit',
      files: 'tests/unit/**/*.spec.js'
    },
    {
      name: 'functional',
      files: 'tests/functional/**/*.spec.js',
      configure(suite) {
        /**
         * Example showcasing how to start the HTTP
         * server before running tests from the
         * functional suite.
         */
        suite.setup(() => {
          const server = startHttpServer()
          return () => server.close()
        })
      }
    }
  ],
  plugins: [
    assert(),
  ],
})
```
