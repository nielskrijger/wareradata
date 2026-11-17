import type { CombatMode } from '@/lib/skills/classify'
import type { CaseRarityCounts, RankingTier } from '@/lib/warera/api'

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

  /**
   * Opens split by case type: case1 (the standard daily-reward case) and
   * case2 (the premium mythic case). Null when no case stats were captured.
   */
  standardCasesOpened: number | null
  mythicCasesOpened: number | null

  /**
   * Per-rarity pull counts split by case type, for the detail card's Standard /
   * Mythic toggle. Null when that type has no categorized pulls.
   */
  standardCasesByRarity: CaseRarityCounts | null
  mythicCasesByRarity: CaseRarityCounts | null

  /**
   * Per-rarity pull counts (case1+case2 merged, from the getUserById scrape),
   * flat so the Cases columns can sort and heat-tint. Null when no case stats
   * were captured.
   */
  casesCommon: number | null
  casesUncommon: number | null
  casesRare: number | null
  casesEpic: number | null
  casesLegendary: number | null
  casesMythic: number | null

  /**
   * Pull luck vs the official drop rates (100 = exactly the published odds).
   * Null under MIN_LUCK_PULLS categorized pulls (see lib/cases.ts).
   */
  caseLuck: number | null
  caseLuckRank: number | null

  /**
   * Weighted luck score inputs, kept on the row so group builders pool
   * members' scores instead of averaging their percentages.
   */
  caseLuckActual: number
  caseLuckExpected: number
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
  health: number | null
  hunger: number | null
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
  pointsRank: number | null
  pointsPerDay: number | null
  premiumGifts: number | null
  premiumGiftsRank: number | null
  premiumMonths: number | null
  premiumMonthsRank: number | null
  readinessStatus: 'buff' | 'debuff' | 'neither' | null

  /**
   * ISO timestamp when the active buff/debuff ends (buffs.buffEndAt /
   * debuffEndAt from the scrape), or null when no effect is active. Drives the
   * live countdown on the Buff column.
   */
  readinessEndsAt: string | null
  referrals: number | null
  referralsRank: number | null

  /**
   * Times the player has prestiged (`leveling.prestigeLevel`). The API's
   * `leveling.prestige` is unspent prestige points, kept as `prestigePoints`.
   */
  prestige: number | null
  prestigePoints: number | null

  /**
   * Lifetime XP. The level ranking orders on this, so a prestiged player can
   * outrank a higher level.
   */
  totalXp: number | null

  /**
   * Lifetime milestone tiers reached and skins owned, from the rankings block
   * (`userMilestoneTiers` / `userSkinsOwned`).
   */
  milestoneTiers: number | null
  milestoneTiersRank: number | null
  skinsOwned: number | null
  skinsOwnedRank: number | null
  terrain: number | null
  terrainRank: number | null
  username: string
  warPoints: number
  warPointsRank: number | null

  /**
   * War's share of war+eco skill investment (0 = pure eco … 1 = pure war), or
   * null when neither is trained. The Mode column sorts on this distribution.
   */
  warShare: number | null
  wealthPoints: number
  wealthRank: number | null
  wealth: number | null

  /**
   * Wealth's five parts in gold; null when the scrape hasn't captured the
   * breakdown yet.
   */
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

  /**
   * Stockpile: tradeable wealth held outside companies (items + cash +
   * equipment + weapons). Null when the wealth breakdown is absent.
   */
  stockpileWealth: number | null
  stockpileWealthRank: number | null
  weeklyDamage: number | null
  weeklyDamageRank: number | null

  /**
   * The user's factory totals; null when the factory scrape hasn't reached
   * them. topPotential feeds efficiency.
   */
  factoryCount: number | null
  factoryPpPerDay: number | null
  factoryNetPerDay: number | null
  factoryTopPotential: number | null

  /**
   * Per-user efficiency: net ÷ Top-potential (the same production on the most
   * profitable item), capped 100 — how close to the best item choice.
   * Null when nothing's produced. The user-table Efficiency column.
   */
  factoryEfficiencyPct: number | null

  /**
   * Net split by source and the employee headcount. The employee fields are
   * null when the roster is unknown.
   */
  factoryEngineNetPerDay: number | null
  factoryEmployeeNetPerDay: number | null
  factoryWorkers: number | null

  /**
   * Employee and manager wages per day.
   */
  factoryPayrollPerDay: number | null

  /**
   * The Employees group: per-employee averages and the count retiring within a
   * week. Null when the roster is unknown.
   */
  employeeAvgPpPerDay: number | null
  employeeAvgNetPerDay: number | null
  employeeAvgHappiness: number | null
  employeeRetiringSoon: number | null
}

