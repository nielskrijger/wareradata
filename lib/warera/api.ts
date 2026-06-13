import type {
  Alliance,
  BattleGetBattlesResponse,
  BattleListItem,
  CompanyGetByIdResponse,
  CompanyProductionBonusResponse,
  CountryListItem,
  GameConfigGetGameConfigResponse,
  GovernmentGetByCountryIdResponse,
  InventoryFetchCurrentEquipmentResponse,
  ItemTradingGetPricesResponse,
  MuListItem,
  MuMemberListItem,
  MuRankingsOptional,
  PartyGetManyPaginatedResponse,
  RankingValueTier,
  RecommendedRegion,
  RegionsObjectItem,
  UserGetUserLiteResponse,
  WorkStatsItem,
} from '@wareraprojects/api'

import { createAPIClient } from '@wareraprojects/api'

// The package's generated types are narrower than what the live API returns
// (the OpenAPI spec doesn't document every field). We re-widen here so our
// code can keep reading fields that exist at runtime but are missing from
// MuListItem / CountryListItem.
export type Country = CountryListItem
export type MU = Omit<MuListItem, 'rankings'> & {
  investedMoneyByUsers?: Record<string, number>
  rankings?: MuRankingsOptional & { muReputation?: RankingValueTier }
  // Not from the API: stamped by the scraper at capture time, and updated by an
  // on-demand member refresh, so the UI can show how fresh an MU's data is.
  lastRefreshedAt?: string
}
export type Party = PartyGetManyPaginatedResponse['items'][number]
export type Region = RegionsObjectItem
// Multi-country bloc (the alliances feature shipped 2026-06-10). The SDK types
// this natively since v0.3.3; re-exported so the rest of the codebase imports
// every WarEra entity from this module.
export type { Alliance } from '@wareraprojects/api'

// The live API returns more on a battle than the generated BattleListItem: the
// finished-battle outcome (`wonBy`, `endedAt`) and per-side `moneyPool` /
// `bountyEffectiveAt` are present at runtime but missing from the spec. We
// re-widen here, same as MU / Country above.
export type Battle = BattleListItem & {
  endedAt?: string
  wonBy?: 'attacker' | 'defender'
  // Tournament battles carry these instead of a `war`; each side has a
  // `tournamentTeam` rather than a `country`.
  tournament?: string
  tournamentRoundNumber?: number
  attacker: BattleListItem['attacker'] & { moneyPool?: number, bountyEffectiveAt?: string, tournamentTeam?: string }
  defender: BattleListItem['defender'] & { moneyPool?: number, bountyEffectiveAt?: string, tournamentTeam?: string }
}
// One case type's opening counts, broken down by loot rarity. Present in the
// getUserById stats payload (which the scrape now uses), absent on the old lite
// payload — hence optional everywhere.
export interface CaseStat {
  byRarity?: Record<string, number>
  openedCount?: number
}
// The components that sum to a user's total wealth (all in gold), from the
// getUserById `stats.wealth` payload: companies owned, items in storage, cash on
// hand, equipped gear, and weapons. `total` is their sum (≈ the userWealth
// ranking value, modulo capture timing). Every field is optional (absent on the
// old lite payload and on the small fraction of users a fresh scrape hasn't
// reached), so readers default to null.
export interface WealthBreakdown {
  companies?: number
  items?: number
  money?: number
  equipments?: number
  weapons?: number
  total?: number
}
// Users are hydrated via getUserById, whose payload is a superset of the lite
// endpoint's. We base this type on the generated lite-response type only because
// it types the fields we read (rankings, skills, …) precisely, whereas the
// getUserById response type is looser (Record-typed); both describe the same
// runtime object. The extra getUserById fields we consume are surfaced below.
// See hydrateUsers.
export type User = UserGetUserLiteResponse & {
  infos?: { isBanned?: boolean, colorScheme?: string }
  dates?: { lastConnectionAt?: string }
  stats?: UserGetUserLiteResponse['stats'] & { case1?: CaseStat, case2?: CaseStat, wealth?: WealthBreakdown }
  // Not from the API: stamped by the scraper at capture time, and updated by an
  // on-demand refresh, so the user page can show how fresh the data is.
  lastRefreshedAt?: string
  // Active drug effect (cocaine: +60% attack for 8h, then -60% for 16h). Present
  // in the getUserById payload but absent from the SDK types, so we widen it
  // here. Only the buff* or the debuff* pair is set at a time; the whole object
  // is absent when no effect is active.
  buffs?: {
    buffCodes?: string[]
    buffEndAt?: string
    debuffCodes?: string[]
    debuffEndAt?: string
  }
}
// One user's currently-equipped gear. Each slot is optional: players strip gear
// between battles to preserve durability, so the response is often `{}`.
export type Equipment = InventoryFetchCurrentEquipmentResponse
// The game's static config (item catalog, skill cost curves, upgrade tiers, …).
// Scraped once per cycle so derived constants (e.g. gear roll bounds, skill
// point costs) can read from live data instead of being hardcoded.
export type GameConfig = GameConfigGetGameConfigResponse
// A country's elected officials. All fields are user ids: the president, vice
// president, three ministers, and the congress roster. Dormant or unoccupied
// countries may have empty-string offices and an empty congress.
export type Government = GovernmentGetByCountryIdResponse

