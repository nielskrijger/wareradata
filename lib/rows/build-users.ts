import type { UserFactoryAgg } from '@/lib/factories/profit'
import type { GearLookup } from '@/lib/gear/score'
import type { UserRow } from '@/lib/rows'
import type { Lookups } from '@/lib/rows/lookups'
import type { Equipment, GameConfig, User } from '@/lib/warera/api'

import { caseLuckScores, luckPercent } from '@/lib/cases'
import { computeGearScore, deriveSlotSpecs } from '@/lib/gear/score'
import { rankAll, toTier } from '@/lib/rows/lookups'
import { computePoints } from '@/lib/scoring'
import { classifyCombatMode, deriveSkillPointCost, ECO_SKILLS, skillPoints, WAR_SKILLS } from '@/lib/skills/classify'
import { extractCasesByType, mergeCasesBreakdown } from '@/lib/warera/api'

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * The batch-wide inputs derived once and shared across every user. Passed to
 * {@link buildUserRow} so that builder stays pure per user and the streaming
 * pass can call it per line.
 */
interface UserRowContext {
  lookups: Lookups
  nowMs: number
  equipment: Record<string, Equipment>
  slotSpecs: ReturnType<typeof deriveSlotSpecs>
  skillCost: ReturnType<typeof deriveSkillPointCost>
  gearLookup: GearLookup
  factoryAggByUser: Map<string, UserFactoryAgg>
}

/**
 * Streams users (one line at a time from users.ndjson) into their rows. The raw
 * User objects are parsed and discarded per line — only the derived UserRow[]
 * (the result) is retained, so the 84 MB raw array never resides in memory.
 *
 * Fills the per-user lookup maps (left empty by buildBaseLookups) during the same
 * pass, so the MU / party / alliance builders that resolve leaders can run after.
 * Ranks are assigned over the full set once the stream completes.
 */
export async function buildUserRows(
  streamUsers: (onUser: (user: User) => void) => Promise<void>,
  lookups: Lookups,
  nowMs: number,
  equipment: Record<string, Equipment>,
  gameConfig: GameConfig,
  gearLookup: GearLookup,
  factoryAggByUser: Map<string, UserFactoryAgg>,
): Promise<UserRow[]> {
  // Derive the gear roll bounds and skill cost curve from the live config once
  // for the whole batch (the scrape always captures it). The gear index is built
  // once in buildSnapshot and passed in, since the Snapshot also exposes it.
  const ctx: UserRowContext = {
    lookups,
    nowMs,
    equipment,
    slotSpecs: deriveSlotSpecs(gameConfig),
    skillCost: deriveSkillPointCost(gameConfig),
    gearLookup,
    factoryAggByUser,
  }

  const rows: ReturnType<typeof buildUserRow>[] = []
  await streamUsers((u) => {
    // Fill the user lookup maps as we pass over each user, ranked or not, so
    // leader resolution works for any id the other builders ask about.
    lookups.userNameById.set(u._id, u.username)
    lookups.userAvatarById.set(u._id, u.avatarUrl ?? null)
    lookups.userColorSchemeById.set(u._id, u.infos?.colorScheme ?? null)

    rows.push(buildUserRow(u, ctx))
  })

  const ranked = rows
    .filter(r => r.levelRank !== null)
    .sort((a, b) => (a.levelRank ?? Infinity) - (b.levelRank ?? Infinity))

  // Leaderboard position for stats the API doesn't rank for us. Standard
  // competition rank (ties share a rank, gaps after) over non-null values;
  // higher value = better (rank #1). Rows with a null value get a null rank.
  rankAll(ranked, [
    'bounty',
    'caseLuck',
    'casesOpened',
    'companiesWealth',
    'itemsWealth',
    'cashWealth',
    'equipmentWealth',
    'weaponsWealth',
    'ecoPoints',
    'gearScore',
    'gemsPurchased',
    'militaryRank',
    'premiumGifts',
    'premiumMonths',
    'referrals',
    'terrain',
    'warPoints',
    'weeklyDamage',
  ], { militaryRank: 'militaryRankPos' })

  return ranked
}

/**
 * Builds one user's row from the shared {@link UserRowContext}. Pure given `ctx`.
 */
