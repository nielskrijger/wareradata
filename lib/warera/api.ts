import type {
  Alliance,
  BattleGetBattlesResponse,
  BattleGetByIdResponse,
  BattleListItem,
  BattleOrderItem,
  BattleRankingItem,
  CompanyGetByIdResponse,
  CongressSeat,
  CountryListItem,
  Employee,
  EmployeeCompanyHourly,
  GameConfigGetGameConfigResponse,
  GovernmentGetByCountryIdResponse,
  InventoryFetchCurrentEquipmentResponse,
  ItemTradingGetPricesResponse,
  Manager,
  MercenaryContractAuctionListItem,
  MuListItem,
  MuMemberListItem,
  MuRankingsOptional,
  PartyGetManyPaginatedResponse,
  RankingValueTier,
  RegionsObjectItem,
  RoundGetByIdResponse,
  StrategicResourceBonuses,
  UserGetUserByIdResponse,
  UserGetUserLiteResponse,
  UserSkills,
  UserSkillsExpiration,
} from '@wareraprojects/api'

import { createAPIClient } from '@wareraprojects/api'

/**
 * The generated types miss fields the live API returns, so these widen them.
 */
export type Country = CountryListItem
export type MU = Omit<MuListItem, 'rankings'> & {
  investedMoneyByUsers?: Record<string, number>
  rankings?: MuRankingsOptional & { muReputation?: RankingValueTier }

  /**
   * Not from the API: stamped by the scraper at capture time, and updated by an
   * on-demand member refresh, so the UI can show how fresh an MU's data is.
   */
  lastRefreshedAt?: string
}
export type Party = PartyGetManyPaginatedResponse['items'][number]
export type Region = RegionsObjectItem

/**
 * Multi-country bloc, re-exported from the SDK so the rest of the codebase
 * imports every WarEra entity from this module.
 */
export type { Alliance } from '@wareraprojects/api'

/**
 * Adds the runtime fields the spec misses: the outcome and per-side money pool.
 */
export type Battle = BattleListItem & {
  endedAt?: string
  wonBy?: 'attacker' | 'defender'

  /**
   * Tournament battles carry these instead of a `war`; each side has a
   * `tournamentTeam` rather than a `country`.
   */
  tournament?: string
  tournamentRoundNumber?: number
  attacker: BattleListItem['attacker'] & { moneyPool?: number, bountyEffectiveAt?: string, tournamentTeam?: string }
  defender: BattleListItem['defender'] & { moneyPool?: number, bountyEffectiveAt?: string, tournamentTeam?: string }
}

/**
 * One case type's opening counts, broken down by loot rarity. Present in the
 * getUserById stats payload (which the scrape uses), absent on the lite payload,
 * hence optional everywhere.
 */
export interface CaseStat {
  byRarity?: Record<string, number>
  openedCount?: number
}

/**
 * Wealth's parts in gold, from getUserById `stats.wealth`. All optional: users
 * the scrape hasn't reached lack them.
 */
export interface WealthBreakdown {
  companies?: number
  items?: number
  money?: number
  equipments?: number
  weapons?: number
  total?: number
}

/**
 * Based on the lite response type because it types the rankings precisely;
 * getUserById returns a superset, whose extra fields are added below.
 */
export type User = UserGetUserLiteResponse & {
  /**
   * Not on the lite payload (it has its own `user.getUserSkills` endpoint), but
   * getUserById carries the same object, and that is what hydrateUsers calls.
   */
  skills?: UserSkills
  skillsExpiration?: UserSkillsExpiration
  infos?: { isBanned?: boolean, colorScheme?: string }
  dates?: { lastConnectionAt?: string }
  stats?: UserGetUserLiteResponse['stats'] & { case1?: CaseStat, case2?: CaseStat, wealth?: WealthBreakdown }

  /**
   * Not from the API: stamped by the scraper at capture time, and updated by an
   * on-demand refresh, so the user page can show how fresh the data is.
   */
  lastRefreshedAt?: string

  /**
   * The active drug effect, missing from the SDK types. Only the buff or the
   * debuff pair is set; absent when nothing is active.
   */
  buffs?: {
    buffCodes?: string[]
    buffEndAt?: string
    debuffCodes?: string[]
    debuffEndAt?: string
  }
}

/**
 * One user's currently-equipped gear. Each slot is optional: players strip gear
 * between battles to preserve durability, so the response is often `{}`.
 */
export type Equipment = InventoryFetchCurrentEquipmentResponse

