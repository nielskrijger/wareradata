import type { ReadinessPill } from '@/lib/rows'

import { EmptyDash } from '@/components/empty-dash'
import { GREEN, pct, RED, SEAM, SKY } from '@/components/readiness-pill-colors'
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
 * Segments are split by a hairline seam so the green/sky boundary stays legible.
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
            <div className="flex h-1.5 w-full overflow-hidden rounded-full">
              {mix.buff > 0 && <div style={{ width: `${pct(mix.buff, total)}%`, backgroundColor: GREEN }} />}
              {mix.ready > 0 && <div style={{ width: `${pct(mix.ready, total)}%`, backgroundColor: SKY, borderLeft: mix.buff > 0 ? SEAM : undefined }} />}
              {mix.debuff > 0 && <div style={{ width: `${pct(mix.debuff, total)}%`, backgroundColor: RED, borderLeft: (mix.buff > 0 || mix.ready > 0) ? SEAM : undefined }} />}
            </div>
          </div>
        )}
      />
      <TooltipContent side="top" className="w-max">
        <div className="flex flex-col gap-1">
          <BreakdownRow label="Buff" n={mix.buff} total={total} color={GREEN} />
          <BreakdownRow label="Ready" n={mix.ready} total={total} color={SKY} />
          <BreakdownRow label="Debuff" n={mix.debuff} total={total} color={RED} />
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
