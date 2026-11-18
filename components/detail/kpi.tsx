import type { ReactNode } from 'react'

interface Props {
  label: string
  value: ReactNode

  /**
   * A muted note under the value.
   */
  sub?: ReactNode
}

/**
 * One headline number with its label.
 */
export function Kpi({ label, value, sub }: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-2xl leading-tight tabular-nums">{value}</span>
      {sub && <span className="text-muted-foreground text-xs tabular-nums">{sub}</span>}
    </div>
  )
}
