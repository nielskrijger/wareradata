import type { CombatMode } from '@/lib/skills/classify'
import type { CasesBreakdown, RankingTier } from '@/lib/warera/api'

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
  // Per-rarity split of cases opened (from the getUserById scrape)
  casesByRarity: CasesBreakdown | null
  combatMode: CombatMode
  countryCode: string | null
  countryId: string
  countryName: string | null
  colorScheme: string | null
  createdAt: string | null
  damageRank: number | null
  damage: number | null
  damagePoints: number
  ecoPoints: number
  ecoPointsRank: number | null
  healthPercent: number | null
  hungerPercent: number | null
  gearScore: number | null
  gearScoreRank: number | null
  gemsPurchased: number | null
  gemsPurchasedRank: number | null
  id: string
  isBanned: boolean
  lastConnectionAt: string | null
  lastRefreshedAt: string | null
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
  // ISO timestamp when the active buff/debuff ends (buffs.buffEndAt /
  // debuffEndAt from the scrape), or null when no effect is active. Drives the
  // live countdown on the Buff column.
  readinessEndsAt: string | null
  referrals: number | null
  referralsRank: number | null
  terrain: number | null
  terrainRank: number | null
  username: string
  warPoints: number
  warPointsRank: number | null
  // War's share of war+eco skill investment (0 = pure eco … 1 = pure war), or
  // null when neither is trained. The Mode column sorts on this distribution.
  warShare: number | null
  wealthPoints: number
  wealthRank: number | null
  wealth: number | null
  // The five parts that make up wealth (gold), from the getUserById
  // `stats.wealth` payload. Null when a scrape hasn't captured the breakdown for
  // this user yet (a small fraction). Surfaced as the "Wealth composition" card
  // and the per-component table columns.
  companiesWealth: number | null
  companiesWealthRank: number | null
  itemsWealth: number | null
  itemsWealthRank: number | null
  cashWealth: number | null
  cashWealthRank: number | null
  equipmentWealth: number | null
  equipmentWealthRank: number | null
  weaponsWealth: number | null
  weaponsWealthRank: number | null
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
  // The alliance this country belongs to, derived from the alliances' member
  // lists (not the country payload, so it works even on a snapshot whose
  // countries predate the alliances feature). Null when unaligned.
  allianceId: string | null
  allianceName: string | null
  alliesCount: number
  alliesCountRank: number | null
  avgWarShare: number | null
  avgWarShareRank: number | null
  avgGearScore: number | null
  avgGearScoreRank: number | null
  avgHealth: number | null
  avgHealthRank: number | null
  avgHunger: number | null
  avgHungerRank: number | null
  avgLevel: number | null
  avgLevelRank: number | null
  avgPoints: number | null
  avgPointsRank: number | null
  avgPointsPerDay: number | null
  bounty: number | null
  bountyRank: number | null
  // Sum of citizens' actual wealth in gold (real holdings, not the wealthPoints
  // points derivative). Surfaced as the "Citizen Wealth" column.
  citizenWealth: number
  citizenWealthRank: number | null
  // Citizen-summed wealth parts (each the sum of citizens' stats.wealth.*).
  // Feed the country "Wealth composition" card and the per-component columns.
  companiesWealth: number
  companiesWealthRank: number | null
  itemsWealth: number
  itemsWealthRank: number | null
  cashWealth: number
  cashWealthRank: number | null
  equipmentWealth: number
  equipmentWealthRank: number | null
  weaponsWealth: number
  weaponsWealthRank: number | null
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
 * One government office holder, resolved from a user id to the bits the country
 * page needs to render an avatar + linked name (and the hover card). Null fields
 * are dropped upstream, so every official here is a real, in-snapshot user.
 */
export interface GovernmentOfficial {
  id: string
  name: string
  avatarUrl: string | null
  colorScheme: string | null
  // The official's political party, resolved from the party-membership lookup,
  // so the government view can colour and group officials by party. Null when
  // the official belongs to no party (an independent).
  partyId: string | null
  partyName: string | null
  partyAvatarUrl: string | null
}

/**
 * A country's elected officials, resolved from {@link RawSnapshot.governments}
 * user ids to renderable {@link GovernmentOfficial}s. Executive seats are null
 * when vacant (or the holder isn't in the snapshot); congress is the resolved
 * roster, which may be empty. Built per country, read only by the country page.
 */
export interface GovernmentRow {
  president: GovernmentOfficial | null
  vicePresident: GovernmentOfficial | null
  minOfDefense: GovernmentOfficial | null
  minOfEconomy: GovernmentOfficial | null
  minOfForeignAffairs: GovernmentOfficial | null
  congressMembers: GovernmentOfficial[]
}

