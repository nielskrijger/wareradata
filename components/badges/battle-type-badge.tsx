import { RED_BADGE } from '@/components/badges/tone'
import { Badge } from '@/components/ui/badge'

interface Props {
  isTournament: boolean
  isResistance: boolean
  tournamentName: string | null
  tournamentRound: number | null
}

/**
 * A battle's kind: War (red), Resistance (amber), or a tournament name plus a
 * round chip. Shared by the battles table and the battle header.
 */
export function BattleTypeBadge({ isTournament, isResistance, tournamentName, tournamentRound }: Props) {
  if (isTournament) {
    return (
      <span className="flex min-w-0 items-center gap-1.5">
        <Badge className="bg-sky-500/15 text-sky-800 truncate dark:text-sky-300">
          {tournamentName ?? 'Tournament'}
        </Badge>
        {tournamentRound != null && (
          <Badge variant="ghost" className="bg-fire/12 text-fire ring-fire/25 ring-1">{`R${tournamentRound}`}</Badge>
        )}
      </span>
    )
  }

  return isResistance
    ? <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-300">Resistance</Badge>
    : <Badge className={RED_BADGE}>War</Badge>
}
