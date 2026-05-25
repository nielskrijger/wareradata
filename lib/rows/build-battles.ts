import type { BattleRow, BattleSide } from '@/lib/rows'
import type { Lookups } from '@/lib/rows/lookups'
import type { Battle, TournamentSnapshot } from '@/lib/warera/api'

/**
 * Resolves one side of a battle to a {@link BattleSide}. Country wars carry a
 * `country` id (→ flag + /countries link); tournament battles carry a
 * `tournamentTeam` id whose roster MU we link to (→ avatar + /mus link), with a
 * "Team #N" fallback when the team or its MU isn't in the snapshot.
 */
function resolveSide(
  side: { country?: string, tournamentTeam?: string },
  lookups: Lookups,
  tournament: TournamentSnapshot,
): BattleSide {
  if (side.tournamentTeam) {
    const team = tournament.teams[side.tournamentTeam]
    const muId = team?.muId ?? null
    const muName = muId ? lookups.muNameById.get(muId) ?? null : null
    return {
      kind: 'mu',
      id: muId,
      name: muName ?? (team ? `Team #${team.number}` : null),
      code: null,
      avatarUrl: muId ? lookups.muAvatarById.get(muId) ?? null : null,
    }
  }

  const country = side.country ? lookups.countryById.get(side.country) : undefined
  return {
    kind: 'country',
    id: side.country ?? null,
    name: country?.name ?? null,
    code: country?.code ?? null,
    avatarUrl: null,
  }
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
