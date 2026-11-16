'use client'

import type { ColumnDef } from '@/components/data-table/features'

import type { BattleRow } from '@/lib/rows'

import { BattleTypeBadge } from '@/components/badges/battle-type-badge'
import { BattleMatchupCell } from '@/components/cells/battle-matchup-cell'
import { EntityCell } from '@/components/cells/entity-cell'
import { compactNumberColumn } from '@/components/data-table/column-factories'
import { ExternalLink } from '@/components/links'
import { RegionLink } from '@/components/region-link'
import { RelativeTime } from '@/components/relative-time'
import { wareraUrl } from '@/lib/warera/urls'

export type { BattleRow }

/**
 * Rounds tally "won–won / N". The leader's number is emphasized; the trailing
 * "/ N" is the first-to count.
 */
function scoreCell(row: BattleRow) {
  const { attackerWonRounds: a, defenderWonRounds: d, roundsToWin } = row

  return (
    <span className="tabular-nums">
      <span className={a >= d ? 'text-foreground font-medium' : 'text-muted-foreground'}>{a}</span>
      <span className="text-muted-foreground">–</span>
      <span className={d >= a ? 'text-foreground font-medium' : 'text-muted-foreground'}>{d}</span>
      <span className="text-muted-foreground ml-1 text-xs">/ {roundsToWin}</span>
    </span>
  )
}

function winnerCell(row: BattleRow) {
  if (!row.wonBy) {
    return null
  }

  const side = row.wonBy === 'attacker' ? row.attacker : row.defender

  return <EntityCell entity={side} />
}

const matchupColumn: ColumnDef<BattleRow> = {
  accessorKey: 'attackerName',
  header: 'Battle',
  cell: ({ row }) => (
    <BattleMatchupCell
      battleId={row.original.id}
      attacker={row.original.attacker}
      defender={row.original.defender}
    />
  ),
  enableSorting: false,
  meta: { width: 320 },
}

const regionColumn: ColumnDef<BattleRow> = {
  accessorKey: 'regionName',
  header: 'Region',
  cell: ({ row }) => {
    const { regionId, regionName } = row.original

    return regionName && <RegionLink id={regionId} name={regionName} className="truncate" />
  },
  meta: { width: 160 },
}

const typeColumn: ColumnDef<BattleRow> = {
  accessorKey: 'isResistance',
  header: 'Type',
  cell: ({ row }) => (
    <BattleTypeBadge
      isTournament={row.original.isTournament}
      isResistance={row.original.isResistance}
      tournamentName={row.original.tournamentName}
      tournamentRound={row.original.tournamentRound}
    />
  ),
  meta: { width: 160 },
}

const wareraColumn: ColumnDef<BattleRow> = {
  id: 'warera',
  header: 'Link',
  enableSorting: false,
  cell: ({ row }) => (
    <ExternalLink href={wareraUrl('battle', row.original.id)}>
      WarEra.io
    </ExternalLink>
  ),
  meta: { width: 110 },
}

export const activeBattleColumns: ColumnDef<BattleRow>[] = [
  matchupColumn,
  regionColumn,
  typeColumn,
  {
    accessorKey: 'attackerWonRounds',
    header: 'Rounds',
    cell: ({ row }) => scoreCell(row.original),
    sortDescFirst: true,
    meta: { align: 'right', width: 110 },
  },
  compactNumberColumn<BattleRow>('roundAttackerDamage', 'Round Dmg (Atk)', { heat: 'ramp', width: 155 }),
  compactNumberColumn<BattleRow>('roundDefenderDamage', 'Round Dmg (Def)', { heat: 'ramp', width: 155 }),
  compactNumberColumn<BattleRow>('totalDamage', 'Total Damage', { heat: 'median', width: 130 }),
  compactNumberColumn<BattleRow>('moneyPool', 'Money Pool', { heat: 'ramp', width: 120 }),
  wareraColumn,
]

export const finishedBattleColumns: ColumnDef<BattleRow>[] = [
  matchupColumn,
  regionColumn,
  typeColumn,
  {
    accessorKey: 'wonBy',
    header: 'Winner',
    cell: ({ row }) => winnerCell(row.original),
    meta: { width: 180 },
  },
  {
    accessorKey: 'attackerWonRounds',
    header: 'Score',
    cell: ({ row }) => scoreCell(row.original),
    sortDescFirst: true,
    meta: { align: 'right', width: 110 },
  },
  compactNumberColumn<BattleRow>('totalDamage', 'Total Damage', { heat: 'median', width: 130 }),
  {
    accessorKey: 'endedAt',
    header: 'Ended',
    cell: ({ row }) => (
      <RelativeTime iso={row.original.endedAt} className="text-muted-foreground" />
    ),
    sortDescFirst: true,
    meta: { width: 120 },
  },
  wareraColumn,
]
