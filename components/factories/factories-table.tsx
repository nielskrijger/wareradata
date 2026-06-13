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

/**
 * Which expanded-row layout to render. Temporary prop for the design preview;
 * the shipping table will hard-code the chosen one.
 *  1 — indented ledger, NET subtotal, best item as a tooltip hint.
 *  2 — indented ledger plus a separate "Opportunity" section.
 *  3 — column-aligned sub-rows (NET sits under Net/day, best under potential).
 *  4 — variant 3 + header tooltips + a dedicated Workers column.
 *  5 — variant 3 + header tooltips, with workers shown inline under the name.
 *  6 — variant 4, with the global best-item opportunity surfaced (item + region).
 *  7 — variant 6 + a "Move potential" column (same item, best region) before Best.
 *  8 — variant 7, but sub-row potentials show value only, item @ region on hover.
 *  9 — variant 7, but item @ region goes in a full-width caption line.
 * 10 — variant 8 + dotted underline, prose tooltip with the bonus breakdown.
 * 11 — variant 8 + dotted underline, structured-list tooltip with the breakdown.
 */
export type BreakdownVariant = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11

interface Props {
  rows: FactoryProfit[]
  totals: PortfolioTotals
  variant?: BreakdownVariant
}

// Plain-language explanations for the metric column headers (variants 4-7).
// Factory, Item and Workers are self-explanatory, so they get no tooltip.
const HEADER_TIPS = {
  out: 'Units produced per day: daily production points ÷ the item\'s point cost.',
  net: 'Daily profit: revenue − input cost − gross wages.',
  move: 'Move potential: same item, relocated to its best region. Net/day for this factory\'s capacity there.',
  best: 'Top potential: the most profitable item globally at its best region. Net/day for this factory\'s capacity there.',
}

interface ColumnLayout {
  // A dedicated numeric Workers column (variants 4, 6, 7).
  showWorkerColumn: boolean
  // Workers shown in the Factory cell subtitle instead of a column (variant 5).
  workersInline: boolean
  // A "Move potential" column before "Best potential" (variant 7).
  showMoveColumn: boolean
  // Wrap metric headers in explanatory tooltips (variants 4-7).
  headerTooltips: boolean
  // Use the column-aligned sub-row breakdown (variants 3-7).
  useSubRows: boolean
  // Surface the best item/region (with region name) in the breakdown (6+).
  globalBest: boolean
  // How the sub-row potential cells show their best item + region:
  //  'cell'    — item @ region inline in the cell (widens the column; variant 7)
  //  'tooltip' — value only, item @ region on hover (variant 8)
  //  'caption' — value only, item @ region in a full-width caption line (variant 9)
  potentialDetail: 'cell' | 'tooltip' | 'caption'
  // Tooltip content for the potential cells:
  //  'caveat' — one-line sentence (variants 3-9)
  //  'prose'  — bonus breakdown as a sentence (variant 10)
  //  'list'   — bonus breakdown as a small table (variant 11)
  tipStyle: 'caveat' | 'prose' | 'list'
  // Columns to the left of Net/day, i.e. the label span for sub-rows / footer.
  labelSpan: number
  // Cells to the right of Net/day: potential column(s) + chevron.
  trailingSpan: number
}

function columnLayout(variant: BreakdownVariant): ColumnLayout {
  const showWorkerColumn = variant >= 6 || variant === 4
  const showMoveColumn = variant >= 7
  return {
    showWorkerColumn,
    workersInline: variant === 5,
    showMoveColumn,
    headerTooltips: variant >= 4,
    useSubRows: variant >= 3,
    globalBest: variant >= 6,
    potentialDetail: variant === 9 ? 'caption' : variant === 8 || variant >= 10 ? 'tooltip' : 'cell',
    tipStyle: variant === 10 ? 'prose' : variant === 11 ? 'list' : 'caveat',
    labelSpan: showWorkerColumn ? 4 : 3,
    trailingSpan: showMoveColumn ? 3 : 2,
  }
}

/**
 * camelCase item code → readable label ("cookedFish" → "cooked fish").
 */
function humanizeItem(code: string): string {
  return code.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
}

/**
 * "2 workers" / "1 worker" / "0 workers".
 */
