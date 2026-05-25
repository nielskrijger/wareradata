import type { FieldAliases } from '@/lib/query'
import type { UserRow } from '@/lib/rows'

import { getSnapshot } from '@/lib/cache/memory'
import { applyStructuredQuery, parseQuery } from '@/lib/query'
import { RANKING_TIERS } from '@/lib/warera/api'

/**
 * Friendly field names for the advanced filter. Underlying row keys still
 * work — these just give a nicer DX (`country:nl` instead of `countryCode:nl`).
 * Keep in sync with the popover cheatsheet in `users-table.tsx`.
 */
const userFieldAliases: FieldAliases = {
  country: 'countryCode',
  mu: 'muName',
  party: 'partyName',
  rank: 'levelRank',
  lastSeen: 'lastConnectionAt',
  joined: 'createdAt',
  ppd: 'pointsPerDay',
  health: 'healthPercent',
  hunger: 'hungerPercent',
  status: 'combatStatus',
}

/**
 * Tier rank lookup so sorting follows progression
 * (bronze → master), not alphabetical order.
 */
const tierIndex: Record<string, number> = Object.fromEntries(
  RANKING_TIERS.map((t, i) => [t, i]),
)

export const dynamic = 'force-dynamic'

/**
 * Maps a column id from the client to a comparable value on the row.
 */
function userSortValue(row: UserRow, sort: string): number | string | null {
  switch (sort) {
    case 'username': return row.username.toLowerCase()
    case 'countryCode': return row.countryCode
    case 'level': return row.level
    case 'levelRank': return row.levelRank
    case 'levelTier': return row.levelTier ? tierIndex[row.levelTier] : null
    case 'wealthRank': return row.wealthRank
    case 'wealth': return row.wealth
    case 'damageRank': return row.damageRank
    case 'damage': return row.damage
    case 'weeklyDamage': return row.weeklyDamage
    case 'bounty': return row.bounty
    case 'terrain': return row.terrain
    case 'referrals': return row.referrals
    case 'premiumMonths': return row.premiumMonths
    case 'premiumGifts': return row.premiumGifts
    case 'casesOpened': return row.casesOpened
    case 'gemsPurchased': return row.gemsPurchased
    case 'militaryRank': return row.militaryRank
    case 'muName': return row.muName?.toLowerCase() ?? null
    case 'partyName': return row.partyName?.toLowerCase() ?? null
    case 'lastConnectionAt': return row.lastConnectionAt
    case 'createdAt': return row.createdAt
    case 'isBanned': return row.isBanned ? 1 : 0
    case 'points': return row.points
    case 'pointsPerDay': return row.pointsPerDay
    case 'healthPercent': return row.healthPercent
    case 'hungerPercent': return row.hungerPercent
    case 'combatStatus': return row.combatStatus
    default: return row.levelRank
  }
}

/**
 * Driven by the client DataTable on /users. Reads from the in-process
 * snapshot cache (warm worker = sub-ms) and applies pagination, sorting, and
 * filtering in memory. Returns `{rows, total}`.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = parseQuery(searchParams)
  const { users } = await getSnapshot()
  const result = applyStructuredQuery(users, query, userSortValue, userFieldAliases)
  return Response.json(result)
}
