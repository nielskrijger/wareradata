'use client'

import type { ColumnDef } from '@tanstack/react-table'

import type { CountryRow } from '@/lib/rows'

import { CountryCell } from '@/components/cells/country-cell'
import { WareraLinkIcon } from '@/components/cells/warera-link-icon'
import { buildColumns } from '@/components/data-table/column-categories'
import {
  combatModeColumn,
  compactNumberColumn,
  gearColumn,
  localeNumberColumn,
  percentBarColumn,
  percentColumn,
  pointsBreakdownColumn,
  rankTooltipColumn,
  readinessColumn,
  tierColumn,
} from '@/components/data-table/column-factories'
import { InternalLink } from '@/components/links'

export type { CountryRow }

export const countryColumns: ColumnDef<CountryRow>[] = buildColumns<CountryRow>(
  {
    accessorKey: 'name',
    header: 'Country',
    cell: ({ row }) => (
      <div className="flex items-center gap-2 overflow-hidden">
        <CountryCell
          countryCode={row.original.code}
          countryName={row.original.name}
          countryId={row.original.id}
          activeBattles={row.original.activeBattles}
          activeBattlesList={row.original.activeBattlesList}
        />
        <WareraLinkIcon kind="country" id={row.original.id} />
      </div>
    ),
    meta: { width: 210 },
  },
  {
    points: [
      pointsBreakdownColumn<CountryRow>('totalPoints', 'Total', { tooltip: 'Combined points of all citizens.' }),
      localeNumberColumn<CountryRow>('avgPoints', 'Average', { heat: 'median', width: 110, tooltip: 'Average points per citizen.' }),
      localeNumberColumn<CountryRow>('avgPointsPerDay', 'Avg / day', { heat: 'median', width: 125, tooltip: 'Average points earned per day, per citizen.' }),
    ],
    general: [
      {
        accessorKey: 'avgLevel',
        header: 'Avg Level',
        cell: ({ row }) => row.original.avgLevel ?? null,
        sortDescFirst: true,
        meta: { heat: 'median', align: 'right', width: 105 },
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
        meta: { align: 'right', width: 115 },
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
    ],
    combat: [
      gearColumn<CountryRow>('avgGearScore', 'Avg Gear', { width: 120 }),
      percentBarColumn<CountryRow>('avgHealth', 'Avg Health'),
      percentBarColumn<CountryRow>('avgHunger', 'Avg Hunger', { width: 140 }),
      readinessColumn<CountryRow>(),
      combatModeColumn<CountryRow>(),
      tierColumn<CountryRow>('damageTier'),
      rankTooltipColumn<CountryRow>('damage', 'damageRank', 'Total', { width: 90 }),
      compactNumberColumn<CountryRow>('weeklyDamage', 'Weekly', { heat: 'median', width: 110 }),
      compactNumberColumn<CountryRow>('weeklyDamagePerCitizen', 'Weekly / Citizen', { heat: 'median', width: 170 }),
    ],
    government: [
      {
        accessorKey: 'development',
        header: 'Development',
        cell: ({ row }) =>
          row.original.development !== null ? row.original.development.toFixed(1) : null,
        sortDescFirst: true,
        meta: { heat: 'median', align: 'right', width: 150 },
      },
      percentColumn<CountryRow>('productionBonus', 'Prod. Bonus', { heat: 'median', width: 140 }),
      percentColumn<CountryRow>('unrestPercent', 'Unrest', { heat: 'invert', decimals: 1, width: 105 }),
      percentColumn<CountryRow>('taxIncome', 'Income Tax', { heat: 'invert', center: 10, width: 135 }),
      percentColumn<CountryRow>('taxMarket', 'Market Tax', { heat: 'invert', sortInvert: true, width: 135 }),
      percentColumn<CountryRow>('taxSelfWork', 'Self-Work Tax', { heat: 'invert', center: 5, width: 155 }),
      localeNumberColumn<CountryRow>('alliesCount', 'Allies', { heat: 'ramp', width: 100 }),
      localeNumberColumn<CountryRow>('warsCount', 'Wars', { heat: 'invertMedian', width: 95 }),
      {
        accessorKey: 'specializedItem',
        header: 'Specialty',
        cell: ({ row }) => row.original.specializedItem ?? null,
        meta: { width: 120 },
      },
    ],
    wealth: [
      rankTooltipColumn<CountryRow>('wealth', 'wealthRank', 'Country Wealth', { width: 165, tooltip: 'Wealth held by the country itself (its own national assets), not the combined citizen Total.' }),
      compactNumberColumn<CountryRow>('citizenWealth', 'Total', { heat: 'median', width: 110, tooltip: 'Combined wealth of all citizens (companies + items + cash + equipment + weapons).' }),
      compactNumberColumn<CountryRow>('companiesWealth', 'Companies', { heat: 'median', width: 135, tooltip: 'Combined company value across citizens.' }),
      compactNumberColumn<CountryRow>('itemsWealth', 'Items', { heat: 'median', width: 100, tooltip: 'Combined item value across citizens.' }),
      compactNumberColumn<CountryRow>('cashWealth', 'Cash', { heat: 'median', width: 100, tooltip: 'Combined cash across citizens.' }),
      compactNumberColumn<CountryRow>('equipmentWealth', 'Equipment', { heat: 'median', width: 130, tooltip: 'Combined equipment value across citizens.' }),
      compactNumberColumn<CountryRow>('weaponsWealth', 'Weapons', { heat: 'median', width: 125, tooltip: 'Combined weapon value across citizens.' }),
      compactNumberColumn<CountryRow>('bounty', 'Bounty', { heat: 'ramp', width: 110, tooltip: 'Coins this country has put up as a battle bounty, paid to fighters per 1k damage dealt.' }),
      compactNumberColumn<CountryRow>('money', 'Treasury', { heat: 'median', width: 120, tooltip: 'Money held in the country treasury.' }),
    ],
    premium: [
      localeNumberColumn<CountryRow>('gemsPurchasedTotal', 'Gems Bought', { heat: 'ramp', width: 150 }),
      localeNumberColumn<CountryRow>('premiumMonthsTotal', 'Premium Mo.', { heat: 'ramp', width: 145 }),
      localeNumberColumn<CountryRow>('premiumGiftsTotal', 'Premium Gifts', { heat: 'ramp', width: 155 }),
    ],
  },
)
