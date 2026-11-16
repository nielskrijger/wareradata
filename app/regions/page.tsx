import type { Metadata } from 'next'

import { connection } from 'next/server'

import { NoDataPage } from '@/components/layout/no-data-page'

import { PageShell } from '@/components/layout/page-shell'
import { getSnapshot } from '@/lib/cache/memory'
import { formatNumber } from '@/lib/format'
import { pageMetadata } from '@/lib/metadata'

import { firstPage } from '@/lib/query'
import { RegionsTable } from './regions-table'

export const metadata: Metadata = pageMetadata({
  title: 'Regions',
  description: 'All regions in WarEra.io, ranked by development.',
  path: '/regions',
})

export default async function RegionsPage() {
  await connection()
  const { regions } = await getSnapshot()

  if (!regions.length) {
    return <NoDataPage />
  }

  const initial = firstPage(regions, 'development')

  return (
    <PageShell
      title="Regions"
      subtitle={`All ${formatNumber(initial.total)} regions in WarEra.io.`}
    >
      <RegionsTable initial={initial} />
    </PageShell>
  )
}
