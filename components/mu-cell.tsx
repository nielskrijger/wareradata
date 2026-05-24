import { InternalLink } from '@/components/internal-link'

interface Props {
  muName: string | null
  /**
   * Render the name in medium weight. Use when MU is the row's primary
   * identifier (e.g. the first column on /mus).
   */
  bold?: boolean
}

/**
 * MU cell shared by /users and /mus.
 *
 * The MU name is an internal link to /users prefiltered to that MU
 * (`?q=mu:"<name>"` — quoted because MU names contain spaces). For the
 * warera.io link, use the dedicated trailing "WarEra" column on /mus.
 */
export function MUCell({ muName, bold }: Props) {
  if (!muName) {
    return '—'
  }
  return (
    <InternalLink href={`/users?q=${encodeURIComponent(`mu:"${muName}"`)}`} bold={bold}>
      {muName}
    </InternalLink>
  )
}
