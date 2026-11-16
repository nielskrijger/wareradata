import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * The tick header's insets must match the row columns either side of the track.
 */
const ROW_COLUMNS = 'grid-cols-[minmax(0,1fr)_auto_4rem] sm:grid-cols-[9.5rem_5rem_minmax(0,1fr)_4rem]'
const TRACK_INSET = 'mr-[calc(4rem+1rem)] ml-[calc(9.5rem+5rem+2rem)]'

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
}

/**
 * Powers of ten below the total, then the total itself as "last".
 */
function ticks(total: number): number[] {
  const out: number[] = []
  for (let t = 1; t < total; t *= 10) {
    out.push(t)
  }

  return [...out, total]
}

/**
 * Every stat as a dot on one shared rank track, so a player's strong and weak
 * spots read at a glance.
 *
 * Log scale, because the difference between #10 and #100 matters far more
 * than between #20,000 and #30,000. Reversed so better sits further right.
 */
export function RankMap({ title, groups, total }: Props) {
  const scale = Math.log10(Math.max(total, 2))
  const pos = (rank: number) => 100 - (Math.log10(Math.min(rank, total)) / scale) * 100
  const marks = ticks(total)

  return (
    <section className="bg-card rounded-md border p-4 sm:p-5">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-medium">{title}</h2>
        <span className="text-muted-foreground text-xs">
          among {total.toLocaleString()} players · further right is better
        </span>
      </div>

      {/* Lines up with the track column of the rows below. */}
      <div className={cn('text-muted-foreground relative hidden h-6 text-[10px] sm:block', TRACK_INSET)}>
        {marks.map(t => (
          <span key={t} className="absolute top-2 -translate-x-1/2 tabular-nums" style={{ left: `${pos(t)}%` }}>
            {tickLabel(t, total)}
          </span>
        ))}
      </div>

      {groups.map(g => (
        <div key={g.title} className="mt-2 border-t pt-2">
          <h3 className="text-xs font-medium tracking-wide uppercase" style={{ color: g.color }}>{g.title}</h3>
          {g.rows.map(row => <Row key={row.label} row={row} color={g.color} marks={marks} pos={pos} />)}
        </div>
      ))}
    </section>
  )
}

function tickLabel(t: number, total: number): string {
  if (t === total) {
    return 'last'
  }

  return t >= 1000 ? `#${t / 1000}k` : `#${t}`
}

/**
 * On phones the track drops under the label so it keeps the full width.
 */
function Row({ row, color, marks, pos }: {
  row: RankMapRow
  color: string
  marks: number[]
  pos: (rank: number) => number
}) {
  const { label, value, display, rank } = row
  const ranked = rank != null && value != null

  return (
    <div className={cn('grid items-center gap-x-3 gap-y-0.5 py-1 text-sm sm:gap-x-4', ROW_COLUMNS)}>
      <span className="text-muted-foreground truncate">{label}</span>
      <span className="text-right tabular-nums">{value == null ? '–' : (display ?? value.toLocaleString())}</span>
      <div className="relative order-last col-span-3 h-4 sm:order-none sm:col-span-1">
        <div className="bg-muted absolute inset-x-0 top-1/2 h-px" />
        {marks.slice(1, -1).map(t => (
          <div key={t} className="bg-border absolute top-0.5 h-3 w-px" style={{ left: `${pos(t)}%` }} />
        ))}
        {ranked && (
          <>
            <div
              className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full opacity-40"
              style={{ width: `${pos(rank)}%`, background: color }}
            />
            <div
              className="ring-card absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2"
              style={{ left: `${pos(rank)}%`, background: color }}
            />
          </>
        )}
      </div>
      <span className="text-muted-foreground text-right text-xs tabular-nums">
        {ranked ? `#${rank.toLocaleString()}` : 'unranked'}
      </span>
    </div>
  )
}
