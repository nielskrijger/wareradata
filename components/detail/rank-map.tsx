import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import type { Peer, RankMapView } from '@/components/detail/peer-ticks'
import type { MemberRanks, PeerTick, PeerValue, PlayerStat } from '@/lib/rank-scale'
import type { UserRow } from '@/lib/rows'

import { HighlightedPlayerName, MemberTicks } from '@/components/detail/highlighted-player'
import { HoveredPeerName, PeerTicks, RankMapViews, ViewSwitch } from '@/components/detail/peer-ticks'
import { Stem, StemTrack } from '@/components/detail/stem'
import { Panel } from '@/components/panel'
import { formatNumber, formatRank, ofFirst, topPercent } from '@/lib/format'
import { memberRanks, peerTicks, RANK_MARKS, rankPosition, VALUE_MARKS, valuePosition } from '@/lib/rank-scale'
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
   * The whole ranked set, this one included, drawn as ticks by their share of
   * the #1's value on every row.
   */
  peers?: Peers

  /**
   * The group's players, drawn as ticks on every row with a {@link RankMapRow.stat}.
   */
  members?: Members
}

interface Peers {
  selfId: string
  all: { id: string, name: string, code: string | null, groups: RankMapGroup[] }[]
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
 * Hides a view's layer while the other view shows.
 */
const HIDE: Record<RankMapView, string> = {
  peers: 'group-data-[view=members]/rank-map:hidden',
  members: 'group-data-[view=peers]/rank-map:hidden',
}

const MARKS: Record<RankMapView, typeof RANK_MARKS> = { peers: VALUE_MARKS, members: RANK_MARKS }

const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1)

const rowKey = (g: RankMapGroup, r: RankMapRow) => `${g.title}/${r.label}`

/**
 * Every stat as a dot on one shared track, so strong and weak spots read at a
 * glance. With peers, the track is the share of the #1's value and every other
 * member of the ranked set is a tick on it; with members, it's the rank and
 * each member is a tick ranked among all players. With both, a switch picks.
 */
export function RankMap({ name, groups, total, unit, peers, members }: Props) {
  const stats = groups.flatMap(g => g.rows.flatMap(r => (r.stat ? [r.stat] : [])))
  const memberSet = members && { rows: members.rows.map(m => memberRanks(m, stats)), players: members.players }
  const peerSet = peers && peerRows(peers, groups)
  // Without peers, the rank view shows even with no members to tick.
  const views = [...(peers ? ['peers' as const] : []), ...(members || !peers ? ['members' as const] : [])]
  const hide = (view: RankMapView) => (views.length > 1 ? HIDE[view] : '')

  return (
    <Panel as="section">
      <RankMapViews>
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="font-medium">
            Where {name} ranks among {formatNumber(total)} {unit}
          </h2>
          <span className="text-muted-foreground inline-flex items-center gap-3 text-xs">
            {members && views.length > 1 && (
              <ViewSwitch labels={{ peers: capitalize(unit), members: `${capitalize(members.noun)}s` }} />
            )}
            {peerSet && (
              <span className={cn('inline-flex items-center', hide('peers'))}>
                {formatNumber(peerSet.count)} other {unit}
                <HoveredPeerName peers={peerSet.names} />
              </span>
            )}
            {members && memberSet && members.rows.length > 0 && (
              <span className={cn('inline-flex items-center gap-1.5', hide('members'))}>
                {formatNumber(members.rows.length)} {members.noun}{members.rows.length === 1 ? '' : 's'},
                {' '}
                among {formatNumber(members.players)} players
                <HighlightedPlayerName members={memberSet.rows} />
              </span>
            )}
          </span>
        </div>

        {/* Lines up with the track column of the rows below. */}
        <div className={cn('text-muted-foreground relative hidden h-6 text-[10px] sm:block', TRACK_INSET)}>
          {views.map(view => (
            <div key={view} className={cn('absolute inset-0', hide(view))}>
              {MARKS[view].map(m => (
                <span
                  key={m.label}
                  className="absolute top-2 -translate-x-1/2 tabular-nums"
                  style={{ left: `${m.at}%` }}
                >
                  {m.label}
                </span>
              ))}
            </div>
          ))}
        </div>

        {groups.map(g => (
          <div key={g.title} className="mt-2 border-t pt-2">
            <h3 className="text-xs font-medium tracking-wide uppercase" style={{ color: g.color }}>{g.title}</h3>
            {g.rows.map(row => (
              <Row
                key={row.label}
                row={row}
                color={g.color}
                total={total}
                hide={hide}
                members={memberSet}
                peers={peerSet && { names: peerSet.names, ...peerSet.rows.get(rowKey(g, row))! }}
              />
            ))}
          </div>
        ))}
      </RankMapViews>
    </Panel>
  )
}

