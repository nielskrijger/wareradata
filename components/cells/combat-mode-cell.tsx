'use client'

import type { CombatMode } from '@/lib/skills/classify'

import { Coins, Swords } from 'lucide-react'

import { EmptyDash } from '@/components/empty-dash'
import { StackedBar } from '@/components/stacked-bar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface Props {
  mode: CombatMode
  warPoints: number
  ecoPoints: number
  // Leaderboard positions for each discipline, shown in the tooltip footer.
  warPointsRank: number | null
  ecoPointsRank: number | null
  // Bar track width. Defaults to 84px to sit inside the Mode column.
  width?: number
}

// Shared heat tokens so war/eco read as one consistent red/green across the
// table cells and the detail-page card (which also uses --heat-red/green).
const WAR_COLOR = 'var(--heat-red)' // red (combat)
const ECO_COLOR = 'var(--heat-green)' // green (growth)

/**
 * A player's War / Eco lean as a two-tone bar (red war / green eco), sized by
 * their war share of war+eco skill points. A bar rather than a badge so it reads
 * consistently with the MU / country aggregate cells and shows the exact split
 * at a glance. The hover card breaks it into actual points, share, and the
 * player's rank in the leading discipline. Empty-dash when nothing's trained.
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
          // the 1.5px-tall bar (matching ReadinessPillBar / the aggregate cell).
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
        <div className="mb-2 flex items-baseline justify-between">
          <span className="font-medium">Skill investment</span>
          <span className="text-neutral-50/60 text-[11px] tabular-nums">{total} pts</span>
        </div>
        <dl className="space-y-2">
          <BreakdownRow label="War" value={warPoints} total={total} color={WAR_COLOR} icon={<Swords className="size-3 shrink-0" style={{ color: WAR_COLOR }} />} />
          <BreakdownRow label="Eco" value={ecoPoints} total={total} color={ECO_COLOR} icon={<Coins className="size-3 shrink-0" style={{ color: ECO_COLOR }} />} />
        </dl>
        <Footer mode={mode} warPointsRank={warPointsRank} ecoPointsRank={ecoPointsRank} />
      </TooltipContent>
    </Tooltip>
  )
}

// One discipline: the label/value/share on a single text line, the proportion
// bar full-width beneath. Stacking the text above the bar (rather than sharing a
// row with a fixed numeric column) means a 3-digit value at 100% can't wrap.
function BreakdownRow({ label, value, total, color, icon }: { label: string, value: number, total: number, color: string, icon: React.ReactNode }) {
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

// Closing line: the leading discipline's leaderboard position, so the tooltip
// answers "how invested is this player, really?". Hybrid/untrained get a plain
// label.
function Footer({ mode, warPointsRank, ecoPointsRank }: { mode: CombatMode, warPointsRank: number | null, ecoPointsRank: number | null }) {
  let line: string | null = null
  if (mode === 'war' && warPointsRank != null) {
    line = `#${warPointsRank.toLocaleString()} most-invested fighter`
  } else if (mode === 'eco' && ecoPointsRank != null) {
    line = `#${ecoPointsRank.toLocaleString()} most-invested economist`
  }
  if (!line) {
    return null
  }
  return <div className="text-neutral-50/60 mt-2 border-t border-neutral-50/15 pt-1.5 text-[11px]">{line}</div>
}
