'use client'

import type { ReactNode } from 'react'
import type { FactoryLedgerRow, LedgerEmployee } from '@/lib/factories/ledger'
import type { PortfolioTotals } from '@/lib/factories/profit'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import { goldSigned, humanizeItem, netClass } from './format'

interface Props {
  rows: FactoryLedgerRow[]
  totals: PortfolioTotals
}

// Plain-language explanations for the metric column headers. Factory and Item are
// self-explanatory, so they get no tooltip.
const HEADER_TIPS = {
  employees: 'NPC employees hired / employee slots.',
  out: 'Units/day: the automated engine plus the NPC employees at the game\'s current hourly estimate. Excludes self-work.',
  net: 'Daily profit: revenue − input cost − employee wages − manager wage, from the automated engine + NPC employees. Excludes self-work (the owner\'s discretionary labour).',
  best: 'Top potential: Net/day if this factory\'s production went into the most profitable item instead. Approximate: employees\' item specialization would not carry over.',
}

// Column spans for the ledger sub-rows and the footer. Four label columns
// (Factory, Item, Employees, Out/day) sit left of Net/day; two trailing cells
// (Top potential, chevron) sit right of it — seven columns total.
const LABEL_SPAN = 4
const TRAILING_SPAN = 2
const TOTAL_COLS = LABEL_SPAN + 1 + TRAILING_SPAN

/**
 * A metric header cell wrapped in an explanatory tooltip.
 */
function HeaderCell({ tip, className, children }: { tip: string, className?: string, children: ReactNode }) {
  return (
    <TableHead className={className}>
      <Tooltip>
        <TooltipTrigger render={<span className="cursor-help underline decoration-dotted underline-offset-2" />}>
          {children}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-60">{tip}</TooltipContent>
      </Tooltip>
    </TableHead>
  )
}

/**
 * A summary-row potential cell: the value with an optional opportunity badge.
 */
function PotentialCell({ value, opportunity }: { value: number, opportunity: number }) {
  return (
    <TableCell className="text-right tabular-nums">
      <span className="inline-flex items-center justify-end gap-1.5">
        {goldSigned(value)}
        {opportunity >= 1 && (
          <Badge className="bg-green-500/15 text-green-800 dark:text-green-300">{goldSigned(opportunity)}</Badge>
        )}
      </span>
    </TableCell>
  )
}

/**
 * A row is worth expanding only when it has employees or a manager: the ledger's
 * value is the per-employee breakdown. An engine-only or idle factory would just
 * restate the summary row, so it stays non-expandable.
 */
function hasStaff(row: FactoryLedgerRow): boolean {
  return row.employees.length > 0 || row.managerPerDay > 0
}

/**
 * The user-page factories table: one dense row per factory (output, net and Top
 * potential per day), each expandable into an accounting ledger — every producer
 * (engine, each employee) and cost (
   inputs,
   wages,
   manager,
 ) summing to Net. Net excludes self-work. The portfolio roll-up
 * lives in the stats card above; the header carries the expand/collapse-all
 * toggle; the footer sums net and potentials.
 */
export function FactoriesTable({ rows, totals }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  const expandableIds = rows.filter(hasStaff).map(row => row.id)
  const allExpanded = expandableIds.length > 0 && expandableIds.every(id => expanded.has(id))

  function toggleRow(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleAll() {
    setExpanded(allExpanded ? new Set() : new Set(expandableIds))
  }

  return (
    <section className="bg-card overflow-hidden rounded-md border">
      <div className="flex items-center justify-between gap-2 p-3">
        <span className="text-muted-foreground text-xs">Per factory</span>
        <Button variant="outline" size="sm" onClick={toggleAll} aria-expanded={allExpanded}>
          {allExpanded ? 'Collapse all' : 'Expand all'}
        </Button>
      </div>

      <Table className="text-sm">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Factory</TableHead>
            <TableHead>Item</TableHead>
            <HeaderCell tip={HEADER_TIPS.employees} className="text-right">Employees</HeaderCell>
            <HeaderCell tip={HEADER_TIPS.out} className="text-right">Out/day</HeaderCell>
            <HeaderCell tip={HEADER_TIPS.net} className="text-right">Net/day</HeaderCell>
            <HeaderCell tip={HEADER_TIPS.best} className="text-right">Top potential</HeaderCell>
            <TableHead className="w-8" aria-label="Expand" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map(row => (
            <FactoryRows
              key={row.id}
              row={row}
              isOpen={expanded.has(row.id)}
              onToggle={() => toggleRow(row.id)}
            />
          ))}
        </TableBody>

        <TableFooter>
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={LABEL_SPAN}>Total</TableCell>
            <TableCell className={cn('text-right tabular-nums', netClass(totals.netPerDay))}>
              {goldSigned(totals.netPerDay)}
            </TableCell>
            <TableCell className="text-right tabular-nums">{goldSigned(totals.bestPotentialNetPerDay)}</TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </section>
  )
}

interface RowProps {
  row: FactoryLedgerRow
  isOpen: boolean
  onToggle: () => void
}

/**
 * A factory's summary row plus its expandable ledger.
 */
