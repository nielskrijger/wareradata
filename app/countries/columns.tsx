'use client'

import type { ColumnDef } from '@tanstack/react-table'

import type { CountryRow } from '@/lib/rows'

import { CountryCell } from '@/components/cells/country-cell'
import {
  compactNumberColumn,
  gearColumn,
  localeNumberColumn,
  percentBarColumn,
  percentColumn,
  pointsBreakdownColumn,
  rankTooltipColumn,
  readinessColumn,
  tierColumn,
  wareraLinkColumn,
} from '@/components/data-table/column-factories'
import { InternalLink } from '@/components/links'

export type { CountryRow }

export const countryColumns: ColumnDef<CountryRow>[] = [
  {
    accessorKey: 'name',
    header: 'Country',
    cell: ({ row }) => (
      <CountryCell
        countryCode={row.original.code}
        countryName={row.original.name}
        countryId={row.original.id}
        activeBattles={row.original.activeBattles}
        activeBattlesList={row.original.activeBattlesList}
      />
    ),
    meta: { width: 210 },
  },
  pointsBreakdownColumn<CountryRow>('totalPoints', 'Total Points'),
  localeNumberColumn<CountryRow>('avgPoints', 'Avg Points', { heat: 'median', width: 110 }),
  {
    accessorKey: 'avgLevel',
    header: 'Avg Level',
    cell: ({ row }) => row.original.avgLevel ?? null,
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 100 },
  },
  gearColumn<CountryRow>('avgGearScore', 'Avg Gear', { width: 110 }),
  percentBarColumn<CountryRow>('avgHealth', 'Avg Health'),
  percentBarColumn<CountryRow>('avgHunger', 'Avg Hunger'),
  readinessColumn<CountryRow>(),
  tierColumn<CountryRow>('damageTier'),
  rankTooltipColumn<CountryRow>('damage', 'damageRank', 'Total Damage', { width: 130 }),
  compactNumberColumn<CountryRow>('weeklyDamage', 'Weekly Damage', { heat: 'median', width: 140 }),
  compactNumberColumn<CountryRow>('weeklyDamagePerCitizen', 'Weekly / Citizen', { heat: 'median', width: 150 }),
  rankTooltipColumn<CountryRow>('wealth', 'wealthRank', 'Wealth', { width: 110 }),
  {
    accessorKey: 'development',
    header: 'Development',
    cell: ({ row }) =>
      row.original.development !== null ? row.original.development.toFixed(1) : null,
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 130 },
  },
  {
    accessorKey: 'activePopulation',
    header: 'Active pop.',
    cell: ({ row }) =>
      row.original.activePopulation === null
        ? null
        : (
            <InternalLink href={`/users?q=${encodeURIComponent(`country:${row.original.code}`)}`}>
              {row.original.activePopulation.toLocaleString()}
            </InternalLink>
          ),
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
  compactNumberColumn<CountryRow>('bounty', 'Bounty', { heat: 'ramp', width: 90 }),
  compactNumberColumn<CountryRow>('money', 'Treasury', { heat: 'median', width: 100 }),
  percentColumn<CountryRow>('productionBonus', 'Prod. Bonus', { heat: 'median', width: 120 }),
  percentColumn<CountryRow>('unrestPercent', 'Unrest', { heat: 'invert', decimals: 1, width: 90 }),
  percentColumn<CountryRow>('taxIncome', 'Income Tax', { heat: 'invert', center: 10, width: 110 }),
  percentColumn<CountryRow>('taxMarket', 'Market Tax', { heat: 'invert', sortInvert: true, width: 110 }),
  percentColumn<CountryRow>('taxSelfWork', 'Self-Work Tax', { heat: 'invert', center: 5, width: 130 }),
  localeNumberColumn<CountryRow>('alliesCount', 'Allies', { heat: 'ramp', width: 80 }),
  localeNumberColumn<CountryRow>('warsCount', 'Wars', { heat: 'invertMedian', width: 80 }),
  {
    accessorKey: 'specializedItem',
    header: 'Specialty',
    cell: ({ row }) => row.original.specializedItem ?? null,
    meta: { width: 120 },
  },
  localeNumberColumn<CountryRow>('gemsPurchasedTotal', 'Gems Bought', { heat: 'ramp', width: 120 }),
  localeNumberColumn<CountryRow>('premiumMonthsTotal', 'Premium Mo.', { heat: 'ramp', width: 120 }),
  localeNumberColumn<CountryRow>('premiumGiftsTotal', 'Premium Gifts', { heat: 'ramp', width: 130 }),
  wareraLinkColumn<CountryRow>('country'),
]
