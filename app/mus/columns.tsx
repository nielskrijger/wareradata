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
  rankTooltipColumn,
  readinessColumn,
  tierColumn,
} from '@/components/data-table/column-factories'
import { casesColumns, pointsColumns, premiumColumns, wealthColumns } from '@/components/data-table/column-groups'

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
    points: pointsColumns<MURow>('members'),
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
      gearColumn<MURow>('avgGearScore', 'Avg Gear', { width: 120, tooltip: 'Average gear score across members. Higher means better-equipped fighters.' }),
      percentBarColumn<MURow>('avgHealth', 'Avg Health', { tooltip: 'Average health across members.' }),
      percentBarColumn<MURow>('avgHunger', 'Avg Hunger', { width: 140, tooltip: 'Average hunger across members.' }),
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
      ...wealthColumns<MURow>('memberWealth', 'members'),
      compactNumberColumn<MURow>('investedMoney', 'Invested', { heat: 'ramp', width: 120, tooltip: 'Total money members have invested in the MU.' }),
      compactNumberColumn<MURow>('bounty', 'Bounty', { heat: 'median', width: 110, tooltip: 'Coins this MU has put up as a battle bounty, paid to fighters per 1k damage dealt.' }),
      rankTooltipColumn<MURow>('wealth', 'wealthRank', 'MU Wealth', { width: 135, tooltip: 'Wealth held by the MU itself (its own account and inventory), not the combined member Total.' }),
    ],
    premium: premiumColumns<MURow>(),
    cases: casesColumns<MURow>(),
  },
)
