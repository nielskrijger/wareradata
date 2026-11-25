import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import type { MemberRanks, PlayerStat } from '@/lib/rank-scale'
import type { UserRow } from '@/lib/rows'

import { HighlightedPlayerName, MemberTicks } from '@/components/detail/highlighted-player'
import { Stem, StemTrack } from '@/components/detail/stem'
import { Panel } from '@/components/panel'
import { formatNumber, formatRank, topPercent } from '@/lib/format'
import { memberRanks, RANK_MARKS, rankPosition } from '@/lib/rank-scale'
import { cn } from '@/lib/utils'

/**
 * The tick header's insets must match the row columns either side of the track.
 */
const ROW_COLUMNS = 'grid-cols-[minmax(0,1fr)_auto_8.5rem] sm:grid-cols-[9.5rem_6rem_minmax(0,1fr)_8.5rem]'
const TRACK_INSET = 'mr-[calc(8.5rem+1rem)] ml-[calc(9.5rem+6rem+2rem)]'

export interface RankMapRow {
  label: string

  /**
   * A muted glyph before the label, for rows that need telling apart at a glance.
   */
  icon?: LucideIcon
  value: number | null | undefined

  /**
   * Formatted value (e.g. <CompactNumber>); falls back to the raw number.
   */
  display?: ReactNode
  rank: number | null | undefined

  /**
   * The player stat this row compares with, to place members (and the
   * highlighted player) on the same track.
   */
  stat?: PlayerStat
}

export interface RankMapGroup {
  title: string
  color: string
  rows: RankMapRow[]
}

interface Props {
  /**
   * Whose ranks these are; the heading reads "Where {name} ranks among …".
   */
  name: string
  groups: RankMapGroup[]

  /**
   * Size of the ranked set; the track runs from last to #1.
   */
  total: number

  /**
   * What the ranked set holds, plural ("players", "MUs").
   */
  unit: string

  /**
   * The group's players, drawn as ticks on every row with a {@link RankMapRow.stat}.
   */
  members?: Members
}

interface Members {
  rows: UserRow[]

  /**
   * One of them, singular ("member", "citizen", "MU mate").
   */
  noun: string

  /**
   * Size of the player set the ticks are ranked in.
   */
  players: number
}

/**
 * Every stat as a dot on one shared rank track, so strong and weak
 * spots read at a glance. Where a stat has a player counterpart, each
 * member is a tick on the same track, ranked among all players.
 */
export function RankMap({ name, groups, total, unit, members }: Props) {
  const stats = groups.flatMap(g => g.rows.flatMap(r => (r.stat ? [r.stat] : [])))
  const ranked = members && { rows: members.rows.map(m => memberRanks(m, stats)), players: members.players }

  return (
    <Panel as="section">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-medium">
          Where {name} ranks among {formatNumber(total)} {unit}
        </h2>
        {members && members.rows.length > 0 && (
          <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
            {formatNumber(members.rows.length)} {members.noun}{members.rows.length === 1 ? '' : 's'},
            {' '}
            among {formatNumber(members.players)} players
            <HighlightedPlayerName members={ranked?.rows ?? []} />
          </span>
        )}
      </div>

      {/* Lines up with the track column of the rows below. */}
      <div className={cn('text-muted-foreground relative hidden h-6 text-[10px] sm:block', TRACK_INSET)}>
        {RANK_MARKS.map(m => (
          <span key={m.label} className="absolute top-2 -translate-x-1/2 tabular-nums" style={{ left: `${m.at}%` }}>
            {m.label}
          </span>
        ))}
      </div>

      {groups.map(g => (
        <div key={g.title} className="mt-2 border-t pt-2">
          <h3 className="text-xs font-medium tracking-wide uppercase" style={{ color: g.color }}>{g.title}</h3>
          {g.rows.map(row => (
            <Row key={row.label} row={row} color={g.color} total={total} members={ranked} />
          ))}
        </div>
      ))}
    </Panel>
  )
}

/**
 * On phones the track drops under the label so it keeps the full width.
 */
interface RowProps {
  row: RankMapRow
  color: string
  total: number
  members?: { rows: MemberRanks[], players: number }
}

function Row({ row, color, total, members }: RowProps) {
  const { label, icon: Icon, value, display, rank, stat } = row
  // Everyone at zero shares one rank, which would read as "top 12%" for nothing.
  const ranked = rank != null && value != null && value !== 0
  const pos = ranked ? rankPosition(rank, total) : 0

  return (
    <div className={cn('grid items-center gap-x-3 gap-y-0.5 py-1 text-sm sm:gap-x-4', ROW_COLUMNS)}>
      <span className="text-muted-foreground inline-flex min-w-0 items-center gap-1.5">
        {Icon && <Icon className="size-3.5 shrink-0" />}
        <span className="truncate">{label}</span>
      </span>
      <span className="text-right whitespace-nowrap tabular-nums">
        {value == null ? '–' : (display ?? formatNumber(value))}
      </span>
      <StemTrack className="order-last col-span-3 h-4 sm:order-none sm:col-span-1">
        {RANK_MARKS.map(m => (
          <div
            key={m.label}
            className="bg-muted-foreground/45 absolute top-0.5 h-3 w-px -translate-x-1/2"
            style={{ left: `${m.at}%` }}
          />
        ))}
        {stat && members && <MemberTicks stat={stat} members={members.rows} players={members.players} color={color} />}
        {ranked && <Stem pct={pos} color={color} />}
      </StemTrack>
      <span className="text-muted-foreground text-right text-xs tabular-nums">
        {ranked
          ? (
              <>
                {formatRank(rank)}
                <span className="text-muted-foreground/60"> · {topPercent(rank, total)}</span>
              </>
            )
          : 'unranked'}
      </span>
    </div>
  )
}
