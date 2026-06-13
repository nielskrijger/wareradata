import type { RawSnapshot } from '@/lib/cache/file-store'

import { recordBattleHistory } from '@/lib/cache/archive'
import { readFactorySnapshot } from '@/lib/cache/factory-store'
import { readRawSnapshot, writeRawSnapshot } from '@/lib/cache/file-store'
import { buildSnapshotNow, swapSnapshot } from '@/lib/cache/memory'
import { getEquipmentUrgent, getMuMembers, getUsersUrgent } from '@/lib/warera/api'
import { scrapeRawSnapshot } from '@/lib/warera/scrape'

import 'server-only'

// The most recent raw snapshot, plus in-flight on-demand refresh promises keyed
// by `<kind>:<id>` (mu / user). Kept on globalThis for the same reason as the
// built snapshot (see memory.ts): Next loads server modules in several graphs
// within one process, so a module-level `let` would give the scrape loop and a
// Server Action separate copies, and an on-demand patch in one wouldn't build on
// the other's base. The global store makes the raw base and the dedupe map
// process-wide.
interface ScraperStore {
  currentRaw: RawSnapshot | null
  inFlightRefreshes: Map<string, Promise<void>>
}

const GLOBAL_KEY = Symbol.for('wareradata.scraperStore')

function store(): ScraperStore {
  const g = globalThis as typeof globalThis & { [GLOBAL_KEY]?: ScraperStore }
  g[GLOBAL_KEY] ??= { currentRaw: null, inFlightRefreshes: new Map() }
  return g[GLOBAL_KEY]
}

let started = false

const MB = 1024 * 1024

/**
 * Logs a one-line memory breakdown tagged with `label`. Tracking the SAME point
 * every cycle is how we tell a real leak from the expected mid-cycle sawtooth:
 * a leak shows the post-GC baseline climbing cycle over cycle, a sawtooth keeps
 * it flat. `external` / `arrayBuffers` climbing (rather than `heapUsed`) points
 * at native retention (undici sockets, undrained response buffers) instead of
 * JS objects.
 */
function logMemory(label: string): void {
  const m = process.memoryUsage()
  console.info(
    `[scraper] mem ${label}: `
    + `rss=${Math.round(m.rss / MB)}MB `
    + `heapUsed=${Math.round(m.heapUsed / MB)}MB `
    + `heapTotal=${Math.round(m.heapTotal / MB)}MB `
    + `external=${Math.round(m.external / MB)}MB `
    + `arrayBuffers=${Math.round(m.arrayBuffers / MB)}MB`,
  )
}

/**
 * Forces a full GC (only available under `node --expose-gc`) then logs memory,
 * so the number reflects what's actually retained rather than uncollected
 * garbage. Without `--expose-gc` it falls back to a plain reading.
 */
function logRetainedMemory(label: string): void {
  const gc = (globalThis as typeof globalThis & { gc?: () => void }).gc
  if (gc) {
    gc()
  }
  logMemory(gc ? `${label} (post-gc)` : label)
}

/**
 * Publishes a full-cycle raw snapshot: record it as current, persist to disk,
 * rebuild rows, and swap the in-memory snapshot readers serve. Only the scrape
 * loop persists; on-demand refreshes update memory only (see refreshMuMembers).
 */
async function publish(raw: RawSnapshot): Promise<void> {
  store().currentRaw = raw
  await writeRawSnapshot(raw)
  swapSnapshot(buildSnapshotNow(raw, 'scrape', await readFactorySnapshot()))
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
      logMemory('cycle-start')
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

      // Measure AFTER the swap, when the previous snapshot should be collectible.
      // The trend of this post-GC baseline over many cycles is the leak signal.
      logRetainedMemory('cycle-end')
    } catch (err) {
      console.error('[scraper] full scrape failed', err instanceof Error ? err.message : err)
      await new Promise(resolve => setTimeout(resolve, 10_000))
    }
  }
}

