import type { ReactElement } from 'react'

import type { Emblem, Stat } from './layout'
import type { BattleSide } from '@/lib/rows'
import { getLiveActiveBattles } from '@/lib/cache/live-battles'

import { getSnapshot } from '@/lib/cache/memory'
import { avatarSrc, flagSrc } from './assets'
import { CardFrame, EmblemImage, EntityCard } from './layout'
import { MUTED, ORANGE } from './theme'

import 'server-only'

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

function formatCompact(n: number | null | undefined): string {
  return n == null ? '—' : compact.format(n)
}

function avgLevel(n: number | null): string {
  return n == null ? '—' : n.toFixed(1)
}

async function CountryLine({ code, name }: { code: string | null, name: string | null }) {
  if (!name) {
    return null
  }

  const flag = await flagSrc(code)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      {flag ? <img src={flag} width={44} height={33} alt="" style={{ borderRadius: 4 }} /> : null}
      <span>{name}</span>
    </div>
  )
}

async function userCard(id: string): Promise<ReactElement | null> {
  const { users } = await getSnapshot()
  const u = users.find(u => u.id === id)
  if (!u) {
    return null
  }

  const stats: Stat[] = [
    { label: 'Level', value: String(u.level ?? '—'), rank: u.levelRank },
    { label: 'Damage', value: formatCompact(u.damage), rank: u.damageRank },
    { label: 'Wealth', value: formatCompact(u.wealth), rank: u.wealthRank },
    { label: 'Gear', value: formatCompact(u.gearScore), rank: u.gearScoreRank },
  ]

  return (
    <EntityCard
      kicker="Player"
      title={u.username}
      subtitle={(
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {await CountryLine({ code: u.countryCode, name: u.countryName })}
          {u.countryName && u.muName ? <span>·</span> : null}
          {u.muName ? <span>{u.muName}</span> : null}
        </div>
      )}
      emblem={{ shape: 'avatar', src: await avatarSrc(u.avatarUrl), fallback: u.username }}
      stats={stats}
    />
  )
}

async function countryCard(id: string): Promise<ReactElement | null> {
  const { countries } = await getSnapshot()
  const c = countries.find(c => c.id === id)
  if (!c) {
    return null
  }

  return (
    <EntityCard
      kicker="Country"
      title={c.name}
      subtitle={c.allianceName ? <span>{c.allianceName}</span> : null}
      emblem={{ shape: 'flag', src: await flagSrc(c.code), fallback: c.name }}
      stats={[
        { label: 'Players', value: formatCompact(c.activePopulation), rank: c.activePopulationRank },
        { label: 'Damage', value: formatCompact(c.damage), rank: c.damageRank },
        { label: 'Wealth', value: formatCompact(c.citizenWealth), rank: c.citizenWealthRank },
        { label: 'Avg level', value: avgLevel(c.avgLevel), rank: c.avgLevelRank },
      ]}
    />
  )
}

async function muCard(id: string): Promise<ReactElement | null> {
  const { mus } = await getSnapshot()
  const m = mus.find(m => m.id === id)
  if (!m) {
    return null
  }

  return (
    <EntityCard
      kicker="Military unit"
      title={m.name}
      subtitle={await CountryLine({ code: m.countryCode, name: m.countryName })}
      emblem={{ shape: 'avatar', src: await avatarSrc(m.avatarUrl), fallback: m.name }}
      stats={[
        { label: 'Members', value: String(m.memberCount), rank: m.memberCountRank },
        { label: 'Damage', value: formatCompact(m.damage), rank: m.damageRank },
        { label: 'Wealth', value: formatCompact(m.memberWealth), rank: m.memberWealthRank },
        { label: 'Avg level', value: avgLevel(m.avgLevel), rank: m.avgLevelRank },
      ]}
    />
  )
}

async function partyCard(id: string): Promise<ReactElement | null> {
  const { parties } = await getSnapshot()
  const p = parties.find(p => p.id === id)
  if (!p) {
    return null
  }

  return (
    <EntityCard
      kicker="Party"
      title={p.name}
      subtitle={await CountryLine({ code: p.countryCode, name: p.countryName })}
      emblem={{ shape: 'avatar', src: await avatarSrc(p.avatarUrl), fallback: p.name }}
      stats={[
        { label: 'Members', value: String(p.memberCount), rank: p.memberCountRank },
        { label: 'Points', value: formatCompact(p.totalPoints), rank: p.totalPointsRank },
        { label: 'Wealth', value: formatCompact(p.memberWealth) },
        { label: 'Avg level', value: avgLevel(p.avgLevel), rank: p.avgLevelRank },
      ]}
    />
  )
}

