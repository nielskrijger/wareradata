import type { Range } from '@/lib/query'

import { CompactNumber } from '@/components/cells/compact-number'
import { HeatCell } from '@/components/data-table/heat-cell'
import { EmptyDash } from '@/components/empty-dash'
import { cn } from '@/lib/utils'

export interface WealthPart {
  label: string
  value: number | null | undefined
  // Dataset range for the heat tint, from the page's `ranges` map.
  range?: Range
  // Leaderboard position among same-kind entities, shown muted after the value.
  rank?: number | null
}

interface Props {
  parts: WealthPart[]
  // For an MU/country: the member/citizen count, to show a per-capita average of
  // the summed total. Omit for a single user.
  perCapita?: { count: number, unit: string }
  className?: string
}

/**
 * The detail-page "Wealth composition" card: an entity's wealth split into its
 * five parts (companies / items / cash / equipment / weapons), each a row whose
 * value is heat-tinted by the dataset range and trailed by its leaderboard rank,
 * the same treatment the Economy card's rows use. The header shows the summed
 * total (and, for groups, a per-capita average). For an MU or country the parts
 * are the sum across members/citizens; for a user, their own holdings.
 */
export function WealthCompositionCard({ parts, perCapita, className }: Props) {
  const total = parts.reduce((sum, p) => sum + (p.value ?? 0), 0)
  const perCapitaValue = perCapita && perCapita.count > 0 ? total / perCapita.count : null

  return (
    <div className={cn('bg-card flex flex-col gap-2 rounded-md border p-3', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium">Wealth composition</span>
        <span className="text-sm tabular-nums"><CompactNumber value={total} /></span>
      </div>
      {perCapitaValue != null && (
        <span className="text-muted-foreground -mt-1 text-xs">
          <CompactNumber value={perCapitaValue} />
          {' avg / '}
          {perCapita!.unit}
        </span>
      )}
      <dl className="space-y-0.5">
        {parts.map(part => <WealthRow key={part.label} {...part} />)}
      </dl>
    </div>
  )
}

function WealthRow({ label, value, range, rank }: WealthPart) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="flex items-baseline gap-2 tabular-nums">
        <span>
          {value == null
            ? <EmptyDash />
            : (
                <HeatCell value={value} range={range} mode="median">
                  <CompactNumber value={value} />
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
