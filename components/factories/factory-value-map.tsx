'use client'

import type { FactoryLedgerRow, LedgerEmployee } from '@/lib/factories/ledger'

import { useLayoutEffect, useRef, useState } from 'react'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import { EmployeeBreakdown } from './employee-breakdown'
import { ENGINE_FILL, goldSigned, humanizeItem, itemColors } from './format'

interface Point {
  e: LedgerEmployee
  factory: FactoryLedgerRow

  /**
   * Output value net of inputs, before wage.
   */
  value: number
  color: string
}

const AXIS_TEXT = 'fill-muted-foreground text-[11px] tabular-nums'

const M = { l: 44, r: 16, t: 12, b: 38 }

/**
 * The element's rendered width. The charts draw at real pixel size so text and
 * dots keep their size however wide the card gets.
 */
function useWidth<T extends Element>(initial: number) {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(initial)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) {
      return
    }

    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)

    return () => observer.disconnect()
  }, [])

  return [ref, width] as const
}

/**
 * Round-number axis ticks from 0 to just past `max`.
 */
function ticks(max: number, count = 5): number[] {
  const raw = max / count
  const mag = 10 ** Math.floor(Math.log10(raw || 1))
  const step = [1, 2, 2.5, 5, 10].map(s => s * mag).find(s => s >= raw) ?? raw
  const n = Math.max(1, Math.ceil(max / step))

  return Array.from({ length: n + 1 }, (_, i) => i * step)
}

