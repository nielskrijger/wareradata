import type { Metadata } from 'next'

import type { RankMapGroup } from '@/components/detail/rank-map/rank-map'
import type { PartyRow } from '@/lib/rows'

import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { cache } from 'react'

import { DetailLayout } from '@/components/detail/detail-sidebar'
import { MembersSection } from '@/components/detail/members-section'
import {
  GROUP_COLOR,
  pointsGroup,
  premiumGroup,
  rankRow,
  wealthPartRows,
} from '@/components/detail/rank-map/rank-row'
import { PartySidebar } from '@/components/party/party-sidebar'
import { getSnapshot } from '@/lib/cache/memory'
import { pageMetadata } from '@/lib/metadata'
import { groupMembers } from '@/lib/rows'

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * Loads the party and everything its page renders. Wrapped in React `cache` so
 * `generateMetadata` and the page share one load per request.
 */
const getParty = cache(async (id: string) => {
  const { parties, users } = await getSnapshot()
  const party = parties.find(p => p.id === id)
  if (!party) {
    return null
  }

  return { party, parties, members: groupMembers(users, u => u.partyId === id) }
})

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const result = await getParty(id)
  if (!result) {
    return { title: 'Party not found' }
  }

  return pageMetadata({
    title: result.party.name,
    description: `WarEra.io political-party stats for ${result.party.name}.`,
    path: `/parties/${id}`,
    image: `/og/parties/${id}`,
  })
}

export default async function PartyDetailPage({ params }: PageProps) {
  await connection()
  const { id } = await params
  const result = await getParty(id)
  if (!result) {
    notFound()
  }

  const { party: p, parties, members } = result

  return (
    <DetailLayout sidebar={<PartySidebar party={p} />}>
      {/* Party members are citizens of the party's country. */}
      <MembersSection
        members={members}
        noun="member"
        name={p.name}
        total={parties.length}
        unit="parties"
        groups={rankGroups(p)}
        peers={{
          selfId: p.id,
          all: parties.map(o => ({ id: o.id, name: o.name, code: o.countryCode, groups: rankGroups(o) })),
        }}
        baseFilter={`partyId:${p.id}`}
        omitColumns={['partyName', 'countryCode']}
      />
    </DetailLayout>
  )
}

/**
 * Every ranked stat, grouped by what it says about the party.
 */
function rankGroups(p: PartyRow): RankMapGroup[] {
  return [
    pointsGroup(p, 'Per member'),
    {
      title: 'Society',
      color: GROUP_COLOR.society,
      rows: [
        rankRow('Members', p.memberCount, p.memberCountRank),
        rankRow('Avg level', p.avgLevel, p.avgLevelRank, { stat: 'level' }),
      ],
    },
    {
      title: 'Economy',
      color: GROUP_COLOR.economy,
      rows: [
        rankRow('Member wealth', p.memberWealth, p.memberWealthRank, { compact: true, stat: 'wealth' }),
        ...wealthPartRows(p),
      ],
    },
    premiumGroup(p),
  ]
}
