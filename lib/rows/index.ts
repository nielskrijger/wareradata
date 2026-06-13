import type { CombatMode } from '@/lib/skills/classify'
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
  // Opens split by case type: case1 (the standard daily-reward case) and
  // case2 (the premium mythic case). Null when no case stats were captured.
  standardCasesOpened: number | null
  mythicCasesOpened: number | null
  // Per-rarity pull counts (case1+case2 merged, from the getUserById scrape),
  // flat so the Cases columns can sort and heat-tint. Null when no case stats
  // were captured.
  casesCommon: number | null
  casesUncommon: number | null
  casesRare: number | null
  casesEpic: number | null
  casesLegendary: number | null
  casesMythic: number | null
  // Pull luck vs the official drop rates (100 = exactly the published odds).
  // Null under MIN_LUCK_PULLS categorized pulls (see lib/cases.ts).
  caseLuck: number | null
  caseLuckRank: number | null
  // Weighted luck score inputs, kept on the row so group builders pool
  // members' scores instead of averaging their percentages.
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
  // Per-user factory totals from the factory scrape. PpPerDay / netPerDay /
  // count are shown in the user table's Industry group; topPotential backs the
  // per-user efficiency and is summed by member-agg into the entity Industry
  // columns. Null when the scrape hasn't captured this user.
  factoryCount: number | null
  factoryPpPerDay: number | null
  factoryNetPerDay: number | null
  factoryTopPotential: number | null
  // Per-user efficiency: net ÷ Top-potential (the most profitable item globally
  // at its best region), capped 100 — how close to the game's best production.
  // Null when nothing's produced. The user-table Efficiency column.
  factoryEfficiencyPct: number | null
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
 * Member-summed wealth components shared by every group row: each is the sum of
 * the members'/citizens' `stats.wealth.*` parts (companies, items, cash,
 * equipment, weapons), with a snapshot rank. The wealth Total is named per
 * entity (memberWealth / citizenWealth), so it stays on each row. UserRow keeps
 * its own nullable versions (one player can lack the breakdown).
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
}

/**
 * Member-summed factory economics shared by the country / MU / alliance rows:
 * production points/day (total + per-member), net gold/day, and location
 * efficiency (Σ net ÷ Σ Move-potential, capped at 100). Each ranked value
 * carries a snapshot rank. Sourced from the slow factory scrape, so all fields
 * read 0 / null until it (and a main scrape carrying market data) have run.
 */
export interface GroupFactoryStats {
  factoryPpPerDay: number
  factoryPpPerDayRank: number | null
  factoryPpPerMember: number | null
  factoryPpPerMemberRank: number | null
  factoryNetPerDay: number
  factoryNetPerDayRank: number | null
  factoryEfficiencyPct: number | null
  factoryEfficiencyRank: number | null
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
 * Member-averaged combat/condition stats produced from a group's pooled
 * citizens: average gear score, war-share, health and hunger, plus the
 * buff/ready/debuff readiness split. Shared by CountryRow, MURow and
 * AllianceRow (filled via {@link aggVitals}); UserRow keeps the raw per-person
 * fields instead. Ranks are assigned by rankAll.
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
 * Damage rankings shared by the country / MU / alliance rows: total damage
 * (value + rank + tier) and weekly damage, all from the upstream API rankings
 * per entity (no agg spread — the builders assign them directly).
 * weeklyDamagePerCitizen stays per-row (countries + alliances only).
 */
export interface GroupDamageStats {
  damage: number | null
  damageRank: number | null
  damageTier: RankingTier | null
  weeklyDamage: number | null
  weeklyDamageRank: number | null
}

/**
 * Leader identity fields shared by the MU / party / alliance rows: the leader's
 * id plus the bits to render their avatar + linked name (and the hover card).
 * All null when the entity has no leader, or the leader isn't in the snapshot.
 * Resolved by {@link leaderFields}. Countries elect a government instead (see
 * {@link GovernmentRow}), so they don't carry this.
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
export interface CountryRow extends GroupCaseStats, GroupWealthParts, GroupFactoryStats, GroupPointsStats, GroupPremiumStats, GroupVitals, GroupDamageStats {
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
  avgLevel: number | null
  avgLevelRank: number | null
  bounty: number | null
  bountyRank: number | null
  // Sum of citizens' actual wealth in gold (real holdings, not the wealthPoints
  // points derivative). Surfaced as the "Citizen Wealth" column.
  citizenWealth: number
  citizenWealthRank: number | null
  code: string
  development: number | null
  developmentRank: number | null
  id: string
  money: number | null
  moneyRank: number | null
  musCount: number
  musCountRank: number | null
  name: string
  partyCount: number
  partyCountRank: number | null
  productionBonus: number | null
  productionBonusRank: number | null
  specializedItem: string | null
  taxIncome: number | null
  taxMarket: number | null
  taxSelfWork: number | null
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
export interface MURow extends GroupCaseStats, GroupWealthParts, GroupFactoryStats, GroupPointsStats, GroupPremiumStats, GroupVitals, GroupDamageStats, LeaderFields {
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
  // Sum of members' actual wealth in gold (real holdings, not the wealthPoints
  // points derivative). Surfaced as the "Member Wealth" column.
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
  // Current (occupying) owner.
  countryCode: string | null
  countryId: string | null
  countryName: string | null
  // Core (original) owner, from the region's initialCountry. Equals the current
  // owner for a home region; differs when the region is occupied.
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
  imperialism: number | null
  industrialism: number | null
  isolationism: number | null
  memberCount: number
  memberCountRank: number | null
  // Sum of members' actual wealth in gold (real holdings, not the wealthPoints
  // points derivative). Surfaced as the "Total" wealth column.
  memberWealth: number
  militarism: number | null
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
export interface AllianceRow extends GroupCaseStats, GroupWealthParts, GroupFactoryStats, GroupPointsStats, GroupPremiumStats, GroupVitals, GroupDamageStats, LeaderFields {
  id: string
  name: string
  // WarEra color scheme name (same palette as user profiles), the alliance's
  // visual identity across the map and our list/detail pages.
  scheme: string
  avatarUrl: string | null
  memberCount: number
  members: AllianceMemberRow[]
  // Concatenated member names + codes, so free-text and `country:` searches
  // can match an alliance by any member country.
  memberNames: string
  // Citizen-summed wealth: the member countries' citizenWealth added up (its
  // five components, from GroupWealthParts, are summed the same way). Feeds the
  // table's wealth column group.
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
