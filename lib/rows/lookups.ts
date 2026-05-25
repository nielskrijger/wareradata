import type { Country, MU, Party, RankingTier, Region, UserLite } from '@/lib/warera/api'
import { RANKING_TIERS } from '@/lib/warera/api'

export interface Lookups {
  countryById: Map<string, { name: string, code: string }>
  muNameById: Map<string, string>
  muAvatarById: Map<string, string | null>
  regionById: Map<string, Region>
  userNameById: Map<string, string>
  userAvatarById: Map<string, string | null>
  userColorSchemeById: Map<string, string | null>
  partyByUser: Map<string, { id: string, name: string, avatarUrl: string | null }>
  partyCountByCountry: Map<string, number>
}

export function buildLookups(
  countries: Country[],
  mus: MU[],
  regions: Region[],
  users: UserLite[],
  parties: Party[],
): Lookups {
  const partyByUser = new Map<string, { id: string, name: string, avatarUrl: string | null }>()
  const partyCountByCountry = new Map<string, number>()
  for (const p of parties) {
    if (p.members) {
      for (const uid of p.members) {
        partyByUser.set(uid, { id: p._id, name: p.name, avatarUrl: p.avatarUrl ?? null })
      }
    }
    if (p.country) {
      partyCountByCountry.set(p.country, (partyCountByCountry.get(p.country) ?? 0) + 1)
    }
  }

  return {
    countryById: new Map(countries.map(c => [c._id, { name: c.name, code: c.code }])),
    muNameById: new Map(mus.map(m => [m._id, m.name])),
    muAvatarById: new Map(mus.map(m => [m._id, m.avatarUrl ?? null])),
    regionById: new Map(regions.map(r => [r._id, r])),
    userNameById: new Map(users.map(u => [u._id, u.username])),
    userAvatarById: new Map(users.map(u => [u._id, u.avatarUrl ?? null])),
    userColorSchemeById: new Map(users.map(u => [u._id, u.infos?.colorScheme ?? null])),
    partyByUser,
    partyCountByCountry,
  }
}

export function toTier(value: unknown): RankingTier | null {
  return typeof value === 'string' && (RANKING_TIERS as readonly string[]).includes(value)
    ? (value as RankingTier)
    : null
}

/**
 * Assigns a standard-competition rank (1 = highest value) into `rankKey`,
 * derived from `valueKey`. Rows tied on a value share a rank; the next distinct
 * value skips ahead by the size of the tie. Rows with a null value keep a null
 * rank — they're unranked for that stat, not last.
 *
 * Mutates the rows in place. Shared by the user and MU builders to rank rows
 * against their own kind (users vs users, MUs vs MUs), not as a sum of members.
 */
export function assignRank<T extends Record<string, unknown>>(
  rows: T[],
  valueKey: keyof T,
  rankKey: keyof T,
): void {
  const ranked = rows
    .filter(r => typeof r[valueKey] === 'number')
    .sort((a, b) => (b[valueKey] as number) - (a[valueKey] as number))

  let lastValue: number | null = null
  let lastRank = 0
  ranked.forEach((row, i) => {
    const value = row[valueKey] as number
    const rank = value === lastValue ? lastRank : i + 1
    ;(row[rankKey] as number | null) = rank
    lastValue = value
    lastRank = rank
  })
}
