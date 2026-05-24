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
  createdAt: string | null
  damageRank: number | null
  damageValue: number | null
  damagePoints: number
  gemsPurchasedValue: number | null
  id: string
  isBanned: boolean
  lastConnectionAt: string | null
  level: number | null
  levelPoints: number
  levelRank: number | null
  levelTier: RankingTier | null
  militaryRank: number | null
  muId: string | null
  muName: string | null
  partyId: string | null
  partyName: string | null
  points: number
  pointsPerDay: number | null
  premiumGiftsValue: number | null
  premiumMonthsValue: number | null
  referralsValue: number | null
  terrainValue: number | null
  username: string
  wealthPoints: number
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
  damagePoints: number
  development: number | null
  id: string
  levelPoints: number
  money: number | null
  musCount: number
  name: string
  partyCount: number
  productionBonusValue: number | null
  specializedItem: string | null
  taxIncome: number | null
  taxMarket: number | null
  taxSelfWork: number | null
  totalPoints: number
  unrestPercent: number | null
  warsCount: number
  wealthPoints: number
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
  damagePoints: number
  dormitoriesLevel: number | null
  headquartersLevel: number | null
  id: string
  investedMoney: number
  levelPoints: number
  memberCount: number
  mercenaryReputation: number | null
  name: string
  regionName: string | null
  reputationValue: number | null
  terrainValue: number | null
  totalPoints: number
  wealthPoints: number
  wealthRank: number | null
  wealthValue: number | null
  weeklyDamageValue: number | null
}

/**
 * Projected political-party row used by /parties and /api/parties.
 */
export interface PartyRow {
  avgPoints: number | null
  countryCode: string | null
  countryId: string | null
  countryName: string | null
  createdAt: string | null
  damagePoints: number
  description: string | null
  id: string
  imperialism: number | null
  industrialism: number | null
  isolationism: number | null
  leaderName: string | null
  levelPoints: number
  memberCount: number
  militarism: number | null
  name: string
  totalPoints: number
  wealthPoints: number
}
