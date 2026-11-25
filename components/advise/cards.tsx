import type { TodoItem } from '@/lib/advisor/types'
import { Check, TriangleAlert } from 'lucide-react'
import { tint } from '@/components/colors'

import { GAIN, KIND } from './format'

export function AllSet() {
  return (
    <section
      className="flex flex-col items-center gap-2 rounded-xl border px-6 py-8 text-center"
      style={{ background: `color-mix(in oklch, ${GAIN} 8%, var(--card))` }}
    >
      <span
        className="flex size-11 items-center justify-center rounded-full"
        style={{ background: tint(GAIN, 18), color: GAIN }}
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
