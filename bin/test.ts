import path from 'path'
import { configure, processCLIArgs, run } from '../src/runner/index.js'
import { SpecReporter } from '../src/reporters/spec.js'

processCLIArgs(process.argv.slice(2))

configure({
  files: ['tests/fixtures/integration/**/*.spec.ts'],
  testPlugins: [path.join(process.cwd(), 'src/assert/index.ts')],
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
  harness: {
    stylesheets: [path.join(process.cwd(), 'tests/fixtures/test.styles.css')],
    template: `
      <!DOCTYPE html>
      <html lang="en" class="dark">
        <head>
          <meta charset="utf-8">
          <title>Custom Theme Tests</title>
          <style>
            .a-special-inlined-style-tag {
              border-radius: 8px;
            }
          </style>
          <!-- lupa-stylesheets -->
        </head>
        <body>
          <div id="app-root"></div>
          <!-- lupa-scripts -->
        </body>
      </html>
    `,
  },
})

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error)
  process.exit(1)
})
