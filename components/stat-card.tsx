import type { ReactNode } from 'react'

import type { Range } from '@/lib/query'

import { HeatCell } from '@/components/data-table/heat-cell'
import { EmptyDash } from '@/components/empty-dash'

type HeatMode = 'ramp' | 'median' | 'invert' | 'invertMedian'

interface Props {
  label: string
  value: number | null | undefined
  /**
   * Pre-formatted display node (e.g. CompactNumber). Falls back to the raw value.
   */
  display?: ReactNode
  range?: Range
  heat?: HeatMode
  center?: number
  log?: boolean
  /**
   * Leaderboard position for this stat (e.g. damageRank), shown as
   * "#rank of total". Hidden when the value is 0 or null: a zero is usually
   * shared by many players, so its tied rank is noise rather than signal.
   */
  rank?: number | null
  /**
   * Total ranked entities, for the "#rank of N" context line. Only read when
   * a rank is shown, so it can be omitted for cards that pass no rank.
   */
  total?: number
}

export function StatCard({ label, value, display, range, heat, center, log, rank, total }: Props) {
  return (
    <div className="bg-card flex flex-col gap-1 rounded-md border p-3">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-2xl tabular-nums">
        {value == null
          ? <EmptyDash />
          : (
              <HeatCell value={value} range={range} mode={heat} center={center} log={log}>
                {display ?? value.toLocaleString()}
              </HeatCell>
            )}
      </span>
      {rank != null && value != null && total != null && (
        <span className="text-muted-foreground text-xs">
          #{rank.toLocaleString()} of {total.toLocaleString()}
        </span>
      )}
    </div>
  )
}
