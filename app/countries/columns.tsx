'use client'

import type { ColumnDef } from '@tanstack/react-table'

import type { CountryRow } from '@/lib/rows'

import { TierBadge } from '@/components/badges/tier-badge'
import { CompactNumber } from '@/components/cells/compact-number'
import { CountryCell } from '@/components/cells/country-cell'
import { PercentBar } from '@/components/cells/percent-bar'
import { PointsBreakdownCell } from '@/components/cells/points-breakdown-cell'
import { ReadinessPillBar } from '@/components/cells/readiness-pill-bar'
import { ValueWithRankTooltip } from '@/components/cells/value-with-rank-tooltip'
import { ExternalLink, InternalLink } from '@/components/links'
import { readinessScore } from '@/lib/rows'
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
        countryId={row.original.id}
        activeBattles={row.original.activeBattles}
        activeBattlesList={row.original.activeBattlesList}
      />
    ),
    meta: { width: 210 },
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
    cell: ({ row }) => row.original.avgPoints?.toLocaleString() ?? null,
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 110 },
  },
  {
    accessorKey: 'avgLevel',
    header: 'Avg Level',
    cell: ({ row }) => row.original.avgLevel ?? null,
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 100 },
  },
  {
    accessorKey: 'avgHealth',
    header: 'Avg Health',
    cell: ({ row }) => <PercentBar value={row.original.avgHealth} />,
    sortDescFirst: true,
    sortUndefined: 'last',
    meta: { width: 130 },
  },
  {
    accessorKey: 'avgHunger',
    header: 'Avg Hunger',
    cell: ({ row }) => <PercentBar value={row.original.avgHunger} />,
    sortDescFirst: true,
    sortUndefined: 'last',
    meta: { width: 130 },
  },
  {
    id: 'readinessScore',
    header: 'Readiness',
    // accessorFn enables the sortable header; the actual ordering is done
    // server-side (manualSorting) via the matching `readinessScore` sort case.
    accessorFn: row => readinessScore(row.readinessPill),
    cell: ({ row }) => <ReadinessPillBar mix={row.original.readinessPill} />,
    sortDescFirst: true,
    sortUndefined: 'last',
    meta: { width: 120 },
  },
  {
    accessorKey: 'damageTier',
    header: 'Tier',
    cell: ({ row }) => <TierBadge tier={row.original.damageTier} />,
    meta: { width: 90 },
  },
  {
    accessorKey: 'damageRank',
    header: 'Total Damage',
    cell: ({ row }) => (
      <ValueWithRankTooltip rank={row.original.damageRank}>
        <CompactNumber value={row.original.damage} />
      </ValueWithRankTooltip>
    ),
    sortDescFirst: false,
    sortUndefined: 'last',
    meta: { heat: 'invert', sortInvert: true, align: 'right', width: 130 },
  },
  {
    accessorKey: 'weeklyDamage',
    header: 'Weekly Damage',
    cell: ({ row }) => <CompactNumber value={row.original.weeklyDamage} />,
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 140 },
  },
  {
    accessorKey: 'weeklyDamagePerCitizen',
    header: 'Weekly / Citizen',
    cell: ({ row }) => <CompactNumber value={row.original.weeklyDamagePerCitizen} />,
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 150 },
  },
  {
    accessorKey: 'wealthRank',
    header: 'Wealth',
    cell: ({ row }) => (
      <ValueWithRankTooltip rank={row.original.wealthRank}>
        <CompactNumber value={row.original.wealth} />
      </ValueWithRankTooltip>
    ),
    sortDescFirst: false,
    sortUndefined: 'last',
    meta: { heat: 'invert', sortInvert: true, align: 'right', width: 110 },
  },
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
  {
    accessorKey: 'bounty',
    header: 'Bounty',
    cell: ({ row }) => <CompactNumber value={row.original.bounty} />,
    sortDescFirst: true,
    meta: { heat: 'ramp', align: 'right', width: 90 },
  },
  {
    accessorKey: 'money',
    header: 'Treasury',
    cell: ({ row }) => <CompactNumber value={row.original.money} />,
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 100 },
  },
  {
    accessorKey: 'productionBonus',
    header: 'Prod. Bonus',
    cell: ({ row }) =>
      row.original.productionBonus !== null
        ? `${row.original.productionBonus}%`
        : null,
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 120 },
  },
  {
    accessorKey: 'unrestPercent',
    header: 'Unrest',
    cell: ({ row }) =>
      row.original.unrestPercent !== null
        ? `${row.original.unrestPercent.toFixed(1)}%`
        : null,
    sortDescFirst: true,
    meta: { heat: 'invert', align: 'right', width: 90 },
  },
  {
    accessorKey: 'taxIncome',
    header: 'Income Tax',
    cell: ({ row }) =>
      row.original.taxIncome !== null ? `${row.original.taxIncome}%` : null,
    sortDescFirst: true,
    meta: { heat: 'invert', heatCenter: 10, align: 'right', width: 110 },
  },
  {
    accessorKey: 'taxMarket',
    header: 'Market Tax',
    cell: ({ row }) =>
      row.original.taxMarket !== null ? `${row.original.taxMarket}%` : null,
    sortDescFirst: true,
    meta: { heat: 'invert', sortInvert: true, align: 'right', width: 110 },
  },
  {
    accessorKey: 'taxSelfWork',
    header: 'Self-Work Tax',
    cell: ({ row }) =>
      row.original.taxSelfWork !== null ? `${row.original.taxSelfWork}%` : null,
    sortDescFirst: true,
    meta: { heat: 'invert', heatCenter: 5, align: 'right', width: 130 },
  },
  {
    accessorKey: 'alliesCount',
    header: 'Allies',
    cell: ({ row }) => row.original.alliesCount.toLocaleString(),
    sortDescFirst: true,
    meta: { heat: 'ramp', align: 'right', width: 80 },
  },
  {
    accessorKey: 'warsCount',
    header: 'Wars',
    cell: ({ row }) => row.original.warsCount.toLocaleString(),
    sortDescFirst: true,
    meta: { heat: 'invertMedian', align: 'right', width: 80 },
  },
  {
    accessorKey: 'specializedItem',
    header: 'Specialty',
    cell: ({ row }) => row.original.specializedItem ?? null,
    meta: { width: 120 },
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
      <ExternalLink href={wareraUrl('country', row.original.id)}>
        WarEra.io
      </ExternalLink>
    ),
    meta: { width: 110 },
  },
]
