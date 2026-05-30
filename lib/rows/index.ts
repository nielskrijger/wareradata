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
  healthPercent: number | null
  hungerPercent: number | null
  gearScore: number | null
  gearScoreRank: number | null
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
  muAvatarUrl: string | null
  muId: string | null
  muName: string | null
  partyAvatarUrl: string | null
  partyId: string | null
  partyName: string | null
  points: number
  pointsPerDay: number | null
  premiumGifts: number | null
  premiumGiftsRank: number | null
  premiumMonths: number | null
  premiumMonthsRank: number | null
  readinessStatus: 'buff' | 'debuff' | 'neither' | null
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
 * One active battle a country is in, from the country's point of view. Powers
 * the ⚔ pill's hover tooltip. Kept tiny on purpose: only what the tooltip
 * renders, so embedding the list on every CountryRow stays cheap on the wire.
 */
export interface ActiveBattleSummary {
  id: string
  // The other side (country flag/name), from this country's perspective.
  opponentName: string | null
  opponentCode: string | null
  regionName: string | null
  isResistance: boolean
  isTournament: boolean
}

/**
 * Member counts by readiness status (buff / ready / debuff) for an entity, used
 * by the ReadinessPillBar. Excludes members with an unknown status, so the three
 * need not sum to the member count.
 */
export interface ReadinessPill {
  buff: number
  ready: number
  debuff: number
}

/**
 * Mean readiness of an entity's classified members on a buff +1 / ready 0 /
 * debuff -1 scale, so the value ranges -1 (all debuffed) to +1 (all buffed) and
 * is comparable across entities of different sizes. Null when no member has a
 * known status. The sort key for the readiness column.
 */
export function readinessScore(mix: ReadinessPill): number | null {
  const total = mix.buff + mix.ready + mix.debuff
  return total > 0 ? (mix.buff - mix.debuff) / total : null
}

/**
 * Projected country row used by /countries and /api/countries.
 */
export interface CountryRow {
  // Count of active battles this country is in (attacker or defender). Live
  // data, stamped on by withActiveBattleCounts(); 0 when not populated.
  activeBattles: number
  // The battles behind `activeBattles`, for the pill's hover tooltip. Stamped
  // alongside the count by withActiveBattleCounts(); empty when not populated.
  activeBattlesList: ActiveBattleSummary[]
  activePopulation: number | null
  activePopulationRank: number | null
  alliesCount: number
  alliesCountRank: number | null
  avgHealth: number | null
  avgHealthRank: number | null
  avgHunger: number | null
  avgHungerRank: number | null
  avgLevel: number | null
  avgLevelRank: number | null
  avgPoints: number | null
  avgPointsRank: number | null
  bounty: number | null
  bountyRank: number | null
  code: string
  damageRank: number | null
  damageTier: RankingTier | null
  damage: number | null
  damagePoints: number
  development: number | null
  developmentRank: number | null
  gemsPurchasedTotal: number
  gemsPurchasedTotalRank: number | null
  id: string
  levelPoints: number
  money: number | null
  moneyRank: number | null
  musCount: number
  musCountRank: number | null
  name: string
  partyCount: number
  partyCountRank: number | null
  premiumGiftsTotal: number
  premiumGiftsTotalRank: number | null
  premiumMonthsTotal: number
  premiumMonthsTotalRank: number | null
  productionBonus: number | null
  productionBonusRank: number | null
  readinessPill: ReadinessPill
  specializedItem: string | null
  taxIncome: number | null
  taxMarket: number | null
  taxSelfWork: number | null
  totalPoints: number
  totalPointsRank: number | null
  unrestPercent: number | null
  warsCount: number
  warsCountRank: number | null
  wealthPoints: number
  wealthRank: number | null
  wealth: number | null
  weeklyDamagePerCitizen: number | null
  weeklyDamagePerCitizenRank: number | null
  weeklyDamage: number | null
  weeklyDamageRank: number | null
}

/**
 * Projected MU (military unit) row used by /mus and /api/mus.
 */
export interface MURow {
  avatarUrl: string | null
  avgHealth: number | null
  avgHealthRank: number | null
  avgHunger: number | null
  avgHungerRank: number | null
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
  lastRefreshedAt: string | null
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
  readinessPill: ReadinessPill
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
  countryId: string | null
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
 * One side of a battle's matchup. Country wars resolve to a country (flag +
 * link to /countries); tournament battles resolve to the team's MU (avatar +
 * link to /mus), falling back to "Team #N" when the MU isn't in the snapshot.
 * The cell branches on `kind` to pick flag vs. avatar and the link target.
 */
export interface BattleSide {
  kind: 'country' | 'mu'
  // Country or MU id, for the detail-page link. Null if unresolved.
  id: string | null
  // Country name, MU name, or "Team #N" fallback.
  name: string | null
  // ISO-3166 code for the flag (country sides only).
  code: string | null
  // MU avatar url (mu sides only).
  avatarUrl: string | null
}

/**
 * Projected battle row used by /battles and /api/battles. Battles are events,
 * not entities ranked against each other, so there are no rank fields (cf.
 * RegionRow). `attackerDamage` / `defenderDamage` are cumulative across the
 * whole battle; `roundAttackerDamage` / `roundDefenderDamage` are the current
 * (or final) round only, which drives the live-progress bar.
 *
 * `attackerName` / `defenderName` / `attackerCode` / `defenderCode` are kept
 * flat (mirroring the structured sides) purely so the liqe text filter can
 * match on them; the cells render from `attacker` / `defender`.
 */
export interface BattleRow {
  attacker: BattleSide
  attackerCode: string | null
  attackerDamage: number
  attackerName: string | null
  attackerWonRounds: number
  createdAt: string | null
  defender: BattleSide
  defenderCode: string | null
  defenderDamage: number
  defenderName: string | null
  defenderWonRounds: number
  endedAt: string | null
  id: string
  isActive: boolean
  isResistance: boolean
  isTournament: boolean
  moneyPool: number
  regionId: string | null
  regionName: string | null
  roundAttackerDamage: number
  roundDefenderDamage: number
  roundsToWin: number
  totalDamage: number
  tournamentName: string | null
  tournamentRound: number | null
  wonBy: 'attacker' | 'defender' | null
}

/**
 * Projected political-party row used by /parties and /api/parties.
 */
export interface PartyRow {
  avatarUrl: string | null
  avgLevel: number | null
  avgLevelRank: number | null
  avgPoints: number | null
  avgPointsRank: number | null
  countryCode: string | null
  countryId: string | null
  countryName: string | null
  createdAt: string | null
  damagePoints: number
  description: string | null
  gemsPurchasedTotal: number
  gemsPurchasedTotalRank: number | null
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
  memberCountRank: number | null
  militarism: number | null
  name: string
  premiumGiftsTotal: number
  premiumGiftsTotalRank: number | null
  premiumMonthsTotal: number
  premiumMonthsTotalRank: number | null
  totalPoints: number
  totalPointsRank: number | null
  wealthPoints: number
}
