import type { BattleRow, BattleSide } from '@/lib/rows'
import type { Lookups } from '@/lib/rows/lookups'
import type { Battle, TournamentSnapshot } from '@/lib/warera/api'

import { entityRef } from '@/lib/rows/lookups'

/**
 * Country wars resolve to the country; tournament battles to the team's MU,
 * falling back to "Team #N" when it's not in the snapshot.
 */
function resolveSide(
  side: { country?: string, tournamentTeam?: string },
  lookups: Lookups,
  tournament: TournamentSnapshot,
): BattleSide {
  if (!side.tournamentTeam) {
    return { ...entityRef('country', side.country, lookups), kind: 'country' }
  }

  const team = tournament.teams[side.tournamentTeam]
  const mu = entityRef('mu', team?.muId, lookups)

  return { ...mu, kind: 'mu', name: mu.name ?? (team ? `Team #${team.number}` : null) }
}

export function buildBattleRows(
  battles: Battle[],
  tournament: TournamentSnapshot,
  lookups: Lookups,
): BattleRow[] {
  return battles
    .map((b) => {
      const isTournament = b.type === 'tournament'
      const attacker = resolveSide(b.attacker, lookups, tournament)
      const defender = resolveSide(b.defender, lookups, tournament)
      const region = b.defender.region ? lookups.regionById.get(b.defender.region) : undefined
      const round = b.currentRound

      return {
        attacker,
        attackerCode: attacker.code,
        attackerDamage: b.attacker.damages ?? 0,
        attackerName: attacker.name,
        attackerWonRounds: b.attacker.wonRoundsCount ?? 0,
        createdAt: b.createdAt ?? null,
        defender,
        defenderCode: defender.code,
        defenderDamage: b.defender.damages ?? 0,
        defenderName: defender.name,
        defenderWonRounds: b.defender.wonRoundsCount ?? 0,
        endedAt: b.endedAt ?? null,
        id: b._id,
        isActive: b.isActive,
        isResistance: b.type === 'resistance',
        isTournament,
        moneyPool: b.attacker.moneyPool ?? 0,
        regionId: b.defender.region ?? null,
        regionName: region?.name ?? null,
        roundAttackerDamage: round?.attacker?.damages ?? 0,
        roundDefenderDamage: round?.defender?.damages ?? 0,
        roundsToWin: b.roundsToWin,
        totalDamage: (b.attacker.damages ?? 0) + (b.defender.damages ?? 0),
        tournamentName: isTournament ? tournament.name : null,
        tournamentRound: isTournament ? b.tournamentRoundNumber ?? null : null,
        wonBy: b.wonBy ?? null,
      } satisfies BattleRow
    })
    // Active battles first, then most-recently-created. Within active, the
    // biggest fights (most total damage) bubble up.
    .sort((a, b) => {
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1
      }

      if (a.isActive) {
        return b.totalDamage - a.totalDamage
      }

      return (b.endedAt ?? '').localeCompare(a.endedAt ?? '')
    })
}