function buildUserRow(u: User, ctx: UserRowContext) {
  const { lookups, nowMs, equipment, slotSpecs, skillCost, gearLookup, factoryAggByUser } = ctx

  const country = lookups.countryById.get(u.country)
  const level = u.rankings?.userLevel
  const damageRanking = u.rankings?.userDamages
  const wealthRanking = u.rankings?.userWealth
  const infos = u.infos
  const dates = u.dates
  const levelValue = u.leveling?.level ?? null
  const damage = damageRanking?.value ?? null
  const wealth = wealthRanking?.value ?? null
  // The wealth breakdown rides along in the getUserById stats payload. Absent
  // for users a fresh scrape hasn't reached, so each part defaults to null.
  const wealthParts = u.stats?.wealth
  const r = u.rankings
  const pts = computePoints({ level: levelValue, damage, wealth })
  const party = lookups.partyByUser.get(u._id)
  const days = daysSinceJoin(u.createdAt, nowMs)
  const pointsPerDay = days === null ? null : Math.round(pts.total / days)
  const skills = u.skills
  const health = barPercent(skills?.health)
  const hunger = barPercent(skills?.hunger)
  const readinessStatus = toReadinessStatus(skills?.attack)
  const readinessEndsAt = u.buffs?.buffEndAt ?? u.buffs?.debuffEndAt ?? null
  const gear = equipment[u._id]
  const gearScore = gear ? computeGearScore(gear, slotSpecs, gearLookup) : null
  const warPoints = skillPoints(skills, WAR_SKILLS, skillCost)
  const ecoPoints = skillPoints(skills, ECO_SKILLS, skillCost)
  const combatMode = classifyCombatMode(warPoints, ecoPoints)

  // War's share of war+eco investment (0 = pure eco, 1 = pure war). This is
  // the distribution the Mode column sorts on — the raw point totals scale
  // with level, so only the ratio is meaningful. Null when nothing's trained
  // in either, so those rows sort last rather than tying with pure-eco.
  const warShare = warPoints + ecoPoints > 0 ? warPoints / (warPoints + ecoPoints) : null

  // Case pulls: the per-type split (for the detail toggle), its merge into the
  // combined per-rarity flats (for the tables), and the official-odds weighted
  // luck scores (kept on the row so group builders can pool them).
  const casesByType = extractCasesByType(u.stats)
  const cases = mergeCasesBreakdown(casesByType.standard, casesByType.mythic)
  const luck = caseLuckScores(u.stats)

  // Per-user factory totals (null when the factory scrape hasn't reached them),
  // summed by member-agg into the entity Factories columns.
  const factory = factoryAggByUser.get(u._id)

  return {
    avatarUrl: u.avatarUrl ?? null,
    bounty: r?.userBounty?.value ?? null,
    bountyRank: null,
    casesOpened: r?.userCasesOpened?.value ?? null,
    casesOpenedRank: null,
    standardCasesOpened: u.stats?.case1?.openedCount ?? null,
    mythicCasesOpened: u.stats?.case2?.openedCount ?? null,
    standardCasesByRarity: casesByType.standard,
    mythicCasesByRarity: casesByType.mythic,
    casesCommon: cases ? cases.byRarity.common ?? 0 : null,
    casesUncommon: cases ? cases.byRarity.uncommon ?? 0 : null,
    casesRare: cases ? cases.byRarity.rare ?? 0 : null,
    casesEpic: cases ? cases.byRarity.epic ?? 0 : null,
    casesLegendary: cases ? cases.byRarity.legendary ?? 0 : null,
    casesMythic: cases ? cases.byRarity.mythic ?? 0 : null,
    caseLuck: luckPercent(luck.actual, luck.expected, luck.categorized),
    caseLuckRank: null,
    caseLuckActual: luck.actual,
    caseLuckExpected: luck.expected,
    combatMode,
    countryCode: country?.code ?? null,
    countryId: u.country,
    countryName: country?.name ?? null,
    colorScheme: infos?.colorScheme ?? null,
    createdAt: u.createdAt ?? null,
    damagePoints: pts.damage,
    damageRank: damageRanking?.rank ?? null,
    damage,
    ecoPoints,
    ecoPointsRank: null,
    gearScore,
    gearScoreRank: null,
    gemsPurchased: r?.userGemsPurchased?.value ?? null,
    gemsPurchasedRank: null,
    health,
    hunger,
    id: u._id,
    isBanned: infos?.isBanned === true,
    lastConnectionAt: dates?.lastConnectionAt ?? null,
    lastRefreshedAt: u.lastRefreshedAt ?? null,
    level: levelValue,
    levelPoints: pts.level,
    levelRank: level?.rank ?? null,
    levelTier: toTier(level?.tier),
    militaryRank: u.militaryRank ?? null,
    militaryRankPos: null,
    muAvatarUrl: u.mu ? (lookups.muAvatarById.get(u.mu) ?? null) : null,
    muId: u.mu ?? null,
    muName: u.mu ? (lookups.muNameById.get(u.mu) ?? null) : null,
    partyAvatarUrl: party?.avatarUrl ?? null,
    partyId: party?.id ?? null,
    partyName: party?.name ?? null,
    points: pts.total,
    pointsPerDay,
    premiumGifts: r?.userPremiumGifts?.value ?? null,
    premiumGiftsRank: null,
    premiumMonths: r?.userPremiumMonths?.value ?? null,
    premiumMonthsRank: null,
    readinessStatus,
    readinessEndsAt,
    referrals: r?.userReferrals?.value ?? null,
    referralsRank: null,
    terrain: r?.userTerrain?.value ?? null,
    terrainRank: null,
    username: u.username,
    warPoints,
    warPointsRank: null,
    warShare,
    wealthPoints: pts.wealth,
    wealthRank: wealthRanking?.rank ?? null,
    wealth,
    companiesWealth: wealthParts?.companies ?? null,
    companiesWealthRank: null,
    itemsWealth: wealthParts?.items ?? null,
    itemsWealthRank: null,
    cashWealth: wealthParts?.money ?? null,
    cashWealthRank: null,
    equipmentWealth: wealthParts?.equipments ?? null,
    equipmentWealthRank: null,
    weaponsWealth: wealthParts?.weapons ?? null,
    weaponsWealthRank: null,
    weeklyDamage: r?.weeklyUserDamages?.value ?? null,
    weeklyDamageRank: null,
    factoryCount: factory?.factoryCount ?? null,
    factoryPpPerDay: factory?.ppPerDay ?? null,
    factoryNetPerDay: factory?.netPerDay ?? null,
    factoryTopPotential: factory?.topPotentialNetPerDay ?? null,
    factoryEfficiencyPct: factory && factory.topPotentialNetPerDay > 0
      ? Math.min(100, (factory.netPerDay / factory.topPotentialNetPerDay) * 100)
      : null,
    factoryEngineNetPerDay: factory?.engineNetPerDay ?? null,
    factoryEmployeeNetPerDay: factory?.employeeNetPerDay ?? null,
    factoryWorkers: factory?.workerCount ?? null,
    productionSkill: skills?.production?.value ?? null,
    energySkill: skills?.energy?.value ?? null,
  } satisfies UserRow
}

