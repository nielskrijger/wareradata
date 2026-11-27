'use client'

import type { PagedResult } from '@/lib/query'
import type { AllianceRow } from '@/lib/rows'

import { AdvancedSearchHint } from '@/components/data-table/advanced-search-hint'
import { DataTable } from '@/components/data-table/data-table'

import { allianceColumns } from './columns'

interface Props {
  initial: PagedResult<AllianceRow>
}

export function AlliancesTable({ initial }: Props) {
  return (
    <DataTable
      tableId="alliances"
      columns={allianceColumns}
      initialData={initial}
      initialSort={{ id: 'totalPoints', desc: true }}
      endpoint="/api/alliances"
      searchPlaceholder="Filter by name, leader, or member country…"
      searchHint={(
        <AdvancedSearchHint
          introText="Type plain text to search across name, leader, and member countries. Or use field-specific syntax:"
          examples={[
            { q: 'maritime', desc: 'Search any field' },
            { q: 'country:netherlands', desc: 'Has member country' },
            { q: 'leader:snoopy', desc: 'Field match' },
            { q: 'dev:>500', desc: 'Comparators' },
            { q: 'population:[100 TO 1000]', desc: 'Numeric range' },
            { q: 'country:rs AND members:>5', desc: 'Combine with AND/OR' },
          ]}
          fieldsList="name, leader, country, members, population, points, ppd, dev, damage, weekly, health, hunger, wealth, companies, stockpile, items, cash, equipment, weapons, gems, cases, luck, and more."
        />
      )}
    />
  )
}
