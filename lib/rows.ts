import type { RankingTier } from '@/lib/warera/schemas'

/**
 * Projected user row used by both the /users page and /api/users.
 * Kept narrow on purpose: client only renders these fields, so the wire
 * payload stays small.
 */
export interface UserRow {
  bountyValue: number | null
  casesOpenedValue: number | null
  countryCode: string | null
  countryId: string
  countryName: string | null
  damageRank: number | null
  damageValue: number | null
  gemsPurchasedValue: number | null
  id: string
  isBanned: boolean
  lastConnectionAt: string | null
  level: number | null
  levelRank: number | null
  levelTier: RankingTier | null
  militaryRank: number | null
  muId: string | null
  muName: string | null
  points: number
  premiumGiftsValue: number | null
  premiumMonthsValue: number | null
  referralsValue: number | null
  terrainValue: number | null
  username: string
  wealthRank: number | null
  wealthValue: number | null
  weeklyDamageValue: number | null
}

/**
 * Projected country row used by /countries and /api/countries.
 */
export interface CountryRow {
  activePopulation: number | null
  alliesCount: number
  avgPoints: number | null
  bountyValue: number | null
  code: string
  damageRank: number | null
  damageTier: RankingTier | null
  damageValue: number | null
  development: number | null
  id: string
  money: number | null
  name: string
  productionBonusValue: number | null
  specializedItem: string | null
  taxIncome: number | null
  taxMarket: number | null
  taxSelfWork: number | null
  totalPoints: number
  unrestPercent: number | null
  warsCount: number
  wealthRank: number | null
  wealthValue: number | null
  weeklyDamagePerCitizenValue: number | null
  weeklyDamageValue: number | null
}

/**
 * Projected MU (military unit) row used by /mus and /api/mus.
 */
export interface MURow {
  avgPoints: number | null
  bountyValue: number | null
  countryCode: string | null
  countryId: string | null
  countryName: string | null
  damageRank: number | null
  damageTier: RankingTier | null
  damageValue: number | null
  dormitoriesLevel: number | null
  headquartersLevel: number | null
  id: string
  investedMoney: number
  memberCount: number
  mercenaryReputation: number | null
  name: string
  regionName: string | null
  reputationValue: number | null
  terrainValue: number | null
  totalPoints: number
  wealthRank: number | null
  wealthValue: number | null
  weeklyDamageValue: number | null
}