function workerLabel(count: number): string {
  return `${count} ${count === 1 ? 'worker' : 'workers'}`
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
 * A metric header cell, optionally wrapped in an explanatory tooltip.
 */
function HeaderCell({ tip, withTooltip, className, children }: { tip: string, withTooltip: boolean, className?: string, children: ReactNode }) {
  if (!withTooltip) {
    return <TableHead className={className}>{children}</TableHead>
  }

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
export function FactoriesTable({ rows, totals, variant = 11 }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  const layout = columnLayout(variant)
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
          {layout.globalBest && champion && (
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
            {layout.showWorkerColumn && <TableHead className="text-right">Workers</TableHead>}
            <HeaderCell tip={HEADER_TIPS.out} withTooltip={layout.headerTooltips} className="text-right">Out/day</HeaderCell>
            <HeaderCell tip={HEADER_TIPS.net} withTooltip={layout.headerTooltips} className="text-right">Net/day</HeaderCell>
            {layout.showMoveColumn && (
              <HeaderCell tip={HEADER_TIPS.move} withTooltip={layout.headerTooltips} className="text-right">Move potential</HeaderCell>
            )}
            <HeaderCell tip={HEADER_TIPS.best} withTooltip={layout.headerTooltips} className="text-right">Top potential</HeaderCell>
            <TableHead className="w-8" aria-label="Expand" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map(row => (
            <FactoryRows
              key={row.id}
              row={row}
              variant={variant}
              layout={layout}
              isOpen={expanded.has(row.id)}
              onToggle={() => toggleRow(row.id)}
            />
          ))}
        </TableBody>

        <TableFooter>
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={layout.labelSpan}>Total</TableCell>
            <TableCell className={cn('text-right tabular-nums', netClass(totals.netPerDay))}>
              {goldSigned(totals.netPerDay)}
            </TableCell>
            {layout.showMoveColumn && (
              <TableCell className="text-right tabular-nums">{goldSigned(totals.movePotentialNetPerDay)}</TableCell>
            )}
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
  variant: BreakdownVariant
  layout: ColumnLayout
}

/**
 * A factory's summary row plus its expandable breakdown (per `variant`).
 */
function FactoryRows({ row, isOpen, onToggle, variant, layout }: RowProps) {
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
          <span className="text-muted-foreground block text-xs">
            {layout.workersInline ? `${row.regionName} · ${workerLabel(row.workerCount)}` : row.regionName}
          </span>
        </TableCell>
        <TableCell className="text-muted-foreground">{humanizeItem(row.itemCode)}</TableCell>
        {layout.showWorkerColumn && (
          <TableCell className={cn('text-right tabular-nums', row.workerCount === 0 && 'text-muted-foreground')}>
            {row.workerCount}
          </TableCell>
        )}
        <TableCell className="text-right tabular-nums">
          {row.isIdle ? <span className="text-muted-foreground">idle</span> : Math.round(row.unitsPerDay).toLocaleString('en')}
        </TableCell>
        <TableCell className={cn('text-right tabular-nums', netClass(row.netPerDay))}>
          {goldSigned(row.netPerDay)}
        </TableCell>
        {layout.showMoveColumn && <PotentialCell value={row.movePotentialNetPerDay} opportunity={row.moveOpportunityPerDay} />}
        <PotentialCell value={row.bestPotentialNetPerDay} opportunity={row.bestOpportunityPerDay} />
        <TableCell className="text-muted-foreground text-right">
          <ChevronDown className={cn('inline size-4 transition-transform', isOpen && 'rotate-180')} />
        </TableCell>
      </TableRow>

      {isOpen && (
        layout.useSubRows
          ? <FactorySubRows row={row} layout={layout} />
          : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="bg-muted/30">
                  {variant === 2 ? <BreakdownTwoColumn row={row} /> : <BreakdownLedger row={row} />}
                </TableCell>
              </TableRow>
            )
      )}
    </>
  )
}

/**
 * Bonus / workers / sell-price context chips, shared by the cell-based variants.
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
 * One ledger line: label left, amount right; components indent, NET doesn't.
 */
function LedgerLine({ label, indent, strong, children }: { label: string, indent?: boolean, strong?: boolean, children: ReactNode }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-6', indent && 'pl-5', strong && 'font-medium')}>
      <dt className={cn(!strong && 'text-muted-foreground')}>{label}</dt>
      <dd className="tabular-nums">{children}</dd>
    </div>
  )
}

/**
 * The revenue / inputs / wages lines summing to a NET subtotal.
 */
function PnlLedger({ row }: { row: FactoryProfit }) {
  return (
    <dl className="space-y-1 text-sm">
      <LedgerLine indent label={`Revenue · ${Math.round(row.unitsPerDay).toLocaleString('en')} × ${row.sellPrice.toFixed(2)}`}>
        <span className="text-green-700 dark:text-green-400">{goldSigned(row.revenuePerDay)}</span>
      </LedgerLine>
      {row.inputs.length === 0
        ? (
            <LedgerLine indent label="Inputs · raw resource">
              <span className="text-muted-foreground">none</span>
            </LedgerLine>
          )
        : row.inputs.map(input => (
            <LedgerLine key={input.code} indent label={`Inputs · ${Math.round(input.qtyPerDay).toLocaleString('en')} ${humanizeItem(input.code)}`}>
              <span className="text-red-700 dark:text-red-400">{goldSigned(-input.costPerDay)}</span>
            </LedgerLine>
          ))}
      <LedgerLine indent label="Wages · gross">
        {row.grossWagePerDay > 0
          ? <span className="text-red-700 dark:text-red-400">{goldSigned(-row.grossWagePerDay)}</span>
          : <span className="text-muted-foreground">0 g</span>}
      </LedgerLine>
      <div className="mt-1 border-t pt-1">
        <LedgerLine label="Net" strong>
          <span className={netClass(row.netPerDay)}>{goldSigned(row.netPerDay)}</span>
        </LedgerLine>
      </div>
    </dl>
  )
}

