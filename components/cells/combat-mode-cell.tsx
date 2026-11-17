'use client'

import type { CombatMode } from '@/lib/skills/classify'

import { Coins, Swords } from 'lucide-react'

import { TooltipHeading } from '@/components/cells/tooltip-ledger'
import { EmptyDash } from '@/components/empty-dash'
import { StackedBar } from '@/components/stacked-bar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ECO_COLOR, WAR_COLOR } from '@/components/war-eco-colors'
import { formatNumber } from '@/lib/format'

interface Props {
  mode: CombatMode
  warPoints: number
  ecoPoints: number

  /**
   * Leaderboard positions for each discipline, shown in the tooltip footer.
   */
  warPointsRank: number | null
  ecoPointsRank: number | null

  /**
   * Bar track width. Defaults to 84px to sit inside the Mode column.
   */
  width?: number
}

/**
 * A player's war/eco split of skill points as a two-tone bar, with points and
 * rank on hover. A bar, not a badge, to match the group cells.
 */
export function CombatModeCell({ mode, warPoints, ecoPoints, warPointsRank, ecoPointsRank, width = 84 }: Props) {
  const total = warPoints + ecoPoints
  if (total === 0) {
    return <EmptyDash />
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={(
          // Pad vertically so the hover/hit area covers the row height, not just
          // the 1.5px-tall bar (matching BuffBar / the aggregate cell).
          <div className="flex cursor-default items-center py-2" style={{ width }}>
            <StackedBar
              className="h-1.5 w-full bg-white/10"
              segments={[
                { key: 'war', value: warPoints, color: WAR_COLOR },
                { key: 'eco', value: ecoPoints, color: ECO_COLOR },
              ]}
            />
          </div>
        )}
      />
      <TooltipContent align="end" side="top" className="w-56 px-3 py-2">
        <TooltipHeading label="Skill investment">{total} pts</TooltipHeading>
        <dl className="space-y-2">
          <BreakdownRow
            label="War"
            value={warPoints}
            total={total}
            color={WAR_COLOR}
            icon={<Swords className="size-3 shrink-0" style={{ color: WAR_COLOR }} />}
          />
          <BreakdownRow
            label="Eco"
            value={ecoPoints}
            total={total}
            color={ECO_COLOR}
            icon={<Coins className="size-3 shrink-0" style={{ color: ECO_COLOR }} />}
          />
        </dl>
        <Footer mode={mode} warPointsRank={warPointsRank} ecoPointsRank={ecoPointsRank} />
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * One discipline: the label/value/share on a single text line, the proportion
 * bar full-width beneath. Stacking the text above the bar (rather than sharing a
 * row with a fixed numeric column) means a 3-digit value at 100% can't wrap.
 */
function BreakdownRow({ label, value, total, color, icon }: {
  label: string
  value: number
  total: number
  color: string
  icon: React.ReactNode
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0

  return (
    <div>
      <div className="flex items-baseline gap-1.5 text-xs">
        {icon}
        <span>{label}</span>
        <span className="ml-auto tabular-nums">{value}</span>
        <span className="text-neutral-50/60 w-8 text-right tabular-nums">
          {pct}
          %
        </span>
      </div>
      <div className="bg-white/10 mt-1 h-1.5 overflow-hidden rounded-full">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

/**
 * Closing line: the leading discipline's leaderboard position, so the tooltip
 * answers "how invested is this player, really?". Hybrid/untrained get a plain
 * label.
 */
function Footer({ mode, warPointsRank, ecoPointsRank }: {
  mode: CombatMode
  warPointsRank: number | null
  ecoPointsRank: number | null
}) {
  let line: string | null = null
  if (mode === 'war' && warPointsRank != null) {
    line = `#${formatNumber(warPointsRank)} most-invested fighter`
  } else if (mode === 'eco' && ecoPointsRank != null) {
    line = `#${formatNumber(ecoPointsRank)} most-invested economist`
  }

  if (!line) {
    return null
  }

  return <div className="text-neutral-50/60 mt-2 border-t border-neutral-50/15 pt-1.5 text-[11px]">{line}</div>
}
