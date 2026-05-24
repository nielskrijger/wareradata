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
    meta: { width: 220 },
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
    meta: { heat: 'median', align: 'right', width: 120 },
  },
  {
    accessorKey: 'avgPoints',
    header: 'Avg Points',
    cell: ({ row }) => row.original.avgPoints?.toLocaleString() ?? '—',
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 110 },
  },
  {
    accessorKey: 'avgLevel',
    header: 'Avg Level',
    cell: ({ row }) => row.original.avgLevel ?? '—',
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 100 },
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
    meta: { width: 180 },
  },
  {
    accessorKey: 'regionName',
    header: 'Region',
    cell: ({ row }) => row.original.regionName ?? '—',
    meta: { width: 140 },
  },
  {
    accessorKey: 'memberCount',
    header: 'Members',
    cell: ({ row }) => row.original.memberCount.toLocaleString(),
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 100 },
  },
  {
    accessorKey: 'damageRank',
    header: 'Damage Rank',
    cell: ({ row }) => row.original.damageRank ?? '—',
    meta: { heat: 'invert', align: 'right', width: 130 },
  },
  {
    accessorKey: 'damageTier',
    header: 'Tier',
    cell: ({ row }) => <TierBadge tier={row.original.damageTier} />,
    meta: { width: 90 },
  },
  {
    accessorKey: 'damage',
    header: 'Total Damage',
    cell: ({ row }) => <CompactNumber value={row.original.damage} />,
    sortDescFirst: true,
    meta: { heat: 'ramp', align: 'right', width: 130 },
  },
  {
    accessorKey: 'weeklyDamage',
    header: 'Weekly Damage',
    cell: ({ row }) => <CompactNumber value={row.original.weeklyDamage} />,
    sortDescFirst: true,
    meta: { heat: 'ramp', align: 'right', width: 140 },
  },
  {
    accessorKey: 'bounty',
    header: 'Bounty',
    cell: ({ row }) => <CompactNumber value={row.original.bounty} />,
    sortDescFirst: true,
    meta: { heat: 'ramp', align: 'right', width: 90 },
  },
  {
    accessorKey: 'wealthRank',
    header: 'Wealth Rank',
    cell: ({ row }) => row.original.wealthRank ?? '—',
    meta: { heat: 'invert', align: 'right', width: 120 },
  },
  {
    accessorKey: 'wealth',
    header: 'Wealth',
    cell: ({ row }) => <CompactNumber value={row.original.wealth} />,
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 100 },
  },
  {
    accessorKey: 'terrain',
    header: 'Terrain',
    cell: ({ row }) => row.original.terrain?.toLocaleString() ?? '—',
    sortDescFirst: true,
    meta: { heat: 'ramp', align: 'right', width: 100 },
  },
  {
    accessorKey: 'reputation',
    header: 'Reputation',
    cell: ({ row }) => row.original.reputation?.toLocaleString() ?? '—',
    sortDescFirst: true,
    meta: { heat: 'ramp', align: 'right', width: 110 },
  },
  {
    accessorKey: 'mercenaryReputation',
    header: 'Mercenary Rep.',
    cell: ({ row }) =>
      row.original.mercenaryReputation !== null
        ? row.original.mercenaryReputation.toFixed(2)
        : '—',
    sortDescFirst: true,
    meta: { heat: 'ramp', align: 'right', width: 140 },
  },
  {
    accessorKey: 'investedMoney',
    header: 'Invested',
    cell: ({ row }) => <CompactNumber value={row.original.investedMoney} />,
    sortDescFirst: true,
    meta: { heat: 'ramp', align: 'right', width: 100 },
  },
  {
    accessorKey: 'dormitoriesLevel',
    header: 'Dorms',
    cell: ({ row }) => row.original.dormitoriesLevel ?? '—',
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 80 },
  },
  {
    accessorKey: 'headquartersLevel',
    header: 'HQ',
    cell: ({ row }) => row.original.headquartersLevel ?? '—',
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 70 },
  },
  {
    accessorKey: 'gemsPurchasedTotal',
    header: 'Gems Bought',
    cell: ({ row }) => row.original.gemsPurchasedTotal.toLocaleString(),
    sortDescFirst: true,
    meta: { heat: 'ramp', align: 'right', width: 120 },
  },
  {
    accessorKey: 'premiumMonthsTotal',
    header: 'Premium Mo.',
    cell: ({ row }) => row.original.premiumMonthsTotal.toLocaleString(),
    sortDescFirst: true,
    meta: { heat: 'ramp', align: 'right', width: 120 },
  },
  {
    accessorKey: 'premiumGiftsTotal',
    header: 'Premium Gifts',
    cell: ({ row }) => row.original.premiumGiftsTotal.toLocaleString(),
    sortDescFirst: true,
    meta: { heat: 'ramp', align: 'right', width: 130 },
  },
  {
    id: 'warera',
    header: 'Link',
    enableSorting: false,
    cell: ({ row }) => (
      <ExternalLink href={wareraUrl('mu', row.original.id)}>
        WarEra.io
      </ExternalLink>
    ),
    meta: { width: 110 },
  },
]
