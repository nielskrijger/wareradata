import type { ReactNode } from 'react'

import type { BuffMix } from '@/lib/rows'

import { ArrowDown, ArrowUp, Minus } from 'lucide-react'

import { COLOR } from '@/components/colors'
import { percentOf } from '@/lib/format'

function CardRow({ icon, label, n, total, color }: {
  icon: ReactNode
  label: string
  n: number
  total: number
  color: string
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="inline-flex w-16 items-center gap-1" style={{ color }}>
        {icon}
        {label}
      </span>
      <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
        <div className="h-full rounded-full" style={{ width: `${percentOf(n, total)}%`, backgroundColor: color }} />
      </div>
      <span className="text-muted-foreground w-12 text-right tabular-nums">
        {n}
      </span>
    </div>
  )
}

/**
 * The three buff / ready / debuff bars. Renders nothing when no member has a
 * known status.
 */
export function BuffRows({ mix }: { mix: BuffMix }) {
  const total = mix.buff + mix.ready + mix.debuff
  if (total === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-1.5">
      <CardRow
        icon={<ArrowUp className="size-3.5" />}
        label="Buff"
        n={mix.buff}
        total={total}
        color={COLOR.green}
      />
      <CardRow
        icon={<Minus className="size-3.5" />}
        label="Ready"
        n={mix.ready}
        total={total}
        color={COLOR.grey}
      />
      <CardRow
        icon={<ArrowDown className="size-3.5" />}
        label="Debuff"
        n={mix.debuff}
        total={total}
        color={COLOR.red}
      />
    </div>
  )
}
