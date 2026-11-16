import type { ReactNode } from 'react'

/**
 * Bold heading with its figure on the right, ruled off from the rows below;
 * the layout the Points tooltip uses.
 */
export function TooltipHeading({ label, children }: { label: ReactNode, children: ReactNode }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-6 border-b border-white/10 pb-1.5 font-medium">
      <span>{label}</span>
      <span className="tabular-nums">{children}</span>
    </div>
  )
}

/**
 * Grey label, right-aligned value.
 */
export function TooltipRow({ label, children }: { label: ReactNode, children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="text-neutral-400">{label}</span>
      <span className="text-right tabular-nums">{children}</span>
    </div>
  )
}
