import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Props {
  value: number | null
  // Inclusive integer bounds of the scale. Values are clamped into this
  // range, then bucketed onto a diverging red→grey→green ramp centered on
  // the midpoint. Defaults to the -2..+2 party-ethics scale.
  min?: number
  max?: number
}

// Diverging ramp: negative = red (intensity by distance from center),
// center = neutral grey, positive = green. Translucent backgrounds with
// dark-mode-aware text, matching the tier-badge treatment.
const ramp: Record<'low2' | 'low1' | 'mid' | 'high1' | 'high2', string> = {
  low2: 'bg-red-500/20 text-red-800 dark:text-red-300',
  low1: 'bg-red-500/12 text-red-700 dark:text-red-300',
  mid: 'bg-muted text-muted-foreground',
  high1: 'bg-green-500/12 text-green-800 dark:text-green-300',
  high2: 'bg-green-500/20 text-green-800 dark:text-green-300',
}

function bucket(value: number, min: number, max: number): keyof typeof ramp {
  const center = (min + max) / 2
  const clamped = Math.max(min, Math.min(max, value))
  if (clamped === center) {
    return 'mid'
  }
  // Fraction of the way from center to the nearer extreme: (0, 1]. Values
  // past the halfway mark saturate (low2/high2); those at or inside it get
  // the softer tint (low1/high1). For the -2..+2 ethics scale this puts
  // ±2 in the strong bucket and ±1 in the soft one.
  const half = (max - min) / 2
  const frac = (clamped - center) / half
  if (frac < 0) {
    return frac < -0.5 ? 'low2' : 'low1'
  }
  return frac > 0.5 ? 'high2' : 'high1'
}

/**
 * Renders a bounded numeric value as a colored pill on a diverging
 * red→grey→green scale. Used for party ethics (-2..+2); the center value
 * reads neutral, extremes saturate toward red (low) or green (high).
 */
export function ScaleBadge({ value, min = -2, max = 2 }: Props) {
  if (value === null) {
    return <>—</>
  }
  return (
    <Badge className={cn('tabular-nums', ramp[bucket(value, min, max)])}>
      {value}
    </Badge>
  )
}
