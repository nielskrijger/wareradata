'use client'

import type { LucideIcon } from 'lucide-react'
import type { AdvisorResult, TodoItem } from '@/lib/advisor/types'
import {
  ArrowLeftRight,
  Check,
  GraduationCap,
  Hammer,
  TriangleAlert,
  UserCog,
  UserMinus,
  UserPlus,
  Wrench,
} from 'lucide-react'
import { useState } from 'react'

import { goldSigned } from '@/components/factories/format'
import { ProgressRing } from '@/components/progress-ring'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Props {
  result: AdvisorResult
}

const KIND: Record<TodoItem['kind'], { label: string, color: string, icon: LucideIcon }> = {
  money: { label: 'Money', color: 'var(--heat-red)', icon: TriangleAlert },
  item: { label: 'Production', color: 'var(--heat-gold)', icon: ArrowLeftRight },
  manager: { label: 'Manager', color: 'var(--heat-purple)', icon: UserCog },
  train: { label: 'Training', color: 'var(--fire)', icon: GraduationCap },
  tool: { label: 'Tools', color: 'var(--heat-teal)', icon: Wrench },
  employee: { label: 'Staff', color: 'var(--heat-blue)', icon: UserMinus },
  hire: { label: 'Hiring', color: 'var(--heat-green)', icon: UserPlus },
  work: { label: 'Work', color: 'var(--heat-slate)', icon: Hammer },
}

const GAIN = 'var(--heat-green)'

function tint(color: string, pct: number): string {
  return `color-mix(in oklch, ${color} ${pct}%, transparent)`
}

function perDay(value: number): string {
  return `${goldSigned(value, 2)}/day`
}

function hours(value: number): string {
  return Number.isFinite(value) ? `${value.toFixed(1)} h` : 'never'
}

/**
 * The ranked to-do list. Each row's green bar is its gain next to the best one,
 * and ticking rows fills the energy and gain rings.
 *
 * Ticks live only in this tab: the list is rebuilt from the API on each load.
 */
