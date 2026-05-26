'use client'

import { Coins, Swords, TrendingUp } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface Props {
  total: number
  level: number
  damage: number
  wealth: number
}

// Level / Damage / Wealth slice colors (brightened for the dark popup) paired
// with an icon, matching the points breakdown panel.
const SLICE_META = {
  Level: { color: 'oklch(0.7 0.2 295)', icon: TrendingUp },
  Damage: { color: 'oklch(0.68 0.21 27)', icon: Swords },
  Wealth: { color: 'oklch(0.82 0.15 85)', icon: Coins },
} as const

/**
 * Renders a points total in a table cell with a hover tooltip that breaks
 * it down into the three contributing slices (level, damage, wealth), each as
 * an icon-led row with its value, percent, and a mini bar.
 */
export function PointsBreakdownCell({ total, level, damage, wealth }: Props) {
  const slices = [
    { label: 'Level' as const, value: level },
    { label: 'Damage' as const, value: damage },
    { label: 'Wealth' as const, value: wealth },
  ].sort((a, b) => b.value - a.value)

  const max = Math.max(level, damage, wealth)

  return (
    <Tooltip>
      <TooltipTrigger
        className="hover:text-foreground underline decoration-dotted decoration-1 underline-offset-2"
      >
        {total.toLocaleString()}
      </TooltipTrigger>
      <TooltipContent align="end" side="top" className="w-60 px-3 py-2">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="font-medium">Points breakdown</span>
          <span className="font-medium tabular-nums">{total.toLocaleString()}</span>
        </div>
        <dl className="space-y-1.5">
          {slices.map(s => (
            <BreakdownRow key={s.label} label={s.label} value={s.value} total={total} max={max} />
          ))}
        </dl>
      </TooltipContent>
    </Tooltip>
  )
}

interface RowProps {
  label: keyof typeof SLICE_META
  value: number
  total: number
  max: number
}

function BreakdownRow({ label, value, total, max }: RowProps) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  const { color, icon: Icon } = SLICE_META[label]
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5 tabular-nums">
        <Icon className="size-3 shrink-0" style={{ color }} />
        <span className="flex-1">{label}</span>
        <span>{value.toLocaleString()}</span>
        <span className="w-8 text-right opacity-60">
          {pct}
          %
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, background: color }} />
      </div>
    </div>
  )
}
