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
    meta: { width: 170 },
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
    meta: { align: 'right', width: 120 },
  },
  {
    accessorKey: 'avgPoints',
    header: 'Avg Points',
    cell: ({ row }) => row.original.avgPoints?.toLocaleString() ?? '—',
    sortDescFirst: true,
    meta: { align: 'right', width: 110 },
  },
  {
    accessorKey: 'avgLevel',
    header: 'Avg Level',
    cell: ({ row }) => row.original.avgLevel ?? '—',
    sortDescFirst: true,
    meta: { align: 'right', width: 100 },
  },
  {
    accessorKey: 'damageRank',
    header: 'Damage Rank',
    cell: ({ row }) => row.original.damageRank ?? '—',
    sortUndefined: 'last',
    meta: { align: 'right', width: 130 },
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
    meta: { align: 'right', width: 130 },
  },
  {
    accessorKey: 'weeklyDamage',
    header: 'Weekly Damage',
    cell: ({ row }) => <CompactNumber value={row.original.weeklyDamage} />,
    sortDescFirst: true,
    meta: { align: 'right', width: 140 },
  },
  {
    accessorKey: 'weeklyDamagePerCitizen',
    header: 'Weekly / Citizen',
    cell: ({ row }) => <CompactNumber value={row.original.weeklyDamagePerCitizen} />,
    sortDescFirst: true,
    meta: { align: 'right', width: 150 },
  },
  {
    accessorKey: 'wealthRank',
    header: 'Wealth Rank',
    cell: ({ row }) => row.original.wealthRank ?? '—',
    meta: { align: 'right', width: 120 },
  },
  {
    accessorKey: 'wealth',
    header: 'Wealth',
    cell: ({ row }) => <CompactNumber value={row.original.wealth} />,
    sortDescFirst: true,
    meta: { align: 'right', width: 100 },
  },
  {
    accessorKey: 'development',
    header: 'Development',
    cell: ({ row }) =>
      row.original.development !== null ? row.original.development.toFixed(1) : '—',
    sortDescFirst: true,
    meta: { align: 'right', width: 130 },
  },
  {
    accessorKey: 'activePopulation',
    header: 'Active pop.',
    cell: ({ row }) => row.original.activePopulation ?? '—',
    sortDescFirst: true,
    meta: { align: 'right', width: 110 },
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
    meta: { align: 'right', width: 80 },
  },
  {
    accessorKey: 'partyCount',
    header: 'Parties',
    cell: ({ row }) => (
      <InternalLink href={`/parties?q=${encodeURIComponent(`country:${row.original.code}`)}`}>
        {row.original.partyCount.toLocaleString()}
      </InternalLink>
    ),
    sortDescFirst: true,
    meta: { align: 'right', width: 90 },
  },
  {
    accessorKey: 'bounty',
    header: 'Bounty',
    cell: ({ row }) => <CompactNumber value={row.original.bounty} />,
    sortDescFirst: true,
    meta: { align: 'right', width: 90 },
  },
  {
    accessorKey: 'money',
    header: 'Treasury',
    cell: ({ row }) => <CompactNumber value={row.original.money} />,
    sortDescFirst: true,
    meta: { align: 'right', width: 100 },
  },
  {
    accessorKey: 'productionBonus',
    header: 'Prod. Bonus',
    cell: ({ row }) =>
      row.original.productionBonus !== null
        ? `${row.original.productionBonus}%`
        : '—',
    sortDescFirst: true,
    meta: { align: 'right', width: 120 },
  },
  {
    accessorKey: 'unrestPercent',
    header: 'Unrest',
    cell: ({ row }) =>
      row.original.unrestPercent !== null
        ? `${row.original.unrestPercent.toFixed(1)}%`
        : '—',
    sortDescFirst: true,
    meta: { align: 'right', width: 90 },
  },
  {
    accessorKey: 'taxIncome',
    header: 'Income Tax',
    cell: ({ row }) =>
      row.original.taxIncome !== null ? `${row.original.taxIncome}%` : '—',
    sortDescFirst: true,
    meta: { align: 'right', width: 110 },
  },
  {
    accessorKey: 'taxMarket',
    header: 'Market Tax',
    cell: ({ row }) =>
      row.original.taxMarket !== null ? `${row.original.taxMarket}%` : '—',
    sortDescFirst: true,
    meta: { align: 'right', width: 110 },
  },
  {
    accessorKey: 'taxSelfWork',
    header: 'Self-Work Tax',
    cell: ({ row }) =>
      row.original.taxSelfWork !== null ? `${row.original.taxSelfWork}%` : '—',
    sortDescFirst: true,
    meta: { align: 'right', width: 130 },
  },
  {
    accessorKey: 'alliesCount',
    header: 'Allies',
    cell: ({ row }) => row.original.alliesCount.toLocaleString(),
    sortDescFirst: true,
    meta: { align: 'right', width: 80 },
  },
  {
    accessorKey: 'warsCount',
    header: 'Wars',
    cell: ({ row }) => row.original.warsCount.toLocaleString(),
    sortDescFirst: true,
    meta: { align: 'right', width: 80 },
  },
  {
    accessorKey: 'specializedItem',
    header: 'Specialty',
    cell: ({ row }) => row.original.specializedItem ?? '—',
    meta: { width: 120 },
  },
  {
    accessorKey: 'gemsPurchasedTotal',
    header: 'Gems Bought',
    cell: ({ row }) => row.original.gemsPurchasedTotal.toLocaleString(),
    sortDescFirst: true,
    meta: { align: 'right', width: 120 },
  },
  {
    accessorKey: 'premiumMonthsTotal',
    header: 'Premium Mo.',
    cell: ({ row }) => row.original.premiumMonthsTotal.toLocaleString(),
    sortDescFirst: true,
    meta: { align: 'right', width: 120 },
  },
  {
    accessorKey: 'premiumGiftsTotal',
    header: 'Premium Gifts',
    cell: ({ row }) => row.original.premiumGiftsTotal.toLocaleString(),
    sortDescFirst: true,
    meta: { align: 'right', width: 130 },
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
    meta: { width: 110 },
  },
]
