'use client'

import type { ColumnDef } from '@tanstack/react-table'

import type { MURow } from '@/lib/rows'

import { MUCell } from '@/components/cells/mu-cell'
import { WareraLinkIcon } from '@/components/cells/warera-link-icon'
import { buildColumns } from '@/components/data-table/column-categories'
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
} from '@/components/data-table/column-factories'

export type { MURow }

export const muColumns: ColumnDef<MURow>[] = buildColumns<MURow>(
  {
    accessorKey: 'name',
    header: 'MU',
    cell: ({ row }) => (
      <div className="flex items-center gap-2 overflow-hidden">
        <MUCell
          muName={row.original.name}
          muId={row.original.id}
          avatarUrl={row.original.avatarUrl}
          bold
        />
        <WareraLinkIcon kind="mu" id={row.original.id} />
      </div>
    ),
    meta: { width: 220 },
  },
  {
    points: [
      pointsBreakdownColumn<MURow>('totalPoints', 'Total', { tooltip: 'Combined points of all members.' }),
      localeNumberColumn<MURow>('avgPoints', 'Average', { heat: 'median', width: 110, tooltip: 'Average points per member.' }),
      localeNumberColumn<MURow>('avgPointsPerDay', 'Avg / day', { heat: 'median', width: 125, tooltip: 'Average points earned per day, per member.' }),
    ],
    general: [
      {
        accessorKey: 'avgLevel',
        header: 'Avg Level',
        cell: ({ row }) => row.original.avgLevel ?? null,
        sortDescFirst: true,
        meta: { heat: 'median', align: 'right', width: 105 },
      },
      countryColumn<MURow>(),
      {
        accessorKey: 'regionName',
        header: 'Region',
        cell: ({ row }) => row.original.regionName ?? null,
        meta: { width: 140 },
      },
      localeNumberColumn<MURow>('memberCount', 'Members', { heat: 'median', width: 100 }),
    ],
    combat: [
      gearColumn<MURow>('avgGearScore', 'Avg Gear', { width: 120 }),
      percentBarColumn<MURow>('avgHealth', 'Avg Health'),
      percentBarColumn<MURow>('avgHunger', 'Avg Hunger', { width: 140 }),
      readinessColumn<MURow>(),
      combatModeColumn<MURow>(),
      tierColumn<MURow>('damageTier'),
      rankTooltipColumn<MURow>('damage', 'damageRank', 'Total', { width: 90 }),
      compactNumberColumn<MURow>('weeklyDamage', 'Weekly', { heat: 'median', width: 110 }),
      localeNumberColumn<MURow>('terrain', 'Terrain', { heat: 'median', width: 105 }),
    ],
    muSpecific: [
      localeNumberColumn<MURow>('reputation', 'Reputation', { heat: 'median', center: 0, width: 135 }),
      {
        accessorKey: 'dormitoriesLevel',
        header: 'Dorms',
        cell: ({ row }) => row.original.dormitoriesLevel ?? null,
        sortDescFirst: true,
        meta: { heat: 'median', align: 'right', width: 105 },
      },
      {
        accessorKey: 'headquartersLevel',
        header: 'HQ',
        cell: ({ row }) => row.original.headquartersLevel ?? null,
        sortDescFirst: true,
        meta: { heat: 'median', heatCenter: 2.5, align: 'right', width: 80 },
      },
    ],
    wealth: [
      compactNumberColumn<MURow>('memberWealth', 'Total', { heat: 'median', width: 110, tooltip: 'Combined wealth of all members (companies + items + cash + equipment + weapons).' }),
      compactNumberColumn<MURow>('companiesWealth', 'Companies', { heat: 'median', width: 135, tooltip: 'Combined company value across members.' }),
      compactNumberColumn<MURow>('itemsWealth', 'Items', { heat: 'median', width: 100, tooltip: 'Combined item value across members.' }),
      compactNumberColumn<MURow>('cashWealth', 'Cash', { heat: 'median', width: 100, tooltip: 'Combined cash across members.' }),
      compactNumberColumn<MURow>('equipmentWealth', 'Equipment', { heat: 'median', width: 130, tooltip: 'Combined equipment value across members.' }),
      compactNumberColumn<MURow>('weaponsWealth', 'Weapons', { heat: 'median', width: 125, tooltip: 'Combined weapon value across members.' }),
      compactNumberColumn<MURow>('investedMoney', 'Invested', { heat: 'ramp', width: 120, tooltip: 'Total money members have invested in the MU.' }),
      compactNumberColumn<MURow>('bounty', 'Bounty', { heat: 'median', width: 110, tooltip: 'Coins this MU has put up as a battle bounty, paid to fighters per 1k damage dealt.' }),
      rankTooltipColumn<MURow>('wealth', 'wealthRank', 'MU Wealth', { width: 135, tooltip: 'Wealth held by the MU itself (its own account and inventory), not the combined member Total.' }),
    ],
    premium: [
      localeNumberColumn<MURow>('gemsPurchasedTotal', 'Gems Bought', { heat: 'ramp', width: 150 }),
      localeNumberColumn<MURow>('premiumMonthsTotal', 'Premium Mo.', { heat: 'ramp', width: 145 }),
      localeNumberColumn<MURow>('premiumGiftsTotal', 'Premium Gifts', { heat: 'ramp', width: 155 }),
    ],
  },
)
