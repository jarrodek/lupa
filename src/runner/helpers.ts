/*
 * @japa/runner
 *
 * (c) Japa
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import timekeeper from 'timekeeper'
import string from '@poppinss/string'
import useColors from '@poppinss/colors'
import supportsColor from 'supports-color'
import { parse } from 'error-stack-parser-es'
import { type Colors } from '@poppinss/colors/types'
import { fileURLToPath } from 'node:url'

// import { Group } from '../testing/group/main.js'
// import type { Runner } from '../runner/runner.js'
import { Test } from '../testing/test/main.js'

export const colors: Colors = supportsColor.stdout ? useColors.ansi() : useColors.silent()

/**
 * A collection of platform specific icons
 */
export const icons =
  process.platform === 'win32' && !process.env.WT_SESSION
    ? {
        tick: '√',
        cross: '×',
        bullet: '*',
        nodejs: '♦',
        pointer: '>',
        info: 'i',
        warning: '‼',
        branch: ' -',
        squareSmallFilled: '[█]',
      }
    : {
        tick: '✔',
        cross: '✖',
        bullet: '●',
        nodejs: '⬢',
        pointer: '❯',
        info: 'ℹ',
        warning: '⚠',
        branch: '└──',
        squareSmallFilled: '◼',
      }

/**
 * Returns a formatted string to print the information about
 * a pinned test
 */
export function formatPinnedTest(test: Test<any>) {
  let fileName = ''
  let line = 0
  let column = 0

  /**
   * Throwing an error using the "meta.abort" method which will help
   * us find the test location by parsing error stack frame
   */
  try {
    test.options.meta.abort('Finding pinned test location')
  } catch (error) {
    const frame = parse(error as Error).find(
      (f) =>
        f.fileName &&
        f.lineNumber !== undefined &&
        f.columnNumber !== undefined &&
        !f.fileName.includes('node:') &&
        !f.fileName.includes('ext:') &&
        !f.fileName.includes('node_modules/')
    )

    if (frame && frame.fileName) {
      fileName = frame.fileName.startsWith('file:')
        ? string.toUnixSlash(fileURLToPath(frame.fileName))
        : string.toUnixSlash(frame.fileName)

      line = frame.lineNumber ?? 0
      column = frame.columnNumber ?? 0
    }
  }

  return `${colors.yellow(` ⁃ ${test.title}`)}\n${colors.dim(`   ${fileName}:${line}:${column}`)}`
}

// /**
//  * Prints a summary of all the pinned tests
//  */
// export function printPinnedTests(runner: Runner<TestContext>) {
//   let pinnedTests: string[] = []
//   runner.suites.forEach((suite) => {
//     suite.stack.forEach((testOrGroup: Test<TestContext> | Group<TestContext>) => {
//       if (testOrGroup instanceof Group) {
//         testOrGroup.tests.forEach(($test) => {
//           if ($test.isPinned) {
//             pinnedTests.push(formatPinnedTest($test))
//           }
//         })
//       } else if (testOrGroup.isPinned) {
//         pinnedTests.push(formatPinnedTest(testOrGroup))
//       }
//     })
//   })

//   if (pinnedTests.length) {
//     console.log(colors.bgYellow().black(` ${pinnedTests.length} pinned test(s) found `))
//     pinnedTests.forEach((row) => console.log(row))
//   } else {
//     console.log(colors.bgYellow().black(` No pinned tests found `))
//   }
// }

export const dateTimeDoubles = {
  reset() {
    timekeeper.reset()
  },
  travelTo(durationOrDate: string | number | Date) {
    if (durationOrDate instanceof Date) {
      timekeeper.travel(durationOrDate)
    } else {
      const travelToDate = new Date()
      travelToDate.setMilliseconds(travelToDate.getMilliseconds() + string.milliseconds.parse(durationOrDate))
      timekeeper.travel(travelToDate)
    }
  },
  freeze(date?: Date) {
    timekeeper.freeze(date)
  },
}