/**
 * The game's static config (item catalog, skill cost curves, upgrade tiers, …).
 * Scraped once per cycle so derived constants (e.g. gear roll bounds, skill
 * point costs) can read from live data instead of being hardcoded.
 */
export type GameConfig = GameConfigGetGameConfigResponse

/**
 * One appointed minister. The president names up to 20 ministers, each with a
 * title (a known code such as `minOfDefense`, or a custom string) and a set of
 * rights.
 */
export interface GovernmentMinister {
  user: string
  title: string
  rights?: string[]
  appointedAt?: string
  badgeGrantedAt?: string
}

/**
 * A country's officials as user ids.
 *
 * The SDK types per-title seats but the API sends a `ministers` array, so both
 * are optional. `congressSeats` comes from a second call, merged in by the scrape.
 */
export type Government = Omit<
  GovernmentGetByCountryIdResponse,
  'minOfDefense' | 'minOfEconomy' | 'minOfForeignAffairs'
> & {
  ministers?: GovernmentMinister[]
  minOfDefense?: string
  minOfEconomy?: string
  minOfForeignAffairs?: string
  congressSeats?: CongressSeat[]
}

/**
 * Strategic resource bonuses a country's citizens get (shared across its
 * alliance): bonus points per skill code plus the region ids holding each
 * resource.
 */
export type StrategicBonuses = StrategicResourceBonuses

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

/**
 * One client per purpose, each with its own budget, so urgent page traffic
 * never waits behind the scrape. The three sum to the API's 500/min per key.
 *
 * Urgent needs real headroom: every visitor shares its queue, and the limiter
 * spaces requests at 60s/limit.
 */
const SCRAPE_RATE_LIMIT = 150
const URGENT_RATE_LIMIT = 100
export const FACTORY_RATE_LIMIT = 250

/**
 * Counted per client so the loops can log how often they're throttled.
 */
type ClientName = 'scrape' | 'urgent' | 'factory'
interface RetryStats { retries: number, rateLimited: number }
const retryStats: Record<ClientName, RetryStats> = {
  scrape: { retries: 0, rateLimited: 0 },
  urgent: { retries: 0, rateLimited: 0 },
  factory: { retries: 0, rateLimited: 0 },
}

/**
 * Returns one client's retry counts and resets them to zero.
 */
export function takeRetryStats(name: ClientName): RetryStats {
  const stats = retryStats[name]
  retryStats[name] = { retries: 0, rateLimited: 0 }

  return stats
}

/**
 * So a hung request can't stall a scrape phase.
 */
const REQUEST_TIMEOUT_MS = 60_000

function createClient(name: ClientName, rateLimit: number) {
  return createAPIClient({
    apiKey: process.env.WARERA_API_KEY,
    rateLimit,
    timeoutMs: REQUEST_TIMEOUT_MS,
    retry: {
      onRetry: ({ status }) => {
        retryStats[name].retries++
        if (status === 429) {
          retryStats[name].rateLimited++
        }
      },
    },
  })
}

const scrapeClient = createClient('scrape', SCRAPE_RATE_LIMIT)
const urgentClient = createClient('urgent', URGENT_RATE_LIMIT)
const factoryClient = createClient('factory', FACTORY_RATE_LIMIT)

type Client = typeof scrapeClient

export function getAllCountries(): Promise<Country[]> {
  return scrapeClient.country.getAllCountries()
}

/**
 * A country's government plus its congress seats (the party list each member
 * was elected on). A failed seats call loses only that mapping.
 */
export async function getGovernmentForCountry(countryId: string): Promise<Government> {
  const [gov, seats] = await Promise.all([
    scrapeClient.government.getByCountryId({ countryId }) as Promise<Government>,
    scrapeClient.government.getCongressSeats({ countryId }).catch(() => undefined),
  ])

  return seats ? { ...gov, congressSeats: seats } : gov
}

/**
 * Fetches the strategic resource bonuses a country's citizens get: its
 * alliance's when it's in one, otherwise its own. Null when it holds none.
 */
export function getStrategicBonusesForCountry(countryId: string): Promise<StrategicBonuses | null> {
  return scrapeClient.country.getStrategicResourceBonuses({ countryId })
}

/**
 * Fetches the game's static configuration (item stats, skill cost curves,
 * upgrade tiers, …). A single no-arg call; it changes only when the devs
 * rebalance, so one fetch per scrape cycle is plenty.
 */
export function getGameConfig(): Promise<GameConfig> {
  return scrapeClient.gameConfig.getGameConfig()
}

/**
 * The endpoint's maximum; its default of 10 takes ten times the requests.
 */
