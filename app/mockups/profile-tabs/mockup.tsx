'use client'

import type { ReactNode } from 'react'

import type { Category } from '@/components/data-table/column-categories'
import type { RankMapGroup } from '@/components/detail/rank-map'
import type { PlayerStat } from '@/lib/rank-scale'
import type { UserRow } from '@/lib/rows'

import { ChartNoAxesGantt, ChevronDown, Columns3, LayoutDashboard, LayoutGrid } from 'lucide-react'
import { useState } from 'react'

import { CompactNumber } from '@/components/cells/compact-number'
import { TableAvatar } from '@/components/cells/table-avatar'
import { CategoryIcon } from '@/components/data-table/category-icon'
import { CATEGORY_META } from '@/components/data-table/column-categories'
import { Pagination } from '@/components/data-table/pagination'
import { DetailLayout, DetailSidebar, Fact, SidebarIdentity, SidebarSection } from '@/components/detail/detail-sidebar'
import { MemberTicks } from '@/components/detail/highlighted-player'
import { RankMap } from '@/components/detail/rank-map'
import { GROUP_COLOR, pointsGroup, premiumGroup, rankRow, wealthPartRows } from '@/components/detail/rank-row'
import { Stem, StemTrack } from '@/components/detail/stem'
import { Avatar } from '@/components/avatar'
import { Flag } from '@/components/flag'
import { PageSection } from '@/components/layout/page-section'
import { InternalLink } from '@/components/links'
import { Panel } from '@/components/panel'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/search-input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTab } from '@/components/ui/tabs'
import { formatNumber, formatRank, topPercent } from '@/lib/format'
import { memberRanks, RANK_MARKS, rankPosition } from '@/lib/rank-scale'
import { cn } from '@/lib/utils'

// Mockup only: fake party data (numbers from the Gulden Verbond screenshot) to compare layouts.

export const VARIANTS = {
  now: 'Now',
  p1: '1 · Ranks as the first tab',
  p2: '2 · Each tab shows its own ranks',
  p3: '3 · Summary tab of category cards',
  p4: '4 · Folded rank map',
  p5: '5 · Ranks move into the sidebar',
  w1: 'Wildcard A · Report card',
  w2: 'Wildcard B · Every member on the rank track',
} as const

export type Variant = keyof typeof VARIANTS

const NAME = 'Gulden Verbond'
const PARTIES = 887
const PLAYERS = 24930

const P = {
  totalPoints: 9237634, totalPointsRank: 14,
  damagePoints: 2.1e6, damagePointsRank: 31,
  wealthPoints: 3.8e6, wealthPointsRank: 10,
  levelPoints: 3.3e6, levelPointsRank: 18,
  avgPoints: 116932, avgPointsRank: 194,
  memberCount: 79, memberCountRank: 47,
  avgLevel: 41, avgLevelRank: 160,
  memberWealth: 3.8e6, memberWealthRank: 10,
  companiesWealth: 2.4e6, companiesWealthRank: 10,
  itemsWealth: 628900, itemsWealthRank: 16,
  cashWealth: 400600, cashWealthRank: 11,
  equipmentWealth: 265700, equipmentWealthRank: 13,
  weaponsWealth: 135200, weaponsWealthRank: 13,
  gemsPurchasedTotal: 122400, gemsPurchasedTotalRank: 6,
  premiumMonthsTotal: 315, premiumMonthsTotalRank: 4,
  premiumGiftsTotal: 159, premiumGiftsTotalRank: 8,
}

/* eslint-disable ts/no-explicit-any */
const GROUPS: RankMapGroup[] = [
  pointsGroup(P as any, 'Per member'),
  {
    title: 'Society',
    color: GROUP_COLOR.society,
    rows: [
      rankRow('Members', P.memberCount, P.memberCountRank),
      rankRow('Avg level', P.avgLevel, P.avgLevelRank, false, 'level'),
    ],
  },
  {
    title: 'Economy',
    color: GROUP_COLOR.economy,
    rows: [
      rankRow('Member wealth', P.memberWealth, P.memberWealthRank, true, 'wealth'),
      ...wealthPartRows(P as any),
    ],
  },
  premiumGroup(P as any),
]

// Seeded so every screenshot shows the same members.
let seed = 7
function rnd() {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}

