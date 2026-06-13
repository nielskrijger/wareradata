import type { Metadata } from 'next'

import { connection } from 'next/server'

import { NoDataPage } from '@/components/layout/no-data-page'
import { PageShell } from '@/components/layout/page-shell'
import { getSnapshot } from '@/lib/cache/memory'
import { firstPage } from '@/lib/query'

import { MUsTable } from './mus-table'

export const metadata: Metadata = {
  title: 'Military Units',
  description: 'All Military Units in WarEra.io.',
}

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
      subtitle={`All ${initial.total.toLocaleString()} Military Units in WarEra.io.`}
    >
      <MUsTable initial={initial} />
    </PageShell>
  )
}
