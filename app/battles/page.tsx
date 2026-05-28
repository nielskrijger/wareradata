import type { Metadata } from 'next'

import { NoDataPage } from '@/components/no-data-page'
import { PageShell } from '@/components/page-shell'
import { getLiveActiveBattles } from '@/lib/cache/live-battles'
import { getSnapshot } from '@/lib/cache/memory'
import { applyQuery, DEFAULT_PAGE_SIZE } from '@/lib/query'

import { BattleTabs } from './battle-tabs'

export const metadata: Metadata = {
  title: 'Battles',
  description: 'Active and recent battles in WarEra.io.',
}

export default async function BattlesPage() {
  const [{ battles }, liveActive] = await Promise.all([getSnapshot(), getLiveActiveBattles()])

  const finishedBattles = battles.filter(b => !b.isActive)
  if (!liveActive.length && !finishedBattles.length) {
    return <NoDataPage />
  }

  const active = applyQuery(
    liveActive,
    { page: 0, pageSize: DEFAULT_PAGE_SIZE, sort: 'totalDamage', dir: 'desc', filter: '' },
    () => '',
    row => row.totalDamage,
  )

  const finished = applyQuery(
    finishedBattles,
    { page: 0, pageSize: DEFAULT_PAGE_SIZE, sort: 'endedAt', dir: 'desc', filter: '' },
    () => '',
    row => row.endedAt,
  )

  return (
    <PageShell
      title="Battles"
      subtitle={(
        <>
          {`${active.total.toLocaleString()} active, ${finished.total.toLocaleString()} recent. `}
          <span className="font-medium">Active battles are live; finished are from the hourly snapshot.</span>
        </>
      )}
    >
      <BattleTabs active={active} finished={finished} />
    </PageShell>
  )
}