/**
 * Every row's peer ticks, keyed by {@link rowKey}, leaving out the unranked
 * and those at zero; with the names of only the peers a tick names.
 */
function peerRows({ selfId, all }: Peers, groups: RankMapGroup[]) {
  const values = new Map<string, PeerValue[]>()
  all.forEach((p, peer) => {
    if (p.id === selfId) {
      return
    }

    for (const g of p.groups) {
      for (const r of g.rows) {
        if (r.rank != null && r.value != null && r.value !== 0) {
          const key = rowKey(g, r)
          values.set(key, [...(values.get(key) ?? []), { peer, value: r.value, rank: r.rank }])
        }
      }
    }
  })

  const names: Peer[] = []
  const named = new Map<number, number>()
  const name = (peer: number) => {
    if (!named.has(peer)) {
      named.set(peer, names.push({ name: all[peer].name, code: all[peer].code }) - 1)
    }

    return named.get(peer)!
  }

  const rows = new Map<string, PeerRow>()
  for (const g of groups) {
    for (const r of g.rows) {
      const key = rowKey(g, r)
      const others = values.get(key) ?? []
      const best = Math.max(0, ...others.map(p => p.value))
      const max = Math.max(best, r.value ?? 0)
      const ticks = peerTicks(others, max).map(([at, peer, rank, count]): PeerTick => [at, name(peer), rank, count])
      rows.set(key, { ticks, max, best })
    }
  }

  return { names, rows, count: all.length - 1 }
}

interface PeerRow {
  ticks: PeerTick[]

  /**
   * The #1's value, the end of the track.
   */
  max: number

  /**
   * The best of the others, for how far the #1 leads.
   */
  best: number
}

interface RowProps {
  row: RankMapRow
  color: string
  total: number
  hide: (view: RankMapView) => string
  members?: { rows: MemberRanks[], players: number }
  peers?: PeerRow & { names: Peer[] }
}

/**
 * On phones the track drops under the label so it keeps the full width.
 */
function Row({ row, color, total, hide, members, peers }: RowProps) {
  const { label, icon: Icon, value, display, rank, stat } = row
  // Everyone at zero shares one rank, which would read as "top 12%" for nothing.
  const ranked = rank != null && value != null && value !== 0

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
        {peers && (
          <div className={cn('absolute inset-0', hide('peers'))}>
            <Marks marks={VALUE_MARKS} />
            <PeerTicks ticks={peers.ticks} peers={peers.names} color={color} />
            {ranked && <Stem pct={valuePosition(value, peers.max)} color={color} />}
          </div>
        )}
        {(members || !peers) && (
          <div className={cn('absolute inset-0', hide('members'))}>
            <Marks marks={RANK_MARKS} />
            {stat && members && (
              <MemberTicks stat={stat} members={members.rows} players={members.players} color={color} />
            )}
            {ranked && <Stem pct={rankPosition(rank, total)} color={color} />}
          </div>
        )}
      </StemTrack>
      <span className="text-muted-foreground text-right text-xs tabular-nums">
        {ranked
          ? (
              <>
                <span className="text-foreground">{formatRank(rank)}</span>
                {' · '}
                {peers && (
                  <span className={hide('peers')}>
                    {rank === 1 ? lead(value, peers.best) : ofFirst(value / peers.max)}
                  </span>
                )}
                {(members || !peers) && <span className={hide('members')}>{topPercent(rank, total)}</span>}
              </>
            )
          : 'unranked'}
      </span>
    </div>
  )
}

/**
 * How far the #1 is ahead of the #2: "1.2× #2".
 */
function lead(value: number, best: number) {
  if (best <= 0) {
    return 'the only one'
  }

  return value > best ? `${(value / best).toFixed(1)}× #2` : 'tied'
}

function Marks({ marks }: { marks: typeof RANK_MARKS }) {
  return marks.map(m => (
    <div
      key={m.label}
      className="bg-muted-foreground/45 absolute top-0.5 h-3 w-px -translate-x-1/2"
      style={{ left: `${m.at}%` }}
    />
  ))
}
