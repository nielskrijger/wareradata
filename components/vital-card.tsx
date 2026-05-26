import type { ReactNode } from 'react'

import { Drumstick, Heart } from 'lucide-react'

import { heatColor } from '@/lib/utils'

interface Props {
  kind: 'health' | 'hunger'
  // 0-100 average across the entity's members; null renders nothing.
  value: number | null
  // Leaderboard position for this stat, shown as "#rank of total".
  rank?: number | null
  total?: number
}

const META: Record<Props['kind'], { label: string, icon: ReactNode }> = {
  health: { label: 'Avg Health', icon: <Heart className="size-4" /> },
  hunger: { label: 'Avg Hunger', icon: <Drumstick className="size-4" /> },
}

/**
 * Detail-page card for an average health or hunger reading: an icon-led row with
 * the percent, a heat-coloured bar, and the rank line, on a card whose tint
 * shifts red->green with the value so condition reads at a glance. Renders
 * nothing when the value is null (no member readings).
 */
export function VitalCard({ kind, value, rank, total }: Props) {
  if (value == null) {
    return null
  }
  const color = heatColor(value)
  const { label, icon } = META[kind]
  return (
    <div
      className="flex flex-col gap-1 rounded-md border p-3"
      style={{
        backgroundColor: `color-mix(in oklab, ${color} 10%, var(--card))`,
        borderColor: `color-mix(in oklab, ${color} 25%, var(--border))`,
      }}
    >
      <div className="flex items-baseline justify-between">
        <span className="inline-flex items-center gap-1 text-base font-medium" style={{ color }}>
          {icon}
          {label}
        </span>
        <span className="text-2xl tabular-nums" style={{ color }}>
          {value}
          %
        </span>
      </div>
      <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      {rank != null && total != null && (
        <span className="text-muted-foreground text-xs">
          #
          {rank.toLocaleString()}
          {' of '}
          {total.toLocaleString()}
        </span>
      )}
    </div>
  )
}
