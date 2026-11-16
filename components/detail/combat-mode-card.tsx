import { CombatModeBadge } from '@/components/badges/combat-mode-badge'
import { StackedBar } from '@/components/stacked-bar'
import { ECO_COLOR, WAR_COLOR } from '@/components/war-eco-colors'
import { formatNumber } from '@/lib/format'
import { classifyWarShare } from '@/lib/skills/classify'

interface Props {
  /**
   * Mean of members' war shares (0 = pure eco … 1 = pure war), or null.
   */
  avgWarShare: number | null

  /**
   * Leaderboard position by war lean and the ranked-entity total, for the
   * "#X of N" line (matching the StatCard frame).
   */
  rank?: number | null
  total?: number
}

/**
 * Detail-page card showing a MU / country's collective War / Eco lean: the mode
 * badge plus the average war split as a two-tone bar. Matches the StatCard frame
 * used across the detail grid; mirrors ReadinessPillCard's role for readiness.
 */
export function CombatModeCard({ avgWarShare, rank, total }: Props) {
  const mode = classifyWarShare(avgWarShare)

  return (
    <div className="bg-card flex flex-col gap-2 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">War / Eco lean</span>
        <CombatModeBadge mode={mode} />
      </div>
      <LeanSplit avgWarShare={avgWarShare} />
      {rank != null && total != null && (
        <span className="text-muted-foreground/60 text-xs">
          #
          {formatNumber(rank)}
          {' of '}
          {formatNumber(total)}
        </span>
      )}
    </div>
  )
}

/**
 * The average war / eco split as a two-tone bar with its shares; also used
 * bare in the MU sidebar.
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