export const RANKING_TIERS = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master'] as const
export type RankingTier = (typeof RANKING_TIERS)[number]

/**
 * Progression index of each ranking tier (bronze = 0 … master = 5), so tier
 * columns sort by strength instead of alphabetically. Derived once from
 * {@link RANKING_TIERS}; shared by the table sort specs.
 */
export const TIER_INDEX: Record<string, number> = Object.fromEntries(
  RANKING_TIERS.map((t, i) => [t, i]),
)

export interface SnapshotMeta {
  entityCounts?: Record<string, number>
  scrapedAt?: string
  scrapeDurationMs?: number
}

// Three independent clients, each with its own rate-limit budget (the limit is
// enforced per client at the fetch level). Splitting by purpose means urgent,
// on-demand work never waits behind the long continuous scrape, and vice versa.
//
//  - scrapeClient:  the background main-scrape loop. Gets the largest share so
//    the leaderboard data stays fresh.
//  - urgentClient:  latency-sensitive on-demand traffic (MU refreshes, live
//    battles, the user-page factory fetch).
//  - factoryClient: the all-users factory scrape. The first full pass is done,
//    so this is back to a maintenance share (a full re-pass takes ~7h, fine for
//    slow-changing factory economics).
//
// The three sum to 200, the API's authenticated cap, so all three together stay
// within budget. Tune them here; rebalancing is a code change, not config.
const SCRAPE_RATE_LIMIT = 120
const URGENT_RATE_LIMIT = 40
export const FACTORY_RATE_LIMIT = 40

const scrapeClient = createAPIClient({
  apiKey: process.env.WARERA_API_KEY,
  rateLimit: SCRAPE_RATE_LIMIT,
})

const urgentClient = createAPIClient({
  apiKey: process.env.WARERA_API_KEY,
  rateLimit: URGENT_RATE_LIMIT,
})

const factoryClient = createAPIClient({
  apiKey: process.env.WARERA_API_KEY,
  rateLimit: FACTORY_RATE_LIMIT,
})

type Client = typeof scrapeClient

export function getAllCountries(): Promise<Country[]> {
  return scrapeClient.country.getAllCountries()
}

/**
 * Fetches one country's government (president, vice president, three ministers,
 * and the congress roster, all as user ids). There's no bulk endpoint, so the
 * scrape fans this out per country with bounded concurrency. Dormant countries
 * may have no government; the caller treats an error or empty result as "none".
 */
export function getGovernmentForCountry(countryId: string): Promise<Government> {
  return scrapeClient.government.getByCountryId({ countryId })
}

/**
 * Fetches the game's static configuration (item stats, skill cost curves,
 * upgrade tiers, …). A single no-arg call; it changes only when the devs
 * rebalance, so one fetch per scrape cycle is plenty.
 */
