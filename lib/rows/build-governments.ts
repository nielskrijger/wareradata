import type { GovernmentOfficial, GovernmentRow } from '@/lib/rows'
import type { Lookups } from '@/lib/rows/lookups'
import type { Government, GovernmentMinister } from '@/lib/warera/api'

/**
 * Short labels for the minister title codes the game uses. A president can
 * also give a minister a custom title; anything not listed here is shown as
 * written (camelCase codes are split into words).
 */
const MINISTER_TITLES: Record<string, string> = {
  minOfDefense: 'Defense',
  minOfEconomy: 'Economy',
  minOfForeignAffairs: 'Foreign',
  minOfInterior: 'Interior',
  minOfCommunication: 'Communication',
  chiefOfStaff: 'Chief of Staff',
  advisor: 'Advisor',
}

function ministerTitle(title: string): string {
  const known = MINISTER_TITLES[title]
  if (known) {
    return known
  }

  const words = title.replace(/^minOf/, '').replace(/([a-z])([A-Z])/g, '$1 $2').trim()

  return words.length > 0 ? words.charAt(0).toUpperCase() + words.slice(1) : 'Minister'
}

/**
 * The ministers of a government, in API order. A government record with the
 * per-title seat fields (`minOfDefense`, …) instead of a `ministers` array is
 * converted to the same shape.
 */
function ministersOf(gov: Government): GovernmentMinister[] {
  if (gov.ministers) {
    return gov.ministers
  }

  const seats: GovernmentMinister[] = []
  for (const title of ['minOfDefense', 'minOfEconomy', 'minOfForeignAffairs'] as const) {
    const user = gov[title]
    if (user) {
      seats.push({ user, title })
    }
  }

  return seats
}

/**
 * Null for a vacant seat or a user not in the snapshot, so the page never
 * links to a 404. `partyId` overrides membership, for congress seats elected
 * on a party list.
 */
function resolveOfficial(userId: string | undefined, lookups: Lookups, partyId?: string): GovernmentOfficial | null {
  if (!userId) {
    return null
  }

  const name = lookups.userNameById.get(userId)
  if (!name) {
    return null
  }

  const party = (partyId ? lookups.partyById.get(partyId) : undefined) ?? lookups.partyByUser.get(userId)

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
 * Resolves each country's officials to renderable rows. Read only by the
 * country page, so it never ships in a table payload.
 */
export function buildGovernmentRows(
  governments: Record<string, Government>,
  lookups: Lookups,
): Record<string, GovernmentRow> {
  const out: Record<string, GovernmentRow> = {}
  for (const [countryId, gov] of Object.entries(governments)) {
    const seatParty = new Map((gov.congressSeats ?? []).map(s => [s.user, s.party]))
    const ministers: GovernmentRow['ministers'] = []
    for (const m of ministersOf(gov)) {
      const official = resolveOfficial(m.user, lookups)
      if (official) {
        ministers.push({ title: ministerTitle(m.title), official })
      }
    }

    out[countryId] = {
      president: resolveOfficial(gov.president, lookups),
      vicePresident: resolveOfficial(gov.vicePresident, lookups),
      ministers,
      congressMembers: (gov.congressMembers ?? [])
        .map(id => resolveOfficial(id, lookups, seatParty.get(id)))
        .filter((o): o is GovernmentOfficial => o !== null),
    }
  }

  return out
}
