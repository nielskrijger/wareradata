import type { ReactNode } from 'react'

import type { Range } from '@/lib/query'

import { HeatCell } from '@/components/data-table/heat-cell'
import { EmptyDash } from '@/components/empty-dash'

type HeatMode = 'ramp' | 'median' | 'invert' | 'invertMedian'

export interface StatRowSpec {
  label: string
  value: number | null | undefined
  // Pre-formatted display (e.g. <CompactNumber> or "5%"). Falls back to the raw value.
  display?: ReactNode
  range?: Range
  heat?: HeatMode
  center?: number
  // Log-scale the heat tint, for highly skewed stats (e.g. cases opened).
  logScale?: boolean
  // Leaderboard position, shown muted after the value. Omit for unranked rates.
  rank?: number | null
}

interface Props {
  label: string
  rows: StatRowSpec[]
  /**
   * Optional headline stat rendered large above the rows (e.g. Total Damage),
   * with its full "#rank of N". Pass `total` for the rank's denominator.
   */
  hero?: StatRowSpec
  total?: number
}

/**
 * A single card holding several related stats that don't each warrant their own
 * StatCard (premium spend, policy rates, demographic counts, the damage family).
 * Each row keeps the heat-tint and rank of the StatCard it replaces, so density
 * drops without losing the at-a-glance color or leaderboard context.
 */
export function MultiStatCard({ label, rows, hero, total }: Props) {
  return (
    <div className="bg-card flex flex-col gap-2 rounded-md border p-3">
      <span className="text-xs font-medium">{label}</span>
      {hero && (
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-2xl tabular-nums">
            {hero.value == null
              ? <EmptyDash />
              : (
                  <HeatCell value={hero.value} range={hero.range} mode={hero.heat} center={hero.center} logScale={hero.logScale}>
                    {hero.display ?? hero.value.toLocaleString()}
                  </HeatCell>
                )}
          </span>
          {hero.rank != null && hero.value != null && total != null && (
            <span className="text-muted-foreground/60 text-xs tabular-nums">
              #
              {hero.rank.toLocaleString()}
              {' of '}
              {total.toLocaleString()}
            </span>
          )}
        </div>
      )}
      <dl className="space-y-0.5">
        {rows.map(row => <StatRow key={row.label} {...row} />)}
      </dl>
    </div>
  )
}

function StatRow({ label, value, display, range, heat, center, logScale, rank }: StatRowSpec) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="flex items-baseline gap-2 tabular-nums">
        <span>
          {value == null
            ? <EmptyDash />
            : (
                <HeatCell value={value} range={range} mode={heat} center={center} logScale={logScale}>
                  {display ?? value.toLocaleString()}
                </HeatCell>
              )}
        </span>
        {rank != null && value != null && (
          <span className="text-muted-foreground/60 w-14 text-right text-xs">
            #
            {rank.toLocaleString()}
          </span>
        )}
      </dd>
    </div>
  )
}
