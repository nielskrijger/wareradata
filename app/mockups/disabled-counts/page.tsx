import type { ReactNode } from 'react'

import { PowerOff } from 'lucide-react'

import { TooltipHeading, TooltipRow } from '@/components/cells/tooltip-ledger'
import { Panel } from '@/components/panel'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

// Mockup only: fake rows to compare ways of showing disabled factories/employees.
interface Row {
  name: string
  factories: number
  offFactories: number
  employees: number
  offEmployees: number
  net: number
  open: number
}

const ROWS: Row[] = [
  { name: 'Kestrel', factories: 14, offFactories: 0, employees: 52, offEmployees: 0, net: 41200, open: 4 },
  { name: 'Marrowind', factories: 12, offFactories: 2, employees: 46, offEmployees: 6, net: 33900, open: 2 },
  { name: 'old_baron', factories: 11, offFactories: 11, employees: 31, offEmployees: 31, net: 0, open: 0 },
  { name: 'Vasquez', factories: 10, offFactories: 0, employees: 38, offEmployees: 0, net: 28100, open: 6 },
  { name: 'tinker_tom', factories: 9, offFactories: 3, employees: 27, offEmployees: 9, net: 15400, open: 1 },
  { name: 'Ilse', factories: 8, offFactories: 0, employees: 30, offEmployees: 0, net: 22700, open: 0 },
  { name: 'Nordmark', factories: 7, offFactories: 1, employees: 22, offEmployees: 4, net: 14100, open: 3 },
  { name: 'pilgrim', factories: 6, offFactories: 0, employees: 18, offEmployees: 0, net: 9800, open: 2 },
]

const VARIANTS = {
  now: 'Now',
  a: 'A · Muted note',
  b: 'B · Running / total (11/13)',
  b2: 'B2 · Total / running (13/11)',
  c: 'C · Icon badge',
  d: 'D · Tooltip only',
  e: 'E · Own columns',
  f: 'F · Amber dot',
  g: 'G · Mini split bar',
  h: 'H · Second line',
  i: 'I · Minus superscript',
  j: 'J · Tinted number',
  w1: 'Wildcard 1 · Pill in the name cell',
  w2: 'Wildcard 2 · Pie glyph',
} as const

type Variant = keyof typeof VARIANTS

interface CountProps {
  v: Variant
  total: number
  off: number
  noun: [string, string]
}

function Breakdown({ total, off, noun }: Omit<CountProps, 'v'>) {
  const [one, many] = noun

  return (
    <div className="min-w-44">
      <TooltipHeading label={many[0].toUpperCase() + many.slice(1)}>{formatNumber(total)}</TooltipHeading>
      <TooltipRow label={noun[1] === 'factories' ? 'Running' : 'Working'}>{formatNumber(total - off)}</TooltipRow>
      <TooltipRow label={noun[1] === 'factories' ? 'Disabled' : `In disabled ${off === 1 ? 'factory' : 'factories'}`}>
        <span className="text-amber-300">{formatNumber(off)}</span>
      </TooltipRow>
      <div className="mt-1.5 max-w-52 text-neutral-400">
        {one === 'factory' ? 'Disabled factories produce nothing.' : 'They earn nothing until the factory is on again.'}
      </div>
    </div>
  )
}

function Tip({ children, content }: { children: ReactNode, content: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="cursor-default" />}>{children}</TooltipTrigger>
      <TooltipContent side="top">{content}</TooltipContent>
    </Tooltip>
  )
}

/**
 * One table count cell in the given style.
 */
