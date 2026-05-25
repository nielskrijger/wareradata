import type { BattleSide } from '@/lib/rows'

import { ArrowRight } from 'lucide-react'

import { Avatar } from '@/components/avatar'
import { EmptyDash } from '@/components/empty-dash'
import { Flag } from '@/components/flag'
import { InternalLink } from '@/components/internal-link'

interface Props {
  battleId: string
  attacker: BattleSide
  defender: BattleSide
}

function SideContent({ side }: { side: BattleSide }) {
  return (
    <>
      {side.kind === 'mu'
        ? <Avatar src={side.avatarUrl} name={side.name ?? '?'} size={20} />
        : <Flag code={side.code} />}
      <span className="truncate">{side.name ?? '?'}</span>
    </>
  )
}

/**
 * Battle matchup cell for /battles: "attacker → defender", linking to the
 * battle detail page. Each side shows a country flag (wars) or an MU avatar
 * (tournament battles), per its `kind`.
 */
export function BattleMatchupCell({ battleId, attacker, defender }: Props) {
  if (!attacker.name && !defender.name) {
    return <EmptyDash />
  }

  return (
    <InternalLink href={`/battles/${battleId}`} className="flex min-w-0 items-center gap-1.5">
      <SideContent side={attacker} />
      <ArrowRight className="text-muted-foreground size-3.5 shrink-0" />
      <SideContent side={defender} />
    </InternalLink>
  )
}
