/*
 * @japa/runner
 *
 * (c) Japa
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { colors, icons } from '../runner/helpers.js'
import type { TestEndNode } from '../types.js'
import { BaseReporter } from '../reporters/base.js'

/**
 * Minimal reporter that prints each test as an icon.
 */
export class DotReporter extends BaseReporter {
  /**
   * When a test ended
   */
  protected onTestEnd(payload: TestEndNode) {
    let output: string
    if (payload.isTodo) {
      output = colors.cyan(icons.info)
    } else if (payload.hasError) {
      output = colors.red(icons.cross)
    } else if (payload.isSkipped) {
      output = colors.yellow(icons.bullet)
    } else if (payload.isFailing) {
      output = colors.magenta(icons.squareSmallFilled)
    } else {
      output = colors.green(icons.tick)
    }

    process.stdout.write(`${output}`)
  }

  /**
   * When test runner ended
   */
  protected async end() {
    console.log('')
    await this.printSummary(this.getRunnerOrThrow().getSummary())
  }
}
