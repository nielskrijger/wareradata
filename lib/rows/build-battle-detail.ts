import type { BattleDetail, BattleFighter, BattleHit, BattleSideKey } from '@/lib/rows'
import type { Lookups } from '@/lib/rows/lookups'
import type { BattleExtras, BattleRanking, BattleRound } from '@/lib/warera/api'

const SIDES: BattleSideKey[] = ['attacker', 'defender']
const LAST_HITS = 10

function toSide(value: string | undefined): BattleSideKey | null {
  return value === 'attacker' || value === 'defender' ? value : null
}

function userFighter(
  userId: string,
  countryId: string | null | undefined,
  value: number,
  lookups: Lookups,
): BattleFighter {
  return {
    id: userId,
    name: lookups.userNameById.get(userId) ?? null,
    avatarUrl: lookups.userAvatarById.get(userId) ?? null,
    colorScheme: lookups.userColorSchemeById.get(userId) ?? null,
    countryCode: countryId ? lookups.countryById.get(countryId)?.code ?? null : null,
    value,
  }
}

function muFighter(muId: string | null | undefined, value: number, lookups: Lookups): BattleFighter {
  return {
    id: muId ?? null,
    name: muId ? lookups.muNameById.get(muId) ?? null : null,
    avatarUrl: muId ? lookups.muAvatarById.get(muId) ?? null : null,
    colorScheme: null,
    countryCode: null,
    value,
  }
}

function countryFighter(countryId: string | null | undefined, value: number, lookups: Lookups): BattleFighter {
  const country = countryId ? lookups.countryById.get(countryId) : undefined

  return {
    id: countryId ?? null,
    name: country?.name ?? null,
    avatarUrl: null,
    colorScheme: null,
    countryCode: country?.code ?? null,
    value,
  }
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
      user: userFighter(h.user, null, h.damages, lookups),
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
  const users = (list: BattleRanking[]) =>
    list.flatMap(r => (r.user ? [userFighter(r.user, r.country, r.value, lookups)] : []))

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
    players: bySide(side => users(extras.players[side])),
    earners: bySide(side => users(extras.earners[side])),
    mus: bySide(side => extras.mus[side].map(r => muFighter(r.mu, r.value, lookups))),
    countries: bySide(side => extras.countries[side].map(r => countryFighter(r.country, r.value, lookups))),
    hits: lastHits(rounds.find(r => r.isActive), lookups),
    orders: extras.orders.flatMap((o) => {
      const side = toSide(o.side)
      const id = o.mu ?? o.country
      if (!side || !id) {
        return []
      }

      const group = o.mu ? muFighter(o.mu, 0, lookups) : countryFighter(id, 0, lookups)

      return [{
        side,
        kind: o.mu ? 'mu' as const : 'country' as const,
        id,
        name: group.name,
        avatarUrl: group.avatarUrl,
        countryCode: group.countryCode,
        priority: o.priority,
      }]
    }),
    contracts: extras.contracts.flatMap((c) => {
      const side = toSide(c.forCountrySide)
      if (!side || (c.status !== 'active' && c.status !== 'won')) {
        return []
      }

      const mu = muFighter(c.currentWinner, 0, lookups)

      return [{
        id: c._id,
        side,
        muId: mu.id,
        muName: mu.name,
        muAvatarUrl: mu.avatarUrl,
        budget: c.budget,
        perK: c.currentPerK,
        status: c.status,
      }]
    }),
  }
}
