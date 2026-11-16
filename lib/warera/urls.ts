/**
 * Builds URLs to public pages on app.warera.io. Single source of truth so
 * the host can change in one place.
 */
const BASE = 'https://app.warera.io'

/**
 * The game's own icon for an item code.
 */
export function itemIconUrl(code: string): string {
  return `https://media.warera.io/images/itemsv2/${code}.webp?v=2`
}

export type WareraEntityKind = 'user' | 'country' | 'mu' | 'party' | 'alliance' | 'battle'

export function wareraUrl(kind: WareraEntityKind, id: string): string {
  return `${BASE}/${kind}/${id}`
}
