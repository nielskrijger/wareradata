import type {
  BattleGetBattlesResponse,
  BattleListItem,
  CountryListItem,
  MuListItem,
  MuRankingsOptional,
  PartyGetManyPaginatedResponse,
  RankingGetRankingResponse,
  RankingValueTier,
  RegionsObjectItem,
  UserGetUserLiteResponse,
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
}
export type Party = PartyGetManyPaginatedResponse['items'][number]
export type Region = RegionsObjectItem

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
export type UserLite = UserGetUserLiteResponse & {
  infos?: { isBanned?: boolean, colorScheme?: string }
  dates?: { lastConnectionAt?: string }
}
export type Ranking = RankingGetRankingResponse

export const RANKING_TIERS = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master'] as const
export type RankingTier = (typeof RANKING_TIERS)[number]

export const RANKING_TYPES = [
  'weeklyCountryDamages',
  'weeklyCountryDamagesPerCitizen',
  'countryRegionDiff',
  'countryDevelopment',
  'countryActivePopulation',
  'countryDamages',
  'countryWealth',
  'countryProductionBonus',
  'countryBounty',
] as const
export type RankingType = (typeof RANKING_TYPES)[number]

export interface SnapshotMeta {
  entityCounts?: Record<string, number>
  scrapedAt?: string
  scrapeDurationMs?: number
}

interface ScrapeRequestOptions {
  // Retained for API compatibility with the previous client. The package
  // doesn't expose Next.js fetch-cache hooks, so this is currently a no-op.
  noCache?: boolean
}

const client = createAPIClient({
  apiKey: process.env.WARERA_API_KEY,
})

export function getAllCountries(_options: ScrapeRequestOptions = {}): Promise<Country[]> {
  return client.country.getAllCountries()
}

export function getRanking(rankingType: RankingType): Promise<Ranking> {
  return client.ranking.getRanking({ rankingType })
}

export async function getUserIdsForCountry(
  countryId: string,
  _options: ScrapeRequestOptions = {},
): Promise<string[]> {
  const ids: string[] = []
  for await (const page of client.user.getUsersByCountry({ countryId, autoPaginate: true })) {
    for (const item of page.items) {
      ids.push(item._id)
    }
  }
  return ids
}

export async function getUserLite(
  userIds: string[],
  _options: ScrapeRequestOptions = {},
): Promise<UserLite[]> {
  return Promise.all(userIds.map(userId => client.user.getUserLite({ userId })))
}

export async function getAllRegions(_options: ScrapeRequestOptions = {}): Promise<Region[]> {
  const obj = await client.region.getRegionsObject()
  return Object.values(obj)
}

export async function getAllMUs(_options: ScrapeRequestOptions = {}): Promise<MU[]> {
  const all: MU[] = []
  for await (const page of client.mu.getManyPaginated({ limit: 100, autoPaginate: true })) {
    all.push(...(page.items as MU[]))
  }
  return all
}

export async function getAllParties(_options: ScrapeRequestOptions = {}): Promise<Party[]> {
  const all: Party[] = []
  for await (const page of client.party.getManyPaginated({ limit: 100, autoPaginate: true })) {
    all.push(...page.items)
  }
  return all
}

// Recent finished battles to retain. Active battles are always fetched in full
// (there are only ~15 at a time), but finished battles are unbounded history,
// so we keep just the most recent page-fulls.
const FINISHED_BATTLES_LIMIT = 100

/**
 * Fetches all active battles plus the most recent {@link FINISHED_BATTLES_LIMIT}
 * finished ones. `battle.getBattles` is cursor-paginated (not autoPaginate),
 * newest first, so we walk `nextCursor` until we have enough.
 */
export async function getAllBattles(_options: ScrapeRequestOptions = {}): Promise<Battle[]> {
  const active: Battle[] = []
  let cursor: string | undefined
  do {
    const page: BattleGetBattlesResponse = await client.battle.getBattles({ isActive: true, limit: 50, cursor })
    active.push(...(page.items as Battle[]))
    cursor = page.nextCursor
  } while (cursor)

  const finished: Battle[] = []
  cursor = undefined
  do {
    const page: BattleGetBattlesResponse = await client.battle.getBattles({ isActive: false, limit: 50, cursor })
    finished.push(...(page.items as Battle[]))
    cursor = page.nextCursor
  } while (cursor && finished.length < FINISHED_BATTLES_LIMIT)

  return [...active, ...finished.slice(0, FINISHED_BATTLES_LIMIT)]
}

/**
 * Fetches all active battles (cursor-paginated, ~15 at a time). The list
 * endpoint is the only one that expands `currentRound` with per-side damages
 * and `lastHits`, which the live /battles views need for the round bar and Top
 * Damage Dealers. Used by the on-demand live cache, not the hourly scrape.
 */
export async function getActiveBattles(): Promise<Battle[]> {
  const active: Battle[] = []
  let cursor: string | undefined
  do {
    const page: BattleGetBattlesResponse = await client.battle.getBattles({ isActive: true, limit: 50, cursor })
    active.push(...(page.items as Battle[]))
    cursor = page.nextCursor
  } while (cursor)
  return active
}

/**
 * Fetches finished battles for the history archive, paging deeper than
 * {@link getAllBattles}. The live API serves a rolling window (~2 weeks /
 * ~1000 battles, newest first); we walk it until `maxBattles` or the cursor
 * runs out. The daily archive job dedupes these by `_id`, so over-fetching is
 * harmless — it only widens the safety margin against battles aging out before
 * we capture them.
 */
export async function getFinishedBattles(maxBattles = 1000): Promise<Battle[]> {
  const finished: Battle[] = []
  let cursor: string | undefined
  do {
    const page: BattleGetBattlesResponse = await client.battle.getBattles({ isActive: false, limit: 50, cursor })
    finished.push(...(page.items as Battle[]))
    cursor = page.nextCursor
  } while (cursor && finished.length < maxBattles)

  return finished.slice(0, maxBattles)
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
  const tournament = await client.tournament.getLastTournament()
  if (!tournament?._id) {
    return { id: null, name: null, teams: new Map() }
  }

  const teams = await client.tournamentTeam.getByTournamentId({ tournamentId: tournament._id })
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