export function AdviseTodo({ result }: Props) {
  const [done, setDone] = useState<Set<string>>(() => new Set())
  const toggle = (id: string) => setDone((prev) => {
    const next = new Set(prev)
    if (!next.delete(id)) {
      next.add(id)
    }

    return next
  })

  const { energy } = result
  const money = result.items.find(i => i.kind === 'money')
  const items = result.items.filter(i => i.kind !== 'money')
  const total = items.reduce((s, i) => s + (i.gainPerDay ?? 0), 0)
  const best = Math.max(0, ...items.map(i => i.gainPerDay ?? 0))
  const ticked = items.filter(i => done.has(i.id))
  const spent = ticked.reduce((s, i) => s + (i.energy ?? 0), 0)
  const banked = ticked.reduce((s, i) => s + (i.gainPerDay ?? 0), 0)
  const planned = items.reduce((s, i) => s + (i.energy ?? 0), 0) - spent
  const left = Math.max(0, energy.current - spent)
  const short = Math.max(0, planned - left)

  return (
    <div className="flex flex-col gap-5">
      <header className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div
          className="flex flex-col justify-center gap-2 rounded-xl border p-5"
          style={{
            background: `linear-gradient(135deg, ${tint('var(--fire)', 22)}, var(--card) 70%)`,
            borderColor: tint('var(--fire)', 40),
          }}
        >
          <h1 className="font-brand text-5xl leading-none tracking-wide">Today&apos;s to-do</h1>
          <p className="text-muted-foreground text-sm">
            Do all of it and you earn
            {' '}
            <strong className="font-mono" style={{ color: GAIN }}>{perDay(total)}</strong>
            {' '}
            more, priced at today&apos;s market.
          </p>
        </div>
        <RingCard
          label="Energy left"
          value={`${left.toFixed(0)} of ${energy.cap}`}
          sub={short > 0
            ? `${short} short for the whole list`
            : `+${energy.regenPerHour}/h · full in ${hours(energy.hoursToFull)}`}
          center={left.toFixed(0)}
          fraction={energy.cap > 0 ? left / energy.cap : 0}
          color="var(--fire)"
        />
        <RingCard
          label="Gain locked in"
          value={perDay(banked)}
          valueColor={GAIN}
          sub={`${ticked.length} of ${items.length} done`}
          center={`${total > 0 ? Math.round((banked / total) * 100) : 0}%`}
          fraction={total > 0 ? banked / total : 0}
          color={GAIN}
        />
      </header>

      {money && <MoneyBanner item={money} />}

      {items.length === 0
        ? (
            <p className="text-muted-foreground bg-card rounded-xl border px-4 py-6 text-sm">
              Nothing worth doing right now.
            </p>
          )
        : (
            <ol className="flex flex-col gap-2">
              {items.map((item, i) => (
                <Row
                  key={item.id}
                  item={item}
                  rank={i + 1}
                  share={best > 0 ? (item.gainPerDay ?? 0) / best : 0}
                  done={done.has(item.id)}
                  onToggle={() => toggle(item.id)}
                />
              ))}
            </ol>
          )}

      {result.skipped.length > 0 && (
        <aside className="bg-card flex flex-col gap-2 rounded-xl border p-4">
          <h2 className="text-sm font-semibold">Not worth it today</h2>
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

function Row({ item, rank, share, done, onToggle }: {
  item: TodoItem
  rank: number
  share: number
  done: boolean
  onToggle: () => void
}) {
  const kind = KIND[item.kind]
  const Icon = kind.icon

  return (
    <li className={cn('bg-card relative overflow-hidden rounded-xl border', done && 'opacity-60')}>
      <div
        aria-hidden
        className="absolute inset-y-0 left-0"
        style={{
          width: `${Math.round(share * 100)}%`,
          background: `linear-gradient(90deg, ${tint(GAIN, 20)}, ${tint(GAIN, 4)})`,
        }}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={done}
        className="relative grid w-full grid-cols-[32px_20px_minmax(0,1fr)] items-center gap-3 px-4 py-3 text-left
          sm:grid-cols-[40px_20px_minmax(0,1fr)_auto]"
      >
        <span className="font-brand text-center text-3xl leading-none" style={{ color: 'var(--fire)' }}>{rank}</span>
        <span
          className={cn(
            'flex size-5 items-center justify-center rounded border-2',
            done ? 'border-green-700 bg-green-700 text-white' : 'border-border',
          )}
        >
          {done && <Check aria-hidden className="size-3.5" strokeWidth={3} />}
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" style={{ color: kind.color, borderColor: kind.color }}>
              <Icon aria-hidden />
              {kind.label}
            </Badge>
            <span className={cn('text-sm font-semibold', done && 'line-through')}>{item.title}</span>
          </span>
          <span className="text-muted-foreground text-xs">{item.why}</span>
        </span>
        <span className="col-start-3 flex items-baseline gap-3 sm:col-start-auto sm:flex-col sm:items-end sm:gap-0.5">
          <span className="font-mono text-base tabular-nums sm:text-lg" style={{ color: GAIN }}>
            {item.gainPerDay != null ? perDay(item.gainPerDay) : 'unpriced'}
          </span>
          <span
            className={cn('text-xs whitespace-nowrap', !item.energy && 'text-muted-foreground')}
            style={(item.energy ?? 0) > 0 ? { color: 'var(--fire)' } : undefined}
          >
            {(item.energy ?? 0) > 0 ? `${item.energy} energy` : 'no energy'}
          </span>
        </span>
      </button>
    </li>
  )
}

function MoneyBanner({ item }: { item: TodoItem }) {
  const color = KIND.money.color

  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-xl border px-4 py-3"
      style={{ background: tint(color, 12), borderColor: color }}
    >
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-black"
        style={{ background: color }}
      >
        <TriangleAlert aria-hidden className="size-4" />
      </span>
      <span className="flex flex-col gap-0.5">
        <strong className="text-sm font-semibold">{item.title}</strong>
        <span className="text-muted-foreground text-xs">{item.why}</span>
      </span>
    </div>
  )
}

function RingCard({ label, value, valueColor, sub, center, fraction, color }: {
  label: string
  value: string
  valueColor?: string
  sub: string
  center: string
  fraction: number
  color: string
}) {
  return (
    <div className="bg-card flex items-center gap-4 rounded-xl border p-4">
      <ProgressRing fraction={fraction} color={color}>{center}</ProgressRing>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-muted-foreground text-xs">{label}</span>
        <span className="text-lg font-semibold tabular-nums" style={valueColor ? { color: valueColor } : undefined}>
          {value}
        </span>
        <span className="text-muted-foreground text-xs">{sub}</span>
      </div>
    </div>
  )
}
