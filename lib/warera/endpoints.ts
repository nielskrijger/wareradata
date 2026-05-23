import type { Country, MU, Ranking, RankingType, UserLite } from './schemas'
import { trpcBatch, trpcQuery } from './client'
import {
  countriesList,
  muPage,
  ranking,
  userLite,
  usersByCountryPage,
} from './schemas'

interface ScrapeRequestOptions {
  // Bypass caches. Used by the scrape job.
  noCache?: boolean
}

export function getAllCountries(options: ScrapeRequestOptions = {}): Promise<Country[]> {
  return trpcQuery('country.getAllCountries', undefined, countriesList, { noCache: options.noCache })
}

export function getRanking(rankingType: RankingType): Promise<Ranking> {
  return trpcQuery('ranking.getRanking', { rankingType }, ranking)
}

// --- User pagination + hydration -----------------------------------------

/**
 * Paginates `user.getUsersByCountry` for a single country, returning every
 * user `_id`. Uses cursor-based pagination; stops when the API returns no
 * `nextCursor`.
 */
export async function getUserIdsForCountry(
  countryId: string,
  options: ScrapeRequestOptions = {},
): Promise<string[]> {
  const ids: string[] = []
  let cursor: string | null | undefined

  do {
    const page = await trpcQuery(
      'user.getUsersByCountry',
      cursor ? { countryId, cursor } : { countryId },
      usersByCountryPage,
      { noCache: options.noCache },
    )
    for (const item of page.items) {
      ids.push(item._id)
    }
    cursor = page.nextCursor
  } while (cursor)

  return ids
}

export function getUserLite(userIds: string[], options: ScrapeRequestOptions = {}): Promise<UserLite[]> {
  return trpcBatch(
    'user.getUserLite',
    userIds.map(userId => ({ userId })),
    userLite,
    { batchSize: 150, noCache: options.noCache },
  )
}

// --- MUs ------------------------------------------------------------------

export async function getAllMUs(options: ScrapeRequestOptions = {}): Promise<MU[]> {
  const all: MU[] = []
  let cursor: string | null | undefined

  do {
    const page = await trpcQuery(
      'mu.getManyPaginated',
      cursor ? { limit: 100, cursor } : { limit: 100 },
      muPage,
      { noCache: options.noCache },
    )
    all.push(...page.items)
    cursor = page.nextCursor
  } while (cursor)

  return all
}
