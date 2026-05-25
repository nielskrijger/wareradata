import { Avatar } from '@/components/avatar'
import { InternalLink } from '@/components/internal-link'

interface Props {
  /**
   * User id; when set the name links to /users/[id].
   */
  userId: string | null | undefined
  name: string | null | undefined
  avatarUrl: string | null | undefined
  colorScheme: string | null | undefined
}

/**
 * A user's avatar + name, shared by any table cell that points at a player
 * (the /users name column, the /parties leader column). The name links to the
 * detail page when an id is present; otherwise it renders as plain text. A
 * null name yields null so DataTableRow shows the muted empty dash.
 */
export function UserNameCell({ userId, name, avatarUrl, colorScheme }: Props) {
  if (!name) {
    return null
  }
  return (
    <div className="flex items-center gap-2">
      <Avatar src={avatarUrl} name={name} size={22} colorScheme={colorScheme} />
      {userId
        ? (
            <InternalLink href={`/users/${userId}`} bold title={name} className="truncate">
              {name}
            </InternalLink>
          )
        : (
            <span className="truncate font-medium">{name}</span>
          )}
    </div>
  )
}
