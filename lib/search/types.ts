export type SearchKind = 'country' | 'mu' | 'user'

export interface SearchHit {
  kind: SearchKind
  id: string
  name: string
  href: string

  /**
   * Avatar for users and MUs; countries show a flag from `countryCode`.
   */
  avatarUrl: string | null
  colorScheme: string | null
  countryCode: string | null

  /**
   * Short muted line under the name, e.g. "Lv 42 · Netherlands".
   */
  detail: string | null
}

export interface SearchGroup {
  kind: SearchKind
  hits: SearchHit[]
}

export interface SearchResponse {
  groups: SearchGroup[]
}
