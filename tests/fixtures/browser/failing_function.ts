export function failingFunction() {
  // eslint-disable-next-line no-console
  console.log('failing function')
  throw new Error('Failing function')
}
