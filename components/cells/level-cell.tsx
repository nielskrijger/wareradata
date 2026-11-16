'use client'

import type { UserRow } from '@/lib/rows'

import { PrestigeSkull } from '@/components/cells/prestige-skull'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { levelTooltipLines } from '@/lib/level-tooltip'

type Props = Pick<UserRow, 'level' | 'levelRank' | 'prestige' | 'prestigePoints' | 'totalXp' | 'colorScheme'>

/**
 * A player's level with the prestige skull in front, and rank, prestige and
 * lifetime XP on hover.
 */
export function LevelCell(props: Props) {
  if (props.level == null) {
    return null
  }
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span className="hover:text-foreground inline-flex cursor-default items-center gap-1.5" />}
      >
        <PrestigeSkull prestige={props.prestige} colorScheme={props.colorScheme} />
        {props.level}
      </TooltipTrigger>
      <TooltipContent side="top">
        {levelTooltipLines(props).map(line => <div key={line}>{line}</div>)}
      </TooltipContent>
    </Tooltip>
  )
}
