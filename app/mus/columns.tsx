'use client'

import type { ColumnDef } from '@tanstack/react-table'

import type { MURow } from '@/lib/rows'

import { MUCell } from '@/components/cells/mu-cell'
import {
  combatModeColumn,
  compactNumberColumn,
  countryColumn,
  gearColumn,
  localeNumberColumn,
  percentBarColumn,
  pointsBreakdownColumn,
  rankTooltipColumn,
  readinessColumn,
  tierColumn,
  wareraLinkColumn,
} from '@/components/data-table/column-factories'

export type { MURow }

export const muColumns: ColumnDef<MURow>[] = [
  {
    accessorKey: 'name',
    header: 'MU',
    cell: ({ row }) => (
      <MUCell
        muName={row.original.name}
        muId={row.original.id}
        avatarUrl={row.original.avatarUrl}
        bold
      />
    ),
    meta: { width: 220 },
  },
  pointsBreakdownColumn<MURow>('totalPoints', 'Total Points'),
  localeNumberColumn<MURow>('avgPoints', 'Avg Points', { heat: 'median', width: 110 }),
  {
    accessorKey: 'avgLevel',
    header: 'Avg Level',
    cell: ({ row }) => row.original.avgLevel ?? null,
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 100 },
  },
  gearColumn<MURow>('avgGearScore', 'Avg Gear', { width: 110 }),
  percentBarColumn<MURow>('avgHealth', 'Avg Health'),
  percentBarColumn<MURow>('avgHunger', 'Avg Hunger'),
  readinessColumn<MURow>(),
  combatModeColumn<MURow>(),
  countryColumn<MURow>(),
  {
    accessorKey: 'regionName',
    header: 'Region',
    cell: ({ row }) => row.original.regionName ?? null,
    meta: { width: 140 },
  },
  localeNumberColumn<MURow>('memberCount', 'Members', { heat: 'median', width: 100 }),
  tierColumn<MURow>('damageTier'),
  rankTooltipColumn<MURow>('damage', 'damageRank', 'Total Damage', { width: 130 }),
  compactNumberColumn<MURow>('weeklyDamage', 'Weekly Damage', { heat: 'median', width: 140 }),
  compactNumberColumn<MURow>('bounty', 'Bounty', { heat: 'median', width: 90 }),
  compactNumberColumn<MURow>('memberWealth', 'Member Wealth', { heat: 'median', width: 140 }),
  rankTooltipColumn<MURow>('wealth', 'wealthRank', 'MU Wealth', { width: 110 }),
  compactNumberColumn<MURow>('companiesWealth', 'Companies', { heat: 'median', width: 110 }),
  compactNumberColumn<MURow>('itemsWealth', 'Items', { heat: 'median', width: 100 }),
  compactNumberColumn<MURow>('cashWealth', 'Cash', { heat: 'median', width: 100 }),
  compactNumberColumn<MURow>('equipmentWealth', 'Equipment', { heat: 'median', width: 120 }),
  compactNumberColumn<MURow>('weaponsWealth', 'Weapons', { heat: 'median', width: 110 }),
  localeNumberColumn<MURow>('terrain', 'Terrain', { heat: 'median', width: 100 }),
  localeNumberColumn<MURow>('reputation', 'Reputation', { heat: 'median', center: 0, width: 110 }),
  compactNumberColumn<MURow>('investedMoney', 'Invested', { heat: 'ramp', width: 100 }),
  {
    accessorKey: 'dormitoriesLevel',
    header: 'Dorms',
    cell: ({ row }) => row.original.dormitoriesLevel ?? null,
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 80 },
  },
  {
    accessorKey: 'headquartersLevel',
    header: 'HQ',
    cell: ({ row }) => row.original.headquartersLevel ?? null,
    sortDescFirst: true,
    meta: { heat: 'median', heatCenter: 2.5, align: 'right', width: 70 },
  },
  localeNumberColumn<MURow>('gemsPurchasedTotal', 'Gems Bought', { heat: 'ramp', width: 120 }),
  localeNumberColumn<MURow>('premiumMonthsTotal', 'Premium Mo.', { heat: 'ramp', width: 120 }),
  localeNumberColumn<MURow>('premiumGiftsTotal', 'Premium Gifts', { heat: 'ramp', width: 130 }),
  wareraLinkColumn<MURow>('mu'),
]
