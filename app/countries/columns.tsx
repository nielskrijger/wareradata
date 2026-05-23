'use client'

import type { ColumnDef } from '@tanstack/react-table'

import type { CountryRow } from '@/lib/rows'

import { CompactNumber } from '@/components/compact-number'
import { Flag } from '@/components/flag'
import { TierBadge } from '@/components/tier-badge'
import { WareraLink } from '@/components/warera-link'

export type { CountryRow }

export const countryColumns: ColumnDef<CountryRow>[] = [
  {
    accessorKey: 'damageRank',
    header: 'Rank',
    cell: ({ row }) => row.original.damageRank ?? '—',
    sortUndefined: 'last',
    meta: { align: 'right' },
  },
  {
    accessorKey: 'name',
    header: 'Country',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Flag code={row.original.code} />
        <WareraLink kind="country" id={row.original.id}>{row.original.name}</WareraLink>
      </div>
    ),
  },
  {
    accessorKey: 'damageTier',
    header: 'Tier',
    cell: ({ row }) => <TierBadge tier={row.original.damageTier} />,
  },
  {
    accessorKey: 'damageValue',
    header: 'Damage',
    cell: ({ row }) => <CompactNumber value={row.original.damageValue} />,
    sortDescFirst: true,
    meta: { align: 'right' },
  },
  {
    accessorKey: 'weeklyDamageValue',
    header: 'Weekly Damage',
    cell: ({ row }) => <CompactNumber value={row.original.weeklyDamageValue} />,
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
    accessorKey: 'development',
    header: 'Development',
    cell: ({ row }) =>
      row.original.development !== null ? row.original.development.toFixed(1) : '—',
    sortDescFirst: true,
    meta: { align: 'right' },
  },
  {
    accessorKey: 'activePopulation',
    header: 'Active pop.',
    cell: ({ row }) => row.original.activePopulation ?? '—',
    sortDescFirst: true,
    meta: { align: 'right' },
  },
]
