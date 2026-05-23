'use client'

import type { ColumnDef } from '@tanstack/react-table'

import type { RankingTier } from '@/lib/warera/schemas'
import { Badge } from '@/components/ui/badge'

export interface CountryRow {
  id: string
  name: string
  code: string
  damageRank: number | null
  damageValue: number | null
  damageTier: RankingTier | null
  wealthRank: number | null
  development: number | null
  activePopulation: number | null
}

const tierColor: Record<RankingTier, string> = {
  bronze: 'bg-amber-700/20 text-amber-300',
  silver: 'bg-zinc-400/20 text-zinc-200',
  gold: 'bg-yellow-500/20 text-yellow-300',
  platinum: 'bg-sky-400/20 text-sky-200',
  diamond: 'bg-cyan-400/20 text-cyan-200',
  master: 'bg-fuchsia-400/20 text-fuchsia-200',
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

export const countryColumns: ColumnDef<CountryRow>[] = [
  {
    accessorKey: 'damageRank',
    header: 'Rank',
    cell: ({ row }) => row.original.damageRank ?? '—',
    sortUndefined: 'last',
  },
  {
    accessorKey: 'name',
    header: 'Country',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground font-mono text-xs uppercase">
          {row.original.code}
        </span>
        <span>{row.original.name}</span>
      </div>
    ),
  },
  {
    accessorKey: 'damageTier',
    header: 'Tier',
    cell: ({ row }) => {
      const t = row.original.damageTier
      if (!t)
        return '—'
      return (
        <Badge variant="outline" className={tierColor[t]}>
          {t}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'damageValue',
    header: 'Damage',
    cell: ({ row }) =>
      row.original.damageValue !== null ? compact.format(row.original.damageValue) : '—',
  },
  {
    accessorKey: 'wealthRank',
    header: 'Wealth Rank',
    cell: ({ row }) => row.original.wealthRank ?? '—',
  },
  {
    accessorKey: 'development',
    header: 'Development',
    cell: ({ row }) =>
      row.original.development !== null ? row.original.development.toFixed(1) : '—',
  },
  {
    accessorKey: 'activePopulation',
    header: 'Active pop.',
    cell: ({ row }) => row.original.activePopulation ?? '—',
  },
]
