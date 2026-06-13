import type { ReactNode } from 'react'

import { heatColor } from '@/lib/utils'

interface Props {
  // 0–100; null renders an empty track with a muted dash.
  pct: number | null
  // Optional leading icon (e.g. a Heart for health).
  icon?: ReactNode
}

/**
 * The vitals fill bar shared by the hover cards: an optional leading icon, a
 * heat-colored fill proportional to `pct`, and the percentage at right.
 */
export function FillBar({ pct, icon }: Props) {
  if (pct == null) {
    return (
      <div className="flex items-center gap-2">
        {icon}
        <div className="h-1.5 flex-1 rounded-full bg-white/10" />
        <span className="w-9 text-right text-[11px] text-neutral-50/40">—</span>
      </div>
    )
  }

  const color = heatColor(pct)
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-9 text-right text-[11px] tabular-nums" style={{ color }}>
        {pct}
        %
      </span>
    </div>
  )
}