function Count({ v, total, off, noun }: CountProps) {
  const shown = v === 'now' && noun[1] === 'employees' ? total - off : total
  if (off === 0 || v === 'now' || v === 'e' || v === 'w1') {
    return <>{formatNumber(shown)}</>
  }

  const tip = <Breakdown total={total} off={off} noun={noun} />

  if (v === 'a') {
    return (
      <Tip content={tip}>
        <span className="text-muted-foreground mr-1.5 text-xs">{off === total ? 'all off' : `${off} off`}</span>
        {formatNumber(total)}
      </Tip>
    )
  }

  if (v === 'b') {
    return (
      <Tip content={tip}>
        <span className={cn(off === total && 'text-muted-foreground')}>{formatNumber(total - off)}</span>
        <span className="text-muted-foreground">/{formatNumber(total)}</span>
      </Tip>
    )
  }

  if (v === 'b2') {
    return (
      <Tip content={tip}>
        {formatNumber(total)}
        <span className="text-muted-foreground">/</span>
        <span className={off === total ? 'text-muted-foreground' : 'text-amber-700 dark:text-amber-300'}>{formatNumber(total - off)}</span>
      </Tip>
    )
  }

  if (v === 'c') {
    return (
      <Tip content={tip}>
        <span className="mr-1.5 inline-flex items-center gap-0.5 rounded bg-amber-500/15 px-1 align-[1px] text-[11px] leading-4 text-amber-700 dark:text-amber-300">
          <PowerOff className="size-3" />
          {off}
        </span>
        {formatNumber(total)}
      </Tip>
    )
  }

  const share = off / total

  if (v === 'f') {
    return (
      <Tip content={tip}>
        <span className="mr-1.5 inline-block size-1.5 rounded-full bg-amber-500 align-middle dark:bg-amber-400" />
        {formatNumber(total)}
      </Tip>
    )
  }

  if (v === 'g') {
    return (
      <Tip content={tip}>
        <span className="mr-2 inline-flex h-1.5 w-6 overflow-hidden rounded-full bg-amber-500/80 align-middle">
          <span className="bg-heat-green h-full" style={{ width: `${(1 - share) * 100}%` }} />
        </span>
        {formatNumber(total)}
      </Tip>
    )
  }

  if (v === 'h') {
    return (
      <Tip content={tip}>
        <span className="inline-flex flex-col items-end leading-tight">
          {formatNumber(total)}
          <span className="text-[10px] text-amber-700 dark:text-amber-300/90">{off === total ? 'all off' : `${off} off`}</span>
        </span>
      </Tip>
    )
  }

  if (v === 'i') {
    return (
      <Tip content={tip}>
        {formatNumber(total)}
        <sup className="ml-0.5 inline-block w-5 text-left text-[10px] text-amber-700 dark:text-amber-300">−{off}</sup>
      </Tip>
    )
  }

  if (v === 'j') {
    return (
      <Tip content={tip}>
        <span className={off === total ? 'text-muted-foreground line-through decoration-1' : 'text-amber-700 dark:text-amber-300'}>
          {formatNumber(total)}
        </span>
      </Tip>
    )
  }

  if (v === 'w2') {
    return (
      <Tip content={tip}>
        <span
          className="mr-1.5 inline-block size-3 rounded-full align-[-1px]"
          style={{ background: `conic-gradient(var(--color-amber-400) 0 ${share * 360}deg, color-mix(in oklch, var(--muted-foreground) 35%, transparent) 0)` }}
        />
        {formatNumber(total)}
      </Tip>
    )
  }

  return (
    <Tip content={tip}>
      <span className="decoration-amber-400/70 underline decoration-dotted underline-offset-4">{formatNumber(total)}</span>
    </Tip>
  )
}

/**
 * Wildcard 1: one pill after the name, the counts stay untouched.
 */
function OffPill({ total, factories, employees }: { total: number, factories: number, employees: number }) {
  if (factories === 0) {
    return null
  }

  return (
    <Tip content={<Breakdown total={total} off={factories} noun={['factory', 'factories']} />}>
      <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-amber-500/40 px-1.5 text-[11px] leading-4 font-normal text-amber-700 dark:text-amber-300">
        <PowerOff className="size-3" />
        {factories} off · {employees} idle
      </span>
    </Tip>
  )
}

function OffCell({ n }: { n: number }) {
  return n === 0
    ? <span className="text-muted-foreground">0</span>
    : <span className="text-amber-700 dark:text-amber-300">{formatNumber(n)}</span>
}

const plural = (n: number, one: string, many: string) => `${formatNumber(n)} ${n === 1 ? one : many}`

/**
 * The user-page Factories card header in the given style.
 */