/**
 * One active battle a country is in, from the country's point of view. Powers
 * the ⚔ pill's hover tooltip. Kept tiny on purpose: only what the tooltip
 * renders, so embedding the list on every CountryRow stays cheap on the wire.
 */
export interface ActiveBattleSummary {
  id: string

  /**
   * The other side (country flag/name), from this country's perspective.
   */
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
 * Mean readiness on a buff +1 / ready 0 / debuff -1 scale, so groups of any
 * size compare. Null when no member's status is known.
 */
export function readinessScore(mix: ReadinessPill): number | null {
  const total = mix.buff + mix.ready + mix.debuff

  return total > 0 ? (mix.buff - mix.debuff) / total : null
}

/**
 * Case pulls aggregated over a group's members (citizens for countries and
 * alliances): opens per case type, per-rarity counts, and pooled luck vs the
 * official odds (see lib/cases.ts). Shared by every group row.
 */
export interface GroupCaseStats {
  casesOpenedTotal: number
  standardCasesOpened: number
  mythicCasesOpened: number
  casesCommon: number
  casesUncommon: number
  casesRare: number
  casesEpic: number
  casesLegendary: number
  casesMythic: number
  caseLuck: number | null
  caseLuckRank: number | null
}

/**
 * Member-summed wealth parts with ranks; the total keeps a per-entity name
 * (memberWealth / citizenWealth).
 */
export interface GroupWealthParts {
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

  /**
   * Stockpile: member-summed tradeable wealth outside companies (items + cash +
   * equipment + weapons).
   */
  stockpileWealth: number
  stockpileWealthRank: number | null
}

/**
 * Member-summed factory economics with ranks; efficiency is Σ net ÷ Σ potential,
 * capped at 100. Zero until the factory scrape has run.
 */
export interface GroupFactoryStats {
  /**
   * Total factories owned across members (member-summed). 0 when none.
   */
  factoryCount: number
  factoryCountRank: number | null
  factoryPpPerDay: number
  factoryPpPerDayRank: number | null
  factoryNetPerDay: number
  factoryNetPerDayRank: number | null

  /**
   * Net split: engine vs employees (workforce, net of wages); together
   * they equal factoryNetPerDay. Plus the member-summed employee headcount.
   */
  factoryEngineNetPerDay: number
  factoryEngineNetPerDayRank: number | null
  factoryEmployeeNetPerDay: number
  factoryEmployeeNetPerDayRank: number | null
  factoryWorkers: number
  factoryWorkersRank: number | null
  factoryEfficiencyPct: number | null
  factoryEfficiencyPctRank: number | null
  factoryPayrollPerDay: number
  factoryPayrollPerDayRank: number | null

