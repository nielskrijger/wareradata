import type { Country, MU, Party, RankingTier, Region, UserLite } from '@/lib/warera/api'
import { RANKING_TIERS } from '@/lib/warera/api'

export interface Lookups {
  countryById: Map<string, { name: string, code: string }>
  muNameById: Map<string, string>
  regionById: Map<string, Region>
  userNameById: Map<string, string>
  partyByUser: Map<string, { id: string, name: string }>
  partyCountByCountry: Map<string, number>
}

export function buildLookups(
  countries: Country[],
  mus: MU[],
  regions: Region[],
  users: UserLite[],
  parties: Party[],
): Lookups {
  const partyByUser = new Map<string, { id: string, name: string }>()
  const partyCountByCountry = new Map<string, number>()
  for (const p of parties) {
    if (p.members) {
      for (const uid of p.members) {
        partyByUser.set(uid, { id: p._id, name: p.name })
      }
    }
    if (p.country) {
      partyCountByCountry.set(p.country, (partyCountByCountry.get(p.country) ?? 0) + 1)
    }
  }

  return {
    countryById: new Map(countries.map(c => [c._id, { name: c.name, code: c.code }])),
    muNameById: new Map(mus.map(m => [m._id, m.name])),
    regionById: new Map(regions.map(r => [r._id, r])),
    userNameById: new Map(users.map(u => [u._id, u.username])),
    partyByUser,
    partyCountByCountry,
  }
}

export function toTier(value: unknown): RankingTier | null {
  return typeof value === 'string' && (RANKING_TIERS as readonly string[]).includes(value)
    ? (value as RankingTier)
    : null
}
