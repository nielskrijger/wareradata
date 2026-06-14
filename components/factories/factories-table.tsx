'use client'

import type { ReactNode } from 'react'
import type { FactoryLedgerRow } from '@/lib/factories/ledger'
import type { PortfolioTotals } from '@/lib/factories/profit'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface Props {
  rows: FactoryLedgerRow[]
  totals: PortfolioTotals
}

// Plain-language explanations for the metric column headers. Factory, Item and
// Workers are self-explanatory, so they get no tooltip.
const HEADER_TIPS = {
  out: 'Units produced per day by the automated engine + hired workers (excludes self-work).',
  net: 'Daily profit: revenue − input cost − wages, from the automated engine + hired workers. Excludes self-work (the owner\'s discretionary labour).',
  move: 'Move potential: same item, relocated to its best region. Net/day for this factory\'s capacity there.',
  best: 'Top potential: the most profitable item globally at its best region. Net/day for this factory\'s capacity there.',
}

// Column spans for the ledger sub-rows and the footer. Four label columns
// (Factory, Item, Workers, Out/day) sit left of Net/day; three trailing cells
// (Move potential, Top potential, chevron) sit right of it — eight columns total.
const LABEL_SPAN = 4
const TRAILING_SPAN = 3
const TOTAL_COLS = LABEL_SPAN + 1 + TRAILING_SPAN

/**
 * camelCase item code → readable label ("cookedFish" → "cooked fish").
 */
function humanizeItem(code: string): string {
  return code.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
}

/**
 * Signed gold for deltas: "+50 g", "−12 g", "0 g".
 */
function goldSigned(value: number): string {
  const rounded = Math.round(value)
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : ''
  return `${sign}${Math.abs(rounded).toLocaleString('en')} g`
}

/**
 * Profit colour: green for gains, red for losses, muted for zero/idle.
 */
function netClass(value: number): string {
  if (value > 0) {
    return 'text-green-700 dark:text-green-400'
  }
  if (value < 0) {
    return 'text-red-700 dark:text-red-400'
  }
  return 'text-muted-foreground'
}

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
 * The user-page factories table: one dense row per factory (output, net, and
 * relocation potentials per day), each expandable into an accounting ledger —
 * every producer (engine, each worker) and cost (inputs, per-worker wages)
 * summing to Net, then the net projected at full worker loyalty. Net excludes
 * self-work. The header carries a portfolio roll-up and an expand/collapse-all
 * toggle; the footer sums net and potentials.
 */
export function FactoriesTable({ rows, totals }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  const allExpanded = rows.length > 0 && rows.every(row => expanded.has(row.id))
  const champion = rows[0]
  const projectedTotal = rows.reduce((sum, row) => sum + row.projectedNetPerDay, 0)

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
    setExpanded(allExpanded ? new Set() : new Set(rows.map(row => row.id)))
  }

  return (
    <section className="bg-card overflow-hidden rounded-md border">
      <div className="flex flex-wrap items-center justify-between gap-2 p-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Factories</span>
          <span className="text-muted-foreground text-xs tabular-nums">
            {totals.activeCount} of {totals.count} active ·{' '}
            <span className={netClass(totals.netPerDay)}>{goldSigned(totals.netPerDay)}</span>
            {' net → '}
            <span className="text-green-700 dark:text-green-400">{goldSigned(projectedTotal)}</span>
            {' at full loyalty'}
          </span>
          {champion && (
            <span className="text-muted-foreground text-xs">
              Best item now:{' '}
              <span className="text-foreground font-medium">{humanizeItem(champion.bestProductCode)}</span>
              {' in '}
              {champion.bestRegionName}
            </span>
          )}
        </div>

        <Button variant="outline" size="sm" onClick={toggleAll} aria-expanded={allExpanded}>
          {allExpanded ? 'Collapse all' : 'Expand all'}
        </Button>
      </div>

      <Table className="text-sm">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Factory</TableHead>
            <TableHead>Item</TableHead>
            <TableHead className="text-right">Workers</TableHead>
            <HeaderCell tip={HEADER_TIPS.out} className="text-right">Out/day</HeaderCell>
            <HeaderCell tip={HEADER_TIPS.net} className="text-right">Net/day</HeaderCell>
            <HeaderCell tip={HEADER_TIPS.move} className="text-right">Move potential</HeaderCell>
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
            <TableCell className="text-right tabular-nums">{goldSigned(totals.movePotentialNetPerDay)}</TableCell>
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
  return (
    <>
      <TableRow
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onToggle()
          }
        }}
        className={cn('cursor-pointer', row.isIdle && 'opacity-60')}
      >
        <TableCell>
          <span className="font-medium">{row.name}</span>
          <span className="text-muted-foreground block text-xs">{row.regionName}</span>
        </TableCell>
        <TableCell className="text-muted-foreground">{humanizeItem(row.itemCode)}</TableCell>
        <TableCell className={cn('text-right tabular-nums', row.workerCount === 0 && 'text-muted-foreground')}>
          {row.workerCount}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {row.isIdle ? <span className="text-muted-foreground">idle</span> : Math.round(row.unitsPerDay).toLocaleString('en')}
        </TableCell>
        <TableCell className={cn('text-right tabular-nums', netClass(row.netPerDay))}>
          {goldSigned(row.netPerDay)}
        </TableCell>
        <PotentialCell value={row.movePotentialNetPerDay} opportunity={row.moveOpportunityPerDay} />
        <PotentialCell value={row.bestPotentialNetPerDay} opportunity={row.bestOpportunityPerDay} />
        <TableCell className="text-muted-foreground text-right">
          <ChevronDown className={cn('inline size-4 transition-transform', isOpen && 'rotate-180')} />
        </TableCell>
      </TableRow>

      {isOpen && <FactoryLedger row={row} />}
    </>
  )
}