  /**
   * Per-employee averages pooled over every employee of members whose roster is
   * known, so a big employer weighs in proportionally. Null when none is.
   */
  employeeAvgPpPerDay: number | null
  employeeAvgPpPerDayRank: number | null
  employeeAvgNetPerDay: number | null
  employeeAvgNetPerDayRank: number | null
  employeeAvgHappiness: number | null
  employeeAvgHappinessRank: number | null
  employeeRetiringSoon: number
  employeeRetiringSoonRank: number | null
}

/**
 * Aggregate ranking points shared by every group row: the member-summed Total
 * (with its level / damage / wealth breakdown) plus the two per-member
 * averages. Only Total and Average carry a rank.
 */
export interface GroupPointsStats {
  totalPoints: number
  totalPointsRank: number | null
  avgPoints: number | null
  avgPointsRank: number | null
  avgPointsPerDay: number | null
  levelPoints: number
  damagePoints: number
  wealthPoints: number
}

/**
 * Member-summed premium spend shared by the country / MU / party rows
 * (alliances carry no premium aggregate): gems bought, premium months, and
 * premium gifts, each with a snapshot rank.
 */
export interface GroupPremiumStats {
  gemsPurchasedTotal: number
  gemsPurchasedTotalRank: number | null
  premiumMonthsTotal: number
  premiumMonthsTotalRank: number | null
  premiumGiftsTotal: number
  premiumGiftsTotalRank: number | null
}

/**
 * Member averages of gear, war share, health and hunger, plus the readiness mix.
 */
export interface GroupVitals {
  avgGearScore: number | null
  avgGearScoreRank: number | null
  avgWarShare: number | null
  avgWarShareRank: number | null
  avgHealth: number | null
  avgHealthRank: number | null
  avgHunger: number | null
  avgHungerRank: number | null
  readinessPill: ReadinessPill
}

/**
 * Damage stats straight from the API rankings.
 */
export interface GroupDamageStats {
  damage: number | null
  damageRank: number | null
  damageTier: RankingTier | null
  weeklyDamage: number | null
  weeklyDamageRank: number | null
}

/**
 * The leader's identity for avatar and link; null when there's none or they're
 * not in the snapshot.
 */
export interface LeaderFields {
  leaderId: string | null
  leaderName: string | null
  leaderAvatarUrl: string | null
  leaderColorScheme: string | null
}

/**
 * Projected country row used by /countries and /api/countries.
 */
export interface CountryRow extends
  GroupCaseStats,
  GroupWealthParts,
  GroupFactoryStats,
  GroupPointsStats,
  GroupPremiumStats,
  GroupVitals,
  GroupDamageStats {
  /**
   * Count of active battles this country is in (attacker or defender). Live
   * data, stamped on by withActiveBattleCounts(); 0 when not populated.
   */
  activeBattles: number

  /**
   * The battles behind `activeBattles`, for the pill's hover tooltip. Stamped
   * alongside the count by withActiveBattleCounts(); empty when not populated.
   */
  activeBattlesList: ActiveBattleSummary[]
  activePopulation: number | null
  activePopulationRank: number | null

  /**
   * The alliance this country belongs to, derived from the alliances' member
   * lists (not the country payload, so it holds even when a country payload
   * lacks allianceId). Null when unaligned.
   */
  allianceId: string | null
  allianceName: string | null
  alliesCount: number
  alliesCountRank: number | null
  avgLevel: number | null
  avgLevelRank: number | null
  bounty: number | null
  bountyRank: number | null

  /**
   * Sum of citizens' actual wealth in gold (real holdings, not the wealthPoints
   * points derivative). Surfaced as the "Citizen Wealth" column.
   */
  citizenWealth: number
  citizenWealthRank: number | null
  code: string

  /**
   * Daily national income in money (development, taxes, strategic resources,
   * government type), from the country's `income.total`.
   */
  dailyIncome: number | null
  dailyIncomeRank: number | null
  development: number | null
  developmentRank: number | null

  /**
   * Government type code: provisional, republic, homelandFront, federation,
   * plutocracy or autocracy. Null when the country payload has none.
   */
  govType: string | null
  id: string
  money: number | null
  moneyRank: number | null
  musCount: number
  musCountRank: number | null
  name: string
  partyCount: number
  partyCountRank: number | null
  taxIncome: number | null
  taxMarket: number | null
  taxManager: number | null
  unrestPercent: number | null
  warsCount: number
  warsCountRank: number | null
  wealthRank: number | null
  wealth: number | null
  weeklyDamagePerCitizen: number | null
  weeklyDamagePerCitizenRank: number | null
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

  /**
   * The official's political party, resolved from the party-membership lookup,
   * so the government view can colour and group officials by party. Null when
   * the official belongs to no party (an independent).
   */
  partyId: string | null
  partyName: string | null
  partyAvatarUrl: string | null
}

/**
 * A country's officials; executive seats are null when vacant.
 */
export interface GovernmentRow {
  president: GovernmentOfficial | null
  vicePresident: GovernmentOfficial | null

