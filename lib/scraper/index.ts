import type { RawSnapshot } from '@/lib/cache/file-store'
import type { User } from '@/lib/warera/api'

import { recordBattleHistory } from '@/lib/cache/archive'
import { appendEquipmentLines } from '@/lib/cache/equipment-store'
import { readRawSnapshot, writeRawSnapshot } from '@/lib/cache/file-store'
import { buildSnapshotFromRaw, swapSnapshot } from '@/lib/cache/memory'
import { loadFactoryOwnerIds } from '@/lib/cache/users-store'
import { buildEngineModel } from '@/lib/factories/engine'
import { logger, logMemory, logRetainedMemory } from '@/lib/log'
import { getEquipmentUrgent, getGameConfig, getMuMembers, getUsersUrgent, takeRetryStats } from '@/lib/warera/api'
import { scrapeFactories } from '@/lib/warera/scrape-factories'
import { scrapeMain } from '@/lib/warera/scrape-main'

import 'server-only'

/**
 * The latest raw snapshot, the refresh overlay and in-flight refreshes.
 *
 * On globalThis for the same reason as the built snapshot (see memory.ts), so
 * the scrape loop and a Server Action share one copy.
 */
interface ScraperStore {
  currentRaw: RawSnapshot | null

  /**
   * Refreshed profiles the build merges over users.ndjson, so a refresh needn't
   * rewrite the 84 MB file. Each main cycle clears it.
   */
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

const log = logger.child({ component: 'scraper' })
const factoryLog = logger.child({ component: 'factory-scrape' })

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
 * Runs back to back on its own rate-limit budget, so it never competes with
 * on-demand traffic. A failed cycle pauses briefly and retries.
 */
async function mainScrapeLoop(): Promise<void> {
  for (;;) {
    try {
      logMemory(log, 'cycle-start')
      log.info('main scrape starting')
      const raw = await scrapeMain(store().currentRaw)
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
 * Runs back to back on its own small budget and only rewrites factories.ndjson;
 * the next main cycle picks it up, so no rebuild here.
 *
 * Memory is logged around each pass so an OOM can be pinned on this loop.
 */
async function factoryScrapeLoop(): Promise<void> {
  for (;;) {
    try {
      const ownerIds = await loadFactoryOwnerIds()
      if (!ownerIds.length) {
        await new Promise(resolve => setTimeout(resolve, 60_000))
        continue
      }

      logMemory(factoryLog, 'factory-pass start')
      factoryLog.info('all-users pass starting')
      const model = buildEngineModel(await getGameConfig())
      const count = await scrapeFactories(ownerIds, model)
      factoryLog.info({ withFactories: count, ...takeRetryStats('factory') }, 'all-users pass done')
      logRetainedMemory(factoryLog, 'factory-pass end')
    } catch (err) {
      factoryLog.error({ err }, 'pass failed')
      await new Promise(resolve => setTimeout(resolve, 30_000))
    }
  }
}

/**
 * Resolves once the snapshot holds the fresh members, so the page action can
 * await it and re-render. Concurrent requests for one MU share a fetch.
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
 * Re-fetches users on the urgent client, applies an optional raw patch, and
 * rebuilds the snapshot.
 *
 * Nothing big is rewritten: profiles go to the overlay and gear is appended;
 * the next main cycle subsumes both. A full rebuild keeps every aggregate and
 * rank consistent.
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

  const [freshRaw, equipmentRaw] = await Promise.all([
    getUsersUrgent(userIds),
    getEquipmentUrgent(userIds),
  ])

  const fresh = freshRaw.filter(u => u !== undefined)
  const equipmentIds = userIds.filter((_, i) => equipmentRaw[i] !== undefined)
  const freshEquipment = equipmentRaw.filter(e => e !== undefined)

  // The reader takes the last line per user, so this overrides the scrape's
  // line until the next main cycle.
  await appendEquipmentLines(equipmentIds, freshEquipment)

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
 * Starts the loops; don't await, they never end. Seeds `currentRaw` first so a
 * refresh works before the first cycle.
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
