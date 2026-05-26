import type { Metadata } from 'next'

import { NoDataPage } from '@/components/no-data-page'
import { PageShell } from '@/components/page-shell'
import { getSnapshot } from '@/lib/cache/memory'
import { applyQuery, DEFAULT_PAGE_SIZE } from '@/lib/query'

import { MUsTable } from './mus-table'

// Reads are served from the warm in-memory snapshot (sub-ms), so there is no
// caching win from ISR; force-dynamic avoids serving a cached "no data" page
// from the window between boot and the scraper's first cycle.
export const dynamic = 'force-dynamic'

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
    <PageShell
      title="MUs"
      subtitle={`All ${initial.total.toLocaleString()} Military Units in WarEra.io.`}
    >
      <MUsTable initial={initial} />
    </PageShell>
  )
}
