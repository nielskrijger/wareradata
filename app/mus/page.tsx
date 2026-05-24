import type { Metadata } from 'next'

import { NoDataPage } from '@/components/no-data-page'
import { PageShell } from '@/components/page-shell'
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
    <PageShell
      title="MUs"
      subtitle={`All ${initial.total.toLocaleString()} Military Units in WarEra.io.`}
    >
      <MUsTable initial={initial} />
    </PageShell>
  )
}
