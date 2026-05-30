import type { Metadata } from 'next'

import { connection } from 'next/server'

import { NoDataPage } from '@/components/layout/no-data-page'
import { PageShell } from '@/components/layout/page-shell'
import { getSnapshot } from '@/lib/cache/memory'
import { applyQuery, DEFAULT_PAGE_SIZE } from '@/lib/query'

import { RegionsTable } from './regions-table'

export const metadata: Metadata = {
  title: 'Regions',
  description: 'All regions in WarEra.io, ranked by development.',
}

export default async function RegionsPage() {
  await connection()
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