async function allianceCard(id: string): Promise<ReactElement | null> {
  const { alliances } = await getSnapshot()
  const a = alliances.find(a => a.id === id)
  if (!a) {
    return null
  }

  const flags = (await Promise.all(a.members.slice(0, 10).map(m => flagSrc(m.code)))).filter(f => f !== null)

  return (
    <EntityCard
      kicker="Alliance"
      title={a.name}
      subtitle={flags.length
        ? flags.map(f => <img key={f} src={f} width={44} height={33} alt="" style={{ borderRadius: 4 }} />)
        : null}
      emblem={{ shape: 'avatar', src: await avatarSrc(a.avatarUrl), fallback: a.name }}
      stats={[
        { label: 'Countries', value: String(a.memberCount) },
        { label: 'Damage', value: formatCompact(a.damage), rank: a.damageRank },
        { label: 'Wealth', value: formatCompact(a.citizenWealth), rank: a.citizenWealthRank },
        { label: 'Development', value: formatCompact(a.development), rank: a.developmentRank },
      ]}
    />
  )
}

interface ResolvedSide {
  name: string
  emblem: Emblem
}

async function battleSide(side: BattleSide): Promise<ResolvedSide> {
  const name = side.name ?? side.code ?? '?'
  const isMu = side.kind === 'mu'
  const src = isMu ? await avatarSrc(side.avatarUrl) : await flagSrc(side.code)

  return { name, emblem: { shape: isMu ? 'avatar' : 'flag', src, fallback: name } }
}

/**
 * Lifted to sit level with the emblems rather than the names below them.
 */
const VERB_STYLE = {
  display: 'flex',
  fontFamily: 'Bebas',
  fontSize: 64,
  color: ORANGE,
  letterSpacing: 2,
  paddingBottom: 90,
}

const REGION_STYLE = { display: 'flex', justifyContent: 'center', marginTop: 28, fontSize: 32, color: MUTED }

const SIDE_NAME_STYLE = {
  display: 'block',
  maxWidth: 400,
  marginTop: 24,
  fontFamily: 'Bebas',
  fontSize: 72,
  lineHeight: 1,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
} as const

function BattleSideBlock({ side }: { side: ResolvedSide }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 400 }}>
      <EmblemImage emblem={side.emblem} size={180} />
      <div style={SIDE_NAME_STYLE}>{side.name}</div>
    </div>
  )
}

/**
 * Sides and matchup only: the score would be stale in any cached preview.
 */
async function battleCard(id: string): Promise<ReactElement | null> {
  const [live, { battles }] = await Promise.all([getLiveActiveBattles(), getSnapshot()])
  const b = live.find(b => b.id === id) ?? battles.find(b => b.id === id)
  if (!b) {
    return null
  }

  const verb = b.isTournament ? 'VS' : b.isResistance ? 'Resisting' : 'Invading'
  const [attacker, defender] = await Promise.all([battleSide(b.attacker), battleSide(b.defender)])

  return (
    <CardFrame kicker={b.tournamentName ?? 'Battle'}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 56 }}>
        <BattleSideBlock side={attacker} />
        <div style={VERB_STYLE}>{verb}</div>
        <BattleSideBlock side={defender} />
      </div>
      {b.regionName
        ? <div style={REGION_STYLE}>{b.regionName}</div>
        : null}
    </CardFrame>
  )
}

/**
 * Share-image builders by URL segment; each returns null for an unknown id.
 */
const SHARE_CARDS: Record<string, (id: string) => Promise<ReactElement | null>> = {
  users: userCard,
  countries: countryCard,
  mus: muCard,
  parties: partyCard,
  alliances: allianceCard,
  battles: battleCard,
}

export async function shareCard(kind: string, id: string): Promise<ReactElement | null> {
  return Object.hasOwn(SHARE_CARDS, kind) ? SHARE_CARDS[kind](id) : null
}