export function getGameConfig(): Promise<GameConfig> {
  return scrapeClient.gameConfig.getGameConfig()
}

export async function getUserIdsForCountry(countryId: string): Promise<string[]> {
  const ids: string[] = []
  for await (const page of scrapeClient.user.getUsersByCountry({ countryId, autoPaginate: true })) {
    for (const item of page.items) {
      ids.push(item._id)
    }
  }
  return ids
}

async function hydrateUsers(client: Client, userIds: string[]): Promise<User[]> {
  // getUserById returns a superset of the lite endpoint (verified field-by-field:
  // same rankings/skills/infos/dates, plus richer stats such as the per-rarity
  // case breakdown). Storage is no longer capped, so we capture the whole payload
  // and project what we need on read. The response shape is looser than User
  // (partial rankings, opaque skills), but every field we read is present at
  // runtime, so we narrow it here.
  const users = await Promise.all(userIds.map(userId => client.user.getUserById({ userId })))
  return users as unknown as User[]
}

/**
 * Hydrates users via the scrape client, for the main-scrape user phase.
 */
export function getUsers(userIds: string[]): Promise<User[]> {
  return hydrateUsers(scrapeClient, userIds)
}

/**
 * Hydrates users via the urgent client, for on-demand piecemeal refreshes.
 */
export function getUsersUrgent(userIds: string[]): Promise<User[]> {
  return hydrateUsers(urgentClient, userIds)
}

// Case loot rarities, weakest to strongest. Doubles as the render order for the
// user page's per-rarity breakdown.
export const CASE_RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'] as const
export type CaseRarity = (typeof CASE_RARITIES)[number]

export interface CasesBreakdown {
  byRarity: Partial<Record<CaseRarity, number>>
  total: number
}

/**
 * Per-rarity breakdown of a user's opened cases, summed across both case types
 * (case1 standard + case2 premium), from a user's `stats` payload. Returns null
 * when there are no case stats. Pure: shared by the snapshot builder (which now
 * has this data on every row) and the live fallback below.
 */
export function extractCasesBreakdown(stats: { case1?: CaseStat, case2?: CaseStat } | undefined): CasesBreakdown | null {
  if (!stats) {
    return null
  }

  const byRarity: Partial<Record<CaseRarity, number>> = {}
  let total = 0
  for (const caseStat of [stats.case1, stats.case2]) {
    const map = caseStat?.byRarity
    if (!map) {
      continue
    }
    for (const rarity of CASE_RARITIES) {
      const count = map[rarity]
      if (typeof count === 'number' && count > 0) {
        byRarity[rarity] = (byRarity[rarity] ?? 0) + count
        total += count
      }
    }
  }

  return total > 0 ? { byRarity, total } : null
}

/**
 * Live fallback for the per-rarity case breakdown, used by the user page only
 * for rows a fresh getUserById scrape hasn't reached yet. Returns null on error.
 */
export async function getUserCasesBreakdown(userId: string): Promise<CasesBreakdown | null> {
  try {
    const user = await urgentClient.user.getUserById({ userId }) as { stats?: { case1?: CaseStat, case2?: CaseStat } }
    return extractCasesBreakdown(user.stats)
  } catch {
    return null
  }
}

function fetchEquipmentBatch(client: Client, userIds: string[]): Promise<Equipment[]> {
  return Promise.all(userIds.map(userId => client.inventory.fetchCurrentEquipment({ userId })))
}

/**
 * Fetches each user's currently-equipped gear. Same per-user fan-out shape as
 * {@link getUsers} — one HTTP call per id, batched by the tRPC client up to
 * 50 ops per request and paced by the rate limiter.
 *
 * Equipment is the most volatile field on a user (durability ticks down per
 * hit, items get swapped between battles), so the per-cycle freshness is only
 * a rough snapshot of what someone happened to be wearing at scrape time.
 */
