import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import type { InlineConfig } from 'vite'
import type { Page } from 'playwright'
import debug from './debug.js'
import type { CoverageOptions } from './types.js'

export class CoverageManager {
  #coverageConfig: boolean | CoverageOptions | undefined
  #globalExcludes: string[]

  constructor(coverageConfig: boolean | CoverageOptions | undefined, globalExcludes: string[] = []) {
    this.#coverageConfig = coverageConfig
    this.#globalExcludes = globalExcludes
  }

  /**
   * Checks if coverage reporting is enabled in the configuration.
   */
  get isEnabled(): boolean {
    return !!this.#coverageConfig
  }

  /**
   * Injects the vite-plugin-istanbul into the Vite configuration if coverage is enabled.
   * Also ensures sourcemaps are enabled to allow accurate source mapping.
   */
  async instrumentViteConfig(viteConfig: InlineConfig): Promise<void> {
    if (!this.isEnabled) return
    const istanbulPlugin = (await import('vite-plugin-istanbul')).default as any

    const coverageOpts = typeof this.#coverageConfig === 'object' ? this.#coverageConfig : {}

    viteConfig.plugins = viteConfig.plugins || []
    viteConfig.plugins.push(
      istanbulPlugin({
        include: coverageOpts.include || ['**/*'],
        exclude: coverageOpts.exclude || [
          'node_modules/**',
          'test/**',
          'tests/**',
          '**/*.spec.ts',
          '**/*.test.ts',
          ...this.#globalExcludes,
        ],
        extension: coverageOpts.extension || ['.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte'],
        requireEnv: false,
        cypress: false,
      })
    )

    viteConfig.build = viteConfig.build || {}
    viteConfig.build.sourcemap = true
  }

  /**
   * Extracts the code coverage data from the Playwright page context,
   * saves it to the disk, and runs the nyc reporting tool.
   */
  async extractAndReport(page: Page): Promise<void> {
    if (!this.isEnabled) return

    try {
      const coverageData = await this.getCoverageStats(page)
      if (!coverageData) {
        console.warn('\nWarning: --coverage flag was provided but no coverage data was found in the browser context.')
        return
      }

      await this.storeCoverage(coverageData)
      await this.printReport()
    } catch (err) {
      console.error('Failed to extract coverage:', err)
    }
  }

  /**
   * Gets the coverage stats and returns them.
   */
  protected getCoverageStats(page: Page): Promise<any> {
    debug('extracting coverage data')
    return page.evaluate(() => (globalThis as any).__coverage__)
  }

  /**
   * Stores the coverage data.
   */
  protected async storeCoverage(coverageData: any): Promise<void> {
    debug('storing coverage data...')
    const outputDir = path.join(process.cwd(), '.nyc_output')

    debug('ensuring output directory exists: %s', outputDir)
    await fs.promises.mkdir(outputDir, { recursive: true })

    debug('writing coverage data to %s/out.json', outputDir)
    await fs.promises.writeFile(path.join(outputDir, 'out.json'), JSON.stringify(coverageData))
    debug('coverage data saved to .nyc_output/out.json')
  }

  /**
   * Prints the coverage report.
   */
  protected async printReport(): Promise<void> {
    debug('printing coverage report')
    console.log('\n--- Coverage Report ---')
    try {
      await new Promise<void>((resolve, reject) => {
        const child = spawn('npx nyc report --reporter=text --reporter=html', {
          stdio: 'inherit',
          shell: true,
        })

        child.on('close', (code) => {
          if (code === 0) resolve()
          else reject(new Error(`nyc report exited with code ${code}`))
        })

        child.on('error', reject)
      })
      debug('coverage report printed')
    } catch (e) {
      debug('failed to print coverage report: %O', e)
      console.error('Failed to print coverage report:', e)
    }
  }
}
