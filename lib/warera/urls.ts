/**
 * Builds URLs to public pages on app.warera.io. Single source of truth so
 * the host can change in one place.
 */
const BASE = 'https://app.warera.io'

type Kind = 'user' | 'country' | 'mu' | 'party'

export function wareraUrl(kind: Kind, id: string): string {
  return `${BASE}/${kind}/${id}`
}