export function getEquipment(userIds: string[]): Promise<Equipment[]> {
  return fetchEquipmentBatch(scrapeClient, userIds)
}

/**
 * Urgent variant for piecemeal on-demand refreshes (mirrors getUsersUrgent).
 */
export function getEquipmentUrgent(userIds: string[]): Promise<Equipment[]> {
  return fetchEquipmentBatch(urgentClient, userIds)
}

export async function getAllRegions(): Promise<Region[]> {
  const obj = await scrapeClient.region.getRegionsObject()
  return Object.values(obj)
}

export async function getAllMUs(): Promise<MU[]> {
  const all: MU[] = []
  for await (const page of scrapeClient.mu.getManyPaginated({ limit: 100, autoPaginate: true })) {
    all.push(...(page.items as MU[]))
  }
  return all
}

/**
 * Fetches the current member roster of a single MU. Each item carries the
 * member's `user` id plus their MU contribution counts, not the full user
 * payload, so a piecemeal MU refresh follows this with {@link getUsersUrgent}
 * over the returned user ids. Returns the authoritative live roster, which
 * catches joins and leaves the stored member list may have missed. On the
 * urgent client so it never waits behind the scrape.
 */
export function getMuMembers(muId: string): Promise<MuMemberListItem[]> {
  return urgentClient.muMember.getByMu({ muId })
}

export async function getAllParties(): Promise<Party[]> {
  const all: Party[] = []
  for await (const page of scrapeClient.party.getManyPaginated({ limit: 100, autoPaginate: true })) {
    all.push(...page.items)
  }
  return all
}

export async function getAllAlliances(): Promise<Alliance[]> {
  const all: Alliance[] = []
  for await (const page of scrapeClient.alliance.getManyPaginated({ limit: 100, autoPaginate: true })) {
    all.push(...page.items)
  }
  return all
}

// Recent finished battles to retain. Active battles are always fetched in full
// (there are only ~15 at a time), but finished battles are unbounded history,
// so we keep just the most recent page-fulls.
const FINISHED_BATTLES_LIMIT = 100
const BATTLES_PAGE_SIZE = 50

/**
 * Walks `battle.getBattles` for the given activity flag. It's cursor-paginated
 * (not autoPaginate), newest first, so we follow `nextCursor` until `max` items
 * are collected or the cursor runs out. Pass `Infinity` for `max` to pull every
 * page (the active list is small and always fetched whole). `client` picks the
 * rate-limit budget.
 */
async function pageBattles(client: Client, isActive: boolean, max: number): Promise<Battle[]> {
  const out: Battle[] = []
  let cursor: string | undefined
  do {
    const page: BattleGetBattlesResponse = await client.battle.getBattles({ isActive, limit: BATTLES_PAGE_SIZE, cursor })
    out.push(...(page.items as Battle[]))
    cursor = page.nextCursor
  } while (cursor && out.length < max)

  return out.length > max ? out.slice(0, max) : out
}

/**
 * Fetches all active battles plus the most recent {@link FINISHED_BATTLES_LIMIT}
 * finished ones, on the scrape client. Used by the hourly snapshot.
 */
export async function getAllBattles(): Promise<Battle[]> {
  const active = await pageBattles(scrapeClient, true, Infinity)
  const finished = await pageBattles(scrapeClient, false, FINISHED_BATTLES_LIMIT)
  return [...active, ...finished]
}

/**
 * Fetches all active battles (cursor-paginated, ~15 at a time). The list
 * endpoint is the only one that expands `currentRound` with per-side damages
 * and `lastHits`, which the live /battles views need for the round bar and Top
 * Damage Dealers. Used by the on-demand live cache, not the hourly scrape.
 */
export function getActiveBattles(): Promise<Battle[]> {
  return pageBattles(urgentClient, true, Infinity)
}

/**
 * Fetches finished battles for the history archive, paging deeper than
 * {@link getAllBattles}. The live API serves a rolling window (~2 weeks /
 * ~1000 battles, newest first); we walk it until `maxBattles` or the cursor
 * runs out. The daily archive job dedupes these by `_id`, so over-fetching is
 * harmless — it only widens the safety margin against battles aging out before
 * we capture them.
 */
