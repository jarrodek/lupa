/*
 * @japa/runner
 *
 * (c) Japa
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import string from '@poppinss/string'
import { ErrorsPrinter } from '@japa/errors-printer'

import { colors } from '../runner/helpers.js'
import type { Emitter } from '../testing/emitter.js'
import type { Runner } from '../runner/runner.js'

import type {
  TestEndNode,
  SuiteEndNode,
  GroupEndNode,
  TestStartNode,
  RunnerSummary,
  RunnerEndNode,
  GroupStartNode,
  SuiteStartNode,
  RunnerStartNode,
  BaseReporterOptions,
} from '../types.js'

export type {
  TestEndNode,
  SuiteEndNode,
  GroupEndNode,
  TestStartNode,
  RunnerSummary,
  RunnerEndNode,
  GroupStartNode,
  SuiteStartNode,
  RunnerStartNode,
  BaseReporterOptions,
} from '../types.js'

/**
 * Base reporter to build custom reporters on top of
 */
export abstract class BaseReporter {
  runner?: Runner

  /**
   * Path to the file for which the tests are getting executed
   */
  currentFileName?: string

  /**
   * Suite for which the tests are getting executed
   */
  currentSuiteName?: string

  /**
   * Group for which the tests are getting executed
   */
  currentGroupName?: string

  protected options: BaseReporterOptions

  constructor(options: BaseReporterOptions = {}) {
    this.options = Object.assign({ stackLinesCount: 2 }, options)
  }

  /**
   * Returns the runner instance
   *
   * @throws Error if the runner is not initialized
   */
  protected getRunnerOrThrow(): Runner {
    if (!this.runner) {
      throw new Error('Invalid state: Runner not initialized')
    }

    return this.runner
  }

  /**
   * Pretty prints the aggregates
   */
  protected printAggregates(summary: RunnerSummary) {
    const tests: string[] = []

    /**
     * Set value for tests row
     */
    if (summary.aggregates.passed) {
      tests.push(colors.green(`${summary.aggregates.passed} passed`))
    }
    if (summary.aggregates.failed) {
      tests.push(colors.red(`${summary.aggregates.failed} failed`))
    }
    if (summary.aggregates.todo) {
      tests.push(colors.cyan(`${summary.aggregates.todo} todo`))
    }
    if (summary.aggregates.skipped) {
      tests.push(colors.yellow(`${summary.aggregates.skipped} skipped`))
    }
    if (summary.aggregates.regression) {
      tests.push(colors.magenta(`${summary.aggregates.regression} regression`))
    }

    this.getRunnerOrThrow().summaryBuilder.use(() => {
      return [
        {
          key: colors.dim('Tests'),
          value: `${tests.join(', ')} ${colors.dim(`(${summary.aggregates.total})`)}`,
        },
        {
          key: colors.dim('Time'),
          value: colors.dim(string.milliseconds.format(summary.duration)),
        },
      ]
    })

    console.log(this.getRunnerOrThrow().summaryBuilder.build().join('\n'))
  }

  /**
   * Aggregates errors tree to a flat array
   */
  protected aggregateErrors(summary: RunnerSummary) {
    const errorsList: { phase: string; title: string; error: Error }[] = []

    summary.failureTree.forEach((suite) => {
      suite.errors.forEach((error) => errorsList.push({ title: suite.name, ...error }))

      suite.children.forEach((testOrGroup) => {
        /**
         * Suite child is a test
         */
        if (testOrGroup.type === 'test') {
          testOrGroup.errors.forEach((error) => {
            errorsList.push({ title: `${suite.name} / ${testOrGroup.title}`, ...error })
          })
          return
        }

        /**
         * Suite child is a group
         */
        testOrGroup.errors.forEach((error) => {
          errorsList.push({ title: testOrGroup.name, ...error })
        })
        testOrGroup.children.forEach((test) => {
          test.errors.forEach((error) => {
            errorsList.push({ title: `${testOrGroup.name} / ${test.title}`, ...error })
          })
        })
      })
    })
    return errorsList
  }

  /**
   * Pretty print errors
   */
  protected async printErrors(summary: RunnerSummary) {
    if (!summary.failureTree.length) {
      return
    }

    const errorPrinter = new ErrorsPrinter({
      framesMaxLimit: this.options.framesMaxLimit,
    })

    errorPrinter.printSectionHeader('ERRORS')
    await errorPrinter.printErrors(this.aggregateErrors(summary))
  }

  /**
   * Handlers to capture events
   */
  protected onTestStart(_node: TestStartNode): void {
    // no-op
  }
  protected onTestEnd(_node: TestEndNode) {
    // no-op
  }

  protected onGroupStart(_node: GroupStartNode) {
    // no-op
  }
  protected onGroupEnd(_node: GroupEndNode) {
    // no-op
  }

  protected onSuiteStart(_node: SuiteStartNode) {
    // no-op
  }
  protected onSuiteEnd(_node: SuiteEndNode) {
    // no-op
  }

  protected async start(_node: RunnerStartNode) {
    // no-op
  }
  protected async end(_node: RunnerEndNode) {
    // no-op
  }

  /**
   * Print tests summary
   */
  protected async printSummary(summary: RunnerSummary) {
    await this.printErrors(summary)

    console.log('')
    if (summary.aggregates.total === 0 && !summary.hasError) {
      console.log(colors.bgYellow().black(' NO TESTS EXECUTED '))
      return
    }

    if (summary.hasError) {
      console.log(colors.bgRed().black(' FAILED '))
    } else {
      console.log(colors.bgGreen().black(' PASSED '))
    }
    console.log('')
    this.printAggregates(summary)
  }

  /**
   * Invoked by the tests runner when tests are about to start
   */
  boot(runner: Runner, emitter: Emitter) {
    this.runner = runner

    emitter.on('test:start', (payload) => {
      this.currentFileName = payload.meta?.fileName
      this.onTestStart(payload as unknown as TestStartNode)
    })

    emitter.on('test:end', (payload) => {
      this.onTestEnd(payload as unknown as TestEndNode)
    })

    emitter.on('group:start', (payload) => {
      this.currentGroupName = payload.title
      this.currentFileName = payload.meta?.fileName
      this.onGroupStart(payload as unknown as GroupStartNode)
    })

    emitter.on('group:end', (payload) => {
      this.currentGroupName = undefined
      this.onGroupEnd(payload as unknown as GroupEndNode)
    })

    emitter.on('suite:start', (payload) => {
      this.currentSuiteName = payload.name
      this.onSuiteStart(payload as unknown as SuiteStartNode)
    })

    emitter.on('suite:end', (payload) => {
      this.currentSuiteName = undefined
      this.onSuiteEnd(payload as unknown as SuiteEndNode)
    })

    emitter.on('runner:start', async (payload) => {
      await this.start(payload as unknown as RunnerStartNode)
    })

    emitter.on('runner:end', async (payload) => {
      await this.end(payload as unknown as RunnerEndNode)
    })
  }
}
