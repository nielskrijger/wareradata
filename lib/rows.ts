import type { RankingTier } from '@/lib/warera/schemas'

/**
 * Projected user row used by both the /users page and /api/users.
 * Kept narrow on purpose: client only renders these fields, so the wire
 * payload stays small.
 */
export interface UserRow {
  id: string
  username: string
  countryId: string | null
  countryCode: string | null
  countryName: string | null
  level: number | null
  levelRank: number | null
  levelTier: RankingTier | null
  wealthRank: number | null
  wealthValue: number | null
  damageRank: number | null
  damageValue: number | null
  militaryRank: number | null
  muName: string | null
  lastConnectionAt: string | null
  isBanned: boolean
  points: number
}

/**
 * Projected country row used by /countries and /api/countries.
 */
export interface CountryRow {
  id: string
  name: string
  code: string
  damageRank: number | null
  damageValue: number | null
  damageTier: RankingTier | null
  weeklyDamageValue: number | null
  wealthRank: number | null
  wealthValue: number | null
  development: number | null
  activePopulation: number | null
}
