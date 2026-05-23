'use client'

import type { PageRequest, PageResult } from '@/components/data-table/data-table'
import type { CountryRow } from '@/lib/rows'

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
      initialSort={{ id: 'damageRank', desc: false }}
      fetchPage={fetchCountries}
      searchPlaceholder="Filter by name or code…"
    />
  )
}
