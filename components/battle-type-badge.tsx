import { Badge } from '@/components/ui/badge'

interface Props {
  isTournament: boolean
  isResistance: boolean
  tournamentName: string | null
  tournamentRound: number | null
}

/**
 * The colored badge(s) identifying a battle's kind, shared by the /battles
 * table and the battle detail header so both read identically.
 *
 * War (red) and Resistance (amber) are single tinted badges, following the
 * codebase's badge convention (cf. TierBadge/ScaleBadge). A tournament renders
 * a sky "name" badge plus a fire `R#` round chip (the fire accent matches the
 * active-nav treatment), so the three types are distinguishable at a glance.
 */
export function BattleTypeBadge({ isTournament, isResistance, tournamentName, tournamentRound }: Props) {
  if (isTournament) {
    return (
      <span className="flex min-w-0 items-center gap-1.5">
        <Badge className="bg-sky-500/15 text-sky-800 truncate dark:text-sky-300">{tournamentName ?? 'Tournament'}</Badge>
        {tournamentRound != null && (
          <Badge variant="ghost" className="bg-fire/12 text-fire ring-fire/25 ring-1">{`R${tournamentRound}`}</Badge>
        )}
      </span>
    )
  }
  return isResistance
    ? <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-300">Resistance</Badge>
    : <Badge className="bg-red-500/15 text-red-800 dark:text-red-300">War</Badge>
}
