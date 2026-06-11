/**
 * Builds URLs to public pages on app.warera.io. Single source of truth so
 * the host can change in one place.
 */
const BASE = 'https://app.warera.io'

export type WareraEntityKind = 'user' | 'country' | 'mu' | 'party' | 'alliance'

export function wareraUrl(kind: WareraEntityKind, id: string): string {
  return `${BASE}/${kind}/${id}`
}
