'use client'

import type { EntityTableProps } from '@/components/data-table/data-table'
import type { MURow } from '@/lib/rows'

import { AdvancedSearchHint } from '@/components/data-table/advanced-search-hint'
import { DataTable } from '@/components/data-table/data-table'

import { muColumns } from './columns'

export function MUsTable({ initial, baseFilter, omitColumns }: EntityTableProps<MURow>) {
  return (
    <DataTable
      tableId="mus"
      columns={muColumns}
      initialData={initial}
      initialSort={{ id: 'totalPoints', desc: true }}
      endpoint="/api/mus"
      baseFilter={baseFilter}
      omitColumns={omitColumns}
      searchPlaceholder="Filter by MU name or country…"
      searchHint={(
        <AdvancedSearchHint
          introText="Type plain text to search across name, country, and region. Or use field-specific syntax:"
          examples={[
            { q: 'oranje', desc: 'Search any field' },
            { q: 'country:nl', desc: 'Field match' },
            { q: '-region:limburg', desc: 'Exclude with -' },
            { q: 'members:[10 TO 50]', desc: 'Numeric range' },
            { q: 'damage:>1000000', desc: 'Comparators' },
            { q: 'country:nl AND members:>20', desc: 'Combine with AND/OR' },
          ]}
          fieldsList="name, country, members, points, damage, weeklyDamage, health, hunger, wealth, memberWealth, companies, stockpile, items, cash, equipment, weapons, cases, luck, and more."
        />
      )}
    />
  )
}
