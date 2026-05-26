import type { Metadata } from 'next'

import { NoDataPage } from '@/components/no-data-page'
import { PageShell } from '@/components/page-shell'
import { getSnapshot } from '@/lib/cache/memory'
import { applyQuery, DEFAULT_PAGE_SIZE } from '@/lib/query'

import { RegionsTable } from './regions-table'

// Reads are served from the warm in-memory snapshot (sub-ms), so there is no
// caching win from ISR; force-dynamic avoids serving a cached "no data" page
// from the window between boot and the scraper's first cycle.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Regions',
  description: 'All regions in WarEra.io, ranked by development.',
}

export default async function RegionsPage() {
  const { regions } = await getSnapshot()

  if (!regions.length) {
    return <NoDataPage />
  }

  const initial = applyQuery(
    regions,
    { page: 0, pageSize: DEFAULT_PAGE_SIZE, sort: 'development', dir: 'desc', filter: '' },
    () => '',
    row => row.development,
  )

  return (
    <PageShell
      title="Regions"
      subtitle={`All ${initial.total.toLocaleString()} regions in WarEra.io.`}
    >
      <RegionsTable initial={initial} />
    </PageShell>
  )
}
