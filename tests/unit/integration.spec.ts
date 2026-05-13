import { test } from 'node:test'
import assert from 'node:assert'
import { fork } from 'node:child_process'
import path from 'node:path'

test('Integration: Lupa Framework End-to-End', async (t) => {
  // Give it a longer timeout since it boots Vite and Playwright
  const TIMEOUT = 30000

  await t.test(
    'executes browser tests, reports telemetry, and exits with correct code',
    { timeout: TIMEOUT },
    async () => {
      const runnerPath = path.join(process.cwd(), 'tests', 'integration', 'run-fixtures.ts')

      const { exitCode, stdout, stderr } = await new Promise<{
        exitCode: number | null
        stdout: string
        stderr: string
      }>((resolve, reject) => {
        const child = fork(runnerPath, [], {
          execArgv: ['--import', 'tsx'],
          cwd: process.cwd(),
          env: {
            ...process.env,
            FORCE_COLOR: '0',
            CI: '1',
          },
          stdio: 'pipe',
        })

        let out = ''
        let err = ''
        child.stdout?.on('data', (data) => (out += data))
        child.stderr?.on('data', (data) => (err += data))

        child.on('exit', (code) => {
          resolve({ exitCode: code, stdout: out, stderr: err })
        })

        child.on('error', reject)
      })

      const output = stdout + '\n' + stderr

      // Verify exit code
      assert.strictEqual(exitCode, 1, `Expected runner to exit with code 1. Output:\n${output}`)

      // Assert that exactly 18 tests passed and 1 failed
      assert.ok(
        output.includes('Tests  18 passed, 1 failed, 1 skipped (20)'),
        `Summary should report 18 passed and 1 failed. Actual output: ${output}`
      )

      // Assert that the failing function stack trace is present
      assert.ok(
        output.includes('failing_function.ts:4:9'),
        'Output should contain source-mapped stack trace to failing_function.ts'
      )

      // Assert that specific test titles were logged by the reporter
      assert.ok(output.includes('this test should fail'), 'Should log the failing test title')
      assert.ok(output.includes('multiply two positive numbers'), 'Should log passing test titles')
    }
  )
})
