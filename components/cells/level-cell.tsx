'use client'

import type { UserRow } from '@/lib/rows'

import { LevelTooltipContent } from '@/components/cells/level-tooltip-content'
import { PrestigeSkull } from '@/components/cells/prestige-skull'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type Props = Pick<UserRow, 'level' | 'levelRank' | 'prestige' | 'prestigePoints' | 'totalXp'>

/**
 * A player's level with the prestige skull after it, and rank, prestige and
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
        {props.level}
        <PrestigeSkull prestige={props.prestige} />
      </TooltipTrigger>
      <TooltipContent side="top">
        <LevelTooltipContent {...props} />
      </TooltipContent>
    </Tooltip>
  )
}
