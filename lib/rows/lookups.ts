import type { Country, MU, RankingTier, Region } from '@/lib/warera/schemas'
import { RANKING_TIERS } from '@/lib/warera/schemas'

export interface Lookups {
  countryById: Map<string, { name: string, code: string }>
  muNameById: Map<string, string>
  regionById: Map<string, Region>
}

export function buildLookups(
  countries: Country[],
  mus: MU[],
  regions: Region[],
): Lookups {
  return {
    countryById: new Map(countries.map(c => [c._id, { name: c.name, code: c.code }])),
    muNameById: new Map(mus.map(m => [m._id, m.name])),
    regionById: new Map(regions.map(r => [r._id, r])),
  }
}

export function toTier(value: unknown): RankingTier | null {
  return typeof value === 'string' && (RANKING_TIERS as readonly string[]).includes(value)
    ? (value as RankingTier)
    : null
}
