import type { BuffMix } from '@/lib/rows'

import { StackedBarCell } from '@/components/cells/stacked-bar-cell'
import { COLOR } from '@/components/colors'
import { EmptyDash } from '@/components/empty-dash'
import { percentOf } from '@/lib/format'

interface Props {
  mix: BuffMix

  /**
   * Bar track width. Defaults to 96px (a touch wider than the 64px health/
   * hunger bars, since this packs three segments).
   */
  width?: number
}

function BreakdownRow({ label, n, total, color }: { label: string, n: number, total: number, color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-12">{label}</span>
      <div className="h-1 w-16 overflow-hidden rounded-full bg-white/15">
        <div className="h-full rounded-full" style={{ width: `${percentOf(n, total)}%`, backgroundColor: color }} />
      </div>
      <span className="ml-auto whitespace-nowrap tabular-nums">
        {n}
        {' '}
        <span className="text-white/60">
          (
          {percentOf(n, total)}
          %)
        </span>
      </span>
    </div>
  )
}

/**
 * Members by buff status as a stacked bar, broken down on hover.
 */
export function BuffBar({ mix, width = 96 }: Props) {
  const total = mix.buff + mix.ready + mix.debuff
  if (total === 0) {
    return <EmptyDash />
  }

  return (
    <StackedBarCell
      width={width}
      tooltipClassName="w-max"
      segments={[
        { key: 'buff', value: mix.buff, color: COLOR.green },
        { key: 'ready', value: mix.ready, color: COLOR.grey },
        { key: 'debuff', value: mix.debuff, color: COLOR.red },
      ]}
    >
      <div className="flex flex-col gap-1">
        <BreakdownRow label="Buff" n={mix.buff} total={total} color={COLOR.green} />
        <BreakdownRow label="Ready" n={mix.ready} total={total} color={COLOR.grey} />
        <BreakdownRow label="Debuff" n={mix.debuff} total={total} color={COLOR.red} />
      </div>
    </StackedBarCell>
  )
}
