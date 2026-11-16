import type { BattleRoundRow } from '@/lib/rows'

import { SIDE_COLOR } from '@/components/battle/side-color'
import { CompactNumber } from '@/components/cells/compact-number'
import { cn } from '@/lib/utils'

/**
 * Half of one round's column: a bar growing away from the round label. The
 * round's loser is dimmed so the winners read at a glance.
 */
interface BarProps {
  value: number
  max: number
  color: string
  dim: boolean
  down?: boolean
}

function Bar({ value, max, color, dim, down }: BarProps) {
  return (
    <div className={cn('flex h-20 w-full justify-center', down ? 'items-start' : 'items-end')}>
      <div
        className={cn('w-full max-w-8', down ? 'rounded-b-sm' : 'rounded-t-sm')}
        style={{ height: `${max > 0 ? (value / max) * 100 : 0}%`, background: color, opacity: dim ? 0.4 : 1 }}
      />
    </div>
  )
}

/**
 * Damage per round, attacker above the axis and defender below; the live
 * round shows its points race instead of a winner.
 */
export function RoundChart({ rounds }: { rounds: BattleRoundRow[] }) {
  const max = Math.max(...rounds.flatMap(r => [r.attackerDamage, r.defenderDamage]))

  return (
    <div className="flex gap-3 sm:gap-6">
      {rounds.map(r => (
        <div key={r.number} className="flex min-w-0 flex-1 flex-col items-center gap-1 text-xs tabular-nums">
          <span className="text-muted-foreground"><CompactNumber value={r.attackerDamage} /></span>
          <Bar value={r.attackerDamage} max={max} color={SIDE_COLOR.attacker} dim={r.wonBy === 'defender'} />
          <span className={cn('w-full border-y py-1 text-center', r.isActive && 'text-fire')}>
            {r.isActive ? `R${r.number} · ${r.attackerPoints}–${r.defenderPoints}` : `R${r.number}`}
          </span>
          <Bar value={r.defenderDamage} max={max} color={SIDE_COLOR.defender} dim={r.wonBy === 'attacker'} down />
          <span className="text-muted-foreground"><CompactNumber value={r.defenderDamage} /></span>
        </div>
      ))}
    </div>
  )
}
