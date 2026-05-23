import { invalidateSnapshot } from '@/lib/cache/memory'
import { runFullScrape } from '@/lib/warera/scrape'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

/**
 * Constant-time string compare so timing differences can't leak the secret one
 * byte at a time.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

/**
 * Triggered hourly by the `refresh-data` GitHub Actions workflow. Runs the full
 * scrape inline (~4 min, fits inside Vercel's 300s function cap).
 */
export async function POST(req: Request) {
  const secret = process.env.REFRESH_SECRET
  if (!secret) {
    console.error('[refresh] REFRESH_SECRET is not configured')
    return Response.json({ error: 'server misconfigured' }, { status: 500 })
  }

  const provided = req.headers.get('x-refresh-secret') ?? ''
  if (!timingSafeEqual(provided, secret)) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const result = await runFullScrape()
    // Drop the in-process snapshot cache so this worker re-loads fresh data
    // on its next page render. Other warm workers will catch up via TTL.
    invalidateSnapshot()
    return Response.json(result)
  } catch (err) {
    console.error('[refresh] scrape failed', err)
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
