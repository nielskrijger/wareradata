import type { AdviseRow } from './rows'

import { Panel } from '@/components/panel'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { gain, KIND, pct, sum, things } from './format'
import { Gain } from './gain'
import { KindIcon } from './kind-icon'
import { SMALL_GAIN_PER_DAY } from './rows'

/**
 * Each big win as a slice of the total, small stuff as one striped slice.
 */
export function ShareBar({ big, small, total }: { big: AdviseRow[], small: AdviseRow[], total: number }) {
  const smallGain = sum(small, 'gainPerDay')
  const top = big.slice(0, 2)
  const topText = top.length > 0
    ? `The first ${top.length === 1 ? 'action is' : '2 are'} ${pct(sum(top, 'gainPerDay') / total)} of it.`
    : ''

  return (
    <Panel as="section" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-muted-foreground text-sm font-medium">By action</h2>
        <p className="text-muted-foreground text-sm">
          {topText}
          {small.length > 0 && ` The striped end is ${things(small.length)}.`}
        </p>
      </div>
      <div className="flex h-8 gap-0.5 overflow-hidden rounded-lg">
        {big.map(row => (
          <Slice
            key={row.id}
            title={row.title}
            gainPerDay={row.gainPerDay}
            share={row.gainPerDay / total}
            background={KIND[row.kind].color}
            label={row.gainPerDay / total >= 0.12}
          />
        ))}
        {smallGain > 0 && (
          <Slice
            title={`${things(small.length)}, each under ${SMALL_GAIN_PER_DAY} g/day`}
            gainPerDay={smallGain}
            share={smallGain / total}
            background="repeating-linear-gradient(45deg, color-mix(in oklch, var(--muted-foreground) 45%, transparent) 0 2px, transparent 2px 7px)"
          />
        )}
      </div>
      {/* Phones have no room for labels in the bar, so the slices are listed below it. */}
      <ul className="flex flex-col gap-1 text-xs md:hidden">
        {big.map(row => (
          <li key={row.id} className="flex items-center gap-2">
            <KindIcon kind={row.kind} small />
            <span className="min-w-0 flex-1 truncate">{row.title}</span>
            <span className="text-muted-foreground font-mono tabular-nums">{pct(row.gainPerDay / total)}</span>
          </li>
        ))}
        {smallGain > 0 && (
          <li className="text-muted-foreground flex items-center gap-2">
            <span className="bg-muted-foreground/20 size-5 shrink-0 rounded-md" />
            <span className="flex-1">{`${things(small.length)}`}</span>
            <span className="font-mono tabular-nums">{pct(smallGain / total)}</span>
          </li>
        )}
      </ul>
    </Panel>
  )
}

/**
 * One block of the share bar. A popover rather than a tooltip, so a tap opens
 * it too: tooltips ignore touch.
 */
function Slice({ title, gainPerDay, share, background, label }: {
  title: string
  gainPerDay: number
  share: number
  background: string
  label?: boolean
}) {
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={0}
        aria-label={`${title}: ${gain(gainPerDay)} g/day, ${pct(share)}`}
        className="flex min-w-0 cursor-default items-center outline-none hover:brightness-110
          focus-visible:ring-2 focus-visible:ring-white/60"
        style={{ flex: gainPerDay, background }}
      >
        {label && (
          <span className="hidden truncate px-2 text-xs font-semibold text-black md:inline">
            {title}
            {' · '}
            {gain(gainPerDay)}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent side="top" sideOffset={6} className="w-auto max-w-64 px-3 py-2 text-xs">
        <span className="block font-semibold">{title}</span>
        <Gain value={gainPerDay} perDay />
        {` · ${pct(share)} of the total`}
      </PopoverContent>
    </Popover>
  )
}