const NAMES = [
  'Snorfiets', 'TimoVink', 'Redchadsper', 'Grasnaaier', 'Wimson', 'Kwark', 'Frikandellium', 'Raquiah', 'Japser',
  'Skaffaar', 'Mead', 'CornelisPomp', 'Marceaux', 'MorsigeJongen', 'Freya', 'RoomPomp', 'CaptainKibbles', 'MieskeB',
  'Edskie', 'RealChemicalEngineer', 'Hiervoorhandel', 'Flaky', 'Roekurwa', 'OpperKoopman', 'Stroopwafel', 'Dijkgraaf',
  'Polderjongen', 'Klompvoet', 'Hagelslag', 'Bitterbal', 'Tulpenkoning', 'Molenaar', 'Zeeuwsmeisje', 'Dropveter',
]
const STATS: PlayerStat[] = [
  'points', 'damagePoints', 'wealthPoints', 'levelPoints', 'level', 'wealth', 'companiesWealth', 'itemsWealth',
  'cashWealth', 'equipmentWealth', 'weaponsWealth', 'gemsPurchased', 'premiumMonths', 'premiumGifts',
]

interface Member {
  row: UserRow
  name: string
  points: number
  damage: number
  wealth: number
  level: number
  factories: number
  perDay: number
  auto: number
  pp: number
  efficiency: number
  employees: number
  gems: number
  cases: number
  pointsRank: number
}

const MEMBERS: Member[] = Array.from({ length: 79 }, (_, i) => {
  const strength = (1 - i / 79) ** 1.6
  const row: Record<string, unknown> = { id: `m${i}`, username: NAMES[i] ?? `Burger${i}` }
  for (const s of STATS) {
    const share = Math.min(0.98, (1 - strength) * 0.55 * (0.6 + rnd() * 0.8) + rnd() * 0.02)
    row[s] = 1
    row[`${s}Rank`] = 1 + Math.floor(share * share * (PLAYERS - 1))
  }
  const points = Math.round(400000 * strength + 20000 + rnd() * 30000)
  const perDay = 742 * strength + 150 + rnd() * 40

  return {
    row: row as unknown as UserRow,
    name: row.username as string,
    points,
    damage: Math.round(points * (0.15 + rnd() * 0.2)),
    wealth: Math.round(points * (0.3 + rnd() * 0.2)),
    level: Math.round(18 + 40 * strength + rnd() * 6),
    factories: 11 + Math.round(rnd() * 2),
    perDay,
    auto: perDay * (0.3 + rnd() * 0.15),
    pp: perDay * 13.5,
    efficiency: 0.64 + rnd() * 0.27,
    employees: Math.round(3 + rnd() * 9),
    gems: Math.round(strength * 6000 + rnd() * 400),
    cases: Math.round(strength * 400 + rnd() * 60),
    pointsRank: row.pointsRank as number,
  }
})
const RANKED = MEMBERS.map(m => memberRanks(m.row, STATS))

type Tab = 'ranks' | 'summary' | 'overview' | Category | 'all'

const CATEGORY_TABS: Category[] = ['points', 'combat', 'wealth', 'factories', 'employees', 'premium', 'cases']

interface Column {
  label: string
  cell: (m: Member) => ReactNode
}

const num = (n: number) => <span className="text-green-400">{formatNumber(Math.round(n))}</span>
const dec = (n: number) => <span className="text-green-400">{n.toFixed(1)}</span>

const COLUMNS: Partial<Record<Tab, Column[]>> = {
  overview: [
    { label: 'Level', cell: m => m.level },
    { label: 'Points', cell: m => num(m.points) },
    { label: 'Points rank', cell: m => formatRank(m.pointsRank) },
  ],
  points: [
    { label: 'Points', cell: m => num(m.points) },
    { label: 'Damage', cell: m => <CompactNumber value={m.damage} /> },
    { label: 'Wealth', cell: m => <CompactNumber value={m.wealth} /> },
    { label: 'Level', cell: m => <CompactNumber value={m.points - m.damage - m.wealth} /> },
  ],
  factories: [
    { label: '# Factories', cell: m => num(m.factories) },
    { label: 'Total / day', cell: m => dec(m.perDay) },
    { label: 'Auto / day', cell: m => dec(m.auto) },
    { label: 'PP / day', cell: m => <CompactNumber value={m.pp} /> },
    { label: 'Efficiency', cell: m => `${Math.round(m.efficiency * 100)}%` },
  ],
}

