import { configure, processCLIArgs, run } from '../src/runner/index.js'
import { SpecReporter } from '../src/reporters/spec.js'

processCLIArgs(process.argv.slice(2))

configure({
  files: ['tests/**/*.spec.ts'],
  testPlugins: ['/src/assert/index.ts'],
  reporters: {
    activated: ['spec'],
    list: [
      {
        name: 'spec',
        handler: (runner, emitter) => {
          const reporter = new SpecReporter()
          reporter.boot(runner, emitter)
        },
      },
    ],
  },
})

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error)
  process.exit(1)
})