const USERS_BY_COUNTRY_PAGE_SIZE = 100

export async function getUserIdsForCountry(countryId: string): Promise<string[]> {
  const ids: string[] = []
  const input = { countryId, limit: USERS_BY_COUNTRY_PAGE_SIZE, autoPaginate: true as const }
  for await (const page of scrapeClient.user.getUsersByCountry(input)) {
    for (const item of page.items) {
      ids.push(item._id)
    }
  }

  return ids
}

/**
 * Undefined for a failed fetch, so one bad batch doesn't fail thousands of good ones.
 * getUserById's response type is looser than User, but every field we read is
 * present at runtime, so we narrow it here.
 */
function hydrateUsers(client: Client, userIds: string[]): Promise<(User | undefined)[]> {
  return Promise.all(userIds.map(userId =>
    (client.user.getUserById({ userId }) as Promise<unknown> as Promise<User>).catch(() => undefined),
  ))
}

/**
 * Hydrates users via the scrape client, for the main-scrape user phase.
 */
export function getUsers(userIds: string[]): Promise<(User | undefined)[]> {
  return hydrateUsers(scrapeClient, userIds)
}

/**
 * Hydrates users via the urgent client, for on-demand piecemeal refreshes.
 */
export function getUsersUrgent(userIds: string[]): Promise<(User | undefined)[]> {
  return hydrateUsers(urgentClient, userIds)
}

/**
 * Case loot rarities, weakest to strongest. Doubles as the render order for the
 * user page's per-rarity breakdown.
 */
export const CASE_RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'] as const
export type CaseRarity = (typeof CASE_RARITIES)[number]

/**
 * Per-rarity pull counts for a case type; absent rarities mean zero.
 */
export type CaseRarityCounts = Partial<Record<CaseRarity, number>>

export interface CasesBreakdown {
  byRarity: CaseRarityCounts
  total: number
}

/**
 * A user's opens split by case type, the bundle the detail card's Standard /
 * Mythic toggle consumes: per-type opened counts plus per-type rarity maps.
 * Each field is null when that type has no captured data.
 */
export interface CasesByType {
  standardOpened: number | null
  mythicOpened: number | null
  standardByRarity: CaseRarityCounts | null
  mythicByRarity: CaseRarityCounts | null
}

/**
 * One case type's byRarity as a clean {@link CaseRarityCounts} map. Drops zero
 * and non-rarity buckets; null when the type has no categorized pulls.
 */
function rarityMap(caseStat: CaseStat | undefined): CaseRarityCounts | null {
  const map = caseStat?.byRarity
  if (!map) {
    return null
  }

  const out: CaseRarityCounts = {}
  let total = 0
  for (const rarity of CASE_RARITIES) {
    const count = map[rarity]
    if (typeof count === 'number' && count > 0) {
      out[rarity] = count
      total += count
    }
  }

  return total > 0 ? out : null
}

/**
 * Per-rarity pull counts split by case type: case1 (the standard daily case)
 * and case2 (the premium mythic case). Each side is null when it has no
 * categorized pulls. Feeds the user page's Standard / Mythic toggle.
 */
export function extractCasesByType(stats: { case1?: CaseStat, case2?: CaseStat } | undefined): {
  standard: CaseRarityCounts | null
  mythic: CaseRarityCounts | null
} {
  return {
    standard: rarityMap(stats?.case1),
    mythic: rarityMap(stats?.case2),
  }
}

/**
 * Merge the per-type rarity maps into the combined breakdown (case1 + case2),
 * with the summed total. Null when neither type has any categorized pulls.
 */
export function mergeCasesBreakdown(
  standard: CaseRarityCounts | null,
  mythic: CaseRarityCounts | null,
): CasesBreakdown | null {
  if (!standard && !mythic) {
    return null
  }

  const byRarity: CaseRarityCounts = {}
  let total = 0
  for (const rarity of CASE_RARITIES) {
    const count = (standard?.[rarity] ?? 0) + (mythic?.[rarity] ?? 0)
    if (count > 0) {
      byRarity[rarity] = count
      total += count
    }
  }

  return total > 0 ? { byRarity, total } : null
}

/**
 * Live fallback for the per-type case breakdown, used by the user page only for
 * rows a fresh getUserById scrape hasn't reached yet. Returns null on error.
 */
