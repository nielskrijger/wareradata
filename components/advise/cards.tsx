import type { AdvisorResult, TodoItem } from '@/lib/advisor/types'
import { Check, TriangleAlert } from 'lucide-react'

import { ProgressRing } from '@/components/progress-ring'

import { GAIN, KIND } from './format'

export function AllSet() {
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

export function EnergyCard({ energy, needed }: { energy: AdvisorResult['energy'], needed: number }) {
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

export function MoneyCard({ item }: { item: TodoItem }) {
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
