// Next calls `register` once per server instance before serving requests;
// despite the name, it's a general boot hook.
//
// The runtime check plus dynamic import keeps the Node-only boot code out of
// the edge bundle.

/**
 * Loads the snapshot and starts the scraper.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { boot } = await import('./instrumentation-node')
    await boot()
  }
}
