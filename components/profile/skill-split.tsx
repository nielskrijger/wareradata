import type { ReactNode } from 'react'

import type { CombatMode } from '@/lib/skills/classify'

import { Coins, Swords } from 'lucide-react'

import { CombatModeBadge } from '@/components/badges/combat-mode-badge'
import { ECO_COLOR, WAR_COLOR } from '@/components/colors'
import { SectionHeading } from '@/components/detail/section-heading'
import { StackedBar } from '@/components/stacked-bar'
import { formatNumber, percentOf } from '@/lib/format'

interface Props {
  mode: CombatMode
  warPoints: number
  ecoPoints: number
}

/**
 * A player's war/eco split for the profile sidebar: badge, bar, and points and
 * share per side. The ranks live in the rank map.
 */
export function SkillSplit({ mode, warPoints, ecoPoints }: Props) {
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
  const pct = percentOf(points, total)

  return (
    <div className="flex items-baseline gap-1.5 text-sm">
      {icon}
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="ml-auto flex items-baseline gap-2 tabular-nums">
        <span>{formatNumber(points)}</span>
        <span className="text-muted-foreground/60 w-9 text-right text-xs">
          {pct}
          %
        </span>
      </dd>
    </div>
  )
}