export function getFinishedBattles(maxBattles = 1000): Promise<Battle[]> {
  return pageBattles(scrapeClient, false, maxBattles)
}

// Tournament battles are fought between teams (not countries). In the current
// "MU Tournament" each team is a single MU, so a team resolves to an MU we can
// link to. `name` is the tournament's name; `teams` maps teamId → its roster.
export interface TournamentTeamInfo {
  number: number
  muId: string | null
  colorScheme: string | null
}

export interface TournamentInfo {
  id: string | null
  name: string | null
  teams: Map<string, TournamentTeamInfo>
}

// JSON-serializable form stored in the snapshot (Map → record).
export interface TournamentSnapshot {
  id: string | null
  name: string | null
  teams: Record<string, TournamentTeamInfo>
}

/**
 * Fetches the current tournament and all its teams in one shot, so battle rows
 * can resolve a `tournamentTeam` id to its MU (and round/tournament name).
 * Returns empty info if there's no active tournament.
 */
export async function getTournamentInfo(): Promise<TournamentInfo> {
  const tournament = await scrapeClient.tournament.getLastTournament()
  if (!tournament?._id) {
    return { id: null, name: null, teams: new Map() }
  }

  const teams = await scrapeClient.tournamentTeam.getByTournamentId({ tournamentId: tournament._id })
  const map = new Map<string, { number: number, muId: string | null, colorScheme: string | null }>()
  for (const t of teams) {
    map.set(t._id, {
      number: t.number,
      muId: t.mus?.[0] ?? null,
      colorScheme: t.colorScheme ?? null,
    })
  }

  return { id: tournament._id, name: tournament.name ?? null, teams: map }
}

// A factory (company) hydrated from getById, widened for fields the live API
// returns that the generated types miss: the real worker objects and the
// optional movedUpAt timestamp.
export interface FactoryWorker {
  user: string
  wage: number
  joinedAt: string
  _id: string
}
export type Factory = Omit<CompanyGetByIdResponse, 'workers'> & {
  workers: FactoryWorker[]
  movedUpAt?: string
}

// One factory's daily work stats (production points + wages per day).
export type FactoryWorkStat = WorkStatsItem

// What getUserCompanies returns per factory: identity + daily stats + the
// current production bonus (null if that call failed).
export interface FactoryData {
  company: Factory
  stats: FactoryWorkStat[]
  bonus: CompanyProductionBonusResponse | null
}

/**
 * Fetches a user's factories with everything the profit model needs, in two
 * HTTP round-trips: one to list the company ids, then one batched request that
 * hydrates each (getById + work stats + production bonus). Returns [] for a user
 * with no factories. `client` picks the rate-limit budget.
 */
async function fetchUserCompanies(client: Client, userId: string): Promise<FactoryData[]> {
  const list = await client.company.getCompanies({ userId, perPage: 100 })
  const ids = list.items ?? []
  if (!ids.length) {
    return []
  }

  // All three hydration calls are dispatched in one tick, so the tRPC client
  // coalesces them into a single batched HTTP request (≤ 50 ops covers the
  // 12-factory cap). Stats/bonus tolerate a per-factory error.
  const [companies, stats, bonuses] = await Promise.all([
    Promise.all(ids.map(id => client.company.getById({ companyId: id }))),
    Promise.all(ids.map(id => client.work.getStatsByCompany({ companyId: id, days: 8, timezone: 'UTC' }).catch(() => [] as FactoryWorkStat[]))),
    Promise.all(ids.map(id => client.company.getProductionBonus({ companyId: id }).catch(() => null))),
  ])

  return ids.map((_, i) => ({ company: companies[i] as unknown as Factory, stats: stats[i], bonus: bonuses[i] }))
}

/**
 * A user's factories on the urgent client, for the on-demand user page.
 */
export function getUserCompanies(userId: string): Promise<FactoryData[]> {
  return fetchUserCompanies(urgentClient, userId)
}

