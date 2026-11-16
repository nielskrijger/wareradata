import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * The one-line body a hover card shows when its fetch failed.
 */
export function HoverCardError() {
  return <div className="px-3 py-2 text-[11px] text-neutral-50/70">Couldn't load details.</div>
}

/**
 * The small caps label over a hover card section or stat tile.
 */
export function HoverLabel({ className, children }: { className?: string, children: ReactNode }) {
  return (
    <span className={cn('text-[10px] tracking-wide text-neutral-50/50 uppercase', className)}>{children}</span>
  )
}
