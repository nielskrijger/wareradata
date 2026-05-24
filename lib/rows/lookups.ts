import type { Country, MU, RankingTier, Region, UserLite } from '@/lib/warera/schemas'
import { RANKING_TIERS } from '@/lib/warera/schemas'

export interface Lookups {
  countryById: Map<string, { name: string, code: string }>
  muNameById: Map<string, string>
  regionById: Map<string, Region>
  userNameById: Map<string, string>
}

export function buildLookups(
  countries: Country[],
  mus: MU[],
  regions: Region[],
  users: UserLite[],
): Lookups {
  return {
    countryById: new Map(countries.map(c => [c._id, { name: c.name, code: c.code }])),
    muNameById: new Map(mus.map(m => [m._id, m.name])),
    regionById: new Map(regions.map(r => [r._id, r])),
    userNameById: new Map(users.map(u => [u._id, u.username])),
  }
}

export function toTier(value: unknown): RankingTier | null {
  return typeof value === 'string' && (RANKING_TIERS as readonly string[]).includes(value)
    ? (value as RankingTier)
    : null
}
