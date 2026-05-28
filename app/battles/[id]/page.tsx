import type { Metadata } from 'next'

import type { BattleSide } from '@/lib/rows'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'

import { Avatar } from '@/components/avatar'
import { BattleTypeBadge } from '@/components/battle-type-badge'
import { CompactNumber } from '@/components/compact-number'
import { Flag } from '@/components/flag'
import { ExternalLink, InternalLink } from '@/components/links'
import { RelativeTime } from '@/components/relative-time'
import { Badge } from '@/components/ui/badge'
import { getLiveActiveBattles } from '@/lib/cache/live-battles'
import { getSnapshot } from '@/lib/cache/memory'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getBattle(id: string) {
  // Prefer the live active list (fresh score / round / top dealers). If the
  // battle isn't active (finished, or just ended between refreshes), fall back
  // to the hourly snapshot.
  const [liveActive, { battles }] = await Promise.all([getLiveActiveBattles(), getSnapshot()])
  return liveActive.find(b => b.id === id) ?? battles.find(b => b.id === id) ?? null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const result = await getBattle(id)
  if (!result) {
    return { title: 'Battle not found' }
  }
  const { attackerName, defenderName } = result
  const title = `${attackerName ?? '?'} vs ${defenderName ?? '?'}`
  return {
    title,
    description: `WarEra.io battle stats: ${title}.`,
  }
}

function battleVerb(b: { isTournament: boolean, isResistance: boolean }): string {
  if (b.isTournament) {
    return 'VS'
  }
  return b.isResistance ? 'RESISTING' : 'INVADING'
}

/**
 * One side of the battle header: a large emblem (MU avatar or country flag),
 * the linked name beneath, and a winner badge when this side won. Country flags
 * need an explicit size via inline style — the `flag-icons` `.fi` base rule
 * (width: 1.333em, background-size: contain) otherwise wins on specificity.
 */
function BattleSideEmblem({ side, won }: { side: BattleSide, won: boolean }) {
  const label = side.name ?? side.code ?? '?'
  const href = side.id ? (side.kind === 'mu' ? `/mus/${side.id}` : `/countries/${side.id}`) : null

  const emblem = side.kind === 'mu'
    ? <Avatar src={side.avatarUrl} name={label} size={96} />
    : (
        <Flag
          code={side.code}
          style={{ width: 96, height: 72, backgroundSize: 'cover', borderRadius: 8, boxShadow: '0 0 0 1px var(--border)' }}
        />
      )

  const inner = (
    <>
      {emblem}
      <span className="font-brand truncate text-base font-medium tracking-wide">{label}</span>
    </>
  )

  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      {href
        ? (
            <Link href={href} className="flex min-w-0 flex-col items-center gap-2 hover:opacity-80">
              {inner}
            </Link>
          )
        : inner}
      {won && <Badge variant="default">winner</Badge>}
    </div>
  )
}

export default async function BattleDetailPage({ params }: PageProps) {
  await connection()
  const { id } = await params
  const b = await getBattle(id)
  if (!b) {
    notFound()
  }

  const attackerShare = b.totalDamage > 0 ? Math.round((b.attackerDamage / b.totalDamage) * 100) : 50
  const defenderShare = 100 - attackerShare

  return (
    <main className="space-y-6 px-6 py-8 sm:px-8 lg:px-12">
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="flex items-center justify-center gap-8">
          <BattleSideEmblem side={b.attacker} won={b.wonBy === 'attacker'} />
          <div className="flex flex-col items-center gap-1">
            <span className="text-muted-foreground/40 font-brand text-4xl tracking-wide">{battleVerb(b)}</span>
            <BattleTypeBadge
              isTournament={b.isTournament}
              isResistance={b.isResistance}
              tournamentName={b.tournamentName}
              tournamentRound={b.tournamentRound}
            />
          </div>
          <BattleSideEmblem side={b.defender} won={b.wonBy === 'defender'} />
        </div>
      </div>

      <section className="flex flex-col items-center gap-3">
        <div className="flex items-baseline gap-4 tabular-nums">
          <span className={`font-brand text-5xl ${b.attackerWonRounds >= b.defenderWonRounds ? 'text-foreground' : 'text-muted-foreground'}`}>
            {b.attackerWonRounds}
          </span>
          <span className="text-muted-foreground text-2xl">–</span>
          <span className={`font-brand text-5xl ${b.defenderWonRounds >= b.attackerWonRounds ? 'text-foreground' : 'text-muted-foreground'}`}>
            {b.defenderWonRounds}
          </span>
        </div>
        <span className="text-muted-foreground text-xs uppercase tracking-widest">
          rounds won · first to {b.roundsToWin}
        </span>

        <div className="w-full max-w-md">
          <div className="flex h-2.5 overflow-hidden rounded-full">
            <div className="h-full bg-[oklch(0.63_0.21_27)]" style={{ width: `${attackerShare}%` }} />
            <div className="h-full bg-[oklch(0.62_0.17_250)]" style={{ width: `${defenderShare}%` }} />
          </div>
          <div className="text-muted-foreground mt-1 flex items-center justify-between text-xs tabular-nums">
            <span><CompactNumber value={b.attackerDamage} /> ({attackerShare}%)</span>
            <span>({defenderShare}%) <CompactNumber value={b.defenderDamage} /></span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm">
          {b.isActive
            ? <Badge variant="ghost" className="text-fire">Active</Badge>
            : <span className="text-muted-foreground">Ended <RelativeTime iso={b.endedAt} /></span>}
          {b.regionName && (
            <span className="text-muted-foreground">
              Region
              {' '}
              {b.regionId
                ? <InternalLink href={`/regions?q=${encodeURIComponent(b.regionName)}`}>{b.regionName}</InternalLink>
                : <span className="text-foreground">{b.regionName}</span>}
            </span>
          )}
          <ExternalLink href={`https://app.warera.io/battle/${b.id}`}>WarEra.io</ExternalLink>
        </div>
      </section>
    </main>
  )
}
