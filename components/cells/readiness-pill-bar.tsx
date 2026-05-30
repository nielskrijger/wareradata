import type { ReactNode } from 'react'

import type { ReadinessPill } from '@/lib/rows'

import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

import { EmptyDash } from '@/components/empty-dash'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface Props {
  mix: ReadinessPill
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

function CardRow({ icon, label, n, total, color }: { icon: ReactNode, label: string, n: number, total: number, color: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="inline-flex w-16 items-center gap-1" style={{ color }}>
        {icon}
        {label}
      </span>
      <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
        <div className="h-full rounded-full" style={{ width: `${pct(n, total)}%`, backgroundColor: color }} />
      </div>
      <span className="text-muted-foreground w-12 text-right tabular-nums">
        {n}
      </span>
    </div>
  )
}

/**
 * Detail-page card form of the readiness mix: an icon-led breakdown (buff up /
 * ready dash / debuff down) with a per-state bar and member count. Spans two
 * StatCard columns. Renders nothing when no member has a known status.
 */
export function ReadinessPillCard({ mix }: { mix: ReadinessPill }) {
  const total = mix.buff + mix.ready + mix.debuff
  if (total === 0) {
    return null
  }
  return (
    <div className="bg-card col-span-2 flex flex-col gap-2 rounded-md border p-3">
      <span className="text-xs font-medium">Readiness</span>
      <div className="flex flex-col gap-1.5">
        <CardRow icon={<ArrowUp className="size-3.5" />} label="Buff" n={mix.buff} total={total} color={GREEN} />
        <CardRow icon={<Minus className="size-3.5" />} label="Ready" n={mix.ready} total={total} color={SKY} />
        <CardRow icon={<ArrowDown className="size-3.5" />} label="Debuff" n={mix.debuff} total={total} color={RED} />
      </div>
    </div>
  )
}
