import type { UserRow } from '@/lib/rows'
import type { Lookups } from '@/lib/rows/lookups'
import type { UserLite } from '@/lib/warera/api'

import { toTier } from '@/lib/rows/lookups'
import { computePoints } from '@/lib/scoring'

const DAY_MS = 24 * 60 * 60 * 1000

export function buildUserRows(users: UserLite[], lookups: Lookups): UserRow[] {
  const nowMs = Date.now()

  const rows = users
    .map((u) => {
      const country = lookups.countryById.get(u.country)
      const level = u.rankings?.userLevel
      const damageRanking = u.rankings?.userDamages
      const wealthRanking = u.rankings?.userWealth
      const infos = u.infos
      const dates = u.dates
      const levelValue = u.leveling?.level ?? null
      const damage = damageRanking?.value ?? null
      const wealth = wealthRanking?.value ?? null
      const r = u.rankings
      const pts = computePoints({ level: levelValue, damage, wealth })
      const party = lookups.partyByUser.get(u._id)
      const days = daysSinceJoin(u.createdAt, nowMs)
      const pointsPerDay = days === null ? null : Math.round(pts.total / days)

      return {
        avatarUrl: u.avatarUrl ?? null,
        bounty: r?.userBounty?.value ?? null,
        bountyRank: null,
        casesOpened: r?.userCasesOpened?.value ?? null,
        casesOpenedRank: null,
        countryCode: country?.code ?? null,
        countryId: u.country,
        countryName: country?.name ?? null,
        colorScheme: infos?.colorScheme ?? null,
        createdAt: u.createdAt ?? null,
        damagePoints: pts.damage,
        damageRank: damageRanking?.rank ?? null,
        damage,
        gemsPurchased: r?.userGemsPurchased?.value ?? null,
        gemsPurchasedRank: null,
        id: u._id,
        isBanned: infos?.isBanned === true,
        lastConnectionAt: dates?.lastConnectionAt ?? null,
        level: levelValue,
        levelPoints: pts.level,
        levelRank: level?.rank ?? null,
        levelTier: toTier(level?.tier),
        militaryRank: u.militaryRank ?? null,
        militaryRankPos: null,
        muId: u.mu ?? null,
        muName: u.mu ? (lookups.muNameById.get(u.mu) ?? null) : null,
        partyId: party?.id ?? null,
        partyName: party?.name ?? null,
        points: pts.total,
        pointsPerDay,
        premiumGifts: r?.userPremiumGifts?.value ?? null,
        premiumGiftsRank: null,
        premiumMonths: r?.userPremiumMonths?.value ?? null,
        premiumMonthsRank: null,
        referrals: r?.userReferrals?.value ?? null,
        referralsRank: null,
        terrain: r?.userTerrain?.value ?? null,
        terrainRank: null,
        username: u.username,
        wealthPoints: pts.wealth,
        wealthRank: wealthRanking?.rank ?? null,
        wealth,
        weeklyDamage: r?.weeklyUserDamages?.value ?? null,
        weeklyDamageRank: null,
      } satisfies UserRow
    })
    .filter(r => r.levelRank !== null)
    .sort((a, b) => (a.levelRank ?? Infinity) - (b.levelRank ?? Infinity))

  // Leaderboard position for stats the API doesn't rank for us. Standard
  // competition rank (ties share a rank, gaps after) over non-null values;
  // higher value = better (rank #1). Rows with a null value get a null rank.
  assignRank(rows, 'bounty', 'bountyRank')
  assignRank(rows, 'casesOpened', 'casesOpenedRank')
  assignRank(rows, 'gemsPurchased', 'gemsPurchasedRank')
  assignRank(rows, 'militaryRank', 'militaryRankPos')
  assignRank(rows, 'premiumGifts', 'premiumGiftsRank')
  assignRank(rows, 'premiumMonths', 'premiumMonthsRank')
  assignRank(rows, 'referrals', 'referralsRank')
  assignRank(rows, 'terrain', 'terrainRank')
  assignRank(rows, 'weeklyDamage', 'weeklyDamageRank')

  return rows
}

/**
 * Assigns a standard-competition rank (1 = highest value) into `rankKey`,
 * derived from `valueKey`. Players tied on a value share a rank; the next
 * distinct value skips ahead by the size of the tie. Rows with a null value
 * keep a null rank — they're unranked for that stat, not last.
 */
function assignRank(
  rows: UserRow[],
  valueKey: keyof UserRow,
  rankKey: keyof UserRow,
): void {
  const ranked = rows
    .filter(r => typeof r[valueKey] === 'number')
    .sort((a, b) => (b[valueKey] as number) - (a[valueKey] as number))

  let lastValue: number | null = null
  let lastRank = 0
  ranked.forEach((row, i) => {
    const value = row[valueKey] as number
    const rank = value === lastValue ? lastRank : i + 1
    ;(row[rankKey] as number | null) = rank
    lastValue = value
    lastRank = rank
  })
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
