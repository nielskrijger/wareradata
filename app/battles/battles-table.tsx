'use client'

import type { PageResult } from '@/components/data-table/data-table'

import type { ColumnDef } from '@/components/data-table/features'
import type { BattleRow } from '@/lib/rows'

import { AdvancedSearchHint } from '@/components/data-table/advanced-search-hint'
import { DataTable } from '@/components/data-table/data-table'

interface Props {
  /**
   * See DataTable's `tableId`; active and finished battles have different columns.
   */
  tableId: 'battles-active' | 'battles-finished'
  initial: PageResult<BattleRow>
  columns: ColumnDef<BattleRow>[]

  /**
   * Locked filter scoping the table to active or finished battles.
   */
  baseFilter: string
  initialSort: { id: string, desc: boolean }
}

export function BattlesTable({ tableId, initial, columns, baseFilter, initialSort }: Props) {
  return (
    <DataTable
      tableId={tableId}
      columns={columns}
      initialData={initial}
      initialSort={initialSort}
      endpoint="/api/battles"
      baseFilter={baseFilter}
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
