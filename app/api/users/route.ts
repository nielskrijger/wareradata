import type { UserRow } from '@/lib/rows'

import { getSnapshot } from '@/lib/cache/memory'
import { applyQuery, parseQuery } from '@/lib/query'
import { RANKING_TIERS } from '@/lib/warera/schemas'

/**
 * Tier rank lookup so sorting follows progression
 * (bronze → master), not alphabetical order.
 */
const tierIndex: Record<string, number> = Object.fromEntries(
  RANKING_TIERS.map((t, i) => [t, i]),
)

export const dynamic = 'force-dynamic'

/**
 * Lowercased blob the global filter substring matches against.
 */
function userHaystack(row: UserRow): string {
  return `${row.username} ${row.countryCode ?? ''} ${row.countryName ?? ''} ${row.muName ?? ''}`.toLowerCase()
}

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
    case 'wealthValue': return row.wealthValue
    case 'damageRank': return row.damageRank
    case 'damageValue': return row.damageValue
    case 'militaryRank': return row.militaryRank
    case 'muName': return row.muName?.toLowerCase() ?? null
    case 'lastConnectionAt': return row.lastConnectionAt
    case 'isBanned': return row.isBanned ? 1 : 0
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
  const result = applyQuery(users, query, userHaystack, userSortValue)
  return Response.json(result)
}
