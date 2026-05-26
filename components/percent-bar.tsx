import { EmptyDash } from '@/components/empty-dash'
import { heatColor } from '@/lib/utils'

interface Props {
  // 0-100; null renders an em-dash placeholder.
  value: number | null
  // Bar track width. Defaults to a compact 64px for table cells.
  width?: number
}

/**
 * Compact percentage bar with an inline colour-coded label, for 0-100 readings
 * like health and hunger. Both the fill and the number shift red->amber->green
 * with the value. Kept small (a 1.5px-tall track) to sit inside table cells.
 */
export function PercentBar({ value, width = 64 }: Props) {
  if (value == null) {
    return <EmptyDash />
  }
  const color = heatColor(value)
  return (
    <div className="flex items-center gap-2">
      <span className="w-9 text-right text-xs tabular-nums" style={{ color }}>
        {value}
        %
      </span>
      <div className="bg-muted h-1.5 overflow-hidden rounded-full" style={{ width }}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}
