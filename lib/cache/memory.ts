import type { CountryRow, MURow, UserRow } from '@/lib/rows'

import type { RankingTier } from '@/lib/warera/schemas'
import { computePoints } from '@/lib/scoring'
import { RANKING_TIERS } from '@/lib/warera/schemas'

import { readAllUsers, readSnapshot } from './snapshot'

// Build-time guard: fails the build if any client component ever imports this
// file (which holds the Redis token + in-process cache).
import 'server-only'

/**
 * In-process snapshot cache, scoped to a single Vercel function worker. Loads
 * the entire snapshot from Redis on first access, then serves all subsequent
 * reads from memory until the TTL expires. Each cold worker pays the load cost
 * once; warm workers serve sub-millisecond reads.
 *
 * Trade-off: warm workers may serve up to TTL_MS-old data after a scrape
 * completes. Acceptable since scrapes run every 4 hours.
 */

const TTL_MS = 5 * 60 * 1000

interface Snapshot {
  users: UserRow[]
  countries: CountryRow[]
  mus: MURow[]
}

interface CacheEntry {
  loadedAt: number
  promise: Promise<Snapshot>
}

let cache: CacheEntry | null = null

function toTier(value: unknown): RankingTier | null {
  return typeof value === 'string' && (RANKING_TIERS as readonly string[]).includes(value)
    ? (value as RankingTier)
    : null
}