function Sidebar({ children }: { children?: ReactNode }) {
  return (
    <DetailSidebar wash="var(--muted)" avatar={<Avatar src={null} name={NAME} size={88} />}>
      <SidebarIdentity name={NAME} kind="party" id="mock">
        <Fact label="Country">
          <span className="inline-flex items-center gap-1.5">
            <Flag code="nl" />
            Netherlands
          </span>
        </Fact>
        <Fact label="Leader"><InternalLink href="#" bold>Snorfiets</InternalLink></Fact>
        <Fact label="Members">79</Fact>
        <Fact label="Founded">Mar 4, 2026</Fact>
      </SidebarIdentity>
      {children}
    </DetailSidebar>
  )
}

const TAB_META: Record<'ranks' | 'summary' | 'overview' | 'all', { label: string, Icon: typeof LayoutGrid }> = {
  ranks: { label: 'Ranks', Icon: ChartNoAxesGantt },
  summary: { label: 'Summary', Icon: LayoutDashboard },
  overview: { label: 'Overview', Icon: LayoutGrid },
  all: { label: 'All columns', Icon: Columns3 },
}

/**
 * The table's view tabs, as ColumnViewTabs draws them, with room for extra tabs and a badge per tab.
 */
function TabRow({ tabs, value, onChange, badge }: {
  tabs: Tab[]
  value: Tab
  onChange: (t: Tab) => void
  badge?: (t: Tab) => ReactNode
}) {
  return (
    <Tabs value={value} onValueChange={t => onChange(t as Tab)}>
      <TabsList className="-mx-6 overflow-x-auto px-6 [scrollbar-width:none] sm:mx-0 sm:px-0">
        {tabs.map((t) => {
          const special = t in TAB_META ? TAB_META[t as keyof typeof TAB_META] : null
          const label = special?.label ?? CATEGORY_META[t as Category].label

          return (
            <TabsTab
              key={t}
              value={t}
              title={label}
              className="inline-flex flex-1 items-center justify-center gap-1.5 px-2 md:flex-none md:px-4 xl:px-3"
            >
              {special ? <special.Icon className="size-4 xl:size-3.5" /> : <CategoryIcon category={t as Category} className="size-4 xl:size-3.5" />}
              <span className={cn(special && t !== 'all' ? 'sr-only sm:not-sr-only' : 'sr-only xl:not-sr-only')}>{label}</span>
              {badge?.(t)}
            </TabsTab>
          )
        })}
      </TabsList>
    </Tabs>
  )
}

const DEFAULT_TABS: Tab[] = ['overview', ...CATEGORY_TABS, 'all']

function Search() {
  return (
    <SearchInput
      readOnly
      value=""
      placeholder="Filter by username, country, MU, or party…"
      className="w-full max-w-xl"
    />
  )
}

/**
 * The members table, static. `track` adds a rank-track column for that stat.
 */