/**
 * Current fill of a regenerating bar (health, hunger) as a 0-100 percent of its
 * max. `total` is the bar's capacity, `currentBarValue` how full it is now.
 * Returns null when the bar or its capacity is missing, and clamps to [0, 100]
 * since `currentBarValue` can briefly read slightly over `total`.
 */
function barPercent(bar: { currentBarValue?: number, total?: number } | undefined): number | null {
  if (!bar || !bar.total || bar.currentBarValue == null) {
    return null
  }
  const pct = (bar.currentBarValue / bar.total) * 100
  return Math.round(Math.min(100, Math.max(0, pct)))
}

/**
 * Net readiness status from the attack skill's buff / debuff percentages: 'buff'
 * when buffed more than debuffed, 'debuff' when the reverse, 'neither' when
 * they're equal (typically both zero). Null when the attack data is missing.
 */
function toReadinessStatus(
  attack: { buffsPercent?: number, debuffsPercent?: number } | undefined,
): 'buff' | 'debuff' | 'neither' | null {
  if (!attack) {
    return null
  }
  const buff = attack.buffsPercent ?? 0
  const debuff = attack.debuffsPercent ?? 0
  if (buff > debuff) {
    return 'buff'
  }
  if (debuff > buff) {
    return 'debuff'
  }
  return 'neither'
}

const MIN_AGE_DAYS = 7

/**
 * Fractional days between the user's account creation and `nowMs`. Returns
 * null for accounts younger than MIN_AGE_DAYS (rate not meaningful yet),
 * missing dates, or sentinel dates like `0000-01-01` that some legacy
 * accounts come back as. The /users page distinguishes the "too young"
 * case from genuinely missing dates by inspecting `createdAt` directly.
 */
function daysSinceJoin(createdAt: string | null | undefined, nowMs: number): number | null {
  if (!createdAt) {
    return null
  }
  const t = Date.parse(createdAt)
  if (Number.isNaN(t) || new Date(t).getUTCFullYear() < 2020) {
    return null
  }
  const days = (nowMs - t) / DAY_MS
  return days < MIN_AGE_DAYS ? null : days
}