async function loadFromRedis(): Promise<Snapshot> {
  const [users, countries, mus, regions] = await Promise.all([
    readAllUsers(),
    readSnapshot('countries'),
    readSnapshot('mus'),
    readSnapshot('regions'),
  ])

  const countryLookup = new Map(countries.map(c => [c._id, { name: c.name, code: c.code }]))
  const muLookup = new Map(mus.map(m => [m._id, m.name]))
  const regionLookup = new Map(regions.map(r => [r._id, r]))

  const userRows: UserRow[] = users
    .map((u) => {
      const country = countryLookup.get(u.country)
      const level = u.rankings?.userLevel
      const damage = u.rankings?.userDamages
      const wealth = u.rankings?.userWealth
      // `u.infos.isBanned` is set on banned accounts; absent or false otherwise.
      const infos = (u as { infos?: { isBanned?: boolean } }).infos
      const dates = (u as { dates?: { lastConnectionAt?: string } }).dates
      const levelValue = u.leveling?.level ?? null
      const damageValue = damage?.value ?? null
      const wealthValue = wealth?.value ?? null
      const r = u.rankings
      const pts = computePoints({ level: levelValue, damageValue, wealthValue })

      return {
        bountyValue: r?.userBounty?.value ?? null,
        casesOpenedValue: r?.userCasesOpened?.value ?? null,
        countryCode: country?.code ?? null,
        countryId: u.country,
        countryName: country?.name ?? null,
        damagePoints: pts.damage,
        damageRank: damage?.rank ?? null,
        damageValue,
        gemsPurchasedValue: r?.userGemsPurchased?.value ?? null,
        id: u._id,
        isBanned: infos?.isBanned === true,
        lastConnectionAt: dates?.lastConnectionAt ?? null,
        level: levelValue,
        levelPoints: pts.level,
        levelRank: level?.rank ?? null,
        levelTier: toTier(level?.tier),
        militaryRank: u.militaryRank ?? null,
        muId: u.mu ?? null,
        muName: u.mu ? (muLookup.get(u.mu) ?? null) : null,
        points: pts.total,
        premiumGiftsValue: r?.userPremiumGifts?.value ?? null,
        premiumMonthsValue: r?.userPremiumMonths?.value ?? null,
        referralsValue: r?.userReferrals?.value ?? null,
        terrainValue: r?.userTerrain?.value ?? null,
        username: u.username,
        wealthPoints: pts.wealth,
        wealthRank: wealth?.rank ?? null,
        wealthValue,
        weeklyDamageValue: r?.weeklyUserDamages?.value ?? null,
      }
    })
    .filter(r => r.levelRank !== null)
    .sort((a, b) => (a.levelRank ?? Infinity) - (b.levelRank ?? Infinity))

  interface PointsAgg {
    total: number
    level: number
    damage: number
    wealth: number
    count: number
  }

  function emptyAgg(): PointsAgg {
    return { total: 0, level: 0, damage: 0, wealth: 0, count: 0 }
  }

  const pointsByCountry = new Map<string, PointsAgg>()
  for (const u of userRows) {
    const entry = pointsByCountry.get(u.countryId) ?? emptyAgg()
    entry.total += u.points
    entry.level += u.levelPoints
    entry.damage += u.damagePoints
    entry.wealth += u.wealthPoints
    entry.count += 1
    pointsByCountry.set(u.countryId, entry)
  }

  // MUs are headquartered in a region; an MU "belongs to" its region's
  // initialCountry for ranking purposes (same logic used below for muRows).
  const musCountByCountry = new Map<string, number>()
  for (const m of mus) {
    const region = m.region ? regionLookup.get(m.region) : undefined
    const countryId = region?.initialCountry
    if (countryId) {
      musCountByCountry.set(countryId, (musCountByCountry.get(countryId) ?? 0) + 1)
    }
  }

  const countryRows: CountryRow[] = countries
    .map((c) => {
      const agg = pointsByCountry.get(c._id)
      const r = c.rankings
      const unrestPercent = c.unrest?.barMax
        ? ((c.unrest.bar ?? 0) / c.unrest.barMax) * 100
        : null

      return {
        activePopulation: r?.countryActivePopulation?.value ?? null,
        alliesCount: c.allies?.length ?? 0,
        avgPoints: agg ? Math.round(agg.total / agg.count) : null,
        bountyValue: r?.countryBounty?.value ?? null,
        code: c.code,
        damagePoints: agg?.damage ?? 0,
        damageRank: r?.countryDamages?.rank ?? null,
        damageTier: r?.countryDamages?.tier ?? null,
        damageValue: r?.countryDamages?.value ?? null,
        development: c.development ?? null,
        id: c._id,
        levelPoints: agg?.level ?? 0,
        money: c.money ?? null,
        musCount: musCountByCountry.get(c._id) ?? 0,
        name: c.name,
        productionBonusValue: r?.countryProductionBonus?.value ?? null,
        specializedItem: c.specializedItem ?? null,
        taxIncome: c.taxes?.income ?? null,
        taxMarket: c.taxes?.market ?? null,
        taxSelfWork: c.taxes?.selfWork ?? null,
        totalPoints: agg?.total ?? 0,
        unrestPercent,
        warsCount: c.warsWith?.length ?? 0,
        wealthPoints: agg?.wealth ?? 0,
        wealthRank: r?.countryWealth?.rank ?? null,
        wealthValue: r?.countryWealth?.value ?? null,
        weeklyDamagePerCitizenValue: r?.weeklyCountryDamagesPerCitizen?.value ?? null,
        weeklyDamageValue: r?.weeklyCountryDamages?.value ?? null,
      }
    })
    .sort((a, b) => {
      if (a.damageRank === null) {
        return 1
      }
      if (b.damageRank === null) {
        return -1
      }
      return a.damageRank - b.damageRank
    })

  const pointsByMu = new Map<string, PointsAgg>()
  for (const u of userRows) {
    if (!u.muId) {
      continue
    }
    const entry = pointsByMu.get(u.muId) ?? emptyAgg()
    entry.total += u.points
    entry.level += u.levelPoints
    entry.damage += u.damagePoints
    entry.wealth += u.wealthPoints
    entry.count += 1
    pointsByMu.set(u.muId, entry)
  }

  const muRows: MURow[] = mus
    .map((m) => {
      const agg = pointsByMu.get(m._id)
      const r = m.rankings
      const investedMoney = m.investedMoneyByUsers
        ? Object.values(m.investedMoneyByUsers).reduce((sum, n) => sum + n, 0)
        : 0
      const region = m.region ? regionLookup.get(m.region) : undefined

      // MUs are headquartered in a region; the region's *initial* country is
      // the MU's spiritual home (current owner can change as territory shifts).
      const country = region?.initialCountry ? countryLookup.get(region.initialCountry) : undefined

      return {
        avgPoints: agg ? Math.round(agg.total / agg.count) : null,
        bountyValue: r?.muBounty?.value ?? null,
        countryCode: country?.code ?? null,
        countryId: region?.initialCountry ?? null,
        countryName: country?.name ?? null,
        damagePoints: agg?.damage ?? 0,
        damageRank: r?.muDamages?.rank ?? null,
        damageTier: toTier(r?.muDamages?.tier),
        damageValue: r?.muDamages?.value ?? null,
        dormitoriesLevel: m.activeUpgradeLevels?.dormitories ?? null,
        headquartersLevel: m.activeUpgradeLevels?.headquarters ?? null,
        id: m._id,
        investedMoney,
        levelPoints: agg?.level ?? 0,
        memberCount: m.members?.length ?? 0,
        mercenaryReputation: m.mercenaryReputation ?? null,
        name: m.name,
        regionName: region?.name ?? null,
        reputationValue: r?.muReputation?.value ?? null,
        terrainValue: r?.muTerrain?.value ?? null,
        totalPoints: agg?.total ?? 0,
        wealthPoints: agg?.wealth ?? 0,
        wealthRank: r?.muWealth?.rank ?? null,
        wealthValue: r?.muWealth?.value ?? null,
        weeklyDamageValue: r?.muWeeklyDamages?.value ?? null,
      }
    })
    .sort((a, b) => (b.totalPoints - a.totalPoints))

  return { users: userRows, countries: countryRows, mus: muRows }
}

export function getSnapshot(): Promise<Snapshot> {
  const now = Date.now()
  if (cache && now - cache.loadedAt < TTL_MS) {
    return cache.promise
  }
  const promise = loadFromRedis()
  cache = { loadedAt: now, promise }
  // If the load fails, drop the cache so the next request retries instead of
  // serving a permanently-rejected promise.
  promise.catch(() => {
    if (cache?.promise === promise) {
      cache = null
    }
  })
  return promise
}
