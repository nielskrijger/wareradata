'use client'

import type { PageRequest, PageResult } from '@/components/data-table/data-table'
import type { RegionRow } from '@/lib/rows'

import { AdvancedSearchHint } from '@/components/data-table/advanced-search-hint'
import { DataTable } from '@/components/data-table/data-table'

import { regionColumns } from './columns'

async function fetchRegions(req: PageRequest): Promise<PageResult<RegionRow>> {
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
  const res = await fetch(`/api/regions?${params.toString()}`)
  if (!res.ok) {
    throw new Error(`Regions fetch failed: ${res.status}`)
  }
  return res.json() as Promise<PageResult<RegionRow>>
}

interface Props {
  initial: PageResult<RegionRow>
}

export function RegionsTable({ initial }: Props) {
  return (
    <DataTable
      columns={regionColumns}
      initialData={initial}
      initialSort={{ id: 'development', desc: true }}
      fetchPage={fetchRegions}
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
          fieldsList="name, country, city, resource, biome, climate, capital, dev, neighbors."
        />
      )}
    />
  )
}
