import type { UserRow } from '@/lib/rows'
import type { Lookups } from '@/lib/rows/lookups'
import type { UserLite } from '@/lib/warera/schemas'

import { toTier } from '@/lib/rows/lookups'
import { computePoints } from '@/lib/scoring'

const DAY_MS = 24 * 60 * 60 * 1000

export function buildUserRows(users: UserLite[], lookups: Lookups): UserRow[] {
  const nowMs = Date.now()

  return users
    .map((u) => {
      const country = lookups.countryById.get(u.country)
      const level = u.rankings?.userLevel
      const damageRanking = u.rankings?.userDamages
      const wealthRanking = u.rankings?.userWealth
      // `u.infos.isBanned` is set on banned accounts; absent or false otherwise.
      const infos = (u as { infos?: { isBanned?: boolean } }).infos
      const dates = (u as { dates?: { lastConnectionAt?: string } }).dates
      const levelValue = u.leveling?.level ?? null
      const damage = damageRanking?.value ?? null
      const wealth = wealthRanking?.value ?? null
      const r = u.rankings
      const pts = computePoints({ level: levelValue, damage, wealth })
      const party = lookups.partyByUser.get(u._id)
      const days = daysSinceJoin(u.createdAt, nowMs)
      const pointsPerDay = days === null ? null : Math.round(pts.total / days)

      return {
        bounty: r?.userBounty?.value ?? null,
        casesOpened: r?.userCasesOpened?.value ?? null,
        countryCode: country?.code ?? null,
        countryId: u.country,
        countryName: country?.name ?? null,
        createdAt: u.createdAt ?? null,
        damagePoints: pts.damage,
        damageRank: damageRanking?.rank ?? null,
        damage,
        gemsPurchased: r?.userGemsPurchased?.value ?? null,
        id: u._id,
        isBanned: infos?.isBanned === true,
        lastConnectionAt: dates?.lastConnectionAt ?? null,
        level: levelValue,
        levelPoints: pts.level,
        levelRank: level?.rank ?? null,
        levelTier: toTier(level?.tier),
        militaryRank: u.militaryRank ?? null,
        muId: u.mu ?? null,
        muName: u.mu ? (lookups.muNameById.get(u.mu) ?? null) : null,
        partyId: party?.id ?? null,
        partyName: party?.name ?? null,
        points: pts.total,
        pointsPerDay,
        premiumGifts: r?.userPremiumGifts?.value ?? null,
        premiumMonths: r?.userPremiumMonths?.value ?? null,
        referrals: r?.userReferrals?.value ?? null,
        terrain: r?.userTerrain?.value ?? null,
        username: u.username,
        wealthPoints: pts.wealth,
        wealthRank: wealthRanking?.rank ?? null,
        wealth,
        weeklyDamage: r?.weeklyUserDamages?.value ?? null,
      }
    })
    .filter(r => r.levelRank !== null)
    .sort((a, b) => (a.levelRank ?? Infinity) - (b.levelRank ?? Infinity))
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