/**
 * Variant 1: ledger only, with a one-line best-item hint (tooltip).
 */
function BreakdownLedger({ row }: { row: FactoryProfit }) {
  if (row.isIdle) {
    return <p className="text-muted-foreground py-1 text-sm">No production this period — factory idle.</p>
  }

  return (
    <div className="max-w-md space-y-2 py-1">
      <ContextBadges row={row} />
      <PnlLedger row={row} />
      <p className="text-muted-foreground pl-5 text-xs">
        Best item:{' '}
        {row.bestOpportunityPerDay >= 1
          ? (
              <Tooltip>
                <TooltipTrigger render={<span className="text-foreground cursor-default font-medium underline decoration-dotted underline-offset-2" />}>
                  {humanizeItem(row.bestProductCode)} in {row.bestRegionName} {goldSigned(row.bestPotentialNetPerDay)}/day
                </TooltipTrigger>
                <TooltipContent side="top">
                  {goldSigned(row.bestOpportunityPerDay)} vs now if this factory's capacity produced{' '}
                  {humanizeItem(row.bestProductCode)} at its best region. Implies relocating; ignores the move cost.
                </TooltipContent>
              </Tooltip>
            )
          : <span className="text-foreground">already optimal</span>}
      </p>
    </div>
  )
}

/**
 * Variant 2: ledger on the left, a distinct "Opportunity" section on the right.
 */
function BreakdownTwoColumn({ row }: { row: FactoryProfit }) {
  if (row.isIdle) {
    return <p className="text-muted-foreground py-1 text-sm">No production this period — factory idle.</p>
  }

  return (
    <div className="grid gap-4 py-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,15rem)]">
      <div className="space-y-2">
        <ContextBadges row={row} />
        <PnlLedger row={row} />
      </div>

      <div className="bg-card flex flex-col gap-1 rounded-md border p-3 text-sm">
        <span className="text-muted-foreground text-xs">Best item globally</span>
        {row.bestOpportunityPerDay >= 1
          ? (
              <>
                <span>
                  <span className="font-medium">{humanizeItem(row.bestProductCode)}</span> in {row.bestRegionName}
                </span>
                <span className="tabular-nums">
                  <span className="font-medium">{goldSigned(row.bestPotentialNetPerDay)}</span>/day
                  {' '}
                  <span className="text-green-700 dark:text-green-400">({goldSigned(row.bestOpportunityPerDay)})</span>
                </span>
                <span className="text-muted-foreground text-xs">Implies relocating; ignores move cost.</span>
              </>
            )
          : <span className="text-muted-foreground">Already the most profitable item.</span>}
      </div>
    </div>
  )
}

/**
 * The bonus breakdown (permanent vs temporary) inside a potential tooltip.
 */
