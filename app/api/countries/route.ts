import type { FieldAliases } from '@/lib/query'
import type { CountryRow } from '@/lib/rows'

import { withActiveBattleCounts } from '@/lib/cache/live-battles'
import { getSnapshot } from '@/lib/cache/memory'
import { applyStructuredQuery, parseQuery } from '@/lib/query'
import { RANKING_TIERS } from '@/lib/warera/api'

/**
 * Tier rank lookup so sorting follows progression
 * (bronze → master), not alphabetical order.
 */
const tierIndex: Record<string, number> = Object.fromEntries(
  RANKING_TIERS.map((t, i) => [t, i]),
)

export const dynamic = 'force-dynamic'

/**
 * Friendly field names for the advanced filter. Keep in sync with the
 * popover cheatsheet in `countries-table.tsx`.
 */
const countryFieldAliases: FieldAliases = {
  allies: 'alliesCount',
  gems: 'gemsPurchasedTotal',
  level: 'avgLevel',
  population: 'activePopulation',
  premiumGifts: 'premiumGiftsTotal',
  premiumMonths: 'premiumMonthsTotal',
  rank: 'damageRank',
  specialty: 'specializedItem',
  treasury: 'money',
  unrest: 'unrestPercent',
  wars: 'warsCount',
}

/**
 * Maps a column id from the client to a comparable value on the row.
 */
function countrySortValue(row: CountryRow, sort: string): number | string | null {
  switch (sort) {
    case 'activePopulation': return row.activePopulation
    case 'alliesCount': return row.alliesCount
    case 'avgLevel': return row.avgLevel
    case 'avgPoints': return row.avgPoints
    case 'bounty': return row.bounty
    case 'code': return row.code
    case 'damageRank': return row.damageRank
    case 'damageTier': return row.damageTier ? tierIndex[row.damageTier] : null
    case 'damage': return row.damage
    case 'development': return row.development
    case 'gemsPurchasedTotal': return row.gemsPurchasedTotal
    case 'money': return row.money
    case 'musCount': return row.musCount
    case 'name': return row.name.toLowerCase()
    case 'partyCount': return row.partyCount
    case 'premiumGiftsTotal': return row.premiumGiftsTotal
    case 'premiumMonthsTotal': return row.premiumMonthsTotal
    case 'productionBonus': return row.productionBonus
    case 'specializedItem': return row.specializedItem
    case 'taxIncome': return row.taxIncome
    case 'taxMarket': return row.taxMarket
    case 'taxSelfWork': return row.taxSelfWork
    case 'totalPoints': return row.totalPoints
    case 'unrestPercent': return row.unrestPercent
    case 'warsCount': return row.warsCount
    case 'wealthRank': return row.wealthRank
    case 'wealth': return row.wealth
    case 'weeklyDamagePerCitizen': return row.weeklyDamagePerCitizen
    case 'weeklyDamage': return row.weeklyDamage
    default: return row.damageRank
  }
}

/**
 * Driven by the client DataTable on /countries. Reads from the in-process
 * snapshot cache (warm worker = sub-ms) and applies pagination, sorting, and
 * filtering in memory. Returns `{rows, total}`.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = parseQuery(searchParams)
  const { countries } = await getSnapshot()
  const withCounts = await withActiveBattleCounts(countries)
  const result = applyStructuredQuery(withCounts, query, countrySortValue, countryFieldAliases)
  return Response.json(result)
}
