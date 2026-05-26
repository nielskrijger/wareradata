// `instrumentation.ts` at the project root is a Next.js file convention: Next
// looks for exactly this filename and calls the exported `register` once per
// server instance, before serving requests. The name comes from its original
// purpose (wiring up observability tooling like OpenTelemetry at startup), but
// `register` is really just a "run once on boot" hook, so using it for other
// server-init work is supported and common.
//
// `instrumentation-node.ts` is NOT a Next convention, just a plain sidecar
// module we pair with this file; the dynamic-import-by-runtime pattern below is
// the documented way to keep Node-only code out of the edge bundle.

/**
 * Runs once per server instance before requests are served. We use it to load
 * the persisted snapshot into memory and start the in-process scrape loop. The
 * Node-only logic lives in a separate module imported dynamically, so its `fs`
 * and scraper imports never end up in the edge bundle.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { boot } = await import('./instrumentation-node')
    await boot()
  }
}
