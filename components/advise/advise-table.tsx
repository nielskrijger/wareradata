import type { AdviseRow } from './rows'
import type { AdvisorResult } from '@/lib/advisor/types'
import { ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

import { CompanyName, TitleParts } from './company-name'
import { COLUMNS, GAIN, gain, KIND, pct, sum, things } from './format'
import { Reason } from './reason'
import { SMALL_GAIN_PER_DAY } from './rows'
import { SwitchTitle } from './switch-title'

/**
 * The big wins with a running share, then the small stuff folded away.
 */
export function AdviseTable({ big, small, total, energy }: {
  big: AdviseRow[]
  small: AdviseRow[]
  total: number
  energy: AdvisorResult['energy']
}) {
  const needed = sum(big, 'energy')
  const short = needed > energy.current
  const have = `${energy.current.toFixed(0)} of ${energy.cap}`
  const refill = energy.hoursToFull <= 0
    ? 'full'
    : Number.isFinite(energy.hoursToFull) ? `full in ${energy.hoursToFull.toFixed(1)} h` : 'not refilling'

  const hint = short ? `The big wins need ${needed}, ${needed - energy.current} more than you have · ${refill}` : refill

  return (
    <div className="bg-card overflow-hidden rounded-xl border text-sm">
      <div className={cn(
        'text-muted-foreground bg-muted/40 hidden items-center gap-3 px-4 py-2 text-xs font-medium md:grid',
        COLUMNS,
      )}
      >
        <span>#</span>
        <span>Action</span>
        <span>Kind</span>
        <span className="flex flex-col items-end leading-tight" title={hint}>
          <span>Energy</span>
          <span className="font-mono font-normal tabular-nums">{`${energy.current.toFixed(0)}/${energy.cap}`}</span>
          {short && <span className="font-mono font-normal" style={{ color: 'var(--fire)' }}>{`need ${needed}`}</span>}
        </span>
        <span className="text-right">Gain/day · running</span>
      </div>
      <div className="text-muted-foreground bg-muted/40 flex justify-between gap-3 px-4 py-2 text-xs md:hidden">
        <span>{`Energy ${have} · ${refill}`}</span>
        {short && <span style={{ color: 'var(--fire)' }}>{`need ${needed}`}</span>}
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
        <span className={cn(small ? 'font-medium' : 'font-semibold')}>
          {row.switch
            ? <SwitchTitle change={row.switch} />
            : row.titleParts ? <TitleParts parts={row.titleParts} /> : row.title}
        </span>
        {row.parts.length > 0 && (
          <span className="flex flex-wrap gap-1.5">
            {row.parts.map(p => (
              <span
                key={p.company?.id ?? p.short}
                className="bg-muted/60 inline-flex min-w-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs"
              >
                {p.company ? <CompanyName company={p.company} /> : p.short}
                {' '}
                <span className="font-mono" style={{ color: GAIN }}>{gain(p.gainPerDay)}</span>
              </span>
            ))}
          </span>
        )}
        <Reason row={row} />
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
          {`${things(rows.length)}, each under ${SMALL_GAIN_PER_DAY} g/day`}
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
