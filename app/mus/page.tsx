import type { Metadata } from 'next'

import { connection } from 'next/server'

import { NoDataPage } from '@/components/layout/no-data-page'

import { PageShell } from '@/components/layout/page-shell'
import { getSnapshot } from '@/lib/cache/memory'
import { formatNumber } from '@/lib/format'
import { pageMetadata } from '@/lib/metadata'

import { firstPage } from '@/lib/query'
import { MUsTable } from './mus-table'

export const metadata: Metadata = pageMetadata({
  title: 'Military Units',
  description: 'Every WarEra.io military unit ranked by points, with members, damage, gear and wealth.',
  path: '/mus',
})

export default async function MUsPage() {
  await connection()
  const { mus } = await getSnapshot()

  if (!mus.length) {
    return <NoDataPage />
  }

  const initial = firstPage(mus, 'totalPoints')

  return (
    <PageShell
      title="Military Units"
      subtitle={`All ${formatNumber(initial.total)} Military Units in WarEra.io.`}
    >
      <MUsTable initial={initial} />
    </PageShell>
  )
}
