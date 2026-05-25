import { Avatar } from '@/components/avatar'
import { EmptyDash } from '@/components/empty-dash'
import { InternalLink } from '@/components/internal-link'

interface Props {
  partyName: string | null
  /**
   * Party id; when set the name links to the party detail page. Without it the
   * name falls back to a `/users?q=party:"<name>"` filter link (used where we
   * only know the name).
   */
  partyId?: string | null
  /**
   * Party avatar; when set, shown as a small round image in front of the name.
   * Parties have no color scheme, so the avatar never gets a ring.
   */
  avatarUrl?: string | null
  /**
   * Render the name in medium weight. Use when party is the row's primary
   * identifier (e.g. the first column on /parties).
   */
  bold?: boolean
}

/**
 * Party cell shared by /parties, /users, and the user detail header.
 *
 * The name links to the party detail page when an id is present; otherwise it
 * links to /users prefiltered to everyone in that party (`?q=party:"<name>"` —
 * quoted because party names often contain spaces).
 */
export function PartyCell({ partyName, partyId, avatarUrl, bold }: Props) {
  if (!partyName) {
    return <EmptyDash />
  }

  const href = partyId
    ? `/parties/${partyId}`
    : `/users?q=${encodeURIComponent(`party:"${partyName}"`)}`
  const link = (
    <InternalLink href={href} bold={bold} title={partyName} className="truncate">
      {partyName}
    </InternalLink>
  )

  if (avatarUrl === undefined) {
    return link
  }
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar src={avatarUrl} name={partyName} size={22} />
      {link}
    </div>
  )
}
