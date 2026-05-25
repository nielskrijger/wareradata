import { Avatar } from '@/components/avatar'
import { EmptyDash } from '@/components/empty-dash'
import { InternalLink } from '@/components/internal-link'

interface Props {
  muName: string | null
  /**
   * MU id; when set the name links to the MU detail page. Without it the name
   * falls back to a `/users?q=mu:"<name>"` filter link (used where we only
   * know the name, e.g. a member's MU before ids were plumbed through).
   */
  muId?: string | null
  /**
   * MU avatar; when set, shown as a small round image in front of the name.
   * MUs have no color scheme, so the avatar never gets a ring.
   */
  avatarUrl?: string | null
  /**
   * Render the name in medium weight. Use when MU is the row's primary
   * identifier (e.g. the first column on /mus).
   */
  bold?: boolean
}

/**
 * MU cell shared by /mus, /users, and the user detail header.
 *
 * The name links to the MU detail page when an id is present; otherwise it
 * links to /users prefiltered to that MU (`?q=mu:"<name>"` — quoted because
 * MU names contain spaces). For the warera.io link, use the dedicated
 * trailing "WarEra" column on /mus.
 */
export function MUCell({ muName, muId, avatarUrl, bold }: Props) {
  if (!muName) {
    return <EmptyDash />
  }

  const href = muId
    ? `/mus/${muId}`
    : `/users?q=${encodeURIComponent(`mu:"${muName}"`)}`
  const link = (
    <InternalLink href={href} bold={bold} title={muName} className="truncate">
      {muName}
    </InternalLink>
  )

  if (avatarUrl === undefined) {
    return link
  }
  return (
    <div className="flex items-center gap-2">
      <Avatar src={avatarUrl} name={muName} size={22} />
      {link}
    </div>
  )
}
