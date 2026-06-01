import type { ReadinessPill } from '@/lib/rows'

import { EmptyDash } from '@/components/empty-dash'
import { GREEN, pct, RED, SLATE } from '@/components/readiness-pill-colors'
import { StackedBar } from '@/components/stacked-bar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface Props {
  mix: ReadinessPill
  // Bar track width. Defaults to 96px (a touch wider than the 64px health/
  // hunger bars, since this packs three segments).
  width?: number
}

function BreakdownRow({ label, n, total, color }: { label: string, n: number, total: number, color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-12">{label}</span>
      <div className="h-1 w-16 overflow-hidden rounded-full bg-white/15">
        <div className="h-full rounded-full" style={{ width: `${pct(n, total)}%`, backgroundColor: color }} />
      </div>
      <span className="ml-auto whitespace-nowrap tabular-nums">
        {n}
        {' '}
        <span className="text-white/60">
          (
          {pct(n, total)}
          %)
        </span>
      </span>
    </div>
  )
}

/**
 * Compact stacked bar of an entity's members by readiness status (buff / ready
 * / debuff), with a hover tooltip breaking the mix down by named status.
 * Segments are split by a hairline seam so the green/slate boundary stays legible.
 * Renders an em-dash when no member has a known status.
 */
export function ReadinessPillBar({ mix, width = 96 }: Props) {
  const total = mix.buff + mix.ready + mix.debuff
  if (total === 0) {
    return <EmptyDash />
  }
  return (
    <Tooltip>
      <TooltipTrigger
        render={(
          // Pad the trigger vertically so the hover/hit area covers the full
          // row height, not just the 1.5px-tall bar (which is hard to target).
          <div className="flex cursor-default items-center py-2" style={{ width }}>
            <StackedBar
              className="h-1.5 w-full"
              segments={[
                { key: 'buff', value: mix.buff, color: GREEN },
                { key: 'ready', value: mix.ready, color: SLATE },
                { key: 'debuff', value: mix.debuff, color: RED },
              ]}
            />
          </div>
        )}
      />
      <TooltipContent side="top" className="w-max">
        <div className="flex flex-col gap-1">
          <BreakdownRow label="Buff" n={mix.buff} total={total} color={GREEN} />
          <BreakdownRow label="Ready" n={mix.ready} total={total} color={SLATE} />
          <BreakdownRow label="Debuff" n={mix.debuff} total={total} color={RED} />
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
