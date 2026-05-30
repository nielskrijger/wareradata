'use client'

import type { ColumnDef } from '@tanstack/react-table'

import type { PageRequest, PageResult } from '@/components/data-table/data-table'
import type { BattleRow } from '@/lib/rows'

import { useCallback } from 'react'

import { AdvancedSearchHint } from '@/components/data-table/advanced-search-hint'
import { DataTable } from '@/components/data-table/data-table'
import { fetchPaginated } from '@/components/data-table/fetch-paginated'

interface Props {
  initial: PageResult<BattleRow>
  columns: ColumnDef<BattleRow>[]
  /**
   * Locked filter scoping the table to active or finished battles.
   */
  baseFilter: string
  initialSort: { id: string, desc: boolean }
}

export function BattlesTable({ initial, columns, baseFilter, initialSort }: Props) {
  const fetchPage = useCallback(
    (req: PageRequest) => fetchPaginated<BattleRow>('/api/battles', req, baseFilter),
    [baseFilter],
  )

  return (
    <DataTable
      columns={columns}
      initialData={initial}
      initialSort={initialSort}
      fetchPage={fetchPage}
      searchPlaceholder="Filter by country or region…"
      searchHint={(
        <AdvancedSearchHint
          introText="Type plain text to search across attacker, defender, and region. Or use field-specific syntax:"
          examples={[
            { q: 'germany', desc: 'Search any field' },
            { q: 'attacker:france', desc: 'Field match' },
            { q: '-region:berlin', desc: 'Exclude with -' },
            { q: 'damage:>1000000', desc: 'Comparators' },
            { q: 'attacker:france AND damage:>500000', desc: 'Combine with AND/OR' },
          ]}
          fieldsList="attacker, defender, region, damage, pool."
        />
      )}
    />
  )
}
