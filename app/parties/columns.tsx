'use client'

import type { ColumnDef } from '@tanstack/react-table'

import type { PartyRow } from '@/lib/rows'

import { PartyCell } from '@/components/cells/party-cell'
import { UserNameCell } from '@/components/cells/user-name-cell'
import { WareraLinkIcon } from '@/components/cells/warera-link-icon'
import { buildColumns } from '@/components/data-table/column-categories'
import { countryColumn, dateColumn, localeNumberColumn, pointsColumns, scaleBadgeColumn, wealthBreakdownColumns } from '@/components/data-table/column-factories'
import { UserHoverCard } from '@/components/user-hover-card'

export type { PartyRow }

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
    points: pointsColumns<PartyRow>('members'),
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
      dateColumn<PartyRow>('createdAt', 'Founded'),
    ],
    ethics: [
      scaleBadgeColumn<PartyRow>('militarism', 'Militarism', { width: 125 }),
      scaleBadgeColumn<PartyRow>('isolationism', 'Isolationism', { width: 140 }),
      scaleBadgeColumn<PartyRow>('imperialism', 'Imperialism', { width: 140 }),
      scaleBadgeColumn<PartyRow>('industrialism', 'Industrialism', { width: 145 }),
    ],
    wealth: wealthBreakdownColumns<PartyRow>('memberWealth', 'members'),
    premium: [
      localeNumberColumn<PartyRow>('gemsPurchasedTotal', 'Gems Bought', { heat: 'ramp', width: 150 }),
      localeNumberColumn<PartyRow>('premiumMonthsTotal', 'Premium Mo.', { heat: 'ramp', width: 145 }),
      localeNumberColumn<PartyRow>('premiumGiftsTotal', 'Premium Gifts', { heat: 'ramp', width: 155 }),
    ],
  },
)