function EmployeeDot({ p, x, y }: { p: Point, x: number, y: number }) {
  // Larger dots have more room to train, the cheapest upside to act on.
  const r = 4 + Math.max(0, p.e.potentialMax - p.e.potential) * 0.4

  return (
    <Tooltip>
      <TooltipTrigger
        render={(
          <circle
            cx={x}
            cy={y}
            r={r}
            fill={p.color}
            fillOpacity={0.85}
            className="stroke-card hover:stroke-foreground cursor-help stroke-[1.5]"
          />
        )}
      />
      <TooltipContent side="right" className="max-w-none">
        <EmployeeBreakdown e={p.e} factoryName={`${p.factory.name} · ${humanizeItem(p.factory.itemCode)}`} />
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * Employees by wage (x) and output value (y); the shaded wedge is where they
 * cost more than they make. The extremes are labelled so they read without
 * hovering.
 */
function Scatter({ points }: { points: Point[] }) {
  const [ref, W] = useWidth<HTMLDivElement>(560)
  const H = Math.min(360, Math.max(240, W * 0.6))
  const xTicks = ticks(Math.max(1, ...points.map(p => p.e.wagePerDay)))
  const yTicks = ticks(Math.max(1, ...points.map(p => p.value)))
  const xMax = xTicks.at(-1)!
  const yMax = yTicks.at(-1)!
  const x = (v: number) => M.l + (v / xMax) * (W - M.l - M.r)
  const y = (v: number) => H - M.b - (Math.max(0, v) / yMax) * (H - M.t - M.b)
  const edge = Math.min(xMax, yMax)

  const byNet = [...points].sort((a, b) => b.e.netPerDay - a.e.netPerDay)
  const labelled = points.length > 1 ? [byNet[0], byNet.at(-1)!] : []

  return (
    <div ref={ref}>
      <svg
        width={W}
        height={H}
        className="block overflow-visible"
        role="img"
        aria-label="Employees by daily wage and output value"
      >
        {yTicks.map(v => (
          <g key={v}>
            <line
              x1={M.l}
              x2={W - M.r}
              y1={y(v)}
              y2={y(v)}
              className="stroke-border"
              strokeDasharray={v ? '2 3' : undefined}
            />
            <text x={M.l - 6} y={y(v) + 3} textAnchor="end" className={AXIS_TEXT}>{v}</text>
          </g>
        ))}
        {xTicks.map(v => (
          <text key={v} x={x(v)} y={H - M.b + 15} textAnchor="middle" className={AXIS_TEXT}>{v}</text>
        ))}

        <polygon
          points={`${x(0)},${y(0)} ${x(xMax)},${y(0)} ${x(xMax)},${y(edge)} ${x(edge)},${y(edge)}`}
          className="fill-red-500/10"
        />
        <line
          x1={x(0)}
          y1={y(0)}
          x2={x(edge)}
          y2={y(edge)}
          className="stroke-red-600 dark:stroke-red-400"
          strokeDasharray="4 3"
        />
        <text x={x(edge) - 4} y={y(edge) - 6} textAnchor="end" className="fill-red-700 text-[10px] dark:fill-red-400">
          break-even
        </text>

        <text x={(M.l + W - M.r) / 2} y={H - 4} textAnchor="middle" className={AXIS_TEXT}>wage, gold/day</text>
        <text transform={`translate(10 ${(M.t + H - M.b) / 2}) rotate(-90)`} textAnchor="middle" className={AXIS_TEXT}>
          output value, gold/day
        </text>

        {points.map(p => <EmployeeDot key={p.e.id} p={p} x={x(p.e.wagePerDay)} y={y(p.value)} />)}
        {labelled.map(p => (
          <text
            key={p.e.id}
            x={x(p.e.wagePerDay) + 9}
            y={y(p.value) + 3}
            className="fill-foreground pointer-events-none text-[11px]"
          >
            {p.e.name}
          </text>
        ))}
      </svg>
    </div>
  )
}

/**
 * Green deepening with net/day relative to the best earner, red when an
 * employee loses money.
 */
function netFill(net: number, best: number): string {
  if (net < 0) {
    return 'oklch(0.63 0.22 27)'
  }

  const t = best > 0 ? Math.min(1, net / best) : 0

  return `oklch(${0.45 + t * 0.35} ${0.08 + t * 0.12} 150)`
}

/**
 * Production points per factory, stacked engine-first then each employee, with
 * Net/day at the end of the bar.
 */

/**
 * One factory's bar spelled out: engine, each employee and the manager, summing
 * to Net/day.
 */
function FactoryBreakdown({ row }: { row: FactoryLedgerRow }) {
  return (
    <div className="space-y-1">
      <div className="font-medium">
        Factory {row.name} · {humanizeItem(row.itemCode)} · {Math.round(row.pointsPerDay)} pts/day
      </div>
      <table className="tabular-nums">
        <tbody>
          <tr>
            <td className="pr-3">Engine Lvl {row.engineLevel}</td>
            <td className="pr-3 text-right">{Math.round(row.enginePointsPerDay)}</td>
            <td className="text-right">{goldSigned(row.engineNetPerDay)}</td>
          </tr>
          {row.employees.map(e => (
            <tr key={e.id}>
              <td className="pr-3">{e.name}</td>
              <td className="pr-3 text-right">{Math.round(e.pointsPerDay)}</td>
              <td className="text-right">{goldSigned(e.netPerDay)}</td>
            </tr>
          ))}
          {row.managerPerDay >= 0.05 && (
            <tr>
              <td className="pr-3">Manager</td>
              <td />
              <td className="text-right">{goldSigned(-row.managerPerDay)}</td>
            </tr>
          )}
          <tr className="border-t font-medium">
            <td className="pt-0.5 pr-3">Net / day</td>
            <td />
            <td className="pt-0.5 text-right">{goldSigned(row.netPerDay)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function OutputBars({ rows }: { rows: FactoryLedgerRow[] }) {
  const best = Math.max(0, ...rows.flatMap(r => r.employees.map(e => e.netPerDay)))
  const [ref, BW] = useWidth<HTMLDivElement>(380)
  const rowH = 22
  const left = 40
  const right = 70
  const max = Math.max(1, ...rows.map(r => r.pointsPerDay))
  const scale = (v: number) => (v / max) * (BW - left - right)
  const BH = rows.length * rowH

  return (
    <div ref={ref}>
      <svg
        width={BW}
        height={BH}
        className="block"
        role="img"
        aria-label="Production points per day by factory"
      >
        {rows.map((row, i) => {
          const top = i * rowH + 3
          let acc = row.enginePointsPerDay

          return (
            <g key={row.id}>
              <text x={left - 6} y={top + 12} textAnchor="end" className={AXIS_TEXT}>{row.name}</text>
              <rect
                x={left}
                y={top}
                width={Math.max(0, scale(row.enginePointsPerDay) - 1.5)}
                height={rowH - 7}
                rx={2}
                fill={ENGINE_FILL}
              />
              {row.employees.map((e) => {
                const x0 = left + scale(acc)
                acc += e.pointsPerDay

                return (
                  <rect
                    key={e.id}
                    x={x0}
                    y={top}
                    width={Math.max(0, scale(e.pointsPerDay) - 1.5)}
                    height={rowH - 7}
                    rx={2}
                    fill={netFill(e.netPerDay, best)}
                  />
                )
              })}
              <text
                x={left + scale(acc) + 6}
                y={top + 12}
                className={cn(
                  'text-[11px] tabular-nums',
                  row.netPerDay >= 0 ? 'fill-green-700 dark:fill-green-400' : 'fill-red-700 dark:fill-red-400',
                )}
              >
                {goldSigned(row.netPerDay)}
              </text>
              {/* One hover target per row, so the tooltip explains the whole bar. */}
              <Tooltip>
                <TooltipTrigger
                  render={(
                    <rect
                      x={0}
                      y={i * rowH}
                      width={BW}
                      height={rowH}
                      className="hover:fill-foreground/5 cursor-help fill-transparent"
                    />
                  )}
                />
                <TooltipContent side="top" className="max-w-none">
                  <FactoryBreakdown row={row} />
                </TooltipContent>
              </Tooltip>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/**
 * The value map as two cards: who pays for themselves (scatter) next to where
 * each factory's output comes from (stacked bars).
 */
export function FactoryValueMap({ rows }: { rows: FactoryLedgerRow[] }) {
  const colors = itemColors(rows.map(r => r.itemCode))
  const points: Point[] = rows.flatMap(factory => factory.employees.map(e => ({
    e,
    factory,
    value: e.revenuePerDay - e.inputCostPerDay,
    color: colors.get(factory.itemCode)!,
  })))

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="bg-card min-w-0 space-y-2 rounded-md border p-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium">Who pays for themselves</h2>
          <span className="text-muted-foreground flex flex-wrap gap-x-3 text-xs">
            {[...colors].map(([it, color]) => (
              <span key={it} className="inline-flex items-center gap-1">
                <i className="size-2 rounded-full" style={{ background: color }} />
                {humanizeItem(it)}
              </span>
            ))}
            <span>dot size = room to train</span>
          </span>
        </div>
        {points.length ? <Scatter points={points} /> : <p className="text-muted-foreground text-sm">No employees.</p>}
      </section>
      <section className="bg-card min-w-0 space-y-2 rounded-md border p-3">
        <h2 className="text-sm font-medium">Points per day by factory</h2>
        <OutputBars rows={rows} />
        <p className="text-muted-foreground text-xs">
          Slate is the automated engine. Each employee is greener the more they net per day, red when they lose money.
        </p>
      </section>
    </div>
  )
}
