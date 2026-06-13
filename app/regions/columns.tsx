'use client'

import type { ColumnDef } from '@tanstack/react-table'

import type { RegionRow } from '@/lib/rows'

import { BoolCell } from '@/components/cells/bool-cell'
import { CountryCell } from '@/components/cells/country-cell'
import { TruncatedCell } from '@/components/cells/truncated-cell'
import { countryColumn } from '@/components/data-table/column-factories'
import { InfoTooltip } from '@/components/info-tooltip'

export type { RegionRow }

function formatDevelopment(value: number | null): string | null {
  return value === null ? null : value.toFixed(1)
}

function titleCase(value: string | null): string | null {
  if (!value) {
    return null
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
  countryColumn<RegionRow>(),
  {
    accessorKey: 'coreCountryName',
    header: 'Core',
    cell: ({ row }) => {
      const r = row.original
      const home = r.coreCountryId != null && r.coreCountryId === r.countryId

      return (
        <div className="flex min-w-0 items-center gap-1.5">
          <CountryCell countryCode={r.coreCountryCode} countryName={r.coreCountryName} countryId={r.coreCountryId} />
          {home && <span className="text-muted-foreground/60 shrink-0 text-xs">(home)</span>}
        </div>
      )
    },
    meta: { width: 170 },
  },
  {
    accessorKey: 'development',
    header: 'Development',
    cell: ({ row }) => formatDevelopment(row.original.development),
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 150 },
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
    cell: ({ row }) => <BoolCell value={row.original.isCapital} falsy="dash" />,
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
    cell: ({ row }) => <BoolCell value={row.original.isLinkedToCapital} />,
    sortDescFirst: true,
    meta: { width: 110 },
  },
  {
    accessorKey: 'mainCity',
    header: 'Main City',
    cell: ({ row }) => row.original.mainCity ?? null,
    meta: { width: 160 },
  },
  {
    accessorKey: 'neighborCount',
    header: 'Neighbors',
    cell: ({ row }) => row.original.neighborCount.toLocaleString(),
    sortDescFirst: true,
    meta: { heat: 'median', align: 'right', width: 110 },
  },
]
