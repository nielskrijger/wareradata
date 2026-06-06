import type { GovernmentOfficial, GovernmentRow } from '@/lib/rows'
import type { Lookups } from '@/lib/rows/lookups'
import type { Government } from '@/lib/warera/api'

/**
 * Resolves a single office-holder user id to a renderable official, or null
 * when the seat is vacant (empty id) or the user isn't in the snapshot. Skipping
 * unknown ids keeps the country page from linking to a /users page that 404s.
 */
function resolveOfficial(userId: string | undefined, lookups: Lookups): GovernmentOfficial | null {
  if (!userId) {
    return null
  }
  const name = lookups.userNameById.get(userId)
  if (!name) {
    return null
  }
  const party = lookups.partyByUser.get(userId)
  return {
    id: userId,
    name,
    avatarUrl: lookups.userAvatarById.get(userId) ?? null,
    colorScheme: lookups.userColorSchemeById.get(userId) ?? null,
    partyId: party?.id ?? null,
    partyName: party?.name ?? null,
    partyAvatarUrl: party?.avatarUrl ?? null,
  }
}

/**
 * Resolves each country's raw government (a bag of user ids) into a
 * {@link GovernmentRow} of avatar + linked-name officials. Keyed by country id,
 * mirroring the input map. Built once per snapshot and read only by the country
 * detail page, so it never ships in a table payload.
 */
export function buildGovernmentRows(
  governments: Record<string, Government>,
  lookups: Lookups,
): Record<string, GovernmentRow> {
  const out: Record<string, GovernmentRow> = {}
  for (const [countryId, gov] of Object.entries(governments)) {
    out[countryId] = {
      president: resolveOfficial(gov.president, lookups),
      vicePresident: resolveOfficial(gov.vicePresident, lookups),
      minOfDefense: resolveOfficial(gov.minOfDefense, lookups),
      minOfEconomy: resolveOfficial(gov.minOfEconomy, lookups),
      minOfForeignAffairs: resolveOfficial(gov.minOfForeignAffairs, lookups),
      congressMembers: (gov.congressMembers ?? [])
        .map(id => resolveOfficial(id, lookups))
        .filter((o): o is GovernmentOfficial => o !== null),
    }
  }
  return out
}