function UserHeader({ v }: { v: Variant }) {
  const f = 12
  const fOff = 2
  const e = 46
  const eOff = 6
  const muted = 'text-muted-foreground'
  const tipF = <Breakdown total={f} off={fOff} noun={['factory', 'factories']} />
  const tipE = <Breakdown total={e} off={eOff} noun={['employee', 'employees']} />

  let summary: ReactNode
  if (v === 'now') {
    summary = `${plural(f, 'factory', 'factories')} · ${fOff} disabled · ${plural(e - eOff, 'employee', 'employees')}`
  } else if (v === 'a') {
    summary = (
      <>
        {plural(f, 'factory', 'factories')} <span className="opacity-70">({fOff} off)</span>
        {' · '}
        {plural(e, 'employee', 'employees')} <span className="opacity-70">({eOff} off)</span>
      </>
    )
  } else if (v === 'b') {
    summary = (
      <>
        <span className="text-foreground">{f - fOff}</span>/{f} factories running
        {' · '}
        <span className="text-foreground">{e - eOff}</span>/{e} employees working
      </>
    )
  } else if (v === 'b2') {
    summary = (
      <>
        <span className="text-foreground">{f}</span>/<span className="text-amber-700 dark:text-amber-300">{f - fOff}</span> factories running
        {' · '}
        <span className="text-foreground">{e}</span>/<span className="text-amber-700 dark:text-amber-300">{e - eOff}</span> employees working
      </>
    )
  } else if (v === 'c') {
    summary = (
      <span className="inline-flex items-center gap-1.5">
        {plural(f, 'factory', 'factories')}
        <Count v="c" total={f} off={fOff} noun={['factory', 'factories']} />
        {' · '}
        {plural(e, 'employee', 'employees')}
      </span>
    )
  } else if (v === 'd') {
    summary = (
      <>
        <Tip content={tipF}>
          <span className="decoration-amber-400/70 underline decoration-dotted underline-offset-4">{plural(f, 'factory', 'factories')}</span>
        </Tip>
        {' · '}
        <Tip content={tipE}>
          <span className="decoration-amber-400/70 underline decoration-dotted underline-offset-4">{plural(e, 'employee', 'employees')}</span>
        </Tip>
      </>
    )
  } else if (v === 'w1') {
    summary = (
      <span className="inline-flex items-center">
        {plural(f, 'factory', 'factories')} · {plural(e, 'employee', 'employees')}
        <OffPill total={f} factories={fOff} employees={eOff} />
      </span>
    )
  } else if (v !== 'e') {
    summary = (
      <span className="inline-flex items-center gap-1">
        <Count v={v} total={f} off={fOff} noun={['factory', 'factories']} /> factories
        {' · '}
        <Count v={v} total={e} off={eOff} noun={['employee', 'employees']} /> employees
      </span>
    )
  } else {
    summary = (
      <>
        {plural(f, 'factory', 'factories')} · {plural(e, 'employee', 'employees')}
        {' · '}
        <span className="text-amber-700 dark:text-amber-300">{fOff} disabled, {eOff} idle</span>
      </>
    )
  }

  // C keeps the icon badge's own markup; the rest are one muted text run.
  const badgeOnly = !['now', 'a', 'b', 'b2', 'd', 'e'].includes(v)

  return (
    <Panel as="section" padding="none" className="overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-4 sm:px-5">
        <h2 className="font-medium">Factories</h2>
        <span className={cn('text-xs tabular-nums', muted, badgeOnly && 'self-center')}>{summary}</span>
      </div>
    </Panel>
  )
}

export default async function Page({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  const raw = (await searchParams).v ?? 'now'
  const v: Variant = raw in VARIANTS ? raw as Variant : 'now'

  return (
    <main className="space-y-4 px-4 py-6 sm:px-6">
      <div className="flex items-baseline gap-3">
        <h1 className="text-lg font-medium">{VARIANTS[v]}</h1>
        <span className="text-muted-foreground text-xs">Players table, Factories + Employees columns · same cells on MUs, countries and alliances</span>
      </div>
      <Panel padding="none" className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={v === 'w1' ? 'w-64' : 'w-40'}>Player</TableHead>
              <TableHead className="text-right"># Factories</TableHead>
              {v === 'e' && <TableHead className="text-right">Disabled</TableHead>}
              <TableHead className="text-right">Total / day</TableHead>
              <TableHead className="text-right"># Employees</TableHead>
              {v === 'e' && <TableHead className="text-right">Idle</TableHead>}
              <TableHead className="text-right">Open slots</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROWS.map(r => (
              <TableRow key={r.name}>
                <TableCell className="font-medium">
                  {r.name}
                  {v === 'w1' && <OffPill total={r.factories} factories={r.offFactories} employees={r.offEmployees} />}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <Count v={v} total={r.factories} off={r.offFactories} noun={['factory', 'factories']} />
                </TableCell>
                {v === 'e' && <TableCell className="text-right tabular-nums"><OffCell n={r.offFactories} /></TableCell>}
                <TableCell className="text-right tabular-nums">{r.net ? formatNumber(r.net) : <span className="text-muted-foreground">0</span>}</TableCell>
                <TableCell className="text-right tabular-nums">
                  <Count v={v} total={r.employees} off={r.offEmployees} noun={['employee', 'employees']} />
                </TableCell>
                {v === 'e' && <TableCell className="text-right tabular-nums"><OffCell n={r.offEmployees} /></TableCell>}
                <TableCell className="text-right tabular-nums">{r.open}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
      <div className="text-muted-foreground pt-2 text-xs">User page, Factories card header</div>
      <UserHeader v={v} />
    </main>
  )
}
