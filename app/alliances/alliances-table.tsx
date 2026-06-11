'use client'

import type { PageResult } from '@/components/data-table/data-table'
import type { AllianceRow } from '@/lib/rows'

import { AdvancedSearchHint } from '@/components/data-table/advanced-search-hint'
import { DataTable } from '@/components/data-table/data-table'
import { fetchPaginated } from '@/components/data-table/fetch-paginated'

import { allianceColumns } from './columns'

interface Props {
  initial: PageResult<AllianceRow>
}

export function AlliancesTable({ initial }: Props) {
  return (
    <DataTable
      columns={allianceColumns}
      initialData={initial}
      initialSort={{ id: 'totalPoints', desc: true }}
      fetchPage={req => fetchPaginated<AllianceRow>('/api/alliances', req)}
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
          fieldsList="name, leader, country, members, population, points, ppd, dev, damage, weekly, wealth, companies, items, cash, equipment, weapons, and more."
        />
      )}
    />
  )
}
