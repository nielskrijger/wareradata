'use client'

import type { LucideIcon } from 'lucide-react'
import type { AdvisorResult, TodoItem } from '@/lib/advisor/types'
import {
  ArrowLeftRight,
  GraduationCap,
  Hammer,
  RefreshCw,
  TriangleAlert,
  UserCog,
  UserMinus,
  UserPlus,
  Wrench,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { goldSigned } from '@/components/factories/format'
import { ProgressRing } from '@/components/progress-ring'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
 * The ranked advice. Each row's green bar is its gain next to the best one.
 */
export function AdviseList({ result }: Props) {
  const { energy } = result
  const money = result.items.find(i => i.kind === 'money')
  const items = result.items.filter(i => i.kind !== 'money')
  const total = items.reduce((s, i) => s + (i.gainPerDay ?? 0), 0)
  const best = Math.max(0, ...items.map(i => i.gainPerDay ?? 0))
  const needed = items.reduce((s, i) => s + (i.energy ?? 0), 0)
  const short = Math.max(0, needed - energy.current)

  return (
    <div className="flex flex-col gap-5">
      <header className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div
          className="flex flex-col justify-center gap-2 rounded-xl border p-5"
          style={{
            background: `linear-gradient(135deg, ${tint('var(--fire)', 22)}, var(--card) 70%)`,
            borderColor: tint('var(--fire)', 40),
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-brand text-5xl leading-none tracking-wide">What to do next</h1>
            <RefreshButton />
          </div>
          <p className="text-muted-foreground text-sm">
            Do all of it and you earn
            {' '}
            <strong className="font-mono" style={{ color: GAIN }}>{perDay(total)}</strong>
            {' '}
            more, priced at today&apos;s market. Refresh after you act to see what&apos;s next.
          </p>
        </div>
        <RingCard
          label="Energy"
          value={`${energy.current.toFixed(0)} of ${energy.cap}`}
          sub={short > 0
            ? `The list needs ${needed}, ${short} more than you have`
            : `+${energy.regenPerHour}/h · full in ${hours(energy.hoursToFull)}`}
          center={energy.current.toFixed(0)}
          fraction={energy.cap > 0 ? energy.current / energy.cap : 0}
          color="var(--fire)"
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

function Row({ item, rank, share }: { item: TodoItem, rank: number, share: number }) {
  const kind = KIND[item.kind]
  const Icon = kind.icon

  return (
    <li className="bg-card relative overflow-hidden rounded-xl border">
      <div
        aria-hidden
        className="absolute inset-y-0 left-0"
        style={{
          width: `${Math.round(share * 100)}%`,
          background: `linear-gradient(90deg, ${tint(GAIN, 20)}, ${tint(GAIN, 4)})`,
        }}
      />
      <div className="relative grid grid-cols-[32px_minmax(0,1fr)] items-center gap-3 px-4 py-3
        sm:grid-cols-[40px_minmax(0,1fr)_auto]"
      >
        <span className="font-brand text-center text-3xl leading-none" style={{ color: 'var(--fire)' }}>{rank}</span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" style={{ color: kind.color, borderColor: kind.color }}>
              <Icon aria-hidden />
              {kind.label}
            </Badge>
            <span className="text-sm font-semibold">{item.title}</span>
          </span>
          <span className="text-muted-foreground text-xs">{item.why}</span>
        </span>
        <span className="col-start-2 flex items-baseline gap-3 sm:col-start-auto sm:flex-col sm:items-end sm:gap-0.5">
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
      </div>
    </li>
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
      <RefreshCw aria-hidden className={cn(pending && 'animate-spin')} />
      {pending ? 'Refreshing' : 'Refresh'}
    </Button>
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
