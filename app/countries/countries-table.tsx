'use client'

import type { PageRequest, PageResult } from '@/components/data-table/data-table'
import type { CountryRow } from '@/lib/rows'

import { AdvancedSearchHint } from '@/components/data-table/advanced-search-hint'
import { DataTable } from '@/components/data-table/data-table'

import { countryColumns } from './columns'

async function fetchCountries(req: PageRequest): Promise<PageResult<CountryRow>> {
  const params = new URLSearchParams({
    page: String(req.page),
    pageSize: String(req.pageSize),
    dir: req.dir,
  })
  if (req.sort) {
    params.set('sort', req.sort)
  }
  if (req.filter) {
    params.set('filter', req.filter)
  }
  const res = await fetch(`/api/countries?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`Countries fetch failed: ${res.status}`)
  }
  return res.json() as Promise<PageResult<CountryRow>>
}

interface Props {
  initial: PageResult<CountryRow>
}

export function CountriesTable({ initial }: Props) {
  return (
    <DataTable
      columns={countryColumns}
      initialData={initial}
      initialSort={{ id: 'totalPoints', desc: true }}
      fetchPage={fetchCountries}
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
          fieldsList="name, code, specialty, rank, damage, weeklyDamage, wealth, treasury, population, allies, wars, taxIncome, taxMarket, taxSelfWork, productionBonus, unrest, development, and more."
        />
      )}
    />
  )
}
