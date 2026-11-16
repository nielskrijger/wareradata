import type { EntityRef, LeaderFields } from '@/lib/rows'
import type { Country, MU, Party, RankingTier, Region } from '@/lib/warera/api'
import { RANKING_TIERS } from '@/lib/warera/api'

export interface Lookups {
  countryById: Map<string, { name: string, code: string }>
  muNameById: Map<string, string>
  muAvatarById: Map<string, string | null>
  regionById: Map<string, Region>
  userNameById: Map<string, string>
  userAvatarById: Map<string, string | null>
  userColorSchemeById: Map<string, string | null>
  partyByUser: Map<string, { id: string, name: string, avatarUrl: string | null }>
  partyById: Map<string, { id: string, name: string, avatarUrl: string | null }>
  partyCountByCountry: Map<string, number>
}

/**
 * Lookups from the small entities. The per-user maps start empty and
 * buildUserRows fills them while streaming users, so the raw array is never
 * held; the group builders run after.
 */
export function buildBaseLookups(
  countries: Country[],
  mus: MU[],
  regions: Region[],
  parties: Party[],
): Lookups {
  const partyByUser = new Map<string, { id: string, name: string, avatarUrl: string | null }>()
  const partyById = new Map<string, { id: string, name: string, avatarUrl: string | null }>()
  const partyCountByCountry = new Map<string, number>()
  for (const p of parties) {
    partyById.set(p._id, { id: p._id, name: p.name, avatarUrl: p.avatarUrl ?? null })
    if (p.members) {
      for (const uid of p.members) {
        partyByUser.set(uid, { id: p._id, name: p.name, avatarUrl: p.avatarUrl ?? null })
      }
    }

    if (p.country) {
      partyCountByCountry.set(p.country, (partyCountByCountry.get(p.country) ?? 0) + 1)
    }
  }

  return {
    countryById: new Map(countries.map(c => [c._id, { name: c.name, code: c.code }])),
    muNameById: new Map(mus.map(m => [m._id, m.name])),
    muAvatarById: new Map(mus.map(m => [m._id, m.avatarUrl ?? null])),
    regionById: new Map(regions.map(r => [r._id, r])),
    userNameById: new Map(),
    userAvatarById: new Map(),
    userColorSchemeById: new Map(),
    partyByUser,
    partyById,
    partyCountByCountry,
  }
}

export function toTier(value: unknown): RankingTier | null {
  return typeof value === 'string' && (RANKING_TIERS as readonly string[]).includes(value)
    ? (value as RankingTier)
    : null
}

/**
 * `rankPair('damage', entry)` → `{ damage, damageRank }`, for stats whose value
 * and rank both come straight from the API.
 */
export function rankPair<K extends string>(
  key: K,
  src: { value?: number | null, rank?: number | null } | null | undefined,
): Record<K | `${K}Rank`, number | null> {
  return {
    [key]: src?.value ?? null,
    [`${key}Rank`]: src?.rank ?? null,
  } as Record<K | `${K}Rank`, number | null>
}

/**
 * Resolve a user, MU or country id from the snapshot. `countryId` flags a user
 * with their citizenship, which the user lookups don't hold.
 */
export function entityRef(
  kind: EntityRef['kind'],
  id: string | null | undefined,
  lookups: Lookups,
  countryId?: string | null,
): EntityRef {
  const ref: EntityRef = { kind, id: id ?? null, name: null, code: null, avatarUrl: null, colorScheme: null }
  if (!id) {
    return ref
  }

  if (kind === 'country') {
    const country = lookups.countryById.get(id)

    return { ...ref, name: country?.name ?? null, code: country?.code ?? null }
  }

  if (kind === 'mu') {
    return { ...ref, name: lookups.muNameById.get(id) ?? null, avatarUrl: lookups.muAvatarById.get(id) ?? null }
  }

  return {
    ...ref,
    name: lookups.userNameById.get(id) ?? null,
    code: countryId ? lookups.countryById.get(countryId)?.code ?? null : null,
    avatarUrl: lookups.userAvatarById.get(id) ?? null,
    colorScheme: lookups.userColorSchemeById.get(id) ?? null,
  }
}

/**
 * Resolve a leader user id into the {@link LeaderFields} the MU / party /
 * alliance rows render. All null when the id is null or the user isn't in the
 * snapshot.
 */
export function leaderFields(leaderId: string | null, lookups: Lookups): LeaderFields {
  return {
    leaderId,
    leaderName: leaderId ? lookups.userNameById.get(leaderId) ?? null : null,
    leaderAvatarUrl: leaderId ? lookups.userAvatarById.get(leaderId) ?? null : null,
    leaderColorScheme: leaderId ? lookups.userColorSchemeById.get(leaderId) ?? null : null,
  }
}

/**
 * Standard competition rank (1 = highest; ties share a rank). Null values stay
 * unranked rather than last. Mutates the rows.
 */
function assignRank<T extends Record<string, unknown>>(
  rows: T[],
  valueKey: keyof T,
  rankKey: keyof T,
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

/**
 * {@link assignRank} into each key's `${key}Rank`; `overrides` names a rank
 * field that breaks the convention.
 */
export function rankAll<T extends Record<string, unknown>>(
  rows: T[],
  valueKeys: (keyof T)[],
  overrides?: Partial<Record<keyof T, keyof T>>,
): void {
  for (const valueKey of valueKeys) {
    const rankKey = overrides?.[valueKey] ?? (`${String(valueKey)}Rank` as keyof T)
    assignRank(rows, valueKey, rankKey)
  }
}
