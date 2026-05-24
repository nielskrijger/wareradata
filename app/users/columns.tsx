'use client'

import type { ColumnDef } from '@tanstack/react-table'

import type { UserRow } from '@/lib/rows'

import { CompactNumber } from '@/components/compact-number'
import { ExternalLink } from '@/components/external-link'
import { Flag } from '@/components/flag'
import { TierBadge } from '@/components/tier-badge'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/format'
import { wareraUrl } from '@/lib/warera/urls'

export type { UserRow }

export const userColumns: ColumnDef<UserRow>[] = [
  {
    accessorKey: 'username',
    header: 'User',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <ExternalLink href={wareraUrl('user', row.original.id)}>
          <span className="font-medium">{row.original.username}</span>
        </ExternalLink>
        {row.original.isBanned && <Badge className="bg-red-500/15 text-red-900">banned</Badge>}
      </div>
    ),
    meta: { minWidth: 200 },
  },
  {
    accessorKey: 'points',
    header: 'Points',
    cell: ({ row }) => row.original.points.toLocaleString(),
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 90 },
  },
  {
    accessorKey: 'countryCode',
    header: 'Country',
    cell: ({ row }) => {
      const { countryId, countryCode, countryName } = row.original
      if (!countryCode) {
        return '—'
      }
      return (
        <div className="flex items-center gap-2">
          <Flag code={countryCode} />
          <ExternalLink href={wareraUrl('country', countryId)}>{countryName ?? ''}</ExternalLink>
        </div>
      )
    },
    meta: { minWidth: 180 },
  },
  {
    accessorKey: 'levelRank',
    header: 'Level Rank',
    cell: ({ row }) => row.original.levelRank ?? '—',
    sortUndefined: 'last',
    meta: { align: 'right', minWidth: 100 },
  },
  {
    accessorKey: 'level',
    header: 'Level',
    cell: ({ row }) => row.original.level ?? '—',
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 70 },
  },
  {
    accessorKey: 'levelTier',
    header: 'Tier',
    cell: ({ row }) => <TierBadge tier={row.original.levelTier} />,
    meta: { minWidth: 90 },
  },
  {
    accessorKey: 'damageRank',
    header: 'Damage Rank',
    cell: ({ row }) => row.original.damageRank ?? '—',
    meta: { align: 'right', minWidth: 110 },
  },
  {
    accessorKey: 'damageValue',
    header: 'Total Damage',
    cell: ({ row }) => <CompactNumber value={row.original.damageValue} />,
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 120 },
  },
  {
    accessorKey: 'weeklyDamageValue',
    header: 'Weekly Damage',
    cell: ({ row }) => <CompactNumber value={row.original.weeklyDamageValue} />,
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 130 },
  },
  {
    accessorKey: 'wealthRank',
    header: 'Wealth Rank',
    cell: ({ row }) => row.original.wealthRank ?? '—',
    meta: { align: 'right', minWidth: 110 },
  },
  {
    accessorKey: 'wealthValue',
    header: 'Wealth',
    cell: ({ row }) => <CompactNumber value={row.original.wealthValue} />,
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 90 },
  },
  {
    accessorKey: 'militaryRank',
    header: 'Mil. Rank',
    cell: ({ row }) => row.original.militaryRank ?? '—',
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 90 },
  },
  {
    accessorKey: 'muName',
    header: 'MU',
    cell: ({ row }) => row.original.muName ?? '—',
    meta: { minWidth: 160 },
  },
  {
    accessorKey: 'lastConnectionAt',
    header: 'Last seen',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatRelativeTime(row.original.lastConnectionAt)}</span>
    ),
    sortDescFirst: true,
    meta: { minWidth: 100 },
  },
  {
    accessorKey: 'bountyValue',
    header: 'Bounty',
    cell: ({ row }) => <CompactNumber value={row.original.bountyValue} />,
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 90 },
  },
  {
    accessorKey: 'terrainValue',
    header: 'Terrain',
    cell: ({ row }) => row.original.terrainValue?.toLocaleString() ?? '—',
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 90 },
  },
  {
    accessorKey: 'referralsValue',
    header: 'Referrals',
    cell: ({ row }) => row.original.referralsValue?.toLocaleString() ?? '—',
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 90 },
  },
  {
    accessorKey: 'premiumMonthsValue',
    header: 'Premium Mo.',
    cell: ({ row }) => row.original.premiumMonthsValue?.toLocaleString() ?? '—',
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 110 },
  },
  {
    accessorKey: 'premiumGiftsValue',
    header: 'Premium Gifts',
    cell: ({ row }) => row.original.premiumGiftsValue?.toLocaleString() ?? '—',
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 120 },
  },
  {
    accessorKey: 'casesOpenedValue',
    header: 'Cases Opened',
    cell: ({ row }) => row.original.casesOpenedValue?.toLocaleString() ?? '—',
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 120 },
  },
  {
    accessorKey: 'gemsPurchasedValue',
    header: 'Gems Purchased',
    cell: ({ row }) => row.original.gemsPurchasedValue?.toLocaleString() ?? '—',
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 130 },
  },
]
