# Plugins

Lupa plugins are vanilla JavaScript functions executed as the first thing when running tests. A plugin can modify configuration, mutate CLI flags, register lifecycle hooks, and extend classes.

```typescript
import { configure } from '@jarrodek/lupa/runner'

function myCustomPlugin() {
  return function ({ emitter, runner, cliArgs, config }) {
    console.log('hello world from myCustomPlugin')
  }
}

configure({
  plugins: [
    myCustomPlugin()
  ],
})
```

## emitter

Reference to the Emitter class. The emitter is responsible for emitting events reporting the progress of tests.

## runner

Reference to an instance of the Runner class. The Runner class is responsible for executing the tests and also exposes API to register suites, reporters, and get the tests summary.

## cliArgs

Reference to the command line arguments parsed by Lupa as an object. You might want to read certain CLI flags and change the behavior of your plugin.

## config

Reference to the runner config. Feel free to mutate the config properties and the changes will be applied accordingly.
