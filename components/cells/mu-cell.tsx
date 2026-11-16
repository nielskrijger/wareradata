import { Avatar } from '@/components/avatar'
import { EmptyDash } from '@/components/empty-dash'
import { InternalLink } from '@/components/links'

interface Props {
  muName: string | null

  /**
   * MU id; when set the name links to the MU detail page. Without it the name
   * falls back to a `/users?q=mu:"<name>"` filter link (used where only
   * the name is known).
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
 * Links to the MU page when there's an id, else to /users filtered to the MU
 * (quoted, since MU names contain spaces).
 */
export function MUCell({ muName, muId, avatarUrl, bold }: Props) {
  if (!muName) {
    return <EmptyDash />
  }

  const href = muId ? `/mus/${muId}` : `/users?q=${encodeURIComponent(`mu:"${muName}"`)}`

  const link = (
    <InternalLink href={href} bold={bold} title={muName} className="truncate">
      {muName}
    </InternalLink>
  )

  if (avatarUrl === undefined) {
    return link
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar src={avatarUrl} name={muName} size={22} />
      {link}
    </div>
  )
}
