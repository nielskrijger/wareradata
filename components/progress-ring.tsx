import type { ReactNode } from 'react'

interface Props {
  /**
   * Filled share, clamped to 0–1.
   */
  fraction: number
  color: string
  children?: ReactNode
}

/**
 * A round progress meter with a label in the middle.
 */
export function ProgressRing({ fraction, color, children }: Props) {
  const pct = Math.round(Math.min(1, Math.max(0, fraction)) * 100)

  return (
    <div
      className="flex size-[72px] shrink-0 items-center justify-center rounded-full"
      style={{ background: `conic-gradient(${color} 0 ${pct}%, var(--muted) ${pct}% 100%)` }}
    >
      <div className="bg-card flex size-14 items-center justify-center rounded-full font-mono text-base tabular-nums">
        {children}
      </div>
    </div>
  )
}
