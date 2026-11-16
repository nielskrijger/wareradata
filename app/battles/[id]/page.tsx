import type { Metadata } from 'next'

import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { cache } from 'react'

import { BattleLeaderboards } from '@/components/battle/battle-leaderboards'
import { BattleSidebar } from '@/components/battle/battle-sidebar'
import { LastHits } from '@/components/battle/last-hits'
import { RoundChart } from '@/components/battle/round-chart'
import { DetailLayout } from '@/components/detail/detail-sidebar'
import { SectionHeading } from '@/components/detail/section-heading'
import { Panel } from '@/components/panel'
import { getBattleDetail } from '@/lib/cache/battle-detail'
import { getLiveActiveBattles } from '@/lib/cache/live-battles'
import { getSnapshot } from '@/lib/cache/memory'
import { pageMetadata } from '@/lib/metadata'

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * Loads the battle's row. Wrapped in React `cache` so `generateMetadata` and
 * the page share one load per request.
 */
const getBattle = cache(async (id: string) => {
  // Prefer the live active list (fresh score / round / top dealers). If the
  // battle isn't active (finished, or just ended between refreshes), fall back
  // to the latest snapshot.
  const [liveActive, { battles }] = await Promise.all([getLiveActiveBattles(), getSnapshot()])

  return liveActive.find(b => b.id === id) ?? battles.find(b => b.id === id) ?? null
})

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const result = await getBattle(id)
  if (!result) {
    return { title: 'Battle not found' }
  }

  const { attackerName, defenderName } = result
  const title = `${attackerName ?? '?'} vs ${defenderName ?? '?'}`

  return pageMetadata({
    title,
    description: `WarEra.io battle stats: ${title}.`,
    path: `/battles/${id}`,
    image: `/og/battles/${id}`,
  })
}

export default async function BattleDetailPage({ params }: PageProps) {
  await connection()
  const { id } = await params
  const [battle, detail] = await Promise.all([getBattle(id), getBattleDetail(id)])
  if (!battle) {
    notFound()
  }

  return (
    <DetailLayout sidebar={<BattleSidebar battle={battle} detail={detail} />}>
      {!detail && (
        <Panel className="text-muted-foreground text-sm">Round and fighter details are unavailable right now.</Panel>
      )}
      {!!detail?.rounds.length && (
        <Panel as="section" className="space-y-3">
          <SectionHeading
            title="Damage per round"
            aside={(
              <span className="text-muted-foreground text-xs">
                {`${battle.attacker.name ?? '?'} up · ${battle.defender.name ?? '?'} down`}
              </span>
            )}
          />
          <RoundChart rounds={detail.rounds} />
        </Panel>
      )}
      {detail && (
        <Panel as="section"><BattleLeaderboards battle={battle} detail={detail} /></Panel>
      )}
      {!!detail?.hits.length && (
        <Panel as="section" className="space-y-2">
          <SectionHeading title="Last hits" />
          <LastHits hits={detail.hits} />
        </Panel>
      )}
    </DetailLayout>
  )
}
