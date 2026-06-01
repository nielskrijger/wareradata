'use client'

import type { PageResult } from '@/components/data-table/data-table'
import type { CountryRow } from '@/lib/rows'

import { AdvancedSearchHint } from '@/components/data-table/advanced-search-hint'
import { DataTable } from '@/components/data-table/data-table'
import { fetchPaginated } from '@/components/data-table/fetch-paginated'

import { countryColumns } from './columns'

interface Props {
  initial: PageResult<CountryRow>
}

export function CountriesTable({ initial }: Props) {
  return (
    <DataTable
      columns={countryColumns}
      initialData={initial}
      initialSort={{ id: 'totalPoints', desc: true }}
      fetchPage={req => fetchPaginated<CountryRow>('/api/countries', req)}
      searchPlaceholder="Filter by name or code…"
      searchHint={(
        <AdvancedSearchHint
          introText="Type plain text to search across name, code, and specialty. Or use field-specific syntax:"
          examples={[
            { q: 'germany', desc: 'Search any field' },
            { q: 'code:nl', desc: 'Field match' },
            { q: '-specialty:oil', desc: 'Exclude with -' },
            { q: 'rank:[1 TO 20]', desc: 'Numeric range' },
            { q: 'taxIncome:>10', desc: 'Comparators' },
            { q: 'code:nl AND wars:>0', desc: 'Combine with AND/OR' },
          ]}
          fieldsList="name, code, rank, damage, weeklyDamage, wealth, citizenWealth, population, unrest, and more."
        />
      )}
    />
  )
}
