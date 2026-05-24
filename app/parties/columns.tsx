'use client'

import type { ColumnDef } from '@tanstack/react-table'

import type { PartyRow } from '@/lib/rows'

import { CountryCell } from '@/components/country-cell'
import { ExternalLink } from '@/components/external-link'
import { PointsBreakdownCell } from '@/components/points-breakdown-cell'
import { TruncatedCell } from '@/components/truncated-cell'
import { wareraUrl } from '@/lib/warera/urls'

export type { PartyRow }

function formatCreated(iso: string | null): string {
  if (!iso) {
    return '—'
  }
  return iso.slice(0, 10)
}

function formatEthic(value: number | null): string {
  return value === null ? '—' : value.toFixed(0)
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
    meta: { align: 'right', width: 120 },
  },
  {
    accessorKey: 'avgPoints',
    header: 'Avg Points',
    cell: ({ row }) => row.original.avgPoints?.toLocaleString() ?? '—',
    sortDescFirst: true,
    meta: { align: 'right', width: 110 },
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
    meta: { align: 'right', width: 100 },
  },
  {
    accessorKey: 'leaderName',
    header: 'Leader',
    cell: ({ row }) => row.original.leaderName ?? '—',
    meta: { width: 180 },
  },
  {
    accessorKey: 'militarism',
    header: 'Militarism',
    cell: ({ row }) => formatEthic(row.original.militarism),
    sortDescFirst: true,
    meta: { align: 'right', width: 110 },
  },
  {
    accessorKey: 'isolationism',
    header: 'Isolationism',
    cell: ({ row }) => formatEthic(row.original.isolationism),
    sortDescFirst: true,
    meta: { align: 'right', width: 120 },
  },
  {
    accessorKey: 'imperialism',
    header: 'Imperialism',
    cell: ({ row }) => formatEthic(row.original.imperialism),
    sortDescFirst: true,
    meta: { align: 'right', width: 120 },
  },
  {
    accessorKey: 'industrialism',
    header: 'Industrialism',
    cell: ({ row }) => formatEthic(row.original.industrialism),
    sortDescFirst: true,
    meta: { align: 'right', width: 130 },
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
