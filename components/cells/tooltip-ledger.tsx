import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/**
 * Bold heading with its figure on the right, ruled off from the rows below;
 * the layout the Points tooltip uses.
 */
export function TooltipHeading({ label, children }: { label: ReactNode, children?: ReactNode }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-6 border-b border-white/10 pb-1.5 font-medium">
      <span>{label}</span>
      <span className="tabular-nums">{children}</span>
    </div>
  )
}

interface RowProps {
  label: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Grey label, right-aligned value.
 */
export function TooltipRow({ label, children, className }: RowProps) {
  return (
    <div className={cn('flex items-center justify-between gap-6', className)}>
      <span className="text-neutral-400">{label}</span>
      <span className="text-right tabular-nums">{children}</span>
    </div>
  )
}

/**
 * Small caps title over a group of rows.
 */
export function TooltipSection({ title, children }: { title: string, children: ReactNode }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[10px] tracking-wide text-neutral-500 uppercase">{title}</div>
      {children}
    </div>
  )
}
