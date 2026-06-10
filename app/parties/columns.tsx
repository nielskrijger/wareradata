'use client'

import type { ColumnDef } from '@tanstack/react-table'

import type { PartyRow } from '@/lib/rows'

import { PartyCell } from '@/components/cells/party-cell'
import { UserNameCell } from '@/components/cells/user-name-cell'
import { WareraLinkIcon } from '@/components/cells/warera-link-icon'
import { buildColumns } from '@/components/data-table/column-categories'
import { compactNumberColumn, countryColumn, localeNumberColumn, pointsBreakdownColumn, scaleBadgeColumn } from '@/components/data-table/column-factories'
import { UserHoverCard } from '@/components/user-hover-card'

export type { PartyRow }

function formatCreated(iso: string | null): string | null {
  if (!iso) {
    return null
  }
  return iso.slice(0, 10)
}

export const partyColumns: ColumnDef<PartyRow>[] = buildColumns<PartyRow>(
  {
    accessorKey: 'name',
    header: 'Party',
    cell: ({ row }) => (
      <div className="flex items-center gap-2 overflow-hidden">
        <PartyCell
          partyName={row.original.name}
          partyId={row.original.id}
          avatarUrl={row.original.avatarUrl}
          bold
        />
        <WareraLinkIcon kind="party" id={row.original.id} />
      </div>
    ),
    meta: { width: 240 },
  },
  {
    points: [
      pointsBreakdownColumn<PartyRow>('totalPoints', 'Total', { tooltip: 'Combined points of all members.' }),
      localeNumberColumn<PartyRow>('avgPoints', 'Average', { heat: 'median', width: 110, tooltip: 'Average points per member.' }),
      localeNumberColumn<PartyRow>('avgPointsPerDay', 'Avg / day', { heat: 'median', width: 125, tooltip: 'Average points earned per day, per member.' }),
    ],
    general: [
      {
        accessorKey: 'avgLevel',
        header: 'Avg Level',
        cell: ({ row }) => row.original.avgLevel ?? null,
        sortDescFirst: true,
        meta: { heat: 'median', align: 'right', width: 105 },
      },
      countryColumn<PartyRow>(),
      localeNumberColumn<PartyRow>('memberCount', 'Members', { heat: 'ramp', width: 100 }),
      {
        accessorKey: 'leaderName',
        header: 'Leader',
        cell: ({ row }) => (
          <UserHoverCard userId={row.original.leaderId}>
            <UserNameCell
              userId={row.original.leaderId}
              name={row.original.leaderName}
              avatarUrl={row.original.leaderAvatarUrl}
              colorScheme={row.original.leaderColorScheme}
            />
          </UserHoverCard>
        ),
        meta: { width: 220 },
      },
      {
        accessorKey: 'createdAt',
        header: 'Founded',
        cell: ({ row }) => formatCreated(row.original.createdAt),
        sortDescFirst: true,
        meta: { width: 110 },
      },
    ],
    ethics: [
      scaleBadgeColumn<PartyRow>('militarism', 'Militarism', { width: 125 }),
      scaleBadgeColumn<PartyRow>('isolationism', 'Isolationism', { width: 140 }),
      scaleBadgeColumn<PartyRow>('imperialism', 'Imperialism', { width: 140 }),
      scaleBadgeColumn<PartyRow>('industrialism', 'Industrialism', { width: 145 }),
    ],
    wealth: [
      compactNumberColumn<PartyRow>('memberWealth', 'Total', { heat: 'median', width: 110, tooltip: 'Combined wealth of all members (companies + items + cash + equipment + weapons).' }),
      compactNumberColumn<PartyRow>('companiesWealth', 'Companies', { heat: 'median', width: 135, tooltip: 'Combined company value across members.' }),
      compactNumberColumn<PartyRow>('itemsWealth', 'Items', { heat: 'median', width: 100, tooltip: 'Combined item value across members.' }),
      compactNumberColumn<PartyRow>('cashWealth', 'Cash', { heat: 'median', width: 100, tooltip: 'Combined cash across members.' }),
      compactNumberColumn<PartyRow>('equipmentWealth', 'Equipment', { heat: 'median', width: 130, tooltip: 'Combined equipment value across members.' }),
      compactNumberColumn<PartyRow>('weaponsWealth', 'Weapons', { heat: 'median', width: 125, tooltip: 'Combined weapon value across members.' }),
    ],
    premium: [
      localeNumberColumn<PartyRow>('gemsPurchasedTotal', 'Gems Bought', { heat: 'ramp', width: 150 }),
      localeNumberColumn<PartyRow>('premiumMonthsTotal', 'Premium Mo.', { heat: 'ramp', width: 145 }),
      localeNumberColumn<PartyRow>('premiumGiftsTotal', 'Premium Gifts', { heat: 'ramp', width: 155 }),
    ],
  },
)