export async function getUserCasesByType(userId: string): Promise<CasesByType | null> {
  try {
    const user = await urgentClient.user.getUserById({ userId }) as { stats?: { case1?: CaseStat, case2?: CaseStat } }
    const { standard, mythic } = extractCasesByType(user.stats)

    return {
      standardOpened: user.stats?.case1?.openedCount ?? null,
      mythicOpened: user.stats?.case2?.openedCount ?? null,
      standardByRarity: standard,
      mythicByRarity: mythic,
    }
  } catch {
    return null
  }
}

function fetchEquipmentBatch(client: Client, userIds: string[]): Promise<(Equipment | undefined)[]> {
  return Promise.all(userIds.map(userId => client.inventory.fetchCurrentEquipment({ userId }).catch(() => undefined)))
}

/**
 * Undefined for a failed fetch, so one bad batch doesn't fail thousands of good ones.
 *
 * Equipment is the most volatile field on a user (durability ticks down per
 * hit, items get swapped between battles), so the per-cycle freshness is only
 * a rough snapshot of what someone happened to be wearing at scrape time.
 */
export function getEquipment(userIds: string[]): Promise<(Equipment | undefined)[]> {
  return fetchEquipmentBatch(scrapeClient, userIds)
}

/**
 * Urgent variant for piecemeal on-demand refreshes (mirrors getUsersUrgent).
 */
