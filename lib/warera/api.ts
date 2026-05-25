import type {
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