/**
 * One ledger line aligned to the table columns: the label spans the left columns,
 * the amount sits under Net/day, the Move/Top/chevron columns stay clear. Shown
 * only when the row is expanded, so it stays collapsed (and out of the way) by
 * default on every screen.
 */
function LedgerRow({ label, amount, divider }: { label: ReactNode, amount: ReactNode, divider?: boolean }) {
  const top = divider ? '[&]:border-t' : ''
  return (
    <TableRow className="hover:bg-transparent border-b-0">
      <TableCell colSpan={LABEL_SPAN} className={cn('bg-muted/30 py-0.5 pl-8', top, divider && 'font-medium')}>{label}</TableCell>
      <TableCell className={cn('bg-muted/30 py-0.5 text-right tabular-nums', top)}>{amount}</TableCell>
      <TableCell colSpan={TRAILING_SPAN} className={cn('bg-muted/30 py-0.5', top)} />
    </TableRow>
  )
}

/**
 * The expanded ledger: the automated engine and each worker as a single net line
 * (output net of inputs, minus that worker's wage), summing to Net, then the net
 * projected at full worker loyalty. Self-work is excluded.
 */
function FactoryLedger({ row }: { row: FactoryLedgerRow }) {
  if (row.isIdle) {
    return (
      <TableRow className="hover:bg-transparent border-b-0">
        <TableCell colSpan={TOTAL_COLS} className="bg-muted/30 text-muted-foreground pl-8 text-sm">
          No production this period — engine idle and no workers.
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      {row.engineNetPerDay >= 1 && (
        <LedgerRow
          label={<span className="text-muted-foreground text-xs">Automated engine · Lvl {row.engineLevel}</span>}
          amount={<span className={cn('text-xs', netClass(row.engineNetPerDay))}>{goldSigned(row.engineNetPerDay)}</span>}
        />
      )}
      {row.workers.map(w => (
        <LedgerRow
          key={w.id}
          label={<span className="text-muted-foreground text-xs">{w.name} · {w.fidelity}/10</span>}
          amount={<span className={cn('text-xs', netClass(w.netPerDay))}>{goldSigned(w.netPerDay)}</span>}
        />
      ))}
      <LedgerRow
        divider
        label="Net"
        amount={<span className={cn('font-medium', netClass(row.netPerDay))}>{goldSigned(row.netPerDay)}</span>}
      />
      <LedgerRow
        label={<span className="font-medium">At full loyalty <span className="text-muted-foreground text-xs font-normal">+10% fidelity</span></span>}
        amount={<span className={cn('font-medium', netClass(row.projectedNetPerDay))}>{goldSigned(row.projectedNetPerDay)}</span>}
      />
    </>
  )
}
