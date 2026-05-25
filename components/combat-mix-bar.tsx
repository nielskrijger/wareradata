import type { CombatMix } from '@/lib/rows'

import { EmptyDash } from '@/components/empty-dash'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface Props {
  mix: CombatMix
  // Bar track width. Defaults to 96px (a touch wider than the 64px health/
  // hunger bars, since this packs three segments).
  width?: number
}

// Buff = green, ready = sky, debuff = red. Saturated mid-lightness so each
// reads on both themes; a thin card-coloured seam separates adjacent segments.
const GREEN = 'oklch(0.68 0.19 145)'
const SKY = 'oklch(0.68 0.15 240)'
const RED = 'oklch(0.63 0.21 27)'
const SEAM = '2px solid var(--card)'

function pct(n: number, t: number): number {
  return t > 0 ? Math.round((n / t) * 100) : 0
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
 * Compact stacked bar of an entity's members by combat status (buff / ready /
 * debuff), with a hover tooltip breaking the mix down by named status. Segments
 * are split by a hairline seam so the green/sky boundary stays legible. Renders
 * an em-dash when no member has a known status.
 */
export function CombatMixBar({ mix, width = 96 }: Props) {
  const total = mix.buff + mix.ready + mix.debuff
  if (total === 0) {
    return <EmptyDash />
  }
  return (
    <Tooltip>
      <TooltipTrigger
        render={(
          <div className="flex h-1.5 overflow-hidden rounded-full" style={{ width }}>
            {mix.buff > 0 && <div style={{ width: `${pct(mix.buff, total)}%`, backgroundColor: GREEN }} />}
            {mix.ready > 0 && <div style={{ width: `${pct(mix.ready, total)}%`, backgroundColor: SKY, borderLeft: mix.buff > 0 ? SEAM : undefined }} />}
            {mix.debuff > 0 && <div style={{ width: `${pct(mix.debuff, total)}%`, backgroundColor: RED, borderLeft: (mix.buff > 0 || mix.ready > 0) ? SEAM : undefined }} />}
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
