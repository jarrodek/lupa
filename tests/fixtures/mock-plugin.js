export default async function myPlugin(context, options) {
  globalThis.MOCK_PLUGIN_EXECUTED = true
  globalThis.MOCK_PLUGIN_OPTIONS = options
}
