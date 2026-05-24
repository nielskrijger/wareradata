import type { Metadata } from 'next'

import { NoDataPage } from '@/components/no-data-page'
import { PageTitle } from '@/components/page-title'
import { getSnapshot } from '@/lib/cache/memory'
import { applyQuery, DEFAULT_PAGE_SIZE } from '@/lib/query'

import { MUsTable } from './mus-table'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'MUs',
  description: 'All Military Units in WarEra.io.',
}

export default async function MUsPage() {
  const { mus } = await getSnapshot()

  if (!mus.length) {
    return <NoDataPage />
  }

  const initial = applyQuery(
    mus,
    { page: 0, pageSize: DEFAULT_PAGE_SIZE, sort: 'totalPoints', dir: 'desc', filter: '' },
    () => '',
    row => row.totalPoints,
  )

  return (
    <main className="space-y-6 px-6 py-8 sm:px-8 lg:px-12">
      <header>
        <PageTitle>MUs</PageTitle>
        <p className="text-muted-foreground text-sm">
          All {initial.total.toLocaleString()} Military Units in WarEra.io.
        </p>
      </header>
      <MUsTable initial={initial} />
    </main>
  )
}
