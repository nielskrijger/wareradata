import type { ReactNode } from 'react'

import { topPercent } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * The tick header's insets must match the row columns either side of the track.
 */
const ROW_COLUMNS = 'grid-cols-[minmax(0,1fr)_auto_8.5rem] sm:grid-cols-[9.5rem_5rem_minmax(0,1fr)_8.5rem]'
const TRACK_INSET = 'mr-[calc(8.5rem+1rem)] ml-[calc(9.5rem+5rem+2rem)]'

export interface RankMapRow {
  label: string
  value: number | null | undefined

  /**
   * Formatted value (e.g. <CompactNumber>); falls back to the raw number.
   */
  display?: ReactNode
  rank: number | null | undefined
}

export interface RankMapGroup {
  title: string
  color: string
  rows: RankMapRow[]
}

interface Props {
  title: string
  groups: RankMapGroup[]

  /**
   * Size of the ranked set; the track runs from last to #1.
   */
  total: number

  /**
   * What the ranked set holds, plural ("players", "MUs").
   */
  unit: string
}

/**
 * Track marks as the share of the set ranked below, from last to #1.
 */
const MARKS = [0, 25, 50, 75, 100]

/**
 * Every stat as a dot on one shared rank track, so strong and weak
 * spots read at a glance.
 *
 * Linear in percentile, so bar length is simply the share of the set beaten;
 * the "top x%" beside each rank separates the very best.
 */
export function RankMap({ title, groups, total, unit }: Props) {
  return (
    <section className="bg-card rounded-md border p-4 sm:p-5">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-medium">{title}</h2>
        <span className="text-muted-foreground text-xs">
          among {total.toLocaleString()} {unit} · further right is better
        </span>
      </div>

      {/* Lines up with the track column of the rows below. */}
      <div className={cn('text-muted-foreground relative hidden h-6 text-[10px] sm:block', TRACK_INSET)}>
        {MARKS.map(m => (
          <span key={m} className="absolute top-2 -translate-x-1/2 tabular-nums" style={{ left: `${m}%` }}>
            {markLabel(m)}
          </span>
        ))}
      </div>

      {groups.map(g => (
        <div key={g.title} className="mt-2 border-t pt-2">
          <h3 className="text-xs font-medium tracking-wide uppercase" style={{ color: g.color }}>{g.title}</h3>
          {g.rows.map(row => <Row key={row.label} row={row} color={g.color} total={total} />)}
        </div>
      ))}
    </section>
  )
}

function markLabel(m: number): string {
  if (m === 0) {
    return 'last'
  }

  return m === 100 ? '#1' : `top ${100 - m}%`
}

/**
 * On phones the track drops under the label so it keeps the full width.
 */
function Row({ row, color, total }: { row: RankMapRow, color: string, total: number }) {
  const { label, value, display, rank } = row
  // Everyone at zero shares one rank, which would read as "top 12%" for nothing.
  const ranked = rank != null && value != null && value !== 0
  const pos = ranked ? 100 * (1 - (rank - 1) / Math.max(total - 1, 1)) : 0

  return (
    <div className={cn('grid items-center gap-x-3 gap-y-0.5 py-1 text-sm sm:gap-x-4', ROW_COLUMNS)}>
      <span className="text-muted-foreground truncate">{label}</span>
      <span className="text-right tabular-nums">{value == null ? '–' : (display ?? value.toLocaleString())}</span>
      <div className="relative order-last col-span-3 h-4 sm:order-none sm:col-span-1">
        <div className="bg-muted absolute inset-x-0 top-1/2 h-px" />
        {MARKS.map(m => (
          <div key={m} className="bg-border absolute top-0.5 h-3 w-px -translate-x-1/2" style={{ left: `${m}%` }} />
        ))}
        {ranked && (
          <>
            <div
              className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full opacity-40"
              style={{ width: `${pos}%`, background: color }}
            />
            <div
              className="ring-card absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2"
              style={{ left: `${pos}%`, background: color }}
            />
          </>
        )}
      </div>
      <span className="text-muted-foreground text-right text-xs tabular-nums">
        {ranked
          ? (
              <>
                #{rank.toLocaleString()}
                <span className="text-muted-foreground/60"> · {topPercent(rank, total)}</span>
              </>
            )
          : 'unranked'}
      </span>
    </div>
  )
}
