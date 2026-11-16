import type { SearchGroup, SearchHit, SearchKind } from './types'
import type { Snapshot } from '@/lib/cache/memory'
import type { CountryRow, MURow, UserRow } from '@/lib/rows'

import 'server-only'

const LIMITS: Record<SearchKind, number> = { country: 3, mu: 4, user: 6 }

/**
 * Ties on match quality keep this order, so a country beats a same-named MU.
 */
const KIND_ORDER: SearchKind[] = ['country', 'mu', 'user']

const intFull = new Intl.NumberFormat('en', { maximumFractionDigits: 0 })

const ID_PATTERN = /^[0-9a-f]{24}$/i

/**
 * Lowercased with diacritics stripped, so "jose" finds "José".
 */
function normalize(text: string): string {
  return text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

/**
 * Lower is better: exact, prefix, word prefix, substring. Null means no match.
 */
function matchQuality(name: string, query: string): number | null {
  if (name === query) {
    return 0
  }

  if (name.startsWith(query)) {
    return 1
  }

  const at = name.indexOf(query)
  if (at === -1) {
    return null
  }

  return /[\s\-_.[(]/.test(name[at - 1]) ? 2 : 3
}

interface Candidate<T> {
  row: T
  quality: number
  popularity: number
}

/**
 * Normalizing ~20k names per keystroke adds up; each snapshot swap is a new array.
 */
const nameCache = new WeakMap<object[], string[]>()

function normalizedNames<T extends object>(rows: T[], name: (row: T) => string): string[] {
  let names = nameCache.get(rows)
  if (!names) {
    names = rows.map(row => normalize(name(row)))
    nameCache.set(rows, names)
  }

  return names
}

function topMatches<T extends { id: string }>(
  rows: T[],
  query: string,
  limit: number,
  name: (row: T) => string,
  popularity: (row: T) => number,
  extraQuality?: (row: T) => number | null,
): Candidate<T>[] {
  const names = normalizedNames(rows, name)
  const isId = ID_PATTERN.test(query)
  const found: Candidate<T>[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const quality = isId && row.id === query
      ? 0
      : minQuality(matchQuality(names[i], query), extraQuality?.(row) ?? null)

    if (quality != null) {
      found.push({ row, quality, popularity: popularity(row) })
    }
  }

  found.sort((a, b) => a.quality - b.quality || b.popularity - a.popularity)

  return found.slice(0, limit)
}

function minQuality(a: number | null, b: number | null): number | null {
  if (a == null) {
    return b
  }

  return b == null ? a : Math.min(a, b)
}

function joinDetail(parts: (string | null | undefined | false)[]): string | null {
  const kept = parts.filter(Boolean)

  return kept.length ? kept.join(' · ') : null
}

function countryHit(row: CountryRow): SearchHit {
  return {
    kind: 'country',
    id: row.id,
    name: row.name,
    href: `/countries/${row.id}`,
    avatarUrl: null,
    colorScheme: null,
    countryCode: row.code,
    detail: joinDetail([
      row.activePopulation != null && `${intFull.format(row.activePopulation)} active`,
      row.musCount > 0 && `${row.musCount} ${row.musCount === 1 ? 'MU' : 'MUs'}`,
    ]),
  }
}

function muHit(row: MURow): SearchHit {
  return {
    kind: 'mu',
    id: row.id,
    name: row.name,
    href: `/mus/${row.id}`,
    avatarUrl: row.avatarUrl,
    colorScheme: null,
    countryCode: row.countryCode,
    detail: joinDetail([
      `${row.memberCount} ${row.memberCount === 1 ? 'member' : 'members'}`,
      row.countryName,
    ]),
  }
}

function userHit(row: UserRow): SearchHit {
  return {
    kind: 'user',
    id: row.id,
    name: row.username,
    href: `/users/${row.id}`,
    avatarUrl: row.avatarUrl,
    colorScheme: row.colorScheme,
    countryCode: row.countryCode,
    detail: joinDetail([
      row.level != null && `Lv ${row.level}`,
      row.muName,
      row.isBanned && 'Banned',
    ]),
  }
}

/**
 * Name search across countries, MUs and users for the nav search box. Groups
 * are ordered by their best match, so an exact username leads even though
 * countries usually come first.
 */
export function searchSnapshot(snapshot: Snapshot, rawQuery: string): SearchGroup[] {
  const query = normalize(rawQuery)
  if (!query) {
    return []
  }

  const countries = topMatches(
    snapshot.countries,
    query,
    LIMITS.country,
    row => row.name,
    row => row.activePopulation ?? 0,
    // Two-letter codes ("nl") are how players often refer to countries.
    row => (row.code.toLowerCase() === query ? 0 : null),
  )

  const mus = topMatches(snapshot.mus, query, LIMITS.mu, row => row.name, row => row.memberCount)
  const users = topMatches(
    snapshot.users,
    query,
    LIMITS.user,
    row => row.username,
    // Banned accounts sink below active ones of the same match quality.
    row => (row.level ?? 0) - (row.isBanned ? 1000 : 0),
  )

  const groups: (SearchGroup & { best: number })[] = [
    { kind: 'country', hits: countries.map(c => countryHit(c.row)), best: countries[0]?.quality ?? 99 },
    { kind: 'mu', hits: mus.map(c => muHit(c.row)), best: mus[0]?.quality ?? 99 },
    { kind: 'user', hits: users.map(c => userHit(c.row)), best: users[0]?.quality ?? 99 },
  ]

  return groups
    .filter(group => group.hits.length)
    .sort((a, b) => a.best - b.best || KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind))
    .map(({ kind, hits }) => ({ kind, hits }))
}
