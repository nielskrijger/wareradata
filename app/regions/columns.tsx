'use client'

import type { ColumnDef } from '@tanstack/react-table'

import type { RegionRow } from '@/lib/rows'

import { CountryCell } from '@/components/country-cell'
import { InfoTooltip } from '@/components/info-tooltip'
import { TruncatedCell } from '@/components/truncated-cell'

export type { RegionRow }

function formatDevelopment(value: number | null): string {
  return value === null ? '—' : value.toFixed(1)
}

function titleCase(value: string | null): string {
  if (!value) {
    return '—'
  }
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export const regionColumns: ColumnDef<RegionRow>[] = [
  {
    accessorKey: 'name',
    header: 'Region',
    cell: ({ row }) => (
      <TruncatedCell text={row.original.name} className="font-medium" />
    ),
    meta: { width: 200 },
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
    accessorKey: 'development',
    header: 'Development',
    cell: ({ row }) => formatDevelopment(row.original.development),
    sortDescFirst: true,
    meta: { align: 'right', width: 130 },
  },
  {
    accessorKey: 'baseDevelopment',
    header: 'Base Dev.',
    cell: ({ row }) => formatDevelopment(row.original.baseDevelopment),
    sortDescFirst: true,
    meta: { align: 'right', width: 110 },
  },
  {
    accessorKey: 'strategicResource',
    header: 'Resource',
    cell: ({ row }) => titleCase(row.original.strategicResource),
    meta: { width: 120 },
  },
  {
    accessorKey: 'biome',
    header: 'Biome',
    cell: ({ row }) => titleCase(row.original.biome),
    meta: { width: 120 },
  },
  {
    accessorKey: 'climate',
    header: 'Climate',
    cell: ({ row }) => titleCase(row.original.climate),
    meta: { width: 120 },
  },
  {
    accessorKey: 'isCapital',
    header: 'Capital',
    cell: ({ row }) => (row.original.isCapital ? 'Yes' : '—'),
    sortDescFirst: true,
    meta: { width: 90 },
  },
  {
    accessorKey: 'isLinkedToCapital',
    header: () => (
      <InfoTooltip
        label="Connected"
        hint="Connected to the country's capital via a chain of owned territory. “No” means an isolated exclave cut off from home territory."
      />
    ),
    cell: ({ row }) => (row.original.isLinkedToCapital ? 'Yes' : 'No'),
    sortDescFirst: true,
    meta: { width: 110 },
  },
  {
    accessorKey: 'mainCity',
    header: 'Main City',
    cell: ({ row }) => row.original.mainCity ?? '—',
    meta: { width: 160 },
  },
  {
    accessorKey: 'neighborCount',
    header: 'Neighbors',
    cell: ({ row }) => row.original.neighborCount.toLocaleString(),
    sortDescFirst: true,
    meta: { align: 'right', width: 100 },
  },
]
