import { EmptyDash } from '@/components/empty-dash'

interface Props {
  // 0-100; null renders an em-dash placeholder.
  value: number | null
  // Bar track width. Defaults to a compact 64px for table cells.
  width?: number
}

/**
 * Colour value low->high as red->amber->green by hue, so a low reading reads as
 * urgent at a glance. Saturated, mid-lightness so it's legible on both themes.
 */
function heatColor(pct: number): string {
  const hue = 27 + (145 - 27) * (Math.min(100, Math.max(0, pct)) / 100)
  return `oklch(0.68 0.19 ${hue})`
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