  /**
   * Appointed ministers in the order the API lists them, each with a display
   * title (known codes like `minOfDefense` mapped to a short label, custom
   * titles kept as written). Vacant or unknown users are skipped.
   */
  ministers: { title: string, official: GovernmentOfficial }[]
  congressMembers: GovernmentOfficial[]
}

/**
 * Strategic resource bonuses a country's citizens get, shared by every member
 * of an alliance. Built from `country.getStrategicResourceBonuses`
 * and read only by the country and alliance detail pages.
 */
export interface StrategicBonusRow {
  /**
   * The alliance sharing these bonuses, or null for a country on its own.
   */
  allianceId: string | null
  countryCount: number

  /**
   * Regions held per resource and the bonus level they reach (1, 4, 9 copies
   * give levels 1 to 3), most regions first.
   */
  resources: { resource: string, regionCount: number, level: number }[]

  /**
   * Bonus points per skill code (e.g. production +3), largest first.
   */
  skills: { skill: string, value: number }[]
}

/**
 * Projected MU (military unit) row used by /mus and /api/mus.
 */
export interface MURow extends
  GroupCaseStats,
  GroupWealthParts,
  GroupFactoryStats,
  GroupPointsStats,
  GroupPremiumStats,
  GroupVitals,
  GroupDamageStats,
  LeaderFields {
  avatarUrl: string | null
  avgLevel: number | null
  avgLevelRank: number | null
  bounty: number | null
  bountyRank: number | null
  countryCode: string | null
  countryId: string | null
  countryName: string | null
  dormitoriesLevel: number | null
  dormitoriesLevelRank: number | null
  headquartersLevel: number | null
  headquartersLevelRank: number | null
  id: string
  investedMoney: number
  investedMoneyRank: number | null
  lastRefreshedAt: string | null
  memberCount: number
  memberCountRank: number | null

  /**
   * Sum of members' actual wealth in gold (real holdings, not the wealthPoints
   * points derivative). Surfaced as the "Member Wealth" column.
   */
  memberWealth: number
  memberWealthRank: number | null
  name: string
  regionName: string | null
  reputation: number | null
  reputationRank: number | null
  terrain: number | null
  terrainRank: number | null
  wealthRank: number | null
  wealth: number | null
}

/**
 * Projected region row used by /regions and /api/regions.
 */
export interface RegionRow {
  baseDevelopment: number | null
  biome: string | null
  climate: string | null
  code: string

  /**
   * Companies and NPC employees located in the region.
   */
  companyCount: number | null
  employeeCount: number | null

  /**
   * Daily income the region yields its owner, from `income.total`.
   */
  dailyIncome: number | null

  /**
   * Current (occupying) owner.
   */
  countryCode: string | null
  countryId: string | null
  countryName: string | null

  /**
   * Core (original) owner, from the region's initialCountry. Equals the current
   * owner for a home region; differs when the region is occupied.
   */
  coreCountryCode: string | null
  coreCountryId: string | null
  coreCountryName: string | null
  development: number | null
  id: string
  isCapital: boolean
  isLinkedToCapital: boolean
  mainCity: string | null
  name: string
  neighborCount: number

  /**
   * Players living in the region.
   */
  population: number | null
  strategicResource: string | null
}

/**
 * A user, MU or country, resolved to what a cell needs to show and link it.
 */
export interface EntityRef {
  kind: 'user' | 'mu' | 'country'

  /**
   * For the detail-page link. Null if unresolved.
   */
  id: string | null
  name: string | null

  /**
   * ISO-3166 code for the flag: the country's own, or a user's citizenship.
   */
  code: string | null

  /**
   * User or MU avatar url.
   */
  avatarUrl: string | null

  /**
   * A user's profile colour scheme.
   */
  colorScheme: string | null
}

/**
 * One side of a matchup: a country, or for tournaments the team's MU, whose
 * name falls back to "Team #N".
 */
export type BattleSide = EntityRef & { kind: 'country' | 'mu' }

/**
 * Battles are events, not ranked entities, so there are no rank fields.
 *
 * The flat attacker/defender name and code fields exist for the text filter;
 * cells render from `attacker` / `defender`.
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

export type BattleSideKey = 'attacker' | 'defender'

/**
 * One entry of a battle leaderboard with its damage or money.
 */
export type BattleFighter = EntityRef & { value: number }

export interface BattleRoundRow {
  number: number
  attackerDamage: number
  defenderDamage: number
  attackerPoints: number
  defenderPoints: number
  wonBy: BattleSideKey | null
  isActive: boolean
}

export interface BattleHit {
  id: string
  side: BattleSideKey
  user: EntityRef
  damage: number
  isCritical: boolean
  isMissed: boolean
  weaponCode: string | null
  hitAt: string
}

export interface BattleOrderRow {
  side: BattleSideKey

