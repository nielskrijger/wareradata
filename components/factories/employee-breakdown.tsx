import type { ReactNode } from 'react'
import type { LedgerEmployee } from '@/lib/factories/ledger'

import { TooltipRow } from '@/components/cells/tooltip-ledger'
import { ItemIcon } from '@/components/item-icon'
import { signed, STAT_NAMES } from '@/lib/factories/employee-stats'

import { goldSigned, humanizeCode } from './format'

/**
 * Red/green for the dark tooltip surface, which stays dark in both themes.
 */
function tone(value: number): string {
  return value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-neutral-400'
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
export function EmployeeBreakdown({ e, factory }: { e: LedgerEmployee, factory?: ReactNode }) {
  const wageRate = e.wagePerHour.toLocaleString('en', { maximumFractionDigits: 3 })

  return (
    <div className="w-64 space-y-2.5">
      <div>
        <div className="text-sm font-medium">{e.name}</div>
        <div className="text-neutral-400">
          {factory && <>{factory} · </>}{e.age}y · retires in {e.retireInDays}d
        </div>
      </div>

      <Section title="Stats (base + trained + traits)">
        {STAT_NAMES.map((s) => {
          const d = e.stats[s]
          const extras = d.contributions
            .map(c => `${humanizeCode(c.code)} ${signed(c.delta, c.percent ? '%' : '')}`)
            .join(', ')

          return (
            <TooltipRow key={s} label={humanizeCode(s)}>
              {d.base} + {d.trained}{extras && <span className="text-neutral-400"> · {extras}</span>} = <b>{d.total}</b>
            </TooltipRow>
          )
        })}
        <TooltipRow label="Potential">{e.potential} / {e.potentialMax}</TooltipRow>
      </Section>

      <Section title={`Production bonus +${e.bonusPct}%`}>
        {e.bonusSources.map(b => (
          <TooltipRow key={b.source} label={humanizeCode(b.source)}>+{b.percent}%</TooltipRow>
        ))}
      </Section>

      <Section title={`Happiness ${e.happiness}`}>
        {e.happinessReasons.map((h, i) => (
          // Reasons can repeat (e.g. two care boosts), so the index keeps keys unique.
          // eslint-disable-next-line react/no-array-index-key
          <TooltipRow key={`${h.label}-${i}`} label={humanizeCode(h.label)}>
            <span className={tone(h.delta)}>{signed(h.delta)}</span>
          </TooltipRow>
        ))}
      </Section>

      {(e.specBest || e.tool) && (
        <Section title="Specialization & tool">
          {e.specBest && (
            <TooltipRow label="Specialization">
              {e.specHere} here
              {e.specBest.level > e.specHere && (
                <span className="text-neutral-400">
                  {' · best '}
                  <ItemIcon code={e.specBest.itemCode} small />
                  {` ${e.specBest.level}`}
                </span>
              )}
            </TooltipRow>
          )}
          {e.tool && (
            <TooltipRow label="Tool">
              {humanizeCode(e.tool.code)} +{e.tool.bonusPct}% · {Math.round(e.tool.durabilityPct)}%
            </TooltipRow>
          )}
        </Section>
      )}

      <Section title="Per day">
        <TooltipRow label="Revenue"><span className="text-green-400">{goldSigned(e.revenuePerDay)}</span></TooltipRow>
        {e.inputCostPerDay >= 0.05 && (
          <TooltipRow label="Inputs"><span className="text-red-400">{goldSigned(-e.inputCostPerDay)}</span></TooltipRow>
        )}
        <TooltipRow
          label={<>Wage <span className="text-neutral-500">({wageRate}/h, asks {e.wageExpectation})</span></>}
        >
          <span className="text-red-400">{goldSigned(-e.wagePerDay)}</span>
        </TooltipRow>
        <TooltipRow label="Net" className="mt-0.5 border-t border-white/20 pt-0.5 font-medium">
          <span className={tone(e.netPerDay)}>{goldSigned(e.netPerDay)}</span>
        </TooltipRow>
      </Section>
    </div>
  )
}