/**
 * Projected MU (military unit) row used by /mus and /api/mus.
 */
export interface MURow {
  avatarUrl: string | null
  avgWarShare: number | null
  avgWarShareRank: number | null
  avgGearScore: number | null
  avgGearScoreRank: number | null
  avgHealth: number | null
  avgHealthRank: number | null
  avgHunger: number | null
  avgHungerRank: number | null
  avgLevel: number | null
  avgLevelRank: number | null
  avgPoints: number | null
  avgPointsRank: number | null
  avgPointsPerDay: number | null
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
  // Sum of members' actual wealth in gold (real holdings, not the wealthPoints
  // points derivative). Surfaced as the "Member Wealth" column.
  memberWealth: number
  memberWealthRank: number | null
  // Member-summed wealth parts (each the sum of members' stats.wealth.*). Feed
  // the MU "Wealth composition" card and the per-component columns.
  companiesWealth: number
  companiesWealthRank: number | null
  itemsWealth: number
  itemsWealthRank: number | null
  cashWealth: number
  cashWealthRank: number | null
  equipmentWealth: number
  equipmentWealthRank: number | null
  weaponsWealth: number
  weaponsWealthRank: number | null
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
  avgPointsPerDay: number | null
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
  // Sum of members' actual wealth in gold (real holdings, not the wealthPoints
  // points derivative). Surfaced as the "Total" wealth column.
  memberWealth: number
  // Member-summed wealth parts (each the sum of members' stats.wealth.*). Feed
  // the party "Wealth composition" card and the per-component columns.
  companiesWealth: number
  companiesWealthRank: number | null
  itemsWealth: number
  itemsWealthRank: number | null
  cashWealth: number
  cashWealthRank: number | null
  equipmentWealth: number
  equipmentWealthRank: number | null
  weaponsWealth: number
  weaponsWealthRank: number | null
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

/**
 * One member country of an alliance, resolved from the raw country id to the
 * bits the alliance pages render (flag, linked name, per-member development).
 */
export interface AllianceMemberRow {
  countryId: string
  code: string | null
  name: string
  // This member's development contribution; the members' coreDevelopments sum
  // to the alliance's, which is what the roster share column leans on.
  coreDevelopment: number
  averageDevelopment: number
  suspended: boolean
  // Country stats joined from the member's CountryRow, so the members table
  // can show what each country brings beyond development (the in-game view
  // shows development only).
  activePopulation: number | null
  weeklyDamage: number | null
  citizenWealth: number | null
  avgLevel: number | null
  damageTier: RankingTier | null
}

/**
 * Projected alliance (multi-country bloc) row used by /alliances and
 * /api/alliances. Values and ranks come from the live alliance rankings (the
 * API ranks all alliances, so its ranks are authoritative); members are
 * resolved and sorted by development contribution at build time.
 */
export interface AllianceRow {
  id: string
  name: string
  // WarEra color scheme name (same palette as user profiles), the alliance's
  // visual identity across the map and our list/detail pages.
  scheme: string
  avatarUrl: string | null
  leaderId: string | null
  leaderName: string | null
  leaderAvatarUrl: string | null
  leaderColorScheme: string | null
  memberCount: number
  members: AllianceMemberRow[]
  // Concatenated member names + codes, so free-text and `country:` searches
  // can match an alliance by any member country.
  memberNames: string
  // Aggregate ranking points over the citizens of all member countries
  // (totalPoints = level + damage + wealth parts), plus per-citizen averages,
  // mirroring the countries/MUs/parties aggregates.
  totalPoints: number
  totalPointsRank: number | null
  avgPoints: number | null
  avgPointsRank: number | null
  avgPointsPerDay: number | null
  levelPoints: number
  damagePoints: number
  wealthPoints: number
  // Citizen-summed wealth (the member countries' citizenWealth and its
  // components added up). Feeds the table's wealth column group.
  citizenWealth: number
  citizenWealthRank: number | null
  companiesWealth: number
  companiesWealthRank: number | null
  itemsWealth: number
  itemsWealthRank: number | null
  cashWealth: number
  cashWealthRank: number | null
  equipmentWealth: number
  equipmentWealthRank: number | null
  weaponsWealth: number
  weaponsWealthRank: number | null
  createdAt: string | null
  development: number | null
  developmentRank: number | null
  developmentTier: RankingTier | null
  coreDevelopment: number | null
  coreDevelopmentRank: number | null
  averageDevelopment: number | null
  averageDevelopmentRank: number | null
  population: number | null
  populationRank: number | null
  totalDamage: number | null
  totalDamageRank: number | null
  weeklyDamage: number | null
  weeklyDamageRank: number | null
  weeklyDamagePerCitizen: number | null
  weeklyDamagePerCitizenRank: number | null
}
