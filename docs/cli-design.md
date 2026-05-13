## CLI Design

Lupa CLI is a command line interface for running tests. Tests are started by calling the `bin/test.js` (or `.ts`) file.

```shell
node bin/test.js
```

The script creates the configuration using the `configure` method and then runs the tests using the `run` method. This initializes the CLI and starts the test runner.

The test runner uses [Playwright](https://playwright.dev/) to run the tests in a real browser environment. The tests are executed in a separate process, which is spawned by the test runner. The test runner communicates with the browser process using [ZeroMQ](https://zeromq.org/) (or similar) sockets.

```typescript
// bin/test.ts
import { configure } from '@jarrodek/lupa/runner'
import { assert } from '@jarrodek/lupa/assert'

configure({
  files: ['tests/**/*.spec.js'],
  plugins: [
    assert(),
  ],
})

run()
```

See the [Runner API](runner-api.md) page for more details.

## Non-interactive mode

In non-interactive mode, the test runner will run all tests and print the results to the console. The test runner will not open any browser windows.

## Interactive mode with `--watch` flag

In interactive mode, the test runner will still not open a browser window but the user can press `f` key to "focus" on a specific test file. Only tests from that file will be executed. This allows developers to quickly run tests for a specific component they are working on. After entering the focus mode, they can press `d` key to open the browser and debug the tests.

```shell
node bin/test.ts --watch
```
