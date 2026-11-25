import { Stem, StemTrack } from '@/components/detail/stem'
import { ECO_COLOR, WAR_COLOR } from '@/components/war-eco-colors'

/**
 * The average war / eco split as two stems meeting at the split, with its shares.
 */
export function LeanSplit({ avgWarShare }: { avgWarShare: number | null }) {
  if (avgWarShare === null) {
    return <span className="text-muted-foreground text-sm">No members trained</span>
  }

  const warPct = Math.round(avgWarShare * 100)

  return (
    <div className="flex flex-col gap-1">
      {/* War grows from the left and eco from the right; the larger side carries the dot. */}
      <StemTrack>
        <Stem pct={100 - warPct} color={ECO_COLOR} from="right" dot={warPct < 50} />
        <Stem pct={warPct} color={WAR_COLOR} dot={warPct >= 50} />
      </StemTrack>
      <div className="text-muted-foreground flex justify-between text-xs tabular-nums">
        <span>
          {warPct}
          % war
        </span>
        <span>
          {100 - warPct}
          % eco
        </span>
      </div>
    </div>
  )
}
