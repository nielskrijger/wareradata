import type { Metadata } from 'next'

import { connection } from 'next/server'

import { NoDataPage } from '@/components/layout/no-data-page'
import { PageShell } from '@/components/layout/page-shell'
import { getLiveActiveBattles } from '@/lib/cache/live-battles'
import { getSnapshot } from '@/lib/cache/memory'
import { firstPage } from '@/lib/query'

import { BattleTabs } from './battle-tabs'

export const metadata: Metadata = {
  title: 'Battles',
  description: 'Active and recent battles in WarEra.io.',
}

export default async function BattlesPage() {
  await connection()
  const [{ battles }, liveActive] = await Promise.all([getSnapshot(), getLiveActiveBattles()])

  const finishedBattles = battles.filter(b => !b.isActive)
  if (!liveActive.length && !finishedBattles.length) {
    return <NoDataPage />
  }

  const active = firstPage(liveActive, 'totalDamage')

  const finished = firstPage(finishedBattles, 'endedAt')

  return (
    <PageShell
      title="Battles"
      subtitle={(
        <>
          {`${active.total.toLocaleString()} active, ${finished.total.toLocaleString()} recent. `}
          <span className="font-medium">Active battles are live; finished are from the latest snapshot.</span>
        </>
      )}
    >
      <BattleTabs active={active} finished={finished} />
    </PageShell>
  )
}
