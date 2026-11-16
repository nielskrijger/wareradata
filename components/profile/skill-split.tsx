import type { ReactNode } from 'react'

import type { CombatMode } from '@/lib/skills/classify'

import { Coins, Swords } from 'lucide-react'

import { CombatModeBadge } from '@/components/badges/combat-mode-badge'
import { SectionHeading } from '@/components/profile/section-heading'
import { StackedBar } from '@/components/stacked-bar'
import { ECO_COLOR, WAR_COLOR } from '@/components/war-eco-colors'

interface Props {
  mode: CombatMode
  warPoints: number
  ecoPoints: number

  /**
   * Leaderboard position within each discipline, for the leading-side footer.
   */
  warPointsRank: number | null
  ecoPointsRank: number | null
}

/**
 * A player's war/eco split for the profile sidebar: badge, bar, points and
 * share per side, and the leading side's rank.
 */
export function SkillSplit({ mode, warPoints, ecoPoints, warPointsRank, ecoPointsRank }: Props) {
  const total = warPoints + ecoPoints

  return (
    <div className="flex flex-col gap-2">
      <SectionHeading title="Skills" aside={<CombatModeBadge mode={mode} />} />
      {total === 0 ? <span className="text-muted-foreground text-sm">No skills trained</span> : (
        <>
          <StackedBar
            className="h-2 bg-muted"
            segments={[
              { key: 'war', value: warPoints, color: WAR_COLOR },
              { key: 'eco', value: ecoPoints, color: ECO_COLOR },
            ]}
          />
          <dl className="space-y-1">
            <SplitRow
              label="War"
              points={warPoints}
              total={total}
              icon={<Swords className="size-3 shrink-0" style={{ color: WAR_COLOR }} />}
            />
            <SplitRow
              label="Eco"
              points={ecoPoints}
              total={total}
              icon={<Coins className="size-3 shrink-0" style={{ color: ECO_COLOR }} />}
            />
          </dl>
          <Footer mode={mode} warPointsRank={warPointsRank} ecoPointsRank={ecoPointsRank} />
        </>
      )}
    </div>
  )
}

interface SplitRowProps {
  label: string
  points: number
  total: number
  icon: ReactNode
}

/**
 * One discipline line: icon + label on the left, points and share on the right.
 */
function SplitRow({ label, points, total, icon }: SplitRowProps) {
  const pct = total > 0 ? Math.round((points / total) * 100) : 0

  return (
    <div className="flex items-baseline gap-1.5 text-sm">
      {icon}
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="ml-auto flex items-baseline gap-2 tabular-nums">
        <span>{points.toLocaleString()}</span>
        <span className="text-muted-foreground/60 w-9 text-right text-xs">
          {pct}
          %
        </span>
      </dd>
    </div>
  )
}

/**
 * Closing line: the leading discipline's leaderboard position, so it
 * answers "how invested is this player, really?". Hybrid/untrained omit it.
 */
function Footer({ mode, warPointsRank, ecoPointsRank }: {
  mode: CombatMode
  warPointsRank: number | null
  ecoPointsRank: number | null
}) {
  let line: string | null = null
  if (mode === 'war' && warPointsRank != null) {
    line = `#${warPointsRank.toLocaleString()} most-invested fighter`
  } else if (mode === 'eco' && ecoPointsRank != null) {
    line = `#${ecoPointsRank.toLocaleString()} most-invested economist`
  }

  if (!line) {
    return null
  }

  return <span className="text-muted-foreground/60 border-border mt-0.5 border-t pt-1.5 text-xs">{line}</span>
}
