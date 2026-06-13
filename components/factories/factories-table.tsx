'use client'

import type { ReactNode } from 'react'
import type { BonusBreakdown, FactoryProfit, PortfolioTotals } from '@/lib/factories/profit'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface Props {
  rows: FactoryProfit[]
  totals: PortfolioTotals
}

// Plain-language explanations for the metric column headers. Factory, Item and
// Workers are self-explanatory, so they get no tooltip.
const HEADER_TIPS = {
  out: 'Units produced per day: daily production points ÷ the item\'s point cost.',
  net: 'Daily profit: revenue − input cost − gross wages.',
  move: 'Move potential: same item, relocated to its best region. Net/day for this factory\'s capacity there.',
  best: 'Top potential: the most profitable item globally at its best region. Net/day for this factory\'s capacity there.',
}

// Column spans for the sub-row breakdown and the footer. Four label columns
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
 * The user-page factories table: one dense row per factory (output, margin, net,
 * and relocation potentials per day), each expandable into a full revenue −
 * inputs − wages breakdown. The header carries a portfolio roll-up and an
 * expand/collapse-all toggle; the footer sums net and potentials.
 */
export function FactoriesTable({ rows, totals }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  const allExpanded = rows.length > 0 && rows.every(row => expanded.has(row.id))
  const champion = rows[0]

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
            {' net'}
            {totals.bestOpportunityPerDay >= 1 && (
              <>
                {' · '}
                <span className="text-green-700 dark:text-green-400">{goldSigned(totals.bestOpportunityPerDay)}</span>
                {' upside'}
              </>
            )}
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
  row: FactoryProfit
  isOpen: boolean
  onToggle: () => void
}

/**
 * A factory's summary row plus its expandable, column-aligned breakdown.
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

      {isOpen && <FactorySubRows row={row} />}
    </>
  )
}

/**
 * Bonus / sell-price context chips above a factory's breakdown.
 */
function ContextBadges({ row }: { row: FactoryProfit }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant="secondary">+{Math.round(row.bonusPct)}% bonus</Badge>
      <Badge variant="secondary">sell {row.sellPrice.toFixed(2)} g</Badge>
    </div>
  )
}

/**
 * The bonus breakdown (permanent vs temporary) shown inside a potential tooltip.
 */
function PotentialTip({ kind, item, region, bonus, value, opportunity }: {
  kind: 'move' | 'top'
  item: string
  region: string
  bonus: BonusBreakdown
  value: number
  opportunity: number
}) {
  const header = kind === 'move' ? `Move to ${region}` : `Switch to ${item} in ${region}`
  const until = bonus.depositEndAt?.slice(0, 10)

  return (
    <div className="space-y-0.5">
      <div className="font-medium">{header}</div>
      <div className="flex justify-between gap-6"><span>Permanent</span><span>+{Math.round(bonus.permanentPct)}%</span></div>
      {bonus.temporaryPct > 0 && (
        <div className="flex justify-between gap-6">
          <span>Temporary{until ? ` · until ${until}` : ''}</span>
          <span>+{Math.round(bonus.temporaryPct)}%</span>
        </div>
      )}
      <div className="flex justify-between gap-6 border-t border-current/25 pt-0.5 font-medium">
        <span>Total bonus</span><span>+{Math.round(bonus.totalPct)}%</span>
      </div>
      <div className="pt-0.5">Net {goldSigned(value)}/day <span className="opacity-80">({goldSigned(opportunity)} vs now)</span></div>
    </div>
  )
}

/**
 * A NET-row potential cell (move or top) aligned under its column. Shows the
 * value (or "optimal" when there's no upside), with the bonus breakdown on hover.
 */
