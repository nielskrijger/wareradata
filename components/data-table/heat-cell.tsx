import type { ReactNode } from 'react'

import type { Range } from '@/lib/query'

type Mode = 'ramp' | 'median' | 'invert' | 'invertMedian'

interface Props {
  value: number | null | undefined
  range: Range | undefined

  /**
   * 'ramp'         green-only, full gradient from min (neutral) to max (full green).
   * 'median'       diverging green→neutral→red centered on the median: above
   *                the typical value greens, below reds. Higher is "good".
   * 'invert'       diverging, lower is "good" (green), higher reds. Centers on
   *                the dataset midpoint. For ranks (uniform) and tax rates.
   * 'invertMedian' like 'invert' but centered on the median — for skewed
   *                lower-is-better columns (e.g. wars) where the midpoint
   *                would leave almost everything green.
   */
  mode?: Mode

  /**
   * For diverging modes, the value that should read neutral (no tint). When
   * omitted, the median-anchored modes use the median and 'invert' the dataset
   * midpoint. Set it (e.g. 10 for tax %) to pin neutral at a meaningful baseline.
   */
  center?: number

  /**
   * Compress the color scale logarithmically so heavily skewed columns (e.g.
   * casesOpened, 1 → 170k) spread their tint across typical values instead of
   * leaving everything near neutral until the lone outlier. Applies to all
   * modes; most useful on diverging columns where even the sqrt ramp curve
   * isn't enough.
   */
  logScale?: boolean
  children: ReactNode
}

// Steepness for the log compression: maps the normalized [0,1] position onto
// a curve that lifts small values hard (0.1 → ~0.4) while keeping 1 → 1.
const LOG_K = 9
function logCurve(t: number): number {
  return Math.log1p(LOG_K * t) / Math.log1p(LOG_K)
}

/**
 * Tints a numeric cell's text to surface standout values.
 *
 * 'ramp' columns are green-only and tint the full range — min reads neutral,
 * max reads full green, with a linear gradient between.
 *
 * The diverging modes tint by distance from a neutral center, one way above
 * and the other below. 'median' greens the high side (higher is good,
 * e.g. avg points); 'invert' / 'invertMedian' green the low side (lower is
 * good, e.g. ranks, tax rates, wars). The *Median variants center on the
 * median; plain 'invert' centers on the dataset midpoint. A `center` overrides
 * the anchor in every diverging mode.
 *
 * `range` is the [min, max, median] over the full filtered dataset, supplied
 * by the API so the highlight is stable across pages.
 */
export function HeatCell({ value, range, mode = 'ramp', center, logScale = false, children }: Props) {
  if (value == null || range == null) {
    return <>{children}</>
  }

  const [min, max, median] = range

  if (mode === 'ramp') {
    const span = max - min
    if (span <= 0) {
      return <>{children}</>
    }
    // Square-root curve (or log, when set) so skewed columns (e.g. premium
    // gifts, where most rows bunch near the minimum) still read clearly green —
    // linear would leave the bulk near neutral and only the rare max bright.
    const norm = (value - min) / span
    const t = logScale ? logCurve(norm) : Math.sqrt(norm)
    if (t < 0.05) {
      return <>{children}</>
    }
    return tinted('--heat-green', 0.3 + 0.7 * t, children)
  }

  // Diverging: distance from the neutral center, normalized by *that side's*
  // own reach so each extreme saturates — the column min hits full color on
  // the low side, the max on the high side, regardless of skew.
  const centersOnMedian = mode === 'median' || mode === 'invertMedian'
  const pivot = center ?? (centersOnMedian ? median : (min + max) / 2)
  const high = value > pivot
  const reach = high ? max - pivot : pivot - min
  if (reach <= 0) {
    return <>{children}</>
  }
  const raw = Math.min(1, Math.abs(value - pivot) / reach)
  const intensity = logScale ? logCurve(raw) : raw
  if (intensity < 0.05) {
    return <>{children}</>
  }

  // 'median' greens above center; the invert modes green below.
  const isGreen = mode === 'median' ? high : !high
  const token = isGreen ? '--heat-green' : '--heat-red'
  return tinted(token, 0.45 + 0.45 * intensity, children)
}

function tinted(token: string, weight: number, children: ReactNode) {
  return (
    <span
      className="font-medium"
      style={{ color: `color-mix(in oklab, var(${token}) ${pct(weight)}, var(--foreground))` }}
    >
      {children}
    </span>
  )
}

function pct(v: number): string {
  return `${Math.round(Math.max(0, Math.min(1, v)) * 100)}%`
}
