'use client'

import type { ReactNode } from 'react'

import type { PeerTick } from './peers'

import { createContext, use, useState } from 'react'

import { Flag } from '@/components/flag'
import { formatRank, ofFirst } from '@/lib/format'
import { cn } from '@/lib/utils'
import { valueShare } from './scale'

import { TickLabel, TickMarker, TickTrack } from './tick-track'

export interface Peer {
  name: string

  /**
   * Its country, for a flag.
   */
  code: string | null
}

export type RankMapView = 'peers' | 'members'

const PeerContext = createContext<{
  view: RankMapView
  show: (view: RankMapView) => void
  hovered: number | null
  hover: (peer: number | null) => void
} | null>(null)

/**
 * The rank map's view and hovered peer; only inside {@link RankMapViews}.
 */
function usePeers() {
  const peers = use(PeerContext)
  if (!peers) {
    throw new Error('usePeers needs a <RankMapViews> around it')
  }

  return peers
}

/**
 * Holds which set the rank map's ticks show, as `data-view` for the
 * `group/rank-map` variants, and which peer the pointer is on.
 */
export function RankMapViews({ children }: { children: ReactNode }) {
  const [view, setView] = useState<RankMapView>('peers')
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <PeerContext value={{ view, show: setView, hovered, hover: setHovered }}>
      <div className="group/rank-map" data-view={view}>{children}</div>
    </PeerContext>
  )
}

export function ViewSwitch({ labels }: { labels: Record<RankMapView, string> }) {
  const { view, show } = usePeers()

  return (
    <span className="inline-flex rounded-md border p-0.5 text-xs">
      {(['peers', 'members'] as const).map(v => (
        <button
          key={v}
          type="button"
          aria-pressed={view === v}
          className={cn(
            'rounded px-2 py-0.5',
            view === v ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
          onClick={() => show(v)}
        >
          {labels[v]}
        </button>
      ))}
    </span>
  )
}

/**
 * The other groups as ticks on a value track. Pointing at a tick marks that
 * peer with a white tick on every row.
 */
export function PeerTicks({ ticks, peers, color }: { ticks: PeerTick[], peers: Peer[], color: string }) {
  const { hovered, hover } = usePeers()
  const marked = ticks.find(([, peer]) => peer === hovered)

  return (
    <TickTrack
      ticks={new Map(ticks.map(([at, , , count]) => [at, count]))}
      alpha={0.35}
      color={color}
      faded={hovered != null}
      spots={ticks.map(([at, peer]) => [at, peer])}
      hovered={hovered}
      hover={hover}
    >
      {marked && <TickMarker at={marked[0]} />}
      {marked && (
        <TickLabel at={marked[0]}>
          <Flag code={peers[marked[1]].code} className="mr-1 align-[-1px]" />
          {peers[marked[1]].name}
          <span className="text-muted-foreground">
            {' · '}
            {formatRank(marked[2])}
            {' · '}
            {ofFirst(valueShare(marked[0]))}
            {marked[3] > 1 && ` · +${marked[3] - 1} more`}
          </span>
        </TickLabel>
      )}
    </TickTrack>
  )
}