function PotentialTip({ kind, item, region, bonus, value, opportunity, style }: {
  kind: 'move' | 'top'
  item: string
  region: string
  bonus: BonusBreakdown
  value: number
  opportunity: number
  style: 'caveat' | 'prose' | 'list'
}) {
  const header = kind === 'move' ? `Move to ${region}` : `Switch to ${item} in ${region}`
  const until = bonus.depositEndAt?.slice(0, 10)

  if (style === 'list') {
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

  return (
    <div className="space-y-0.5">
      <div className="font-medium">{header}</div>
      <div>
        +{Math.round(bonus.totalPct)}% bonus — {Math.round(bonus.permanentPct)}% permanent
        {bonus.temporaryPct > 0 && `, ${Math.round(bonus.temporaryPct)}% temporary${until ? ` (until ${until})` : ''}`}
      </div>
      <div>{goldSigned(value)}/day · {goldSigned(opportunity)} vs now</div>
      <div className="opacity-80">Ignores the move cost.</div>
    </div>
  )
}

/**
 * A NET-row potential cell (move or top) aligned under its column.
 */
function PotentialSubCell({ kind, row, layout }: { kind: 'move' | 'top', row: FactoryProfit, layout: ColumnLayout }) {
  const isMove = kind === 'move'
  const opportunity = isMove ? row.moveOpportunityPerDay : row.bestOpportunityPerDay
  if (opportunity < 1) {
    return <TableCell className="bg-muted/30 [&]:border-t text-muted-foreground text-right text-xs">optimal</TableCell>
  }

  const value = isMove ? row.movePotentialNetPerDay : row.bestPotentialNetPerDay
  const item = humanizeItem(isMove ? row.itemCode : row.bestProductCode)
  const region = isMove ? row.moveRegionName : row.bestRegionName
  const bonus = isMove ? row.moveBonus : row.topBonus
  const inlineLabel = layout.potentialDetail === 'cell'
  const underline = layout.potentialDetail === 'tooltip'

  const tip = layout.tipStyle === 'caveat'
    ? (isMove
        ? `${goldSigned(opportunity)} vs now if you relocated this ${item} factory to ${region} (its best region). Ignores the move cost.`
        : `${goldSigned(opportunity)} vs now if this factory's capacity produced ${item} at its best region. Implies relocating and switching item; ignores the move cost.`)
    : <PotentialTip kind={kind} item={item} region={region} bonus={bonus} value={value} opportunity={opportunity} style={layout.tipStyle} />

  return (
    <TableCell className="bg-muted/30 [&]:border-t text-right text-xs tabular-nums whitespace-nowrap">
      <Tooltip>
        <TooltipTrigger render={<span className={cn('text-green-700 dark:text-green-400 cursor-default', underline && 'underline decoration-dotted underline-offset-2')} />}>
          {inlineLabel ? `${item}${layout.globalBest ? ` @ ${region}` : ''} ` : ''}{goldSigned(value)}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-64 text-xs">{tip}</TooltipContent>
      </Tooltip>
    </TableCell>
  )
}

/**
 * Variants 3-7: column-aligned sub-rows — amounts sit under Net/day, the
 *  potentials under their columns, so the breakdown reads as an extension of
 *  the table.
 */
function FactorySubRows({ row, layout }: { row: FactoryProfit, layout: ColumnLayout }) {
  const totalCols = layout.labelSpan + 1 + layout.trailingSpan

  if (row.isIdle) {
    return (
      <TableRow className="hover:bg-transparent">
        <TableCell colSpan={totalCols} className="bg-muted/30 text-muted-foreground pl-8 text-sm">
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
        <TableCell colSpan={totalCols} className="bg-muted/30 pt-2 pb-1">
          <ContextBadges row={row} />
        </TableCell>
      </TableRow>
      {lines.map(line => (
        <TableRow key={line.label} className="hover:bg-transparent border-b-0">
          <TableCell colSpan={layout.labelSpan} className="bg-muted/30 text-muted-foreground py-0.5 pl-8 text-xs">{line.label}</TableCell>
          <TableCell className="bg-muted/30 py-0.5 text-right text-xs tabular-nums">{line.node}</TableCell>
          <TableCell className="bg-muted/30 py-0.5" colSpan={layout.trailingSpan} />
        </TableRow>
      ))}
      <TableRow className={cn('hover:bg-transparent', layout.potentialDetail === 'caption' && 'border-b-0')}>
        <TableCell colSpan={layout.labelSpan} className="bg-muted/30 [&]:border-t pl-4 font-medium">Net</TableCell>
        <TableCell className={cn('bg-muted/30 [&]:border-t text-right font-medium tabular-nums', netClass(row.netPerDay))}>
          {goldSigned(row.netPerDay)}
        </TableCell>
        {layout.showMoveColumn && <PotentialSubCell kind="move" row={row} layout={layout} />}
        <PotentialSubCell kind="top" row={row} layout={layout} />
        <TableCell className="bg-muted/30 [&]:border-t" />
      </TableRow>

      {layout.potentialDetail === 'caption' && (row.moveOpportunityPerDay >= 1 || row.bestOpportunityPerDay >= 1) && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={totalCols} className="bg-muted/30 text-muted-foreground pb-2 pl-8 text-xs">
            {row.moveOpportunityPerDay >= 1 && (
              <>
                Move → <span className="text-foreground">{humanizeItem(row.itemCode)} in {row.moveRegionName}</span>{' '}
                <span className="text-green-700 dark:text-green-400">{goldSigned(row.movePotentialNetPerDay)}/day</span>
              </>
            )}
            {row.moveOpportunityPerDay >= 1 && row.bestOpportunityPerDay >= 1 && <span className="px-2">·</span>}
            {row.bestOpportunityPerDay >= 1 && (
              <>
                Top → <span className="text-foreground">{humanizeItem(row.bestProductCode)} in {row.bestRegionName}</span>{' '}
                <span className="text-green-700 dark:text-green-400">{goldSigned(row.bestPotentialNetPerDay)}/day</span>
              </>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
