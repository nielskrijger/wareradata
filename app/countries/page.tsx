import type { Metadata } from 'next'

import { NoDataPage } from '@/components/no-data-page'
import { PageShell } from '@/components/page-shell'
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
    { page: 0, pageSize: DEFAULT_PAGE_SIZE, sort: 'totalPoints', dir: 'desc', filter: '' },
    () => '',
    row => row.totalPoints,
  )

  return (
    <PageShell
      title="Countries"
      subtitle={`All ${initial.total.toLocaleString()} countries in Warera.`}
    >
      <CountriesTable initial={initial} />
    </PageShell>
  )
}
