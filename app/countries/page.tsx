import type { Metadata } from 'next'

import { NoDataPage } from '@/components/no-data-page'
import { PageTitle } from '@/components/page-title'
import { getSnapshot } from '@/lib/cache/memory'
import { applyQuery, DEFAULT_PAGE_SIZE } from '@/lib/query'

import { CountriesTable } from './countries-table'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Countries',
  description: 'All WarEra.io countries.',
}

export default async function CountriesPage() {
  const { countries } = await getSnapshot()

  if (!countries.length) {
    return <NoDataPage />
  }

  const initial = applyQuery(
    countries,
    { page: 0, pageSize: DEFAULT_PAGE_SIZE, sort: 'damageRank', dir: 'asc', filter: '' },
    () => '',
    row => row.damageRank,
  )

  return (
    <main className="space-y-6 px-6 py-8 sm:px-8 lg:px-12">
      <header>
        <PageTitle>Countries</PageTitle>
        <p className="text-muted-foreground text-sm">
          All {initial.total.toLocaleString()} countries in Warera.
        </p>
      </header>
      <CountriesTable initial={initial} />
    </main>
  )
}
