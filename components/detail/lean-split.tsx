import { ECO_COLOR, WAR_COLOR } from '@/components/colors'
import { StackedBar } from '@/components/stacked-bar'

/**
 * The average war / eco split as a two-tone bar with its shares.
 */
export function LeanSplit({ avgWarShare }: { avgWarShare: number | null }) {
  if (avgWarShare === null) {
    return <span className="text-muted-foreground text-sm">No members trained</span>
  }

  const warPct = Math.round(avgWarShare * 100)

  return (
    <div className="flex flex-col gap-1">
      <StackedBar
        className="h-2 bg-muted"
        segments={[
          { key: 'war', value: warPct, color: WAR_COLOR },
          { key: 'eco', value: 100 - warPct, color: ECO_COLOR },
        ]}
      />
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
