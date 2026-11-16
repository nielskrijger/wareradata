import type { ReactNode } from 'react'
import type { LedgerEmployee } from '@/lib/factories/ledger'

import { signed, STAT_NAMES } from '@/lib/factories/employee-stats'
import { cn } from '@/lib/utils'

import { goldSigned, humanizeCode } from './format'

/**
 * Red/green for the dark tooltip surface, which stays dark in both themes.
 */
function tone(value: number): string {
  return value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-neutral-400'
}

function Row({ label, children, className }: { label: ReactNode, children: ReactNode, className?: string }) {
  return (
    <div className={cn('flex justify-between gap-6', className)}>
      <span className="text-neutral-400">{label}</span>
      <span className="text-right tabular-nums">{children}</span>
    </div>
  )
}

function Section({ title, children }: { title: string, children: ReactNode }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[10px] tracking-wide text-neutral-500 uppercase">{title}</div>
      {children}
    </div>
  )
}

/**
 * Everything the roster knows about one employee, for the name tooltip: where
 * each stat comes from, the bonus and happiness reasons, specialization, tool and
 * the money behind Net/day.
 */
export function EmployeeBreakdown({ e, factoryName }: { e: LedgerEmployee, factoryName?: string }) {
  const wageRate = e.wagePerHour.toLocaleString('en', { maximumFractionDigits: 3 })

  return (
    <div className="w-64 space-y-2.5">
      <div>
        <div className="text-sm font-medium">{e.name}</div>
        <div className="text-neutral-400">
          {factoryName && <>{factoryName} · </>}{e.age}y · retires in {e.retireInDays}d
        </div>
      </div>

      <Section title="Stats (base + trained + traits)">
        {STAT_NAMES.map((s) => {
          const d = e.stats[s]
          const extras = d.contributions
            .map(c => `${humanizeCode(c.code)} ${signed(c.delta, c.percent ? '%' : '')}`)
            .join(', ')

          return (
            <Row key={s} label={humanizeCode(s)}>
              {d.base} + {d.trained}{extras && <span className="text-neutral-400"> · {extras}</span>} = <b>{d.total}</b>
            </Row>
          )
        })}
        <Row label="Potential">{e.potential} / {e.potentialMax}</Row>
      </Section>

      <Section title={`Production bonus +${e.bonusPct}%`}>
        {e.bonusSources.map(b => (
          <Row key={b.source} label={humanizeCode(b.source)}>+{b.percent}%</Row>
        ))}
      </Section>

      <Section title={`Happiness ${e.happiness}`}>
        {e.happinessReasons.map((h, i) => (
          // Reasons can repeat (e.g. two care boosts), so the index keeps keys unique.
          // eslint-disable-next-line react/no-array-index-key
          <Row key={`${h.label}-${i}`} label={humanizeCode(h.label)}>
            <span className={tone(h.delta)}>{signed(h.delta)}</span>
          </Row>
        ))}
      </Section>

      {(e.specBest || e.tool) && (
        <Section title="Specialization & tool">
          {e.specBest && (
            <Row label="Specialization">
              {e.specHere} here
              {e.specBest.level > e.specHere && (
                <span className="text-neutral-400"> · {humanizeCode(e.specBest.itemCode)} {e.specBest.level}</span>
              )}
            </Row>
          )}
          {e.tool && (
            <Row label="Tool">
              {humanizeCode(e.tool.code)} +{e.tool.bonusPct}% · {Math.round(e.tool.durabilityPct)}%
            </Row>
          )}
        </Section>
      )}

      <Section title="Per day">
        <Row label="Revenue"><span className="text-green-400">{goldSigned(e.revenuePerDay)}</span></Row>
        {e.inputCostPerDay >= 0.05 && (
          <Row label="Inputs"><span className="text-red-400">{goldSigned(-e.inputCostPerDay)}</span></Row>
        )}
        <Row label={<>Wage <span className="text-neutral-500">({wageRate}/h, asks {e.wageExpectation})</span></>}>
          <span className="text-red-400">{goldSigned(-e.wagePerDay)}</span>
        </Row>
        <Row label="Net" className="mt-0.5 border-t border-white/20 pt-0.5 font-medium">
          <span className={tone(e.netPerDay)}>{goldSigned(e.netPerDay)}</span>
        </Row>
      </Section>
    </div>
  )
}
