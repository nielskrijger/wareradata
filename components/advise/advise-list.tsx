'use client'

import type { AdviseRow } from './rows'
import type { AdvisorResult, TodoItem } from '@/lib/advisor/types'
import { Check, ChevronRight, RefreshCw, TriangleAlert } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { ProgressRing } from '@/components/progress-ring'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { SMALL_GAIN_PER_DAY, splitBySize } from './rows'

interface Props {
  result: AdvisorResult
  user: { id: string, name: string }
}

const KIND: Record<TodoItem['kind'], { label: string, color: string }> = {
  money: { label: 'Money', color: 'var(--heat-red)' },
  item: { label: 'Production', color: 'var(--heat-gold)' },
  manager: { label: 'Manager', color: 'var(--heat-purple)' },
  train: { label: 'Training', color: 'var(--fire)' },
  tool: { label: 'Tools', color: 'var(--heat-teal)' },
  employee: { label: 'Staff', color: 'var(--heat-blue)' },
  hire: { label: 'Hiring', color: 'var(--heat-green)' },
  work: { label: 'Work', color: 'var(--heat-slate)' },
}

const GAIN = 'var(--heat-green)'

/**
 * Shared by the header and every row, so the columns line up.
 */
const COLUMNS = 'md:grid-cols-[28px_minmax(0,1fr)_110px_70px_140px]'