function FactoryRows({ row, isOpen, onToggle }: RowProps) {
  const expandable = hasStaff(row)

  return (
    <>
      <TableRow
        role={expandable ? 'button' : undefined}
        tabIndex={expandable ? 0 : undefined}
        aria-expanded={expandable ? isOpen : undefined}
        onClick={expandable ? onToggle : undefined}
        onKeyDown={expandable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onToggle()
              }
            }
          : undefined}
        className={cn(expandable && 'cursor-pointer', row.isIdle && 'opacity-60')}
      >
        <TableCell>
          <span className="font-medium">{row.name}</span>
          <span className="text-muted-foreground block text-xs">{row.regionName}</span>
        </TableCell>
        <TableCell className="text-muted-foreground">{humanizeItem(row.itemCode)}</TableCell>
        <TableCell className={cn('text-right tabular-nums', row.employeeCount === 0 && 'text-muted-foreground')}>
          {row.employeeCount}
          {row.employeeCap > 0 && <span className="text-muted-foreground">/{row.employeeCap}</span>}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {row.isIdle
            ? <span className="text-muted-foreground">idle</span>
            : Math.round(row.unitsPerDay).toLocaleString('en')}
        </TableCell>
        <TableCell className={cn('text-right tabular-nums', netClass(row.netPerDay))}>
          {goldSigned(row.netPerDay)}
        </TableCell>
        <PotentialCell value={row.bestPotentialNetPerDay} opportunity={row.bestOpportunityPerDay} />
        <TableCell className="text-muted-foreground text-right">
          {expandable && <ChevronDown className={cn('inline size-4 transition-transform', isOpen && 'rotate-180')} />}
        </TableCell>
      </TableRow>

      {expandable && isOpen && <FactoryLedger row={row} />}
    </>
  )
}

/**
 * One ledger line aligned to the table columns: the label spans the left columns,
 * the amount sits under Net/day, the Top/chevron columns stay clear. Shown
 * only when the row is expanded, so it stays collapsed (and out of the way) by
 * default on every screen.
 */
function LedgerRow({ label, amount, divider }: { label: ReactNode, amount: ReactNode, divider?: boolean }) {
  const top = divider ? '[&]:border-t' : ''
  return (
    <TableRow className="hover:bg-transparent border-b-0">
      <TableCell colSpan={LABEL_SPAN} className={cn('bg-muted/30 py-0.5 pl-8', top, divider && 'font-medium')}>
        {label}
      </TableCell>
      <TableCell className={cn('bg-muted/30 py-0.5 text-right tabular-nums', top)}>{amount}</TableCell>
      <TableCell colSpan={TRAILING_SPAN} className={cn('bg-muted/30 py-0.5', top)} />
    </TableRow>
  )
}

/**
 * An employee's net amount with the calculation (revenue − inputs − wage = net)
 * on hover. The line itself stays short to fit the Net/day column; the arithmetic
 * lives in the tooltip.
 */
function EmployeeNet({ w }: { w: LedgerEmployee }) {
  const wageRate = w.wagePerHour.toLocaleString('en', { maximumFractionDigits: 3 })
  const triggerClass = cn('cursor-help text-xs underline decoration-dotted underline-offset-2', netClass(w.netPerDay))

  return (
    <Tooltip>
      <TooltipTrigger render={<span className={triggerClass} />}>
        {goldSigned(w.netPerDay, 1)}
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        <div className="space-y-0.5">
          <TipRow label="Revenue" value={w.revenuePerDay} className="text-green-700 dark:text-green-400" />
          {w.inputCostPerDay >= 0.05 && (
            <TipRow label="Inputs" value={-w.inputCostPerDay} className="text-red-700 dark:text-red-400" />
          )}
          <TipRow
            label={<>Wage <span className="text-muted-foreground">({wageRate}/h)</span></>}
            value={-w.wagePerDay}
            className="text-red-700 dark:text-red-400"
          />
          <TipRow
            label="Net"
            value={w.netPerDay}
            className={netClass(w.netPerDay)}
            total
          />
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

interface TipRowProps {
  label: ReactNode
  value: number
  className?: string
  total?: boolean
}

/**
 * One label/amount line in the employee tooltip. `total` draws the rule above the
 * Net line.
 */
function TipRow({ label, value, className, total }: TipRowProps) {
  return (
    <div className={cn('flex justify-between gap-6', total && 'mt-0.5 border-t border-current/25 pt-0.5 font-medium')}>
      <span>{label}</span>
      <span className={cn('tabular-nums', className)}>{goldSigned(value, 1)}</span>
    </div>
  )
}

/**
 * The expanded ledger: the automated engine and each employee as a single net
 * line (output net of inputs, minus that employee's wage; the calculation is in a
 * tooltip), then the manager's wage, summing to Net. Self-work is excluded.
 */
function FactoryLedger({ row }: { row: FactoryLedgerRow }) {
  if (row.isIdle) {
    return (
      <TableRow className="hover:bg-transparent border-b-0">
        <TableCell colSpan={TOTAL_COLS} className="bg-muted/30 text-muted-foreground pl-8 text-sm">
          No production — no engine output and no productive employees.
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      {row.engineNetPerDay >= 0.05 && (
        <LedgerRow
          label={<span className="text-muted-foreground text-xs">Automated engine · Lvl {row.engineLevel}</span>}
          amount={(
            <span className={cn(
              'text-xs',
              netClass(row.engineNetPerDay),
            )}
            >{goldSigned(row.engineNetPerDay, 1)}
            </span>
          )}
        />
      )}
      {row.employees.map(w => (
        <LedgerRow
          key={w.id}
          label={<span className="text-muted-foreground text-xs">{w.name} · +{w.bonusPct}%</span>}
          amount={<EmployeeNet w={w} />}
        />
      ))}
      {row.managerPerDay >= 0.05 && (
        <LedgerRow
          label={<span className="text-muted-foreground text-xs">Manager wage</span>}
          amount={(
            <span className={cn(
              'text-xs',
              netClass(-row.managerPerDay),
            )}
            >{goldSigned(-row.managerPerDay, 1)}
            </span>
          )}
        />
      )}
      <LedgerRow
        divider
        label="Net"
        amount={<span className={cn('font-medium', netClass(row.netPerDay))}>{goldSigned(row.netPerDay, 1)}</span>}
      />
    </>
  )
}
