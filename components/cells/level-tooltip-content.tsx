import type { UserRow } from '@/lib/rows'

import { PrestigeSkull } from '@/components/cells/prestige-skull'
import { TooltipHeading, TooltipRow } from '@/components/cells/tooltip-ledger'

type Props = Pick<UserRow, 'level' | 'levelRank' | 'prestige' | 'prestigePoints' | 'totalXp'> & {
  /**
   * Size of the ranked set, shown as "of N" after the rank.
   */
  rankedTotal?: number
}

/**
 * A player's level rank with prestige and lifetime XP. The rank is on lifetime
 * XP, so those rows explain why a lower level can rank higher.
 */
export function LevelTooltipContent({ level, levelRank, prestige, prestigePoints, totalXp, rankedTotal }: Props) {
  return (
    <div className="min-w-44">
      <TooltipHeading label={`Level ${level}`}>
        {levelRank == null
          ? <span className="font-normal text-neutral-400">Unranked</span>
          : (
              <>
                #{levelRank.toLocaleString()}
                {rankedTotal != null && (
                  <span className="font-normal text-neutral-400"> of {rankedTotal.toLocaleString()}</span>
                )}
              </>
            )}
      </TooltipHeading>
      <div className="space-y-1">
        {!!prestige && (
          <TooltipRow label="Prestige">
            <PrestigeSkull prestige={prestige} className="bg-white/10 text-neutral-300 ring-white/20" />
          </TooltipRow>
        )}
        {!!prestigePoints && <TooltipRow label="Unspent points">{prestigePoints}</TooltipRow>}
        {totalXp != null && <TooltipRow label="Lifetime XP">{totalXp.toLocaleString()}</TooltipRow>}
      </div>
    </div>
  )
}
