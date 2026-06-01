import { CombatModeBadge } from '@/components/badges/combat-mode-badge'
import { StackedBar } from '@/components/stacked-bar'
import { classifyWarShare } from '@/lib/skills/classify'

interface Props {
  // Mean of members' war shares (0 = pure eco … 1 = pure war), or null.
  avgWarShare: number | null
  // Leaderboard position by war lean and the ranked-entity total, for the
  // "#X of N" line (matching the StatCard frame).
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
  const warPct = avgWarShare === null ? null : Math.round(avgWarShare * 100)
  return (
    <div className="bg-card flex flex-col gap-2 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">War / Eco lean</span>
        <CombatModeBadge mode={mode} />
      </div>
      {warPct === null
        ? <span className="text-muted-foreground text-sm">No members trained</span>
        : (
            <>
              <StackedBar
                className="h-2 bg-muted"
                segments={[
                  { key: 'war', value: warPct, color: 'var(--heat-red)' },
                  { key: 'eco', value: 100 - warPct, color: 'var(--heat-green)' },
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
            </>
          )}
      {rank != null && total != null && (
        <span className="text-muted-foreground/60 text-xs">
          #
          {rank.toLocaleString()}
          {' of '}
          {total.toLocaleString()}
        </span>
      )}
    </div>
  )
}
