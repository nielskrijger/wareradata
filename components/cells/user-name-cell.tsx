import { Avatar } from '@/components/avatar'
import { InternalLink } from '@/components/links'

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
 * A player's avatar and name, linked when there's an id. A null name returns
 * null so the row shows its empty dash.
 */
export function UserNameCell({ userId, name, avatarUrl, colorScheme }: Props) {
  if (!name) {
    return null
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar src={avatarUrl} name={name} size={22} colorScheme={colorScheme} />
      {userId ? (
        <InternalLink href={`/users/${userId}`} bold className="truncate">
          {name}
        </InternalLink>
      ) : (
        <span className="truncate font-medium">{name}</span>
      )}
    </div>
  )
}