/**
 * A user's factories on the slow factory client, for the all-users scrape.
 */
export function getUserCompaniesSlow(userId: string): Promise<FactoryData[]> {
  return fetchUserCompanies(factoryClient, userId)
}

// Current market price per item code. Aliased so the snapshot store and row
// builders can name the type without reaching into the SDK.
export type MarketPrices = ItemTradingGetPricesResponse

// Market prices change constantly, but a couple-minute cache is plenty for the
// factory profit views; one fetch serves every user page in that window.
let pricesCache: { at: number, data: MarketPrices } | null = null
const PRICES_TTL_MS = 2 * 60_000

/**
 * Current item prices, memoized for {@link PRICES_TTL_MS}. Urgent client, for
 * the on-demand user page.
 */
export async function getItemPrices(): Promise<MarketPrices> {
  if (pricesCache && Date.now() - pricesCache.at < PRICES_TTL_MS) {
    return pricesCache.data
  }

  const data = await urgentClient.itemTrading.getPrices({})
  pricesCache = { at: Date.now(), data }
  return data
}

/**
 * Fresh item prices on the scrape client, captured into the snapshot.
 */
export function scrapeItemPrices(): Promise<MarketPrices> {
  return scrapeClient.itemTrading.getPrices({})
}

// The best region (and its bonus breakdown) for producing each item. Scraped
// from getRecommendedRegionIdsByItemCode, which returns a ranked shortlist per
// item. User-independent and slow-changing, so one fetch is cached for all
// user pages.
export interface ItemBestRegion {
  regionId: string
  bonusPct: number
  strategicPct: number
  ethicSpecializationPct: number
  depositPct: number
  ethicDepositPct: number
  depositEndAt?: string
}

/**
 * Best-region bonus per item, fetched on `client` (no cache).
 */
async function fetchItemBestRegions(client: Client, itemCodes: string[]): Promise<Record<string, ItemBestRegion>> {
  const entries = await Promise.all(itemCodes.map(code =>
    client.company.getRecommendedRegionIdsByItemCode({ itemCode: code, includeDeposit: true })
      .then(regions => [code, regions] as const)
      .catch(() => [code, [] as RecommendedRegion[]] as const),
  ))

  const out: Record<string, ItemBestRegion> = {}
  for (const [code, regions] of entries) {
    // Take the highest total bonus (the shortlist is ranked, but don't assume).
    const best = regions.reduce<RecommendedRegion | null>((top, r) => (top && top.bonus >= r.bonus ? top : r), null)
    if (best) {
      out[code] = {
        regionId: best.regionId,
        bonusPct: best.bonus,
        strategicPct: best.strategicBonus,
        ethicSpecializationPct: best.ethicSpecializationBonus,
        depositPct: best.depositBonus,
        ethicDepositPct: best.ethicDepositBonus,
        depositEndAt: best.depositEndAt,
      }
    }
  }

  return out
}

let bestRegionsCache: { at: number, data: Record<string, ItemBestRegion> } | null = null
const BEST_REGIONS_TTL_MS = 10 * 60_000

/**
 * Best-region bonus per item — the global "production frontier" the profit
 * model ranks against. All item calls fire in one tick (batched), and the
 * result is memoized for {@link BEST_REGIONS_TTL_MS}. Urgent client.
 */
export async function getItemBestRegions(itemCodes: string[]): Promise<Record<string, ItemBestRegion>> {
  if (bestRegionsCache && Date.now() - bestRegionsCache.at < BEST_REGIONS_TTL_MS) {
    return bestRegionsCache.data
  }

  const data = await fetchItemBestRegions(urgentClient, itemCodes)
  bestRegionsCache = { at: Date.now(), data }
  return data
}

/**
 * Fresh best-region map on the scrape client, captured into the snapshot.
 */
export function scrapeItemBestRegions(itemCodes: string[]): Promise<Record<string, ItemBestRegion>> {
  return fetchItemBestRegions(scrapeClient, itemCodes)
}
