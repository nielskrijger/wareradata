'use client'

import type { CSSProperties } from 'react'
import type { FactoryLedgerRow, LedgerEmployee } from '@/lib/factories/ledger'
import type { PortfolioTotals } from '@/lib/factories/profit'

import { ArrowDown, ArrowUp } from 'lucide-react'
import { Fragment, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import { EmployeeBreakdown } from './employee-breakdown'
import { goldSigned, humanizeCode, humanizeItem, netClass } from './format'

interface Props {
  rows: FactoryLedgerRow[]
  totals: PortfolioTotals
}

interface RosterEmployee extends LedgerEmployee {
  factory: FactoryLedgerRow
}

type SortKey = 'name' | 'production' | 'luck' | 'responsibility' | 'potential' | 'happiness' | 'bonus' | 'wage' | 'net'

interface Column {
  key: SortKey | 'traits' | 'tool'
  label: string
  tip?: string
  right?: boolean
  className?: string

  /**
   * Sort value; columns without one don't sort.
   */
  value?: (e: RosterEmployee) => number | string
}

const COLUMNS: Column[] = [
  { key: 'name', label: 'Employee', value: e => e.name },
  {
    key: 'production',
    label: 'Prod',
    tip: 'Production stat: base + trained + traits and specialization.',
    right: true,
    value: e => e.stats.production.total,
  },
  { key: 'luck', label: 'Luck', right: true, value: e => e.stats.luck.total },
  {
    key: 'responsibility',
    label: 'Resp',
    tip: 'Responsibility stat; raises happiness.',
    right: true,
    value: e => e.stats.responsibility.total,
  },
  { key: 'potential', label: 'Potential', tip: 'Potential / its maximum.', value: e => e.potential },
  { key: 'happiness', label: 'Happy', tip: 'Happiness; below 50 is shown red.', right: true, value: e => e.happiness },
  {
    key: 'bonus',
    label: 'Bonus',
    tip: 'Total production bonus: management, manager, region, happiness, specialization, tool and traits.',
    right: true,
    value: e => e.bonusPct,
  },
  { key: 'traits', label: 'Traits', className: 'hidden md:table-cell' },
  { key: 'tool', label: 'Tool', className: 'hidden lg:table-cell' },
  { key: 'wage', label: 'Wage/day', right: true, value: e => e.wagePerDay },
  {
    key: 'net',
    label: 'Net/day',
    tip: 'The value of the employee\'s output net of inputs, minus their wage. Factory rows: revenue − inputs − wages − manager wage, from the engine + employees. Excludes self-work.',
    right: true,
    value: e => e.netPerDay,
  },
]

/**
 * Columns left of Net/day, for the group header and footer spans.
 */
const LEAD_COLS = COLUMNS.length - 1

/**
 * A faint green fill scaled to where `value` sits in its column, so a column
 * can be scanned for its strongest employees.
 */
function heat(value: number, [lo, hi]: [number, number]): CSSProperties | undefined {
  if (hi <= lo) {
    return undefined
  }

  const t = Math.max(0, Math.min(1, (value - lo) / (hi - lo)))

  return { background: `color-mix(in oklch, var(--color-green-500) ${Math.round(t * 30)}%, transparent)` }
}

function Pips({ value, max, scale }: { value: number, max: number, scale: number }) {
  return (
    <span className="inline-flex items-center gap-1.5" title={`Potential ${value} of ${max}`}>
      <span className="inline-flex gap-px">
        {Array.from({ length: scale }, (_, i) => (
          <i
            key={i}
            className={cn(
              'h-2.5 w-1 rounded-[1px]',
              i < value && 'bg-green-600 dark:bg-green-400',
              i >= value && i < max && 'bg-green-600/30 dark:bg-green-400/30',
              i >= max && 'bg-muted',
            )}
          />
        ))}
      </span>
      <span className="text-muted-foreground text-xs tabular-nums">{value}/{max}</span>
    </span>
  )
}

function TraitChips({ e }: { e: LedgerEmployee }) {
  if (!e.traits.length) {
    return <span className="text-muted-foreground text-xs">—</span>
  }

  return (
    <span className="flex flex-wrap gap-1">
      {e.traits.map(t => (
        <Badge
          key={t.code + (t.arg ?? '')}
          title={t.effects.join(', ') || 'No visible effect'}
          className={cn(
            'font-normal',
            t.tone > 0 && 'bg-green-500/15 text-green-800 dark:text-green-300',
            t.tone < 0 && 'bg-red-500/15 text-red-800 dark:text-red-300',
            t.tone === 0 && 'bg-muted text-muted-foreground',
          )}
        >
          {humanizeCode(t.code)}{t.arg && <span className="opacity-75"> ({humanizeCode(t.arg)})</span>}
        </Badge>
      ))}
    </span>
  )
}

function ColumnHeader({ col, sort, onSort }: { col: Column, sort: Sort | null, onSort: (key: SortKey) => void }) {
  if (!col.value) {
    return <TableHead className={col.className}>{col.label}</TableHead>
  }

  const active = sort?.key === col.key
  const Arrow = sort?.dir === 'asc' ? ArrowUp : ArrowDown
  const label = (
    <button
      type="button"
      onClick={() => onSort(col.key as SortKey)}
      className={cn(
        'inline-flex cursor-pointer items-center gap-0.5 hover:text-foreground',
        active && 'text-foreground',
      )}
      aria-label={`Sort by ${col.label}`}
    >
      <span className={cn(col.tip && 'underline decoration-dotted underline-offset-2')}>{col.label}</span>
      {active && <Arrow className="size-3" />}
    </button>
  )

  return (
    <TableHead
      className={cn(col.right && 'text-right', col.className)}
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
    >
      {col.tip ? (
        <Tooltip>
          <TooltipTrigger render={<span />}>{label}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-60">{col.tip}</TooltipContent>
        </Tooltip>
      ) : label}
    </TableHead>
  )
}

const NAME_TRIGGER = 'cursor-help font-medium underline decoration-dotted underline-offset-2'

interface Sort {
  key: SortKey
  dir: 'asc' | 'desc'
}

/**
 * Header → descending → ascending → back to grouped by factory.
 */
function nextSort(sort: Sort | null, key: SortKey): Sort | null {
  if (sort?.key !== key) {
    return { key, dir: 'desc' }
  }

  return sort.dir === 'desc' ? { key, dir: 'asc' } : null
}

/**
 * The user-page roster: every employee on one screen, grouped under a row per
 * factory with its net, engine and Top potential. Sorting any column flattens
 * the groups to rank employees across factories; clearing it regroups.
 */
export function FactoryRoster({ rows, totals }: Props) {
  const [sort, setSort] = useState<Sort | null>(null)

  const employees = useMemo<RosterEmployee[]>(
    () => rows.flatMap(row => row.employees.map(e => ({ ...e, factory: row }))),
    [rows],
  )

  const ranges = useMemo(() => {
    const range = (pick: (e: RosterEmployee) => number): [number, number] => {
      const values = employees.map(pick)

      return [Math.min(...values), Math.max(...values)]
    }

    return {
      production: range(e => e.stats.production.total),
      luck: range(e => e.stats.luck.total),
      responsibility: range(e => e.stats.responsibility.total),
    }
  }, [employees])

  const potentialScale = Math.max(10, ...employees.map(e => e.potentialMax))

  const sorted = useMemo(() => {
    if (!sort) {
      return null
    }

    const value = COLUMNS.find(c => c.key === sort.key)!.value!
    const dir = sort.dir === 'asc' ? 1 : -1

    return [...employees].sort((a, b) => {
      const va = value(a)
      const vb = value(b)

      return (typeof va === 'string' ? va.localeCompare(vb as string) : va - (vb as number)) * dir
    })
  }, [employees, sort])

  function onSort(key: SortKey) {
    setSort(nextSort(sort, key))
  }

  function employeeRow(e: RosterEmployee, showFactory: boolean) {
    const s = e.stats

    return (
      <TableRow key={e.id}>
        <TableCell>
          <Tooltip>
            <TooltipTrigger render={<span className={NAME_TRIGGER} />}>
              {e.name}
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-none">
              <EmployeeBreakdown e={e} />
            </TooltipContent>
          </Tooltip>
          <span className="text-muted-foreground block text-xs">
            {showFactory && <>{e.factory.name} · {humanizeItem(e.factory.itemCode)} · </>}
            {e.age}y · retires {e.retireInDays}d
          </span>
        </TableCell>
        {(['production', 'luck', 'responsibility'] as const).map(k => (
          <TableCell key={k} className="text-right tabular-nums">
            <span className="rounded px-1.5 py-0.5" style={heat(s[k].total, ranges[k])}>{s[k].total}</span>
          </TableCell>
        ))}
        <TableCell><Pips value={e.potential} max={e.potentialMax} scale={potentialScale} /></TableCell>
        <TableCell
          className={cn(
            'text-right tabular-nums',
            e.happiness >= 65 && 'text-green-700 dark:text-green-400',
            e.happiness < 50 && 'text-red-700 dark:text-red-400',
          )}
        >
          {e.happiness}
        </TableCell>
        <TableCell className="text-right tabular-nums">+{e.bonusPct}%</TableCell>
        <TableCell className="hidden md:table-cell"><TraitChips e={e} /></TableCell>
        <TableCell className="hidden text-xs lg:table-cell">
          {e.tool ? (
            <span className="whitespace-nowrap">
              {humanizeCode(e.tool.code.replace(/\d+$/, ''))}{' '}
              <span className="text-muted-foreground">
                +{e.tool.bonusPct}% ·{' '}
                <span className={cn(e.tool.durabilityPct < 60 && 'text-amber-700 dark:text-amber-400')}>
                  {Math.round(e.tool.durabilityPct)}%
                </span>
              </span>
            </span>
          ) : <span className="text-muted-foreground">—</span>}
        </TableCell>
        <TableCell className="text-muted-foreground text-right tabular-nums">
          {goldSigned(e.wagePerDay).replace(/^\+/, '')}
        </TableCell>
        <TableCell className={cn('text-right tabular-nums', netClass(e.netPerDay))}>
          {goldSigned(e.netPerDay)}
        </TableCell>
      </TableRow>
    )
  }

  function factoryRow(row: FactoryLedgerRow) {
    const details = [
      row.regionName,
      `Engine Lvl ${row.engineLevel}`,
      `${row.employeeCount}${row.employeeCap > 0 ? `/${row.employeeCap}` : ''} employees`,
      row.managerPerDay >= 0.05 ? `manager ${goldSigned(-row.managerPerDay)}` : null,
    ].filter(Boolean).join(' · ')

    return (
      <TableRow className={cn('bg-muted/50 hover:bg-muted/50', row.isIdle && 'opacity-60')}>
        <TableCell colSpan={LEAD_COLS}>
          <span className="font-medium">{row.name}</span>
          <span className="text-muted-foreground"> · {humanizeItem(row.itemCode)}</span>
          <span className="text-muted-foreground ml-2 text-xs">{details}</span>
          {row.engineNetPerDay >= 0.05 && (
            <span className="text-muted-foreground ml-2 text-xs tabular-nums">
              · engine {goldSigned(row.engineNetPerDay)}
            </span>
          )}
          {row.bestOpportunityPerDay >= 1 && (
            <Tooltip>
              <TooltipTrigger render={<span className="ml-2 cursor-help" />}>
                <Badge className="bg-green-500/15 text-green-800 dark:text-green-300">
                  {humanizeItem(row.bestProductCode)} {goldSigned(row.bestOpportunityPerDay)}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-60">
                Top potential: Net/day would be {goldSigned(row.bestPotentialNetPerDay)} making{' '}
                {humanizeItem(row.bestProductCode)} instead. Approximate: employees' item specialization would
                not carry over.
              </TooltipContent>
            </Tooltip>
          )}
        </TableCell>
        <TableCell className={cn('text-right font-medium tabular-nums', netClass(row.netPerDay))}>
          {row.isIdle ? <span className="text-muted-foreground font-normal">idle</span> : goldSigned(row.netPerDay)}
        </TableCell>
      </TableRow>
    )
  }

  return (
    <Table className="text-sm">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {COLUMNS.map(col => <ColumnHeader key={col.key} col={col} sort={sort} onSort={onSort} />)}
        </TableRow>
      </TableHeader>

      <TableBody>
        {sorted ? sorted.map(e => employeeRow(e, true)) : rows.map(row => (
          <Fragment key={row.id}>
            {factoryRow(row)}
            {row.employees.map(e => employeeRow({ ...e, factory: row }, false))}
          </Fragment>
        ))}
      </TableBody>

      <TableFooter>
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={LEAD_COLS}>
            Total
            {totals.bestOpportunityPerDay >= 1 && (
              <span className="text-muted-foreground ml-2 text-xs font-normal">
                Top potential {goldSigned(totals.bestPotentialNetPerDay)}
              </span>
            )}
          </TableCell>
          <TableCell className={cn('text-right tabular-nums', netClass(totals.netPerDay))}>
            {goldSigned(totals.netPerDay)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
