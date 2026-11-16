'use client'

import type { EntityTableProps } from '@/components/data-table/data-table'
import type { PartyRow } from '@/lib/rows'

import { AdvancedSearchHint } from '@/components/data-table/advanced-search-hint'
import { DataTable } from '@/components/data-table/data-table'

import { partyColumns } from './columns'

export function PartiesTable({ initial, baseFilter, omitColumns }: EntityTableProps<PartyRow>) {
  return (
    <DataTable
      tableId="parties"
      columns={partyColumns}
      initialData={initial}
      initialSort={{ id: 'totalPoints', desc: true }}
      endpoint="/api/parties"
      baseFilter={baseFilter}
      omitColumns={omitColumns}
      searchPlaceholder="Filter by party, country, or leader…"
      searchHint={(
        <AdvancedSearchHint
          introText="Type plain text to search across name, country, and leader. Or use field-specific syntax:"
          examples={[
            { q: 'liberal', desc: 'Search any field' },
            { q: 'country:nl', desc: 'Field match' },
            { q: 'members:>10', desc: 'Comparators' },
            { q: 'points:[1000 TO 5000]', desc: 'Numeric range' },
            { q: 'country:nl AND members:>5', desc: 'Combine with AND/OR' },
          ]}
          fieldsList="name, country, leader, members, points, companies, stockpile, items, cash, equipment, weapons, cases, luck, and more."
        />
      )}
    />
  )
}