  /**
   * The country or MU that set the order.
   */
  by: EntityRef
  priority: string
}

export interface BattleContractRow {
  id: string
  side: BattleSideKey
  mu: EntityRef
  budget: number
  perK: number
  status: string
}

export interface BattleSideStats {
  damage: number
  hits: number
  moneyPool: number
  moneyPer1k: number | null

  /**
   * Distinct players who dealt damage, from the ranking's entry count.
   */
  fighters: number
}

/**
 * What the battle page adds to its {@link BattleRow}, fetched live per battle.
 */
export interface BattleDetail {
  startedAt: string
  sides: Record<BattleSideKey, BattleSideStats>
  rounds: BattleRoundRow[]
  players: Record<BattleSideKey, BattleFighter[]>
  earners: Record<BattleSideKey, BattleFighter[]>
  mus: Record<BattleSideKey, BattleFighter[]>
  countries: Record<BattleSideKey, BattleFighter[]>

  /**
   * The live round's latest hits, newest first; empty once the battle ends.
   */
  hits: BattleHit[]
  orders: BattleOrderRow[]
  contracts: BattleContractRow[]
}

/**
 * Projected political-party row used by /parties and /api/parties.
 */
export interface PartyRow extends GroupCaseStats, GroupWealthParts, GroupPointsStats, GroupPremiumStats, LeaderFields {
  avatarUrl: string | null
  avgLevel: number | null
  avgLevelRank: number | null
  countryCode: string | null
  countryId: string | null
  countryName: string | null
  createdAt: string | null
  description: string | null
  id: string
  memberCount: number
  memberCountRank: number | null

  /**
   * Sum of members' actual wealth in gold (real holdings, not the wealthPoints
   * points derivative). Surfaced as the "Total" wealth column.
   */
  memberWealth: number
  name: string
}

/**
 * One member country of an alliance, resolved from the raw country id to the
 * bits the alliance pages render (flag, linked name, per-member development).
 */
export interface AllianceMemberRow {
  countryId: string
  code: string | null
  name: string

  /**
   * This member's development contribution; the members' coreDevelopments sum
   * to the alliance's, which is what the roster share column leans on.
   */
  coreDevelopment: number
  averageDevelopment: number
  suspended: boolean

  /**
   * Country stats joined from the member's CountryRow, so the members table
   * can show what each country brings beyond development (the in-game view
   * shows development only).
   */
  activePopulation: number | null
  weeklyDamage: number | null
  citizenWealth: number | null
  avgLevel: number | null
  damageTier: RankingTier | null
}

/**
 * Values and ranks come from the API's alliance rankings, which cover every
 * alliance.
 */
export interface AllianceRow extends
  GroupCaseStats,
  GroupWealthParts,
  GroupFactoryStats,
  GroupPointsStats,
  GroupPremiumStats,
  GroupVitals,
  GroupDamageStats,
  LeaderFields {
  id: string
  name: string

  /**
   * WarEra color scheme name (same palette as user profiles), the alliance's
   * visual identity across the map and our list/detail pages.
   */
  scheme: string
  avatarUrl: string | null
  memberCount: number
  members: AllianceMemberRow[]

  /**
   * Concatenated member names + codes, so free-text and `country:` searches
   * can match an alliance by any member country.
   */
  memberNames: string

  /**
   * Citizen-summed wealth: the member countries' citizenWealth added up (its
   * five components, from GroupWealthParts, are summed the same way). Feeds the
   * table's wealth column group.
   */
  citizenWealth: number
  citizenWealthRank: number | null
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
  weeklyDamagePerCitizen: number | null
  weeklyDamagePerCitizenRank: number | null
}