function gain(value: number): string {
  return `+${value.toFixed(2)}`
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`
}

function sum(rows: AdviseRow[], key: 'gainPerDay' | 'energy'): number {
  return rows.reduce((s, r) => s + r[key], 0)
}

/**
 * The advice, most profitable first: a bar of where the gain comes from, then
 * a table of the big wins with the small stuff folded away below.
 */
export function AdviseList({ result, user }: Props) {
  const money = result.items.find(i => i.kind === 'money')
  const { big, small } = splitBySize(result.items.filter(i => i.kind !== 'money'))
  const total = sum(big, 'gainPerDay') + sum(small, 'gainPerDay')

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-brand text-4xl leading-none tracking-wide">Advise</h1>
          <p className="text-muted-foreground text-sm">
            Best next actions for
            {' '}
            <Link href={`/users/${user.id}`} className="text-fire hover:underline">{user.name}</Link>
            , priced at today&apos;s market.
          </p>
        </div>
        <RefreshButton />
      </header>

      {total > 0
        ? <ShareBar big={big} small={small} total={total} />
        : <AllSet />}

      <div className="grid gap-3 md:grid-cols-2">
        <EnergyCard energy={result.energy} needed={sum(big, 'energy')} />
        {money && <MoneyCard item={money} />}
      </div>

      {(big.length > 0 || small.length > 0) && (
        <div className="bg-card overflow-hidden rounded-xl border text-sm">
          <div className={cn(
            'text-muted-foreground bg-muted/40 hidden items-center gap-3 px-4 py-2 text-xs font-medium md:grid',
            COLUMNS,
          )}
          >
            <span>#</span>
            <span>Action</span>
            <span>Kind</span>
            <span className="text-right">Energy</span>
            <span className="text-right">Gain/day · running</span>
          </div>
          <ol>
            {big.map((row, i) => (
              <Row
                key={row.id}
                row={row}
                rank={i + 1}
                running={sum(big.slice(0, i + 1), 'gainPerDay') / total}
              />
            ))}
          </ol>
          {small.length > 0 && (
            <SmallStuff rows={small} start={big.length + 1} open={big.length === 0} />
          )}
        </div>
      )}

      {result.skipped.length > 0 && (
        <aside className="bg-card flex flex-col gap-2 rounded-xl border p-4">
          <h2 className="text-sm font-semibold">Checked and skipped</h2>
          <ul className="text-muted-foreground flex flex-col gap-1.5 text-sm">
            {result.skipped.map(s => (
              <li key={s.title}>
                <span className="text-foreground">{s.title}</span>
                {': '}
                {s.why}
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  )
}

/**
 * Each big win as a slice of the total, small stuff as one striped slice.
 */
function ShareBar({ big, small, total }: { big: AdviseRow[], small: AdviseRow[], total: number }) {
  const smallGain = sum(small, 'gainPerDay')
  const top = big.slice(0, 2)
  const things = (n: number) => `${n} small ${n === 1 ? 'thing' : 'things'}`
  const topText = top.length > 0
    ? `The first ${top.length === 1 ? 'action is' : '2 are'} ${pct(sum(top, 'gainPerDay') / total)} of it.`
    : ''

  return (
    <section className="bg-card flex flex-col gap-3 rounded-xl border p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">
          Where the
          {' '}
          <span className="font-mono" style={{ color: GAIN }}>
            {gain(total)}
            {' '}
            g/day
          </span>
          {' '}
          comes from
        </h2>
        <p className="text-muted-foreground text-sm">
          {topText}
          {small.length > 0 && ` The striped end is ${things(small.length)}.`}
        </p>
      </div>
      <div className="flex h-8 gap-0.5 overflow-hidden rounded-lg">
        {big.map(row => (
          <span
            key={row.id}
            title={`${row.title}: ${gain(row.gainPerDay)}/day`}
            className="flex min-w-0 items-center"
            style={{ flex: row.gainPerDay, background: KIND[row.kind].color }}
          >
            {row.gainPerDay / total >= 0.12 && (
              <span className="hidden truncate px-2 text-xs font-semibold text-black md:inline">
                {row.title}
                {' · '}
                {gain(row.gainPerDay)}
              </span>
            )}
          </span>
        ))}
        {smallGain > 0 && (
          <span
            title={`Small stuff: ${gain(smallGain)}/day`}
            style={{
              flex: smallGain,
              background: 'repeating-linear-gradient(45deg, var(--muted-foreground) 0 2px, transparent 2px 7px)',
              opacity: 0.45,
            }}
          />
        )}
      </div>
      {/* Phones have no room for labels in the bar, so the slices are listed below it. */}
      <ul className="flex flex-col gap-1 text-xs md:hidden">
        {big.map(row => (
          <li key={row.id} className="flex items-center gap-2">
            <span className="size-2 shrink-0 rounded-full" style={{ background: KIND[row.kind].color }} />
            <span className="min-w-0 flex-1 truncate">{row.title}</span>
            <span className="text-muted-foreground font-mono tabular-nums">{pct(row.gainPerDay / total)}</span>
          </li>
        ))}
        {smallGain > 0 && (
          <li className="text-muted-foreground flex items-center gap-2">
            <span className="bg-muted-foreground/45 size-2 shrink-0 rounded-full" />
            <span className="flex-1">{`${things(small.length)}`}</span>
            <span className="font-mono tabular-nums">{pct(smallGain / total)}</span>
          </li>
        )}
      </ul>
    </section>
  )
}

function Row({ row, rank, running, small }: { row: AdviseRow, rank: number, running?: number, small?: boolean }) {
  const kind = KIND[row.kind]

  return (
    <li className={cn(
      'grid grid-cols-[20px_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1.5 border-t px-4 py-3 first:border-t-0',
      'md:items-center md:py-2.5',
      COLUMNS,
      small && 'bg-muted/20',
    )}
    >
      <span className="text-muted-foreground pt-0.5 font-mono text-xs md:pt-0">{rank}</span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className={cn(small ? 'font-medium' : 'font-semibold')}>{row.title}</span>
        {row.parts.length > 0 && (
          <span className="flex flex-wrap gap-1.5">
            {row.parts.map(p => (
              <span key={p.short} className="bg-muted/60 rounded-md px-1.5 py-0.5 text-xs">
                {p.short}
                {' '}
                <span className="font-mono" style={{ color: GAIN }}>{gain(p.gainPerDay)}</span>
              </span>
            ))}
          </span>
        )}
        <span className="text-muted-foreground max-w-[70ch] text-xs">{row.why}</span>
      </span>
      <span className="col-start-2 flex items-center gap-1.5 text-xs md:col-start-auto">
        <span className="size-2 shrink-0 rounded-full" style={{ background: kind.color }} />
        {kind.label}
        {row.energy > 0 && (
          <span className="md:hidden" style={{ color: 'var(--fire)' }}>{` · ${row.energy} energy`}</span>
        )}
      </span>
      <span className="hidden text-right text-xs md:block" style={{ color: 'var(--fire)' }}>
        {row.energy > 0 ? row.energy : ''}
      </span>
      <span className="col-start-3 row-start-1 flex flex-col items-end gap-0.5 md:col-start-auto md:row-start-auto
        md:flex-row md:items-baseline md:justify-end md:gap-3"
      >
        <span className={cn('font-mono tabular-nums', small ? 'text-sm' : 'text-base')} style={{ color: GAIN }}>
          {gain(row.gainPerDay)}
        </span>
        {running != null && (
          <span className="text-muted-foreground text-right font-mono text-xs tabular-nums md:w-9">{pct(running)}</span>
        )}
      </span>
    </li>
  )
}

function SmallStuff({ rows, start, open }: { rows: AdviseRow[], start: number, open: boolean }) {
  return (
    <details open={open} className="group border-t">
      <summary className="text-muted-foreground hover:text-foreground flex cursor-pointer list-none items-center
        justify-between gap-3 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <ChevronRight aria-hidden className="size-4 shrink-0 transition-transform group-open:rotate-90" />
          {`${rows.length} small ${rows.length === 1 ? 'thing' : 'things'}, each under ${SMALL_GAIN_PER_DAY} g/day`}
        </span>
        <span className="shrink-0 font-mono whitespace-nowrap" style={{ color: GAIN }}>
          {gain(sum(rows, 'gainPerDay'))}
          <span className="hidden sm:inline"> together</span>
        </span>
      </summary>
      <ol className="border-t">
        {rows.map((row, i) => <Row key={row.id} row={row} rank={start + i} small />)}
      </ol>
    </details>
  )
}

function AllSet() {
  return (
    <section
      className="flex flex-col items-center gap-2 rounded-xl border px-6 py-8 text-center"
      style={{ background: `color-mix(in oklch, ${GAIN} 8%, var(--card))` }}
    >
      <span
        className="flex size-11 items-center justify-center rounded-full"
        style={{ background: `color-mix(in oklch, ${GAIN} 18%, transparent)`, color: GAIN }}
      >
        <Check aria-hidden className="size-5" />
      </span>
      <h2 className="text-lg font-semibold">You&apos;re all set</h2>
      <p className="text-muted-foreground max-w-md text-sm">
        Nothing pays off right now. Check back after your energy refills or prices move.
      </p>
    </section>
  )
}

/**
 * Re-renders the page on the server, so advice reflects what the player just did.
 */
function RefreshButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      <RefreshCw aria-hidden className={cn('size-3.5', pending && 'animate-spin')} />
      {pending ? 'Refreshing' : 'Refresh'}
    </Button>
  )
}

function EnergyCard({ energy, needed }: { energy: AdvisorResult['energy'], needed: number }) {
  const short = Math.max(0, needed - energy.current)
  const refill = energy.hoursToFull <= 0
    ? 'full'
    : Number.isFinite(energy.hoursToFull) ? `full in ${energy.hoursToFull.toFixed(1)} h` : 'not refilling'

  return (
    <div className="bg-card flex items-center gap-4 rounded-xl border p-4">
      <ProgressRing fraction={energy.cap > 0 ? energy.current / energy.cap : 0} color="var(--fire)">
        {energy.current.toFixed(0)}
      </ProgressRing>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-muted-foreground text-xs">Energy</span>
        <span className="text-lg font-semibold tabular-nums">{`${energy.current.toFixed(0)} of ${energy.cap}`}</span>
        <span className="text-muted-foreground text-xs">
          {short > 0
            ? `The big wins need ${needed}, ${short} more than you have · ${refill}`
            : `+${energy.regenPerHour}/h · ${refill}`}
        </span>
      </div>
    </div>
  )
}

function MoneyCard({ item }: { item: TodoItem }) {
  const color = KIND.money.color

  return (
    <div
      role="alert"
      className="flex items-center gap-4 rounded-xl border p-4"
      style={{ background: `color-mix(in oklch, ${color} 10%, var(--card))`, borderColor: color }}
    >
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-full text-black"
        style={{ background: color }}
      >
        <TriangleAlert aria-hidden className="size-5" />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <strong className="text-sm font-semibold">{item.title}</strong>
        <span className="text-muted-foreground text-xs">{item.why}</span>
      </span>
    </div>
  )
}
