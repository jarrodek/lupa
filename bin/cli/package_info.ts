import { readFileSync } from 'node:fs'

let cachedPkg: any = null

/**
 * Reads the package.json file and returns it
 */
export default function readPackageJson() {
  if (cachedPkg) {
    return cachedPkg
  }

  try {
    cachedPkg = JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf-8'))
  } catch {
    cachedPkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf-8'))
  }

  return cachedPkg
}