export function getEquipmentUrgent(userIds: string[]): Promise<(Equipment | undefined)[]> {
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
 * The live roster as user ids, which catches joins and leaves the stored list
 * missed.
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

/**
 * Recent finished battles to retain. Active battles are always fetched in full
 * (there are only ~15 at a time), but finished battles are unbounded history,
 * so we keep just the most recent page-fulls.
 */
const FINISHED_BATTLES_LIMIT = 100
const BATTLES_PAGE_SIZE = 50

/**
 * Follows the cursor (newest first) until `max` battles or the end.
 */
async function pageBattles(client: Client, isActive: boolean, max: number): Promise<Battle[]> {
  const out: Battle[] = []
  let cursor: string | undefined
  do {
    const page: BattleGetBattlesResponse = await client.battle.getBattles({
      isActive,
      limit: BATTLES_PAGE_SIZE,
      cursor,
    })

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
 * Only the list endpoint expands `currentRound` with per-side damage and
 * `lastHits`, which the live views need.
 */
export function getActiveBattles(): Promise<Battle[]> {
  return pageBattles(urgentClient, true, Infinity)
}

/**
 * Pages deeper than {@link getAllBattles} for the archive, which dedupes, so
 * over-fetching only widens the margin before battles age out.
 */
export function getFinishedBattles(maxBattles = 1000): Promise<Battle[]> {
  return pageBattles(scrapeClient, false, maxBattles)
}

export type BattleRanking = BattleRankingItem
export type BattleRound = RoundGetByIdResponse
export type BattleOrder = BattleOrderItem
export type MercenaryContract = MercenaryContractAuctionListItem

type Side = 'attacker' | 'defender'

/**
 * Everything the battle page shows beyond the list row, keyed by side where
 * the API splits it.
 */
export interface BattleExtras {
  battle: BattleGetByIdResponse
  rounds: BattleRound[]
  players: Record<Side, BattleRanking[]>
  playersCount: Record<Side, number>
  earners: Record<Side, BattleRanking[]>
  mus: Record<Side, BattleRanking[]>
  countries: Record<Side, BattleRanking[]>
  orders: BattleOrder[]
  contracts: MercenaryContract[]
}

const BATTLE_RANKING_LIMIT = 10

/**
 * Calls made in the same tick share one HTTP request (and one rate-limit
 * slot), so this fires everything in two waves: what the battle id alone
 * keys, then its rounds.
 */
export async function getBattleExtras(battleId: string): Promise<BattleExtras> {
  const rank = (side: Side, type: 'user' | 'mu' | 'country', dataType: 'damage' | 'money' = 'damage') =>
    urgentClient.battleRanking.getRanking({ battleId, side, type, dataType, limit: BATTLE_RANKING_LIMIT })

  const bySide = <T>(fetch: (side: Side) => Promise<T>) =>
    Promise.all([fetch('attacker'), fetch('defender')]).then(([attacker, defender]) => ({ attacker, defender }))

  const [battle, players, earners, mus, countries, orders, contracts] = await Promise.all([
    urgentClient.battle.getById({ battleId }),
    bySide(side => rank(side, 'user')),
    bySide(side => rank(side, 'user', 'money')),
    bySide(side => rank(side, 'mu')),
    bySide(side => rank(side, 'country')),
    bySide(side => urgentClient.battleOrder.getByBattle({ battleId, side })),
    urgentClient.mercenaryContractAuction.getPaginatedAuctions({ battleId, limit: 20 }),
  ])

  const rounds = await Promise.all(battle.rounds.map(roundId => urgentClient.round.getById({ roundId })))

  return {
    battle,
    rounds: rounds.sort((a, b) => a.number - b.number),
    players: { attacker: players.attacker.items, defender: players.defender.items },
    playersCount: { attacker: players.attacker.itemCount, defender: players.defender.itemCount },
    earners: { attacker: earners.attacker.items, defender: earners.defender.items },
    mus: { attacker: mus.attacker.items, defender: mus.defender.items },
    countries: { attacker: countries.attacker.items, defender: countries.defender.items },
    orders: [...orders.attacker, ...orders.defender],
    contracts: contracts.items,
  }
}

/**
 * Tournament battles are fought between teams (not countries). In the current
 * "MU Tournament" each team is a single MU, so a team resolves to an MU we can
 * link to. `name` is the tournament's name; `teams` maps teamId → its roster.
 */
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

/**
 * JSON-serializable form stored in the snapshot (Map → record).
 */
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

/**
 * A factory (company) as returned by company.getById.
 */
export type Factory = CompanyGetByIdResponse

/**
 * A company's hourly employee production and wages; engine output isn't
 * included (see lib/factories/engine).
 */
export type CompanyHourly = EmployeeCompanyHourly
// One NPC employee, as `employee.getCompanyRoster` returns it.
export type { Employee }

/**
 * A factory with its hourly figures and roster; `hourly` is null and
 * `employees` empty when the roster call failed.
 */
export interface FactoryData {
  company: Factory
  hourly: CompanyHourly | null
  employees: Employee[]
}

/**
 * Two round trips: the ids, then one batch with each company and roster. A
 * failed roster leaves that factory engine-only.
 *
 * getCompanies lists them in the game's order (most recently moved up first).
 */
async function fetchUserCompanies(client: Client, userId: string): Promise<FactoryData[]> {
  const list = await client.company.getCompanies({ userId, perPage: 100 })
  const ids = list.items ?? []
  if (!ids.length) {
    return []
  }

  // Both hydration calls are dispatched in one tick, so the tRPC client coalesces
  // them into a single batched HTTP request.
  const [companies, rosters] = await Promise.all([
    Promise.all(ids.map(id => client.company.getById({ companyId: id }))),
    Promise.all(ids.map(id => client.employee.getCompanyRoster({ companyId: id }).catch(() => null))),
  ])

  return ids.map((_, i) => ({
    company: companies[i],
    hourly: rosters[i]?.hourly ?? null,
    employees: rosters[i]?.employees ?? [],
  }))
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

/**
 * Everything the Advise page reads about the API key's owner.
 */
export interface AdviceData {
  user: UserGetUserByIdResponse
  factories: FactoryData[]
  managers: (Manager | null)[]
  ppValue: number
  managerMarketWage: number | null
}

/**
 * The API key owner's user id, read from their employees; null when they have none.
 */
export async function getKeyOwnerId(): Promise<string | null> {
  const mine = await urgentClient.employee.getMyEmployees()

  return mine[0]?.owner ?? null
}

/**
 * Loads a user's companies, employees, managers and bars; null for an unknown user.
 */
export async function getAdviceData(userId: string): Promise<AdviceData | null> {
  const [user, factories, ppValue, wageStats] = await Promise.all([
    urgentClient.user.getUserById({ userId }).catch(() => null),
    fetchUserCompanies(urgentClient, userId),
    urgentClient.gameStat.getPpMoneyValue(),
    urgentClient.managerOffer.getWageStats({}).catch(() => null),
  ])

  if (!user) {
    return null
  }

  const managers = await Promise.all(
    factories.map(f => urgentClient.manager.getByCompanyId({ companyId: f.company._id }).catch(() => null)),
  )

  return { user, factories, managers, ppValue, managerMarketWage: wageStats?.allowedRange.average ?? null }
}

/**
 * Production points per hour one more manager Management point adds to a company.
 */
export async function managerPointValue(companyId: string): Promise<number> {
  const res = await urgentClient.employee.getManagerPointValue({ companyId })

  return res.productionPerPoint
}

/**
 * Current market price per item code. Aliased so the snapshot store and row
 * builders can name the type without reaching into the SDK.
 */
export type MarketPrices = ItemTradingGetPricesResponse

/**
 * Market prices change constantly, but a couple-minute cache is plenty for the
 * factory profit views; one fetch serves every user page in that window.
 */
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
