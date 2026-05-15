import type { JsonSerializable, NormalizedConfig } from '../types.js'
import type { ViteDevServer } from 'vite'
import { resolve } from 'node:path'

/**
 * Creates the Vite plugin responsible for generating the Lupa test harness HTML.
 * Exported for testing purposes.
 */
export default function harnessPlugin(
  suites: { name: string; timeout?: number; retries?: number; filesURLs: URL[] }[],
  resolvedPlugins: (JsonSerializable | undefined)[][],
  runnerConfig: NormalizedConfig,
  harnessPath: string
) {
  return {
    name: 'lupa-harness',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/__lupa__/runner.html', async (_req, res) => {
        const configPayload = JSON.stringify({
          suites: suites.map((s) => ({
            name: s.name,
            timeout: s.timeout,
            retries: s.retries,
            files: s.filesURLs.map((u) => u.pathname),
          })),
          testPlugins: resolvedPlugins,
          config: {
            filters: runnerConfig?.filters,
            timeout: runnerConfig?.timeout,
            retries: runnerConfig?.retries,
          },
        })

        const scripts = `
          <script>window.__lupa__ = ${configPayload}</script>
          <script type="module" src="/@fs${harnessPath}"></script>
        `

        const stylesheets = (runnerConfig?.harness?.stylesheets || [])
          .map((cssPath) => {
            if (cssPath.startsWith('http://') || cssPath.startsWith('https://')) {
              return `<link rel="stylesheet" href="${cssPath}">`
            }
            const resolved = resolve(process.cwd(), cssPath)
            return `<link rel="stylesheet" href="/@fs${resolved}">`
          })
          .join('\n')

        let html: string
        if (typeof runnerConfig?.harness?.template === 'function') {
          html = runnerConfig.harness.template({ scripts, stylesheets })
        } else if (typeof runnerConfig?.harness?.template === 'string') {
          html = runnerConfig.harness.template
            .replace('<!-- lupa-scripts -->', scripts)
            .replace('<!-- lupa-stylesheets -->', stylesheets)
        } else {
          html = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <title>Lupa Test Runner</title>
                ${stylesheets}
              </head>
              <body>
                ${scripts}
              </body>
            </html>
          `
        }

        res.setHeader('Content-Type', 'text/html')
        res.end(html)
      })
    },
  }
}
