'use client'

import type { ColumnDef } from '@tanstack/react-table'

import type { MURow } from '@/lib/rows'

import { CompactNumber } from '@/components/compact-number'
import { CountryCell } from '@/components/country-cell'
import { ExternalLink } from '@/components/external-link'
import { MUCell } from '@/components/mu-cell'
import { PointsBreakdownCell } from '@/components/points-breakdown-cell'
import { TierBadge } from '@/components/tier-badge'
import { wareraUrl } from '@/lib/warera/urls'

export type { MURow }

export const muColumns: ColumnDef<MURow>[] = [
  {
    accessorKey: 'name',
    header: 'MU',
    cell: ({ row }) => (
      <MUCell muName={row.original.name} bold />
    ),
    meta: { minWidth: 220 },
  },
  {
    accessorKey: 'totalPoints',
    header: 'Total Points',
    cell: ({ row }) => (
      <PointsBreakdownCell
        total={row.original.totalPoints}
        level={row.original.levelPoints}
        damage={row.original.damagePoints}
        wealth={row.original.wealthPoints}
      />
    ),
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 110 },
  },
  {
    accessorKey: 'avgPoints',
    header: 'Avg Points',
    cell: ({ row }) => row.original.avgPoints?.toLocaleString() ?? '—',
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 100 },
  },
  {
    accessorKey: 'countryName',
    header: 'Country',
    cell: ({ row }) => (
      <CountryCell
        countryCode={row.original.countryCode}
        countryName={row.original.countryName}
      />
    ),
    meta: { minWidth: 180 },
  },
  {
    accessorKey: 'regionName',
    header: 'Region',
    cell: ({ row }) => row.original.regionName ?? '—',
    meta: { minWidth: 140 },
  },
  {
    accessorKey: 'memberCount',
    header: 'Members',
    cell: ({ row }) => row.original.memberCount.toLocaleString(),
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 90 },
  },
  {
    accessorKey: 'damageRank',
    header: 'Damage Rank',
    cell: ({ row }) => row.original.damageRank ?? '—',
    meta: { align: 'right', minWidth: 110 },
  },
  {
    accessorKey: 'damageTier',
    header: 'Tier',
    cell: ({ row }) => <TierBadge tier={row.original.damageTier} />,
    meta: { minWidth: 90 },
  },
  {
    accessorKey: 'damageValue',
    header: 'Total Damage',
    cell: ({ row }) => <CompactNumber value={row.original.damageValue} />,
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 120 },
  },
  {
    accessorKey: 'weeklyDamageValue',
    header: 'Weekly Damage',
    cell: ({ row }) => <CompactNumber value={row.original.weeklyDamageValue} />,
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 130 },
  },
  {
    accessorKey: 'bountyValue',
    header: 'Bounty',
    cell: ({ row }) => <CompactNumber value={row.original.bountyValue} />,
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 90 },
  },
  {
    accessorKey: 'wealthRank',
    header: 'Wealth Rank',
    cell: ({ row }) => row.original.wealthRank ?? '—',
    meta: { align: 'right', minWidth: 110 },
  },
  {
    accessorKey: 'wealthValue',
    header: 'Wealth',
    cell: ({ row }) => <CompactNumber value={row.original.wealthValue} />,
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 100 },
  },
  {
    accessorKey: 'terrainValue',
    header: 'Terrain',
    cell: ({ row }) => row.original.terrainValue?.toLocaleString() ?? '—',
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 100 },
  },
  {
    accessorKey: 'reputationValue',
    header: 'Reputation',
    cell: ({ row }) => row.original.reputationValue?.toLocaleString() ?? '—',
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 110 },
  },
  {
    accessorKey: 'mercenaryReputation',
    header: 'Mercenary Rep.',
    cell: ({ row }) =>
      row.original.mercenaryReputation !== null
        ? row.original.mercenaryReputation.toFixed(2)
        : '—',
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 130 },
  },
  {
    accessorKey: 'investedMoney',
    header: 'Invested',
    cell: ({ row }) => <CompactNumber value={row.original.investedMoney} />,
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 100 },
  },
  {
    accessorKey: 'dormitoriesLevel',
    header: 'Dorms',
    cell: ({ row }) => row.original.dormitoriesLevel ?? '—',
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 80 },
  },
  {
    accessorKey: 'headquartersLevel',
    header: 'HQ',
    cell: ({ row }) => row.original.headquartersLevel ?? '—',
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 70 },
  },
  {
    id: 'warera',
    header: '',
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <ExternalLink href={wareraUrl('mu', row.original.id)}>
        WarEra.io
      </ExternalLink>
    ),
    meta: { minWidth: 110 },
  },
]