/**
 * Refreshes one MU's members on demand and resolves when the in-memory snapshot
 * has been updated, so a caller (the page's refresh action) can await it and
 * then re-render with fresh data. Runs on the urgent client, separate from the
 * scrape budget. Concurrent requests for the same MU share one fetch.
 */
export function refreshMuMembers(muId: string): Promise<void> {
  return dedupe(`mu:${muId}`, () => doRefreshMuMembers(muId))
}

/**
 * Refreshes one user on demand (their lite profile + equipment), mirroring
 * {@link refreshMuMembers}. Concurrent requests for the same user share one fetch.
 */
export function refreshUser(userId: string): Promise<void> {
  return dedupe(`user:${userId}`, () => doRefreshUser(userId))
}

/**
 * Single-flight by key: a refresh started while one with the same key is in
 * flight reuses it. Keys are namespaced (`mu:<id>` / `user:<id>`) since MU and
 * user ids share a format.
 */
function dedupe(key: string, run: () => Promise<void>): Promise<void> {
  const map = store().inFlightRefreshes
  const existing = map.get(key)
  if (existing) {
    return existing
  }
  const promise = run().finally(() => map.delete(key))
  map.set(key, promise)
  return promise
}

async function doRefreshMuMembers(muId: string): Promise<void> {
  const userIds = (await getMuMembers(muId)).map(m => m.user)
  await refreshUsersInSnapshot(userIds, `mu-refresh ${muId}`, (raw, now) => ({
    mus: raw.mus.map(m => (m._id === muId ? { ...m, members: userIds, lastRefreshedAt: now } : m)),
  }))
}

async function doRefreshUser(userId: string): Promise<void> {
  await refreshUsersInSnapshot([userId], `user-refresh ${userId}`)
}

/**
 * Shared core of the on-demand refreshes. Re-fetches the given users' lite
 * profiles + equipment via the urgent client, stamps each with the refresh time
 * (so their pages show fresh data), merges them into a copy of `currentRaw`,
 * applies an optional entity-specific patch (e.g. an MU's member list and its
 * own timestamp), then rebuilds and swaps the served snapshot.
 *
 * In-memory only: it patches `currentRaw` and the built snapshot but does NOT
 * write the file. The scrape loop alone owns the persisted snapshot, so a manual
 * refresh is a transient overlay the next full cycle subsumes. Rebuilding the
 * whole snapshot keeps every aggregate and rank globally consistent. No-ops if
 * no base snapshot exists yet, or `userIds` is empty.
 */
async function refreshUsersInSnapshot(
  userIds: string[],
  reason: string,
  patch?: (raw: RawSnapshot, now: string) => Partial<RawSnapshot>,
): Promise<void> {
  // Ensure a base to patch. In a single process the scrape loop has already set
  // this; if we run before the first cycle, seed it from the file.
  await seedCurrentRaw()
  const s = store()
  if (!s.currentRaw || !userIds.length) {
    return
  }

  const [fresh, freshEquipment] = await Promise.all([
    getUsersUrgent(userIds),
    getEquipmentUrgent(userIds),
  ])

  const now = new Date().toISOString()
  const byId = new Map(s.currentRaw.users.map(u => [u._id, u]))
  for (const u of fresh) {
    byId.set(u._id, { ...u, lastRefreshedAt: now })
  }
  const equipment = { ...s.currentRaw.equipment }
  for (let i = 0; i < userIds.length; i++) {
    equipment[userIds[i]] = freshEquipment[i]
  }

  const base: RawSnapshot = { ...s.currentRaw, users: [...byId.values()], equipment }
  const patched = patch ? { ...base, ...patch(base, now) } : base

  s.currentRaw = patched
  swapSnapshot(buildSnapshotNow(patched, reason, await readFactorySnapshot()))
  console.info(`[scraper] on-demand refresh: ${reason} (${fresh.length} users)`)
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
