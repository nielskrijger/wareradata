import type { AdviseRow } from './rows'
import type { AdvisorResult } from '@/lib/advisor/types'
import { ChevronRight } from 'lucide-react'

import { TitleParts } from '@/components/company-name'

import { Panel } from '@/components/panel'
import { formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { COLUMNS, sum, things } from './format'
import { Gain } from './gain'
import { KindIcon } from './kind-icon'
import { Reason } from './reason'
import { SMALL_GAIN_PER_DAY } from './rows'

const FILL = 'color-mix(in oklch, var(--foreground) 5%, transparent)'

/**
 * The big wins with a running share, then the small stuff folded away. Each
 * row is shaded by its gain against the biggest one.
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

  const top = Math.max(...big.map(r => r.gainPerDay), ...small.map(r => r.gainPerDay)) || 1
  const hint = short ? `The big wins need ${needed}, ${needed - energy.current} more than you have · ${refill}` : refill

  return (
    <Panel padding="none" className="overflow-hidden text-sm">
      <div className={cn(
        'text-muted-foreground bg-muted/40 hidden items-center gap-3 px-4 py-2 text-xs font-medium md:grid',
        COLUMNS,
      )}
      >
        <span>#</span>
        <span>Action</span>
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
            size={row.gainPerDay / top}
            running={sum(big.slice(0, i + 1), 'gainPerDay') / total}
          />
        ))}
      </ol>
      {small.length > 0 && (
        <SmallStuff rows={small} start={big.length + 1} top={top} open={big.length === 0} />
      )}
    </Panel>
  )
}

function Row({ row, rank, size, running, small }: {
  row: AdviseRow
  rank: number
  size: number
  running?: number
  small?: boolean
}) {
  // The shading stops short of the gain column so the number stays clean.
  const shade = `linear-gradient(to right, ${FILL} calc((100% - var(--gain-col)) * ${size}), transparent 0)`

  return (
    <li
      style={{ backgroundImage: shade }}
      className={cn(
        'grid grid-cols-[20px_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1.5 border-t px-4 py-3 first:border-t-0',
        '[--gain-col:72px] md:[--gain-col:156px]',
        'md:items-center md:py-2.5',
        COLUMNS,
        small && 'bg-muted/20',
      )}
    >
      <span className="text-muted-foreground pt-0.5 font-mono text-xs md:pt-0">{rank}</span>
      <span className="flex min-w-0 gap-3">
        <KindIcon kind={row.kind} />
        <span className="flex min-w-0 flex-col gap-1 pt-0.5">
          <span className={cn(small ? 'font-medium' : 'font-semibold')}>
            {row.titleParts ? <TitleParts parts={row.titleParts} /> : row.title}
          </span>
          {row.byCompany && <ByCompany groups={row.byCompany} />}
          <Reason row={row} />
          {row.energy > 0 && (
            <span className="text-xs md:hidden" style={{ color: 'var(--fire)' }}>{`${row.energy} energy`}</span>
          )}
        </span>
      </span>
      <span className="hidden text-right text-xs md:block" style={{ color: 'var(--fire)' }}>
        {row.energy > 0 ? row.energy : ''}
      </span>
      <span className="col-start-3 row-start-1 flex flex-col items-end gap-0.5 md:col-start-auto md:row-start-auto
        md:flex-row md:items-baseline md:justify-end md:gap-3"
      >
        <Gain value={row.gainPerDay} className={cn('tabular-nums', small ? 'text-sm' : 'text-base')} />
        {running != null && (
          <span className="text-muted-foreground text-right font-mono text-xs tabular-nums md:w-9">
            {formatPercent(running)}
          </span>
        )}
      </span>
    </li>
  )
}

/**
 * Each company it starts from as a heading, its steps underneath, as the
 * game's Reorganize screen lists them.
 */
function ByCompany({ groups }: { groups: NonNullable<AdviseRow['byCompany']> }) {
  return (
    <span className="flex flex-col gap-2 text-xs">
      {groups.map(g => (
        <span key={g.company.id} className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-medium" style={{ color: 'var(--fire)' }}>{g.company.name}</span>
          {g.steps.map(step => <span key={step} className="text-muted-foreground pl-4">{step}</span>)}
        </span>
      ))}
    </span>
  )
}

function SmallStuff({ rows, start, top, open }: { rows: AdviseRow[], start: number, top: number, open: boolean }) {
  return (
    <details open={open} className="group border-t">
      <summary className="text-muted-foreground hover:text-foreground flex cursor-pointer list-none items-center
        justify-between gap-3 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <ChevronRight aria-hidden className="size-4 shrink-0 transition-transform group-open:rotate-90" />
          {`${things(rows.length)}, each under ${SMALL_GAIN_PER_DAY} g/day`}
        </span>
        <Gain value={sum(rows, 'gainPerDay')} className="shrink-0 whitespace-nowrap">
          <span className="hidden sm:inline"> together</span>
        </Gain>
      </summary>
      <ol className="border-t">
        {rows.map((row, i) => <Row key={row.id} row={row} rank={start + i} size={row.gainPerDay / top} small />)}
      </ol>
    </details>
  )
}
