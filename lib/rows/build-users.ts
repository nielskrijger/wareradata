import type { UserRow } from '@/lib/rows'
import type { Lookups } from '@/lib/rows/lookups'
import type { UserLite } from '@/lib/warera/api'

import { assignRank, toTier } from '@/lib/rows/lookups'
import { computePoints } from '@/lib/scoring'

const DAY_MS = 24 * 60 * 60 * 1000

export function buildUserRows(users: UserLite[], lookups: Lookups, nowMs: number): UserRow[] {
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
      const skills = u.skills
      const healthPercent = barPercent(skills?.health)
      const hungerPercent = barPercent(skills?.hunger)
      const readinessStatus = toReadinessStatus(skills?.attack)

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
        healthPercent,
        hungerPercent,
        id: u._id,
        isBanned: infos?.isBanned === true,
        lastConnectionAt: dates?.lastConnectionAt ?? null,
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
