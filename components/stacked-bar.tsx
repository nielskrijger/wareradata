import { SEAM } from '@/components/readiness-pill-colors'

export interface BarSegment {
  key: string
  value: number
  /**
   * CSS color for the segment fill (token, oklch, hex, …).
   */
  color: string
}

interface Props {
  segments: BarSegment[]
  /**
   * Denominator for each segment's width. Defaults to the sum of the segment
   * values, so the segments fill the whole track. Pass a larger total (an
   * overall total, or a row max) to get a single-fill bar whose unfilled
   * remainder shows the track background.
   */
  total?: number
  /**
   * Track utilities (height, width, background). `flex overflow-hidden
   * rounded-full` are always applied.
   */
  className?: string
}

/**
 * Horizontal bar of proportional colored segments in a rounded track, with a
 * hairline {@link SEAM} between adjacent segments so neighboring colors stay
 * legible. Backs the readiness and war/eco bars (several segments) and the
 * points bars (a single segment below `total`, leaving the track background as
 * the remainder). Zero-value segments are skipped, so no stray seam appears.
 */
export function StackedBar({ segments, total, className }: Props) {
  const visible = segments.filter(seg => seg.value > 0)
  const valuesSum = visible.reduce((acc, seg) => acc + seg.value, 0)
  const sum = total ?? valuesSum
  // When the segments don't span the whole track (a single-fill bar), round the
  // trailing end of the last one into a cap. Multi-segment bars fill the track,
  // so the rounded overflow clip already caps both ends.
  const hasGap = sum > valuesSum

  return (
    <div className={`flex overflow-hidden rounded-full ${className ?? ''}`}>
      {sum > 0 && visible.map((seg, i) => (
        <div
          key={seg.key}
          className={i === visible.length - 1 && hasGap ? 'h-full rounded-r-full' : 'h-full'}
          style={{
            width: `${(seg.value / sum) * 100}%`,
            background: seg.color,
            borderLeft: i > 0 ? SEAM : undefined,
          }}
        />
      ))}
    </div>
  )
}
