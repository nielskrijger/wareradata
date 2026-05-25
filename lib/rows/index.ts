import type { RankingTier } from '@/lib/warera/api'

/**
 * Projected user row used by both the /users page and /api/users.
 * Kept narrow on purpose: client only renders these fields, so the wire
 * payload stays small.
 */
export interface UserRow {
  avatarUrl: string | null
  bounty: number | null
  bountyRank: number | null
  casesOpened: number | null
  casesOpenedRank: number | null
  countryCode: string | null
  countryId: string
  countryName: string | null
  colorScheme: string | null
  createdAt: string | null
  damageRank: number | null
  damage: number | null
  damagePoints: number
  gemsPurchased: number | null
  gemsPurchasedRank: number | null
  id: string
  isBanned: boolean
  lastConnectionAt: string | null
  level: number | null
  levelPoints: number
  levelRank: number | null
  levelTier: RankingTier | null
  militaryRank: number | null
  militaryRankPos: number | null
  muId: string | null
  muName: string | null
  partyId: string | null
  partyName: string | null
  points: number
  pointsPerDay: number | null
  premiumGifts: number | null
  premiumGiftsRank: number | null
  premiumMonths: number | null
  premiumMonthsRank: number | null
  referrals: number | null
  referralsRank: number | null
  terrain: number | null
  terrainRank: number | null
  username: string
  wealthPoints: number
  wealthRank: number | null
  wealth: number | null
  weeklyDamage: number | null
  weeklyDamageRank: number | null
}

/**
 * Projected country row used by /countries and /api/countries.
 */
export interface CountryRow {
  activePopulation: number | null
  alliesCount: number
  avgLevel: number | null
  avgPoints: number | null
  bounty: number | null
  code: string
  damageRank: number | null
  damageTier: RankingTier | null
  damage: number | null
  damagePoints: number
  development: number | null
  gemsPurchasedTotal: number
  id: string
  levelPoints: number
  money: number | null
  musCount: number
  name: string
  partyCount: number
  premiumGiftsTotal: number
  premiumMonthsTotal: number
  productionBonus: number | null
  specializedItem: string | null
  taxIncome: number | null
  taxMarket: number | null
  taxSelfWork: number | null
  totalPoints: number
  unrestPercent: number | null
  warsCount: number
  wealthPoints: number
  wealthRank: number | null
  wealth: number | null
  weeklyDamagePerCitizen: number | null
  weeklyDamage: number | null
}

/**
 * Projected MU (military unit) row used by /mus and /api/mus.
 */
export interface MURow {
  avatarUrl: string | null
  avgLevel: number | null
  avgLevelRank: number | null
  avgPoints: number | null
  avgPointsRank: number | null
  bounty: number | null
  bountyRank: number | null
  countryCode: string | null
  countryId: string | null
  countryName: string | null
  damageRank: number | null
  damageTier: RankingTier | null
  damage: number | null
  damagePoints: number
  dormitoriesLevel: number | null
  dormitoriesLevelRank: number | null
  gemsPurchasedTotal: number
  gemsPurchasedTotalRank: number | null
  headquartersLevel: number | null
  headquartersLevelRank: number | null
  id: string
  investedMoney: number
  investedMoneyRank: number | null
  leaderAvatarUrl: string | null
  leaderColorScheme: string | null
  leaderId: string | null
  leaderName: string | null
  levelPoints: number
  memberCount: number
  memberCountRank: number | null
  name: string
  premiumGiftsTotal: number
  premiumGiftsTotalRank: number | null
  premiumMonthsTotal: number
  premiumMonthsTotalRank: number | null
  regionName: string | null
  reputation: number | null
  reputationRank: number | null
  terrain: number | null
  terrainRank: number | null
  totalPoints: number
  totalPointsRank: number | null
  wealthPoints: number
  wealthRank: number | null
  wealth: number | null
  weeklyDamage: number | null
  weeklyDamageRank: number | null
}

/**
 * Projected region row used by /regions and /api/regions.
 */
export interface RegionRow {
  baseDevelopment: number | null
  biome: string | null
  climate: string | null
  code: string
  countryCode: string | null
  countryName: string | null
  development: number | null
  id: string
  isCapital: boolean
  isLinkedToCapital: boolean
  mainCity: string | null
  name: string
  neighborCount: number
  strategicResource: string | null
}

/**
 * Projected political-party row used by /parties and /api/parties.
 */
export interface PartyRow {
  avgLevel: number | null
  avgPoints: number | null
  countryCode: string | null
  countryId: string | null
  countryName: string | null
  createdAt: string | null
  damagePoints: number
  description: string | null
  gemsPurchasedTotal: number
  id: string
  imperialism: number | null
  industrialism: number | null
  isolationism: number | null
  leaderAvatarUrl: string | null
  leaderColorScheme: string | null
  leaderId: string | null
  leaderName: string | null
  levelPoints: number
  memberCount: number
  militarism: number | null
  name: string
  premiumGiftsTotal: number
  premiumMonthsTotal: number
  totalPoints: number
  wealthPoints: number
}
