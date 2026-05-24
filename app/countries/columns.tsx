'use client'

import type { ColumnDef } from '@tanstack/react-table'

import type { CountryRow } from '@/lib/rows'

import { CompactNumber } from '@/components/compact-number'
import { CountryCell } from '@/components/country-cell'
import { ExternalLink } from '@/components/external-link'
import { InternalLink } from '@/components/internal-link'
import { PointsBreakdownCell } from '@/components/points-breakdown-cell'
import { TierBadge } from '@/components/tier-badge'
import { wareraUrl } from '@/lib/warera/urls'

export type { CountryRow }

export const countryColumns: ColumnDef<CountryRow>[] = [
  {
    accessorKey: 'name',
    header: 'Country',
    cell: ({ row }) => (
      <CountryCell
        countryCode={row.original.code}
        countryName={row.original.name}
      />
    ),
    meta: { minWidth: 200 },
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
    accessorKey: 'damageRank',
    header: 'Damage Rank',
    cell: ({ row }) => row.original.damageRank ?? '—',
    sortUndefined: 'last',
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
    accessorKey: 'weeklyDamagePerCitizenValue',
    header: 'Weekly / Citizen',
    cell: ({ row }) => <CompactNumber value={row.original.weeklyDamagePerCitizenValue} />,
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 140 },
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
    accessorKey: 'development',
    header: 'Development',
    cell: ({ row }) =>
      row.original.development !== null ? row.original.development.toFixed(1) : '—',
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 110 },
  },
  {
    accessorKey: 'activePopulation',
    header: 'Active pop.',
    cell: ({ row }) => row.original.activePopulation ?? '—',
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 100 },
  },
  {
    accessorKey: 'musCount',
    header: 'MUs',
    cell: ({ row }) => (
      <InternalLink href={`/mus?q=${encodeURIComponent(`country:${row.original.code}`)}`}>
        {row.original.musCount.toLocaleString()}
      </InternalLink>
    ),
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 80 },
  },
  {
    accessorKey: 'bountyValue',
    header: 'Bounty',
    cell: ({ row }) => <CompactNumber value={row.original.bountyValue} />,
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 90 },
  },
  {
    accessorKey: 'money',
    header: 'Treasury',
    cell: ({ row }) => <CompactNumber value={row.original.money} />,
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 100 },
  },
  {
    accessorKey: 'productionBonusValue',
    header: 'Prod. Bonus',
    cell: ({ row }) =>
      row.original.productionBonusValue !== null
        ? `${row.original.productionBonusValue}%`
        : '—',
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 110 },
  },
  {
    accessorKey: 'unrestPercent',
    header: 'Unrest',
    cell: ({ row }) =>
      row.original.unrestPercent !== null
        ? `${row.original.unrestPercent.toFixed(1)}%`
        : '—',
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 90 },
  },
  {
    accessorKey: 'taxIncome',
    header: 'Income Tax',
    cell: ({ row }) =>
      row.original.taxIncome !== null ? `${row.original.taxIncome}%` : '—',
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 100 },
  },
  {
    accessorKey: 'taxMarket',
    header: 'Market Tax',
    cell: ({ row }) =>
      row.original.taxMarket !== null ? `${row.original.taxMarket}%` : '—',
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 100 },
  },
  {
    accessorKey: 'taxSelfWork',
    header: 'Self-Work Tax',
    cell: ({ row }) =>
      row.original.taxSelfWork !== null ? `${row.original.taxSelfWork}%` : '—',
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 120 },
  },
  {
    accessorKey: 'alliesCount',
    header: 'Allies',
    cell: ({ row }) => row.original.alliesCount.toLocaleString(),
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 80 },
  },
  {
    accessorKey: 'warsCount',
    header: 'Wars',
    cell: ({ row }) => row.original.warsCount.toLocaleString(),
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 80 },
  },
  {
    accessorKey: 'specializedItem',
    header: 'Specialty',
    cell: ({ row }) => row.original.specializedItem ?? '—',
    meta: { minWidth: 120 },
  },
  {
    id: 'warera',
    header: 'Link',
    enableSorting: false,
    cell: ({ row }) => (
      <ExternalLink href={wareraUrl('country', row.original.id)}>
        WarEra.io
      </ExternalLink>
    ),
    meta: { minWidth: 110 },
  },
]
