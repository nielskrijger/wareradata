import type { RawSnapshot } from '@/lib/cache/file-store'

import { recordBattleHistory } from '@/lib/cache/archive'
import { readRawSnapshot, writeRawSnapshot } from '@/lib/cache/file-store'
import { buildSnapshotNow, swapSnapshot } from '@/lib/cache/memory'
import { getMuMembers, getUserLiteUrgent } from '@/lib/warera/api'
import { scrapeRawSnapshot } from '@/lib/warera/scrape'

import 'server-only'

// The most recent raw snapshot, plus per-MU in-flight refresh promises. Kept on
// globalThis for the same reason as the built snapshot (see memory.ts): Next
// loads server modules in several graphs within one process, so a module-level
// `let` would give the scrape loop and a Server Action separate copies, and an
// on-demand patch in one wouldn't build on the other's base. The global store
// makes the raw base and the dedupe map process-wide.
interface ScraperStore {
  currentRaw: RawSnapshot | null
  inFlightMuRefreshes: Map<string, Promise<void>>
}

const GLOBAL_KEY = Symbol.for('wareradata.scraperStore')

function store(): ScraperStore {
  const g = globalThis as typeof globalThis & { [GLOBAL_KEY]?: ScraperStore }
  g[GLOBAL_KEY] ??= { currentRaw: null, inFlightMuRefreshes: new Map() }
  return g[GLOBAL_KEY]
}

let started = false

/**
 * Publishes a full-cycle raw snapshot: record it as current, persist to disk,
 * rebuild rows, and swap the in-memory snapshot readers serve. Only the scrape
 * loop persists; on-demand refreshes update memory only (see refreshMuMembers).
 */
async function publish(raw: RawSnapshot): Promise<void> {
  store().currentRaw = raw
  await writeRawSnapshot(raw)
  swapSnapshot(buildSnapshotNow(raw, 'scrape'))
}

/**
 * The continuous full-scrape loop. Runs on the scrape client (its own rate-limit
 * budget), so it never competes with urgent on-demand traffic. Each cycle
 * publishes the snapshot, folds finished battles into the archive, then starts
 * the next cycle. Errors are logged and the loop continues after a short pause.
 */
async function scrapeLoop(): Promise<void> {
  for (;;) {
    try {
      console.info('[scraper] full scrape starting')
      const raw = await scrapeRawSnapshot()
      await publish(raw)
      console.info('[scraper] full scrape published')

      try {
        const result = await recordBattleHistory(raw.battles)
        console.info('[archive]', JSON.stringify(result))
      } catch (err) {
        console.error('[archive] failed', err instanceof Error ? err.message : err)
      }
    } catch (err) {
      console.error('[scraper] full scrape failed', err instanceof Error ? err.message : err)
      await new Promise(resolve => setTimeout(resolve, 10_000))
    }
  }
}

/**
 * Refreshes one MU's members on demand and resolves when the in-memory snapshot
 * has been updated, so a caller (the page's "Request refresh" action) can await
 * it and then re-render with fresh data. Runs on the urgent client, separate
 * from the scrape budget.
 *
 * In-memory only: it patches `currentRaw` and swaps the built snapshot, but does
 * NOT write the file. The scrape loop alone owns the persisted snapshot, so a
 * manual refresh is a transient overlay that the next full cycle subsumes.
 *
 * Rebuilding the whole snapshot keeps the MU's aggregates, its members' rows,
 * the parent country's aggregates, and all ranks globally consistent. Concurrent
 * requests for the same MU share one fetch. No-ops if no base snapshot exists
 * yet (the scrape loop will cover it).
 */
export function refreshMuMembers(muId: string): Promise<void> {
  const s = store()
  const existing = s.inFlightMuRefreshes.get(muId)
  if (existing) {
    return existing
  }

  const run = doRefreshMuMembers(muId).finally(() => {
    s.inFlightMuRefreshes.delete(muId)
  })
  s.inFlightMuRefreshes.set(muId, run)
  return run
}

async function doRefreshMuMembers(muId: string): Promise<void> {
  // Ensure a base to patch. In a single process this is already set by the
  // scrape loop; if this runs before the first cycle we seed it from the file.
  await seedCurrentRaw()
  const s = store()
  if (!s.currentRaw) {
    return
  }

  const roster = await getMuMembers(muId)
  const userIds = roster.map(m => m.user)
  if (!userIds.length) {
    return
  }

  const fresh = await getUserLiteUrgent(userIds)

  const byId = new Map(s.currentRaw.users.map(u => [u._id, u]))
  for (const u of fresh) {
    byId.set(u._id, u)
  }

  const now = new Date().toISOString()
  const patched: RawSnapshot = {
    ...s.currentRaw,
    users: [...byId.values()],
    mus: s.currentRaw.mus.map(m => (m._id === muId ? { ...m, members: userIds, lastRefreshedAt: now } : m)),
  }

  // In-memory only: update currentRaw and the served snapshot, but do not
  // persist (the scrape loop owns the file).
  s.currentRaw = patched
  swapSnapshot(buildSnapshotNow(patched, `mu-refresh ${muId}`))
  console.info(`[scraper] MU ${muId} refreshed on demand (${fresh.length} members)`)
}

/**
 * Starts the continuous scraper. Called once from the instrumentation hook
 * after the boot snapshot is loaded. Seeds `currentRaw` from the persisted file
 * (so piecemeal works before the first cycle) then runs the loop. Do not await:
 * the loop never ends.
 */
export function startScraper(): void {
  if (started) {
    return
  }
  started = true

  void seedCurrentRaw().finally(() => {
    void scrapeLoop()
  })
}

async function seedCurrentRaw(): Promise<void> {
  const s = store()
  if (s.currentRaw) {
    return
  }
  try {
    const raw = await readRawSnapshot()
    if (raw && !s.currentRaw) {
      s.currentRaw = raw
    }
  } catch (err) {
    console.error('[scraper] seed from file failed', err instanceof Error ? err.message : err)
  }
}
