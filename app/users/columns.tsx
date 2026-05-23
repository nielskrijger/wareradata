'use client'

import type { ColumnDef } from '@tanstack/react-table'

import type { UserRow } from '@/lib/rows'

import { CompactNumber } from '@/components/compact-number'
import { Flag } from '@/components/flag'
import { TierBadge } from '@/components/tier-badge'
import { Badge } from '@/components/ui/badge'
import { WareraLink } from '@/components/warera-link'
import { formatRelativeTime } from '@/lib/format'

export type { UserRow }

export const userColumns: ColumnDef<UserRow>[] = [
  {
    accessorKey: 'levelRank',
    header: 'Rank',
    cell: ({ row }) => row.original.levelRank ?? '—',
    sortUndefined: 'last',
    meta: { align: 'right' },
  },
  {
    accessorKey: 'username',
    header: 'User',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <WareraLink kind="user" id={row.original.id}>
          <span className="font-medium">{row.original.username}</span>
        </WareraLink>
        {row.original.isBanned && <Badge className="bg-red-500/15 text-red-900">banned</Badge>}
      </div>
    ),
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
          <WareraLink kind="country" id={countryId}>{countryName ?? ''}</WareraLink>
        </div>
      )
    },
  },
  {
    accessorKey: 'level',
    header: 'Level',
    cell: ({ row }) => row.original.level ?? '—',
    sortDescFirst: true,
    meta: { align: 'right' },
  },
  {
    accessorKey: 'levelTier',
    header: 'Tier',
    cell: ({ row }) => <TierBadge tier={row.original.levelTier} />,
  },
  {
    accessorKey: 'damageRank',
    header: 'Damage Rank',
    cell: ({ row }) => row.original.damageRank ?? '—',
    meta: { align: 'right' },
  },
  {
    accessorKey: 'damageValue',
    header: 'Damage',
    cell: ({ row }) => <CompactNumber value={row.original.damageValue} />,
    sortDescFirst: true,
    meta: { align: 'right' },
  },
  {
    accessorKey: 'wealthRank',
    header: 'Wealth Rank',
    cell: ({ row }) => row.original.wealthRank ?? '—',
    meta: { align: 'right' },
  },
  {
    accessorKey: 'wealthValue',
    header: 'Wealth',
    cell: ({ row }) => <CompactNumber value={row.original.wealthValue} />,
    sortDescFirst: true,
    meta: { align: 'right' },
  },
  {
    accessorKey: 'militaryRank',
    header: 'Mil. Rank',
    cell: ({ row }) => row.original.militaryRank ?? '—',
    sortDescFirst: true,
    meta: { align: 'right' },
  },
  {
    accessorKey: 'muName',
    header: 'MU',
    cell: ({ row }) => row.original.muName ?? '—',
  },
  {
    accessorKey: 'lastConnectionAt',
    header: 'Last seen',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatRelativeTime(row.original.lastConnectionAt)}</span>
    ),
    sortDescFirst: true,
  },
  {
    accessorKey: 'points',
    header: 'Points',
    cell: ({ row }) => row.original.points.toLocaleString(),
    sortDescFirst: true,
    meta: { align: 'right' },
  },
]
