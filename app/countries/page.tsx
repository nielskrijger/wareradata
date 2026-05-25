import type { Metadata } from 'next'

import { NoDataPage } from '@/components/no-data-page'
import { PageShell } from '@/components/page-shell'
import { withActiveBattleCounts } from '@/lib/cache/live-battles'
import { getSnapshot } from '@/lib/cache/memory'
import { applyQuery, DEFAULT_PAGE_SIZE } from '@/lib/query'

import { CountriesTable } from './countries-table'

// Country rows carry a live active-battle count (the ⚔ pill), so this page
// can't be statically cached.
export const dynamic = 'force-dynamic'

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
    await withActiveBattleCounts(countries),
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
