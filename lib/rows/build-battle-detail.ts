import type { BattleDetail, BattleFighter, BattleHit, BattleSideKey, EntityRef } from '@/lib/rows'
import type { Lookups } from '@/lib/rows/lookups'
import type { BattleExtras, BattleRanking, BattleRound } from '@/lib/warera/api'

import { entityRef } from '@/lib/rows/lookups'

const SIDES: BattleSideKey[] = ['attacker', 'defender']
const LAST_HITS = 10

function toSide(value: string | undefined): BattleSideKey | null {
  return value === 'attacker' || value === 'defender' ? value : null
}

function bySide<T>(fn: (side: BattleSideKey) => T): Record<BattleSideKey, T> {
  return { attacker: fn('attacker'), defender: fn('defender') }
}

function lastHits(round: BattleRound | undefined, lookups: Lookups): BattleHit[] {
  if (!round?.isActive) {
    return []
  }

  return SIDES
    .flatMap(side => round[side].lastHits.map(h => ({
      id: h._id,
      side,
      user: entityRef('user', h.user, lookups),
      damage: h.damages,
      isCritical: h.isCriticalHit,
      isMissed: h.isMissed,
      weaponCode: h.weapon?.code ?? null,
      hitAt: h.hitAt,
    })))
    .sort((a, b) => b.hitAt.localeCompare(a.hitAt))
    .slice(0, LAST_HITS)
}

export function buildBattleDetail(extras: BattleExtras, lookups: Lookups): BattleDetail {
  const { battle, rounds } = extras
  const ranked = (kind: EntityRef['kind'], list: BattleRanking[]): BattleFighter[] =>
    list.map(r => ({ ...entityRef(kind, r[kind], lookups, r.country), value: r.value }))

  return {
    startedAt: battle.createdAt,
    sides: bySide(side => ({
      damage: battle[side].damages,
      hits: battle[side].hitCount,
      moneyPool: battle[side].moneyPool ?? 0,
      moneyPer1k: battle[side].moneyPer1kDamages ?? null,
      fighters: extras.playersCount[side],
    })),
    rounds: rounds.map(r => ({
      number: r.number,
      attackerDamage: r.attacker.damages,
      defenderDamage: r.defender.damages,
      attackerPoints: r.attacker.points,
      defenderPoints: r.defender.points,
      wonBy: toSide(r.wonBy),
      isActive: r.isActive,
    })),
    players: bySide(side => ranked('user', extras.players[side])),
    earners: bySide(side => ranked('user', extras.earners[side])),
    mus: bySide(side => ranked('mu', extras.mus[side])),
    countries: bySide(side => ranked('country', extras.countries[side])),
    hits: lastHits(rounds.find(r => r.isActive), lookups),
    orders: extras.orders.flatMap((o) => {
      const side = toSide(o.side)
      const by = o.mu ? entityRef('mu', o.mu, lookups) : entityRef('country', o.country, lookups)

      return side ? [{ side, by, priority: o.priority }] : []
    }),
    contracts: extras.contracts.flatMap((c) => {
      const side = toSide(c.forCountrySide)
      if (!side || (c.status !== 'active' && c.status !== 'won')) {
        return []
      }

      return [{
        id: c._id,
        side,
        mu: entityRef('mu', c.currentWinner, lookups),
        budget: c.budget,
        perK: c.currentPerK,
        status: c.status,
      }]
    }),
  }
}
