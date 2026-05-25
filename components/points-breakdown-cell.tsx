'use client'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface Props {
  total: number
  level: number
  damage: number
  wealth: number
}

/**
 * Renders a points total in a table cell with a hover tooltip that breaks
 * it down into the three contributing slices (level, damage, wealth).
 */
export function PointsBreakdownCell({ total, level, damage, wealth }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger
        className="hover:text-foreground cursor-help underline decoration-dotted decoration-1 underline-offset-2"
      >
        {total.toLocaleString()}
      </TooltipTrigger>
      <TooltipContent align="end" side="top" className="w-56 px-3 py-2">
        <p className="mb-1.5 font-medium">Points breakdown</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 tabular-nums">
          <BreakdownRow label="Level" value={level} total={total} />
          <BreakdownRow label="Damage" value={damage} total={total} />
          <BreakdownRow label="Wealth" value={wealth} total={total} />
          <dt className="border-background/30 mt-1 border-t pt-1 font-medium">Total</dt>
          <dd className="border-background/30 mt-1 border-t pt-1 text-right font-medium">
            {total.toLocaleString()}
          </dd>
        </dl>
      </TooltipContent>
    </Tooltip>
  )
}

function BreakdownRow({ label, value, total }: { label: string, value: number, total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <>
      <dt>{label}</dt>
      <dd className="text-right">
        {value.toLocaleString()}
        {' '}
        <span className="opacity-60">
          (
          {pct}
          %)
        </span>
      </dd>
    </>
  )
}
