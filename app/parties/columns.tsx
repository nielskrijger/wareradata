'use client'

import type { ColumnDef } from '@tanstack/react-table'

import type { PartyRow } from '@/lib/rows'

import { CountryCell } from '@/components/country-cell'
import { ExternalLink } from '@/components/external-link'
import { PointsBreakdownCell } from '@/components/points-breakdown-cell'
import { ScaleBadge } from '@/components/scale-badge'
import { TruncatedCell } from '@/components/truncated-cell'
import { UserNameCell } from '@/components/user-name-cell'
import { wareraUrl } from '@/lib/warera/urls'

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
      <TruncatedCell text={row.original.name} className="font-medium" />
    ),
    meta: { width: 240 },
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
    accessorKey: 'countryName',
    header: 'Country',
    cell: ({ row }) => (
      <CountryCell
        countryCode={row.original.countryCode}
        countryName={row.original.countryName}
      />
    ),
    meta: { width: 180 },
  },
  {
    accessorKey: 'memberCount',
    header: 'Members',
    cell: ({ row }) => row.original.memberCount.toLocaleString(),
    sortDescFirst: true,
    meta: { heat: 'ramp', align: 'right', width: 100 },
  },
  {
    accessorKey: 'leaderName',
    header: 'Leader',
    cell: ({ row }) => (
      <UserNameCell
        userId={row.original.leaderId}
        name={row.original.leaderName}
        avatarUrl={row.original.leaderAvatarUrl}
        colorScheme={row.original.leaderColorScheme}
      />
    ),
    meta: { width: 220 },
  },
  {
    accessorKey: 'militarism',
    header: 'Militarism',
    cell: ({ row }) => <ScaleBadge value={row.original.militarism} />,
    sortDescFirst: true,
    meta: { align: 'right', width: 110 },
  },
  {
    accessorKey: 'isolationism',
    header: 'Isolationism',
    cell: ({ row }) => <ScaleBadge value={row.original.isolationism} />,
    sortDescFirst: true,
    meta: { align: 'right', width: 120 },
  },
  {
    accessorKey: 'imperialism',
    header: 'Imperialism',
    cell: ({ row }) => <ScaleBadge value={row.original.imperialism} />,
    sortDescFirst: true,
    meta: { align: 'right', width: 120 },
  },
  {
    accessorKey: 'industrialism',
    header: 'Industrialism',
    cell: ({ row }) => <ScaleBadge value={row.original.industrialism} />,
    sortDescFirst: true,
    meta: { align: 'right', width: 130 },
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
    accessorKey: 'createdAt',
    header: 'Founded',
    cell: ({ row }) => formatCreated(row.original.createdAt),
    sortDescFirst: true,
    meta: { width: 110 },
  },
  {
    id: 'warera',
    header: 'Link',
    enableSorting: false,
    cell: ({ row }) => (
      <ExternalLink href={wareraUrl('party', row.original.id)}>
        WarEra.io
      </ExternalLink>
    ),
    meta: { width: 110 },
  },
]
