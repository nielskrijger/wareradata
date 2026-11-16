import type { LeaderFields } from '@/lib/rows'

import { UserNameCell } from '@/components/cells/user-name-cell'
import { UserHoverCard } from '@/components/user-hover-card'

/**
 * The leader of an MU, party or alliance, with the player hover card.
 */
export function LeaderCell({ leader }: { leader: LeaderFields }) {
  return (
    <UserHoverCard userId={leader.leaderId}>
      <UserNameCell
        userId={leader.leaderId}
        name={leader.leaderName}
        avatarUrl={leader.leaderAvatarUrl}
        colorScheme={leader.leaderColorScheme}
      />
    </UserHoverCard>
  )
}
