import { BADGE } from '@/components/badges/tone'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Props {
  isTournament: boolean
  isResistance: boolean
  tournamentName: string | null
  tournamentRound: number | null
}

/**
 * A battle's kind: War (red), Resistance (gold), or a tournament name plus a
 * round chip. Shared by the battles table and the battle header.
 */
export function BattleTypeBadge({ isTournament, isResistance, tournamentName, tournamentRound }: Props) {
  if (isTournament) {
    return (
      <span className="flex min-w-0 items-center gap-1.5">
        <Badge className={cn(BADGE.blue, 'truncate')}>
          {tournamentName ?? 'Tournament'}
        </Badge>
        {tournamentRound != null && (
          <Badge variant="ghost" className="bg-fire/12 text-fire ring-fire/25 ring-1">{`R${tournamentRound}`}</Badge>
        )}
      </span>
    )
  }

  return isResistance
    ? <Badge className={BADGE.gold}>Resistance</Badge>
    : <Badge className={BADGE.red}>War</Badge>
}
