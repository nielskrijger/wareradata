import type { Snapshot } from '@/lib/cache/memory'

import 'server-only'

export type SearchKind = 'country' | 'mu' | 'user'

export interface SearchHit {
  kind: SearchKind
  id: string
  name: string
  href: string
  avatarUrl: string | null
  colorScheme: string | null
  countryCode: string | null
  detail: string | null
}

/**
 * Lowercase without diacritics, so "jose" finds "José".
 */
function normalize(text: string): string {
  return text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

/**
 * 0 exact, 1 prefix, 2 substring, null no match.
 */
function quality(name: string, query: string): number | null {
  const n = normalize(name)
  if (n === query) {
    return 0
  }

  if (n.startsWith(query)) {
    return 1
  }

  return n.includes(query) ? 2 : null
}

/**
 * Best matches first; ties go to the more popular row.
 */
function top<T>(rows: T[], limit: number, score: (row: T) => number | null, popularity: (row: T) => number): T[] {
  return rows
    .map(row => ({ row, q: score(row) }))
    .filter((c): c is { row: T, q: number } => c.q != null)
    .sort((a, b) => a.q - b.q || popularity(b.row) - popularity(a.row))
    .slice(0, limit)
    .map(c => c.row)
}

function detail(...parts: (string | null | false)[]): string | null {
  return parts.filter(Boolean).join(' · ') || null
}

/**
 * Name search for the nav search box: countries, then MUs, then users.
 */
export function search(snapshot: Snapshot, rawQuery: string): SearchHit[] {
  const query = normalize(rawQuery)
  if (!query) {
    return []
  }

  const countries = top(
    snapshot.countries,
    3,
    // Players often refer to a country by its code ("nl").
    c => (c.code.toLowerCase() === query ? 0 : quality(c.name, query)),
    c => c.activePopulation ?? 0,
  )

  const mus = top(snapshot.mus, 4, m => quality(m.name, query), m => m.memberCount)
  const users = top(snapshot.users, 6, u => quality(u.username, query), u => (u.level ?? 0) - (u.isBanned ? 1000 : 0))

  return [
    ...countries.map(c => ({
      kind: 'country' as const,
      id: c.id,
      name: c.name,
      href: `/countries/${c.id}`,
      avatarUrl: null,
      colorScheme: null,
      countryCode: c.code,
      detail: detail(c.activePopulation != null && `${c.activePopulation.toLocaleString('en')} active`),
    })),
    ...mus.map(m => ({
      kind: 'mu' as const,
      id: m.id,
      name: m.name,
      href: `/mus/${m.id}`,
      avatarUrl: m.avatarUrl,
      colorScheme: null,
      countryCode: m.countryCode,
      detail: detail(`${m.memberCount} members`, m.countryName),
    })),
    ...users.map(u => ({
      kind: 'user' as const,
      id: u.id,
      name: u.username,
      href: `/users/${u.id}`,
      avatarUrl: u.avatarUrl,
      colorScheme: u.colorScheme,
      countryCode: u.countryCode,
      detail: detail(u.level != null && `Lv ${u.level}`, u.muName, u.isBanned && 'Banned'),
    })),
  ]
}
