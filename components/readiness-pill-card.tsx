import type { ReactNode } from 'react'

import type { ReadinessPill } from '@/lib/rows'

import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

import { GREEN, GREEN_TEXT, pct, RED, SLATE, SLATE_TEXT } from '@/components/readiness-pill-colors'

function CardRow({ icon, label, n, total, color, textColor = color }: {
  icon: ReactNode
  label: string
  n: number
  total: number
  color: string
  textColor?: string
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="inline-flex w-16 items-center gap-1" style={{ color: textColor }}>
        {icon}
        {label}
      </span>
      <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
        <div className="h-full rounded-full" style={{ width: `${pct(n, total)}%`, backgroundColor: color }} />
      </div>
      <span className="text-muted-foreground w-12 text-right tabular-nums">
        {n}
      </span>
    </div>
  )
}

/**
 * The readiness mix as a detail card. Renders nothing when no member has a
 * known status.
 */
export function ReadinessPillCard({ mix }: { mix: ReadinessPill }) {
  const total = mix.buff + mix.ready + mix.debuff
  if (total === 0) {
    return null
  }

  return (
    <div className="bg-card flex flex-col gap-2 rounded-md border p-3 sm:col-span-2">
      <span className="text-xs font-medium">Readiness</span>
      <div className="flex flex-col gap-1.5">
        <CardRow
          icon={<ArrowUp className="size-3.5" />}
          label="Buff"
          n={mix.buff}
          total={total}
          color={GREEN}
          textColor={GREEN_TEXT}
        />
        <CardRow
          icon={<Minus className="size-3.5" />}
          label="Ready"
          n={mix.ready}
          total={total}
          color={SLATE}
          textColor={SLATE_TEXT}
        />
        <CardRow icon={<ArrowDown className="size-3.5" />} label="Debuff" n={mix.debuff} total={total} color={RED} />
      </div>
    </div>
  )
}
