'use client'

import type { PageResult } from '@/components/data-table/data-table'
import type { RegionRow } from '@/lib/rows'

import { AdvancedSearchHint } from '@/components/data-table/advanced-search-hint'
import { DataTable } from '@/components/data-table/data-table'
import { fetchPaginated } from '@/components/data-table/fetch-paginated'

import { regionColumns } from './columns'

interface Props {
  initial: PageResult<RegionRow>
}

export function RegionsTable({ initial }: Props) {
  return (
    <DataTable
      columns={regionColumns}
      initialData={initial}
      initialSort={{ id: 'development', desc: true }}
      fetchPage={req => fetchPaginated<RegionRow>('/api/regions', req)}
      searchPlaceholder="Filter by region, country, city, or resource…"
      searchHint={(
        <AdvancedSearchHint
          introText="Type plain text to search across name, country, city, biome, and resource. Or use field-specific syntax:"
          examples={[
            { q: 'zurich', desc: 'Search any field' },
            { q: 'resource:gold', desc: 'Field match' },
            { q: 'capital:true', desc: 'Boolean match' },
            { q: 'biome:desert', desc: 'Field match' },
            { q: 'dev:>100', desc: 'Comparators' },
          ]}
          fieldsList="name, country, core, city, resource, biome, climate, capital, dev, neighbors."
        />
      )}
    />
  )
}
