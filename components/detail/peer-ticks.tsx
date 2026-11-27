'use client'

import type { MouseEvent, ReactNode } from 'react'

import type { PeerTick } from '@/lib/rank-scale'

import { createContext, use, useState } from 'react'

import { Flag } from '@/components/flag'
import { formatRank, ofFirst } from '@/lib/format'
import { cn } from '@/lib/utils'

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
}>({ view: 'peers', show: () => {
}, hovered: null, hover: () => {
} })

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
  const { view, show } = use(PeerContext)

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
 * The peer under the pointer, for the rank map legend.
 */
export function HoveredPeerName({ peers }: { peers: Peer[] }) {
  const { hovered } = use(PeerContext)
  const peer = hovered == null ? undefined : peers[hovered]

  return peer && (
    <span className="text-foreground ml-2 inline-flex items-center gap-1.5">
      <span className="h-3 w-0.5 rounded-full bg-white" />
      <Flag code={peer.code} />
      {peer.name}
    </span>
  )
}

/**
 * How far from a tick, in pixels, the pointer still picks it.
 */
const PICK_RADIUS = 8

/**
 * The other groups as ticks on a value track. Pointing at a tick marks that
 * peer with a white tick on every row and labels it here.
 */
export function PeerTicks({ ticks, peers, color }: { ticks: PeerTick[], peers: Peer[], color: string }) {
  const { hovered, hover } = use(PeerContext)
  const tick = ticks.find(t => t[1] === hovered)
  const marked = tick && { at: tick[0], peer: tick[1], rank: tick[2], count: tick[3] }
  // One path per count, so a set of thousands stays a handful of elements.
  const paths = new Map<number, PeerTick[]>()
  for (const t of ticks) {
    paths.set(t[3], [...(paths.get(t[3]) ?? []), t])
  }

  function nearest(e: MouseEvent<HTMLDivElement>) {
    const box = e.currentTarget.getBoundingClientRect()
    const pointer = ((e.clientX - box.left) / box.width) * 100
    let found: number | null = null
    let distance = (PICK_RADIUS / box.width) * 100
    for (const [at, peer] of ticks) {
      const d = Math.abs(at - pointer)
      if (d <= distance) {
        found = peer
        distance = d
      }
    }

    return found
  }

  return (
    <div className="group absolute inset-0">
      <svg
        className={cn('absolute inset-0 size-full transition-opacity duration-150', hovered != null && 'opacity-60')}
        viewBox="0 0 100 16"
        preserveAspectRatio="none"
        aria-hidden
      >
        {[...paths].map(([count, group]) => (
          <path
            key={count}
            d={group.map(([at]) => `M${at} 2V14`).join('')}
            stroke={color}
            // Peers sharing a spot add up, so crowded stretches read brighter.
            strokeOpacity={1 - 0.65 ** count}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {marked && (
        <>
          <div
            className="absolute top-0 z-10 h-4 w-0.5 -translate-x-1/2 rounded-full bg-white"
            style={{ left: `${marked.at}%` }}
          />
          {/* Only on the track under the pointer. */}
          <div
            className={`bg-card pointer-events-none absolute bottom-full z-30 mb-1 hidden -translate-x-1/2 rounded
              border px-1.5 py-0.5 text-[10px] whitespace-nowrap shadow group-hover:block`}
            style={{ left: `${marked.at}%` }}
          >
            <Flag code={peers[marked.peer].code} className="mr-1 align-[-1px]" />
            {peers[marked.peer].name}
            <span className="text-muted-foreground">
              {' · '}
              {formatRank(marked.rank)}
              {' · '}
              {ofFirst((marked.at / 100) ** 2)}
              {marked.count > 1 && ` · +${marked.count - 1} more`}
            </span>
          </div>
        </>
      )}
      <div
        className="absolute inset-0 z-20 cursor-default"
        onPointerMove={(e) => {
          const peer = nearest(e)
          if (peer !== hovered) {
            hover(peer)
          }
        }}
        onPointerLeave={() => hover(null)}
      />
    </div>
  )
}
