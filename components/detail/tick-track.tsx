'use client'

import type { MouseEvent, ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * A white tick marking whoever the pointer is on.
 */
const MARKER = 'w-0.5 rounded-full bg-white'

/**
 * How far from a tick, in pixels, the pointer still picks it.
 */
const PICK_RADIUS = 8

interface Props<Id> {
  /**
   * How many sit at each spot (0–100) of the track.
   */
  ticks: Map<number, number>

  /**
   * Opacity of one tick; ticks sharing a spot add up, so crowded stretches read brighter.
   */
  alpha: number
  color: string

  /**
   * Fades the ticks while someone is highlighted.
   */
  faded: boolean

  /**
   * Who the pointer can pick, by their spot on the track.
   */
  spots: [at: number, id: Id][]
  hovered: Id | null
  hover: (id: Id | null) => void
  pick?: (id: Id | null) => void

  /**
   * The marker, dot and label of whoever is highlighted.
   */
  children?: ReactNode
}

/**
 * Ticks on a rank map track that the pointer picks the nearest of.
 */
export function TickTrack<Id>({ ticks, alpha, color, faded, spots, hovered, hover, pick, children }: Props<Id>) {
  // One path per count, so thousands of ticks stay a handful of elements.
  const paths = new Map<number, number[]>()
  for (const [at, count] of ticks) {
    const path = paths.get(count)
    if (path) {
      path.push(at)
    } else {
      paths.set(count, [at])
    }
  }

  function nearest(e: MouseEvent<HTMLDivElement>) {
    const box = e.currentTarget.getBoundingClientRect()
    const pointer = ((e.clientX - box.left) / box.width) * 100
    let found: Id | null = null
    let distance = (PICK_RADIUS / box.width) * 100
    for (const [at, id] of spots) {
      const d = Math.abs(at - pointer)
      if (d <= distance) {
        found = id
        distance = d
      }
    }

    return found
  }

  return (
    <div className="group absolute inset-0">
      <svg
        className={cn('absolute inset-0 size-full transition-opacity duration-150', faded && 'opacity-60')}
        viewBox="0 0 100 16"
        preserveAspectRatio="none"
        aria-hidden
      >
        {[...paths].map(([count, spots]) => (
          <path
            key={count}
            d={spots.map(at => `M${at} 2V14`).join('')}
            stroke={color}
            strokeOpacity={1 - (1 - alpha) ** count}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {children}
      <div
        className={cn('absolute inset-0 z-20', pick ? 'cursor-pointer' : 'cursor-default')}
        data-keeps-pin
        onPointerMove={(e) => {
          const id = nearest(e)
          if (id !== hovered) {
            hover(id)
          }
        }}
        onPointerLeave={() => hover(null)}
        onClick={pick && (e => pick(nearest(e)))}
      />
    </div>
  )
}

/**
 * The {@link TickMarker} beside a name in the legend.
 */
export function LegendMarker() {
  return <span className={`h-3 ${MARKER}`} />
}

export function TickMarker({ at }: { at: number }) {
  return <div className={`absolute top-0 z-10 h-4 -translate-x-1/2 ${MARKER}`} style={{ left: `${at}%` }} />
}

/**
 * A label above a tick, only on the track under the pointer.
 */
export function TickLabel({ at, children }: { at: number, children: ReactNode }) {
  return (
    <div
      className={`bg-card pointer-events-none absolute bottom-full z-30 mb-1 hidden -translate-x-1/2 rounded border
        px-1.5 py-0.5 text-[10px] whitespace-nowrap shadow group-hover:block`}
      style={{ left: `${at}%` }}
    >
      {children}
    </div>
  )
}
