import type { Metadata } from 'next'

import { NoDataPage } from '@/components/no-data-page'
import { PageShell } from '@/components/page-shell'
import { getSnapshot } from '@/lib/cache/memory'
import { applyQuery, DEFAULT_PAGE_SIZE } from '@/lib/query'

import { PartiesTable } from './parties-table'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Parties',
  description: 'All political parties in WarEra.io.',
}

export default async function PartiesPage() {
  const { parties } = await getSnapshot()

  if (!parties.length) {
    return <NoDataPage />
  }

  const initial = applyQuery(
    parties,
    { page: 0, pageSize: DEFAULT_PAGE_SIZE, sort: 'totalPoints', dir: 'desc', filter: '' },
    () => '',
    row => row.totalPoints,
  )

  return (
    <PageShell
      title="Parties"
      subtitle={`All ${initial.total.toLocaleString()} political parties in WarEra.io.`}
    >
      <PartiesTable initial={initial} />
    </PageShell>
  )
}
