import type { RawSnapshot } from '@/lib/cache/file-store'
import type { User } from '@/lib/warera/api'

import { recordBattleHistory } from '@/lib/cache/archive'
import { appendEquipmentLines } from '@/lib/cache/equipment-store'
import { readRawSnapshot, writeRawSnapshot } from '@/lib/cache/file-store'
import { buildSnapshotFromRaw, swapSnapshot } from '@/lib/cache/memory'
import { loadCompanyOwnerIds } from '@/lib/cache/users-store'
import { logger, logMemory, logRetainedMemory } from '@/lib/log'
import { getEquipmentUrgent, getMuMembers, getUsersUrgent } from '@/lib/warera/api'
import { scrapeFactories } from '@/lib/warera/scrape-factories'
import { scrapeMain } from '@/lib/warera/scrape-main'

import 'server-only'

// The most recent raw snapshot (small now that users/equipment live in their own
// files), the user-refresh overlay, and in-flight on-demand refresh promises
// keyed by `<kind>:<id>` (mu / user). Kept on globalThis for the same reason as
// the built snapshot (see memory.ts): Next loads server modules in several graphs
// within one process, so a module-level `let` would give the scrape loop and a
// Server Action separate copies, and an on-demand patch in one wouldn't build on
// the other's base. The global store makes them process-wide.
interface ScraperStore {
  currentRaw: RawSnapshot | null
  // Fresh user profiles from on-demand refreshes, keyed by user id. The build
  // merges these over users.ndjson (last-wins) so a refreshed user's rows are
  // current without rewriting the 84 MB file; each main cycle rewrites the file
  // whole and clears this.
  userOverlay: Map<string, User>
  inFlightRefreshes: Map<string, Promise<void>>
}

const GLOBAL_KEY = Symbol.for('wareradata.scraperStore')

function store(): ScraperStore {
  const g = globalThis as typeof globalThis & { [GLOBAL_KEY]?: ScraperStore }
  g[GLOBAL_KEY] ??= { currentRaw: null, userOverlay: new Map(), inFlightRefreshes: new Map() }
  return g[GLOBAL_KEY]
}

let started = false

const log = logger.child({ phase: 'scraper' })
const factoryLog = logger.child({ phase: 'factory-scrape' })

/**
 * Publishes a full-cycle raw snapshot: record it as current, persist to disk,
 * rebuild rows, and swap the in-memory snapshot readers serve. Only the scrape
 * loop persists; on-demand refreshes update memory only (see refreshMuMembers).
 */
async function publish(raw: RawSnapshot): Promise<void> {
  // The scrape just rewrote users.ndjson whole, so the on-demand overlay is
  // stale: drop it and build from the fresh file.
  store().currentRaw = raw
  store().userOverlay.clear()
  await writeRawSnapshot(raw)
  swapSnapshot(await buildSnapshotFromRaw(raw, 'scrape'))
}

/**
 * The continuous main-scrape loop. Runs on the scrape client (its own rate-limit
 * budget), so it never competes with urgent on-demand traffic. Each cycle
 * publishes the snapshot, folds finished battles into the archive, then starts
 * the next cycle. Errors are logged and the loop continues after a short pause.
 */
async function mainScrapeLoop(): Promise<void> {
  for (;;) {
    try {
      logMemory(log, 'cycle-start')
      log.info('main scrape starting')
      const raw = await scrapeMain()
      await publish(raw)
      log.info('main scrape published')

      try {
        const result = await recordBattleHistory(raw.battles)
        log.info({ result }, 'archive recorded')
      } catch (err) {
        log.error({ err }, 'archive failed')
      }

      // Measure AFTER the swap, when the previous snapshot should be collectible.
      // The trend of this post-GC baseline over many cycles is the leak signal.
      logRetainedMemory(log, 'cycle-end')
    } catch (err) {
      log.error({ err }, 'main scrape failed')
      await new Promise(resolve => setTimeout(resolve, 10_000))
    }
  }
}

/**
 * The continuous all-users factory scrape loop, back-to-back like the main
 * scrape. Runs on the factory client (its own small rate-limit budget),
 * independent of the main scrape and urgent traffic. Each pass only rewrites
 * `factories.ndjson` (streamed, no accumulator); the main loop reapplies it on
 * its next cycle, so we deliberately do NOT rebuild the snapshot here. Memory is
 * logged at pass start/end (with heap-vs-limit %), and `scrapeFactories`
 * logs it mid-pass, so an OOM is attributable to this loop rather than guessed.
 * Streams users.ndjson for the company-owner list; waits for it before the first
 * pass.
 */
async function factoryScrapeLoop(): Promise<void> {
  for (;;) {
    try {
      const userIds = await loadCompanyOwnerIds()
      if (!userIds.length) {
        await new Promise(resolve => setTimeout(resolve, 60_000))
        continue
      }

      logMemory(factoryLog, 'factory-pass start')
      factoryLog.info('all-users pass starting')
      const count = await scrapeFactories(userIds)
      factoryLog.info({ withFactories: count }, 'all-users pass done')
      logRetainedMemory(factoryLog, 'factory-pass end')
    } catch (err) {
      factoryLog.error({ err }, 'pass failed')
      await new Promise(resolve => setTimeout(resolve, 30_000))
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
 * profiles + equipment via the urgent client, stamps each profile with the
 * refresh time (so their pages show fresh data), stashes the profiles in the
 * user overlay and appends the fresh gear to the equipment file, applies an
 * optional entity-specific patch (e.g. an MU's member list and its own
 * timestamp), then rebuilds and swaps the served snapshot.
 *
 * Does NOT rewrite the big files: it patches in-memory `currentRaw`, merges the
 * overlay over users.ndjson at build, and only appends to the equipment file
 * (both subsumed when the next main cycle rewrites them clean). The scrape loop
 * alone owns the persisted snapshot, so a manual refresh is a transient overlay
 * the next full cycle subsumes. Rebuilding the whole snapshot keeps every
 * aggregate and rank globally consistent. No-ops if no base snapshot exists yet,
 * or `userIds` is empty.
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

  // Append the fresh gear to the equipment file. The reader takes the last
  // line per user, so this overrides the scrape's line until the next main cycle
  // rewrites the file; the rebuild below streams it back for gear scoring, and
  // the user detail page reads the same line.
  await appendEquipmentLines(userIds, freshEquipment)

  // Stash the fresh profiles in the overlay (keyed by id) so the rebuild below
  // streams users.ndjson with these merged on top — no rewrite of the 84 MB file
  // for a handful of users. The next main cycle rewrites the file and clears it.
  const now = new Date().toISOString()
  for (const u of fresh) {
    s.userOverlay.set(u._id, { ...u, lastRefreshedAt: now })
  }

  const patched = patch ? { ...s.currentRaw, ...patch(s.currentRaw, now) } : s.currentRaw

  s.currentRaw = patched
  swapSnapshot(await buildSnapshotFromRaw(patched, reason, s.userOverlay))
  log.info({ reason, users: fresh.length }, 'on-demand refresh')
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
    void mainScrapeLoop()
    void factoryScrapeLoop()
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
    log.error({ err }, 'seed from file failed')
  }
}