function PotentialSubCell({ kind, row }: { kind: 'move' | 'top', row: FactoryProfit }) {
  const isMove = kind === 'move'
  const opportunity = isMove ? row.moveOpportunityPerDay : row.bestOpportunityPerDay
  if (opportunity < 1) {
    return <TableCell className="bg-muted/30 [&]:border-t text-muted-foreground text-right text-xs">optimal</TableCell>
  }

  const value = isMove ? row.movePotentialNetPerDay : row.bestPotentialNetPerDay
  const item = humanizeItem(isMove ? row.itemCode : row.bestProductCode)
  const region = isMove ? row.moveRegionName : row.bestRegionName
  const bonus = isMove ? row.moveBonus : row.topBonus

  return (
    <TableCell className="bg-muted/30 [&]:border-t text-right text-xs tabular-nums whitespace-nowrap">
      <Tooltip>
        <TooltipTrigger render={<span className="text-green-700 dark:text-green-400 cursor-default underline decoration-dotted underline-offset-2" />}>
          {goldSigned(value)}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-64 text-xs">
          <PotentialTip kind={kind} item={item} region={region} bonus={bonus} value={value} opportunity={opportunity} />
        </TooltipContent>
      </Tooltip>
    </TableCell>
  )
}

/**
 * The expanded breakdown: column-aligned sub-rows — amounts sit under Net/day,
 * the potentials under their columns, so the breakdown reads as an extension of
 * the table.
 */
function FactorySubRows({ row }: { row: FactoryProfit }) {
  if (row.isIdle) {
    return (
      <TableRow className="hover:bg-transparent">
        <TableCell colSpan={TOTAL_COLS} className="bg-muted/30 text-muted-foreground pl-8 text-sm">
          No production this period — factory idle.
        </TableCell>
      </TableRow>
    )
  }

  const lines: { label: string, node: ReactNode }[] = [
    {
      label: `Revenue · ${Math.round(row.unitsPerDay).toLocaleString('en')} × ${row.sellPrice.toFixed(2)}`,
      node: <span className="text-green-700 dark:text-green-400">{goldSigned(row.revenuePerDay)}</span>,
    },
    ...(row.inputs.length === 0
      ? [{ label: 'Inputs · raw resource', node: <span className="text-muted-foreground">none</span> }]
      : row.inputs.map(input => ({
          label: `Inputs · ${Math.round(input.qtyPerDay).toLocaleString('en')} ${humanizeItem(input.code)}`,
          node: <span className="text-red-700 dark:text-red-400">{goldSigned(-input.costPerDay)}</span>,
        }))),
    {
      label: 'Wages · gross',
      node: row.grossWagePerDay > 0
        ? <span className="text-red-700 dark:text-red-400">{goldSigned(-row.grossWagePerDay)}</span>
        : <span className="text-muted-foreground">0 g</span>,
    },
  ]

  return (
    <>
      <TableRow className="hover:bg-transparent border-b-0">
        <TableCell colSpan={TOTAL_COLS} className="bg-muted/30 pt-2 pb-1">
          <ContextBadges row={row} />
        </TableCell>
      </TableRow>
      {lines.map(line => (
        <TableRow key={line.label} className="hover:bg-transparent border-b-0">
          <TableCell colSpan={LABEL_SPAN} className="bg-muted/30 text-muted-foreground py-0.5 pl-8 text-xs">{line.label}</TableCell>
          <TableCell className="bg-muted/30 py-0.5 text-right text-xs tabular-nums">{line.node}</TableCell>
          <TableCell className="bg-muted/30 py-0.5" colSpan={TRAILING_SPAN} />
        </TableRow>
      ))}
      <TableRow className="hover:bg-transparent">
        <TableCell colSpan={LABEL_SPAN} className="bg-muted/30 [&]:border-t pl-4 font-medium">Net</TableCell>
        <TableCell className={cn('bg-muted/30 [&]:border-t text-right font-medium tabular-nums', netClass(row.netPerDay))}>
          {goldSigned(row.netPerDay)}
        </TableCell>
        <PotentialSubCell kind="move" row={row} />
        <PotentialSubCell kind="top" row={row} />
        <TableCell className="bg-muted/30 [&]:border-t" />
      </TableRow>
    </>
  )
}
