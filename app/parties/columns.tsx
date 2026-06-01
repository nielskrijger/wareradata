'use client'

import type { ColumnDef } from '@tanstack/react-table'

import type { PartyRow } from '@/lib/rows'

import { PartyCell } from '@/components/cells/party-cell'
import { UserNameCell } from '@/components/cells/user-name-cell'
import { compactNumberColumn, countryColumn, localeNumberColumn, pointsBreakdownColumn, scaleBadgeColumn, wareraLinkColumn } from '@/components/data-table/column-factories'
import { UserHoverCard } from '@/components/user-hover-card'

export type { PartyRow }

function formatCreated(iso: string | null): string | null {
  if (!iso) {
    return null
  }
  return iso.slice(0, 10)
}

export const partyColumns: ColumnDef<PartyRow>[] = [
  {
    accessorKey: 'name',
    header: 'Party',
    cell: ({ row }) => (
      <PartyCell
        partyName={row.original.name}
        partyId={row.original.id}
        avatarUrl={row.original.avatarUrl}
        bold
      />
    ),
    meta: { width: 240 },
  },
  pointsBreakdownColumn<PartyRow>('totalPoints', 'Total Points'),
  localeNumberColumn<PartyRow>('avgPoints', 'Avg Points', { heat: 'median', width: 110 }),
  {
    accessorKey: 'avgLevel',
    header: 'Avg Level',
    cell: ({ row }) => row.original.avgLevel ?? null,
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 100 },
  },
  countryColumn<PartyRow>(),
  localeNumberColumn<PartyRow>('memberCount', 'Members', { heat: 'ramp', width: 100 }),
  compactNumberColumn<PartyRow>('memberWealth', 'Member Wealth', { heat: 'median', width: 140 }),
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
  scaleBadgeColumn<PartyRow>('militarism', 'Militarism', { width: 110 }),
  scaleBadgeColumn<PartyRow>('isolationism', 'Isolationism', { width: 120 }),
  scaleBadgeColumn<PartyRow>('imperialism', 'Imperialism', { width: 120 }),
  scaleBadgeColumn<PartyRow>('industrialism', 'Industrialism', { width: 130 }),
  localeNumberColumn<PartyRow>('gemsPurchasedTotal', 'Gems Bought', { heat: 'ramp', width: 120 }),
  localeNumberColumn<PartyRow>('premiumMonthsTotal', 'Premium Mo.', { heat: 'ramp', width: 120 }),
  localeNumberColumn<PartyRow>('premiumGiftsTotal', 'Premium Gifts', { heat: 'ramp', width: 130 }),
  {
    accessorKey: 'createdAt',
    header: 'Founded',
    cell: ({ row }) => formatCreated(row.original.createdAt),
    sortDescFirst: true,
    meta: { width: 110 },
  },
  wareraLinkColumn<PartyRow>('party'),
]
