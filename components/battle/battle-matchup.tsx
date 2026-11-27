import type { BattleRow, BattleSide } from '@/lib/rows'

import Link from 'next/link'

import { Avatar } from '@/components/avatar'
import { BattleTypeBadge } from '@/components/badges/battle-type-badge'
import { SIDE_COLOR } from '@/components/battle/side-color'
import { CompactNumber } from '@/components/cells/compact-number'
import { Flag } from '@/components/flag'
import { StackedBar } from '@/components/stacked-bar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const EMBLEM = 72

function battleVerb(b: BattleRow): string {
  if (b.isTournament) {
    return 'vs'
  }

  return b.isResistance ? 'resisting' : 'invading'
}

/**
 * Flags get an explicit inline size because the `flag-icons` `.fi` rule
 * otherwise wins on specificity.
 */
function SideEmblem({ side, won }: { side: BattleSide, won: boolean }) {
  const label = side.name ?? side.code ?? '?'
  const href = side.id ? (side.kind === 'mu' ? `/mus/${side.id}` : `/countries/${side.id}`) : null
  const emblem = side.kind === 'mu' ? <Avatar src={side.avatarUrl} name={label} size={EMBLEM} /> : (
    <Flag
      code={side.code}
      style={{
        width: EMBLEM,
        height: EMBLEM * 0.75,
        backgroundSize: 'cover',
        borderRadius: 6,
        boxShadow: '0 0 0 1px var(--border)',
      }}
    />
  )

  const inner = (
    <>
      {emblem}
      <span className="font-brand w-full truncate text-base tracking-wide">{label}</span>
    </>
  )

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
      {href
        ? (
            <Link href={href} className="flex w-full min-w-0 flex-col items-center gap-1.5 hover:opacity-80">
              {inner}
            </Link>
          )
        : inner}
      {won && <Badge variant="default">winner</Badge>}
    </div>
  )
}

function Score({ value, leads }: { value: number, leads: boolean }) {
  return <span className={cn('font-brand text-5xl', leads ? 'text-foreground' : 'text-muted-foreground')}>{value}</span>
}

/**
 * Both sides, the rounds score between them and the damage split below: the
 * top of the battle page's sidebar.
 */
export function BattleMatchup({ battle: b }: { battle: BattleRow }) {
  const attackerShare = b.totalDamage > 0 ? Math.round((b.attackerDamage / b.totalDamage) * 100) : 50

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-start gap-2">
        <SideEmblem side={b.attacker} won={b.wonBy === 'attacker'} />
        <div className="flex shrink-0 items-baseline gap-2 tabular-nums">
          <Score value={b.attackerWonRounds} leads={b.attackerWonRounds >= b.defenderWonRounds} />
          <span className="text-muted-foreground text-xl">–</span>
          <Score value={b.defenderWonRounds} leads={b.defenderWonRounds >= b.attackerWonRounds} />
        </div>
        <SideEmblem side={b.defender} won={b.wonBy === 'defender'} />
      </div>
      {/* The type badge sits here rather than under the score so the score
          row can break out of the sidebar's top edge on its own. */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <BattleTypeBadge
          isTournament={b.isTournament}
          isResistance={b.isResistance}
          tournamentName={b.tournamentName}
          tournamentRound={b.tournamentRound}
        />
        <span className="text-muted-foreground text-xs tracking-widest uppercase">
          {`${battleVerb(b)} · first to ${b.roundsToWin}`}
        </span>
      </div>
      <div className="space-y-1">
        <StackedBar
          className="h-2.5 bg-muted"
          segments={[
            { key: 'attacker', value: b.attackerDamage, color: SIDE_COLOR.attacker },
            { key: 'defender', value: b.defenderDamage, color: SIDE_COLOR.defender },
          ]}
        />
        <div className="text-muted-foreground flex justify-between text-xs tabular-nums">
          <span><CompactNumber value={b.attackerDamage} /> ({attackerShare}%)</span>
          <span>({100 - attackerShare}%) <CompactNumber value={b.defenderDamage} /></span>
        </div>
      </div>
    </div>
  )
}
