import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface StemProps {
  /**
   * Length along the track, 0–100.
   */
  pct: number
  color: string

  /**
   * The end the stem grows from.
   */
  from?: 'left' | 'right'

  /**
   * A ringed dot at the stem's tip.
   */
  dot?: boolean
}

/**
 * A thin line fading in to a ringed dot, placed inside a relative track.
 */
export function Stem({ pct, color, from = 'left', dot = true }: StemProps) {
  return (
    <>
      {/* Fades in toward the dot and glows, so the stem reads bright without muddying the track. */}
      <div
        className="absolute top-1/2 h-0.5 -translate-y-1/2 rounded-full opacity-85"
        style={{
          [from]: 0,
          width: `${pct}%`,
          background: `linear-gradient(to ${from === 'left' ? 'right' : 'left'}, transparent, ${color})`,
          filter: `drop-shadow(0 0 3px ${color})`,
        }}
      />
      {dot && (
        <div
          className="ring-card absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2"
          style={{ left: `${from === 'left' ? pct : 100 - pct}%`, background: color }}
        />
      )}
    </>
  )
}

/**
 * The hairline track {@link Stem}s and marks sit on.
 */
export function StemTrack({ className, children }: { className?: string, children: ReactNode }) {
  return (
    <div className={cn('relative h-3', className)}>
      <div className="bg-muted-foreground/25 absolute inset-x-0 top-1/2 h-px" />
      {children}
    </div>
  )
}
