'use client'

import type { ColumnDef } from '@tanstack/react-table'

import type { CountryRow } from '@/lib/rows'

import { CompactNumber } from '@/components/compact-number'
import { ExternalLink } from '@/components/external-link'
import { Flag } from '@/components/flag'
import { TierBadge } from '@/components/tier-badge'
import { wareraUrl } from '@/lib/warera/urls'

export type { CountryRow }

export const countryColumns: ColumnDef<CountryRow>[] = [
  {
    accessorKey: 'damageRank',
    header: 'Rank',
    cell: ({ row }) => row.original.damageRank ?? '—',
    sortUndefined: 'last',
    meta: { align: 'right', minWidth: 70 },
  },
  {
    accessorKey: 'name',
    header: 'Country',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Flag code={row.original.code} />
        <ExternalLink href={wareraUrl('country', row.original.id)}>{row.original.name}</ExternalLink>
      </div>
    ),
    meta: { minWidth: 200 },
  },
  {
    accessorKey: 'damageTier',
    header: 'Tier',
    cell: ({ row }) => <TierBadge tier={row.original.damageTier} />,
    meta: { minWidth: 90 },
  },
  {
    accessorKey: 'damageValue',
    header: 'Damage',
    cell: ({ row }) => <CompactNumber value={row.original.damageValue} />,
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 100 },
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
    meta: { align: 'right', minWidth: 100 },
  },
  {
    accessorKey: 'development',
    header: 'Development',
    cell: ({ row }) =>
      row.original.development !== null ? row.original.development.toFixed(1) : '—',
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 110 },
  },
  {
    accessorKey: 'activePopulation',
    header: 'Active pop.',
    cell: ({ row }) => row.original.activePopulation ?? '—',
    sortDescFirst: true,
    meta: { align: 'right', minWidth: 100 },
  },
]