function MembersTable({ tab, rows = 10, track, partyRow }: {
  tab: Tab
  rows?: number
  track?: { stat: PlayerStat, color: string }
  partyRow?: boolean
}) {
  const columns = COLUMNS[tab] ?? COLUMNS.factories!
  const members = MEMBERS.slice(0, rows)

  return (
    <div className="space-y-3">
      <div className={cn(
        'border-input bg-card overflow-hidden border dark:bg-input/50',
        '-mx-6 rounded-none border-x-0 sm:mx-0 sm:rounded-md sm:border-x',
      )}
      >
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className={cn('w-44', track ? 'sm:w-44' : 'sm:w-56')}>User</TableHead>
              {track && (
                <TableHead className="relative hidden md:table-cell">
                  <div className="text-muted-foreground relative h-4 text-[10px] font-normal">
                    {RANK_MARKS.map(m => (
                      <span key={m.label} className="absolute -translate-x-1/2 tabular-nums" style={{ left: `${m.at}%` }}>{m.label}</span>
                    ))}
                  </div>
                </TableHead>
              )}
              {columns.map(c => <TableHead key={c.label} className={cn('w-24 text-right', !track && 'sm:w-28')}>{c.label}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {partyRow && track && (
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <TableAvatar src={null} name={NAME} />
                    <span className="truncate font-medium">{NAME}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-3">
                    <StemTrack className="h-4 flex-1">
                      <Stem pct={rankPosition(P.totalPointsRank, PARTIES)} color={track.color} />
                    </StemTrack>
                    <span className="text-muted-foreground w-28 shrink-0 text-right text-xs tabular-nums">
                      #14 of 887 parties
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(P.totalPoints)}</TableCell>
                <TableCell className="text-right"><CompactNumber value={P.damagePoints} /></TableCell>
                <TableCell className="text-right"><CompactNumber value={P.wealthPoints} /></TableCell>
                <TableCell className="text-right"><CompactNumber value={P.levelPoints} /></TableCell>
              </TableRow>
            )}
            {members.map(m => (
              <TableRow key={m.name}>
                <TableCell>
                  <div className="flex min-w-0 items-center gap-2">
                    <TableAvatar src={null} name={m.name} countryCode="nl" />
                    <InternalLink href="#" bold className="truncate">{m.name}</InternalLink>
                  </div>
                </TableCell>
                {track && (
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-3">
                      <StemTrack className="h-4 flex-1">
                        {RANK_MARKS.map(mark => (
                          <div key={mark.label} className="bg-muted-foreground/30 absolute top-1 h-2 w-px" style={{ left: `${mark.at}%` }} />
                        ))}
                        <Stem pct={rankPosition(m.pointsRank, PLAYERS)} color={track.color} />
                      </StemTrack>
                      <span className="text-muted-foreground w-28 shrink-0 text-right text-xs tabular-nums">
                        {formatRank(m.pointsRank)}
                        <span className="text-muted-foreground/60"> · {topPercent(m.pointsRank, PLAYERS)}</span>
                      </span>
                    </div>
                  </TableCell>
                )}
                {columns.map(c => <TableCell key={c.label} className="text-right tabular-nums">{c.cell(m)}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination pageIndex={0} pageCount={8} pageSize={rows} total={79} disabled={false} onPageChange={() => {}} onPageSizeChange={() => {}} />
    </div>
  )
}

function Members({ initial = 'factories' as Tab, tabs = DEFAULT_TABS, badge }: { initial?: Tab, tabs?: Tab[], badge?: (t: Tab) => ReactNode }) {
  const [tab, setTab] = useState<Tab>(initial)

  return (
    <PageSection title="Members">
      <Search />
      <TabRow tabs={tabs} value={tab} onChange={setTab} badge={badge} />
      <MembersTable tab={tab} />
    </PageSection>
  )
}

const MEMBERS_PROP = { rows: MEMBERS.map(m => m.row), noun: 'member', players: PLAYERS }

function FullRankMap({ groups = GROUPS }: { groups?: RankMapGroup[] }) {
  return <RankMap name={NAME} total={PARTIES} unit="parties" groups={groups} members={MEMBERS_PROP} />
}

/* ── 1 · Ranks as the first tab ─────────────────────────────────────── */

function P1() {
  const [tab, setTab] = useState<Tab>('ranks')

  return (
    <PageSection title="Party stats">
      <TabRow tabs={['ranks', ...DEFAULT_TABS]} value={tab} onChange={setTab} />
      {tab === 'ranks'
        ? <FullRankMap />
        : (
            <>
              <Search />
              <MembersTable tab={tab} />
            </>
          )}
    </PageSection>
  )
}

/* ── 2 · Each tab shows its own ranks ───────────────────────────────── */

const SLICE: Partial<Record<Tab, RankMapGroup[]>> = {
  overview: [GROUPS[1], { ...GROUPS[0], rows: [GROUPS[0].rows[0], GROUPS[0].rows[4]] }],
  points: [GROUPS[0]],
  combat: [{ ...GROUPS[0], title: 'Combat', color: GROUP_COLOR.combat, rows: [GROUPS[0].rows[1]] }],
  wealth: [GROUPS[2]],
  premium: [GROUPS[3]],
}

function P2() {
  const [tab, setTab] = useState<Tab>('points')
  const slice = SLICE[tab]

  return (
    <PageSection title="Members">
      <TabRow tabs={DEFAULT_TABS} value={tab} onChange={setTab} />
      {slice
        ? <FullRankMap groups={slice} />
        : <p className="text-muted-foreground text-sm">Parties aren&apos;t ranked on {CATEGORY_META[tab as Category]?.label.toLowerCase()} yet.</p>}
      <Search />
      <MembersTable tab={tab} />
    </PageSection>
  )
}

/* ── 3 · Summary tab of category cards ─────────────────────────────── */

interface Card {
  tab: Category | 'society'
  label: string
  value: ReactNode
  rank?: number
  stat?: PlayerStat
  color: string
  note: string
}

const CARDS: Card[] = [
  { tab: 'points', label: 'Points', value: formatNumber(P.totalPoints), rank: P.totalPointsRank, stat: 'points', color: GROUP_COLOR.points, note: '116,932 per member · #194' },
  { tab: 'combat', label: 'Combat', value: <CompactNumber value={P.damagePoints} />, rank: P.damagePointsRank, stat: 'damagePoints', color: GROUP_COLOR.combat, note: 'damage points, 23% of total' },
  { tab: 'wealth', label: 'Wealth', value: <CompactNumber value={P.memberWealth} />, rank: P.memberWealthRank, stat: 'wealth', color: GROUP_COLOR.economy, note: 'companies 2.4M · items 629K' },
  { tab: 'premium', label: 'Premium', value: <CompactNumber value={P.gemsPurchasedTotal} />, rank: P.gemsPurchasedTotalRank, stat: 'gemsPurchased', color: GROUP_COLOR.premium, note: 'gems · 315 months · 159 gifts' },
  { tab: 'society', label: 'Society', value: '79 members', rank: P.memberCountRank, stat: 'level', color: GROUP_COLOR.society, note: 'avg level 41 · #160' },
  { tab: 'factories', label: 'Factories', value: '1,004', color: 'var(--orange)', note: '36.2K / day · 76% efficiency' },
  { tab: 'employees', label: 'Employees', value: '512', color: 'var(--blue)', note: '18.4K / day paid out' },
  { tab: 'cases', label: 'Cases', value: '9,841', color: 'var(--green)', note: 'opened · 212 mythic' },
]

function SummaryCard({ c, onOpen }: { c: Card, onOpen: () => void }) {
  return (
    <Panel padding="sm" className="hover:border-foreground/30 flex cursor-pointer flex-col gap-2 transition-colors" onClick={onOpen}>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 font-medium">
          {c.tab === 'society'
            ? <span className="size-2 rounded-full" style={{ background: c.color }} />
            : <CategoryIcon category={c.tab} />}
          {c.label}
        </span>
        <span className="text-muted-foreground text-xs tabular-nums">
          {c.rank ? <>{formatRank(c.rank)}<span className="text-muted-foreground/60"> · {topPercent(c.rank, PARTIES)}</span></> : 'not ranked'}
        </span>
      </div>
      <div className="text-2xl leading-tight tabular-nums">{c.value}</div>
      <StemTrack className="h-4">
        {RANK_MARKS.map(m => <div key={m.label} className="bg-muted-foreground/45 absolute top-0.5 h-3 w-px -translate-x-1/2" style={{ left: `${m.at}%` }} />)}
        {c.stat && <MemberTicks stat={c.stat} members={RANKED} players={PLAYERS} color={c.color} />}
        {c.rank && <Stem pct={rankPosition(c.rank, PARTIES)} color={c.color} />}
      </StemTrack>
      <div className="text-muted-foreground text-xs">{c.note}</div>
      <div className="text-muted-foreground border-t pt-2 text-xs">
        Top: <span className="text-foreground">Snorfiets</span>, TimoVink, Redchadsper
      </div>
    </Panel>
  )
}

function P3() {
  const [tab, setTab] = useState<Tab>('summary')

  return (
    <PageSection title="Members">
      <TabRow tabs={['summary', ...CATEGORY_TABS, 'all']} value={tab} onChange={setTab} />
      {tab === 'summary'
        ? (
            <>
              <div className="text-muted-foreground text-xs">Ranked among 887 parties · ticks are the 79 members among 24,930 players</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                {CARDS.map(c => <SummaryCard key={c.label} c={c} onOpen={() => setTab(c.tab === 'society' ? 'overview' : c.tab)} />)}
              </div>
            </>
          )
        : (
            <>
              <Search />
              <MembersTable tab={tab} />
            </>
          )}
    </PageSection>
  )
}

/* ── 4 · Folded rank map ───────────────────────────────────────────── */

function P4() {
  const [open, setOpen] = useState(false)
  const groups = open ? GROUPS : GROUPS.map(g => ({ ...g, rows: g.rows.slice(0, 1) }))

  return (
    <>
      <div className="relative mb-3">
        <FullRankMap groups={groups} />
        <Button variant="outline" size="sm" className="bg-card text-muted-foreground absolute -bottom-3.5 left-1/2 -translate-x-1/2 rounded-full" onClick={() => setOpen(!open)}>
          {open ? 'Show less' : 'All 16 ranks'}
          <ChevronDown className={cn(open && 'rotate-180')} />
        </Button>
      </div>
      <Members />
    </>
  )
}

/* ── 5 · Ranks move into the sidebar ──────────────────────────────── */

function SidebarRanks() {
  return (
    <SidebarSection>
      <div className="text-muted-foreground text-xs">Ranks among 887 parties</div>
      {GROUPS.map(g => (
        <div key={g.title} className="space-y-1.5">
          <h3 className="text-xs font-medium tracking-wide uppercase" style={{ color: g.color }}>{g.title}</h3>
          {g.rows.map(r => (
            <div key={r.label} className="grid grid-cols-[minmax(0,1fr)_4.5rem_5.5rem] items-center gap-x-2 text-sm">
              <span className="text-muted-foreground truncate">{r.label}</span>
              <StemTrack className="h-3">
                {r.rank && <Stem pct={rankPosition(r.rank, PARTIES)} color={g.color} />}
              </StemTrack>
              <span className="text-right text-xs tabular-nums">
                {formatRank(r.rank)}
                <span className="text-muted-foreground/60"> · {topPercent(r.rank ?? 1, PARTIES)}</span>
              </span>
            </div>
          ))}
        </div>
      ))}
    </SidebarSection>
  )
}

/* ── Wildcard A · Report card ──────────────────────────────────────── */

function grade(rank: number, total: number) {
  const share = rank / total
  if (share <= 0.01) {
    return 'S'
  }
  if (share <= 0.03) {
    return 'A+'
  }
  if (share <= 0.1) {
    return 'A'
  }
  if (share <= 0.25) {
    return 'B'
  }

  return share <= 0.5 ? 'C' : 'D'
}

function W1() {
  return (
    <>
      <Panel as="section">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-medium">{NAME}&apos;s report card</h2>
          <span className="text-muted-foreground text-xs">S top 1% · A+ top 3% · A top 10% · B top 25% · C top half</span>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {GROUPS.map((g) => {
            const best = g.rows[0]

            return (
              <div key={g.title} className="rounded-md border p-3" style={{ background: `color-mix(in oklab, ${g.color} 8%, transparent)` }}>
                <div className="flex items-start justify-between">
                  <h3 className="text-xs font-medium tracking-wide uppercase" style={{ color: g.color }}>{g.title}</h3>
                  <span className="font-brand text-5xl leading-none" style={{ color: g.color }}>{grade(best.rank!, PARTIES)}</span>
                </div>
                <div className="mt-2 space-y-0.5">
                  {g.rows.map(r => (
                    <div key={r.label} className="flex justify-between gap-2 text-xs">
                      <span className="text-muted-foreground truncate">{r.label}</span>
                      <span className="tabular-nums">
                        <span className="text-muted-foreground/70 mr-1.5">{formatRank(r.rank)}</span>
                        <span className="font-medium">{grade(r.rank!, PARTIES)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </Panel>
      <Members />
    </>
  )
}

/* ── Wildcard B · Every member on the rank track ───────────────────── */

function W2() {
  const [tab, setTab] = useState<Tab>('points')

  return (
    <PageSection title="Members on the rank track">
      <Search />
      <TabRow
        tabs={['points', 'combat', 'wealth', 'factories', 'premium']}
        value={tab}
        onChange={setTab}
        badge={(t) => {
          const rank = { points: 14, combat: 31, wealth: 10, premium: 6 }[t as string]
          return rank && <span className="text-muted-foreground/70 hidden text-xs tabular-nums sm:inline">#{rank}</span>
        }}
      />
      <MembersTable tab="points" track={{ stat: 'points', color: GROUP_COLOR.points }} partyRow rows={12} />
    </PageSection>
  )
}

/* ── Page ─────────────────────────────────────────────────────────── */

export function Mockup({ v }: { v: Variant }) {
  const body = {
    now: <><FullRankMap /><Members /></>,
    p1: <P1 />,
    p2: <P2 />,
    p3: <P3 />,
    p4: <P4 />,
    p5: <Members />,
    w1: <W1 />,
    w2: <W2 />,
  }[v]

  return (
    <>
      <div className="text-muted-foreground mx-auto px-6 pt-4 text-sm" data-variant-label>{VARIANTS[v]}</div>
      <DetailLayout sidebar={<Sidebar>{v === 'p5' && <SidebarRanks />}</Sidebar>}>{body}</DetailLayout>
    </>
  )
}
