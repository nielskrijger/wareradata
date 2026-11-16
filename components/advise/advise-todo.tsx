'use client'

import type { AdvisorResult, TodoItem } from '@/lib/advisor/types'
import { Check } from 'lucide-react'
import { useState } from 'react'

import { StackedBar } from '@/components/stacked-bar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Props {
  result: AdvisorResult
}

const KIND_LABEL: Record<TodoItem['kind'], string> = {
  money: 'Money',
  train: 'Train',
  tool: 'Tool',
  manager: 'Manager',
  employee: 'Employee',
  item: 'Item',
  hire: 'Hire',
  work: 'Work',
}

function gold(value: number): string {
  return `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(2)}`
}

function hours(value: number): string {
  return Number.isFinite(value) ? `${value.toFixed(1)} h` : 'never'
}

/**
 * The ranked to-do list with an energy bar that fills as items are ticked off.
 * Ticks live only in this tab: the list is rebuilt from the API on each load.
 */
export function AdviseTodo({ result }: Props) {
  const [done, setDone] = useState<Set<string>>(() => new Set())
  const toggle = (id: string) => setDone((prev) => {
    const next = new Set(prev)
    if (!next.delete(id)) {
      next.add(id)
    }

    return next
  })

  const { energy, items } = result
  const spent = items.filter(i => done.has(i.id)).reduce((s, i) => s + i.energy, 0)
  const planned = items.filter(i => !done.has(i.id)).reduce((s, i) => s + i.energy, 0)
  const banked = items.filter(i => done.has(i.id)).reduce((s, i) => s + (i.gainPerDay ?? 0), 0)
  const left = energy.current - spent
  const spare = Math.max(0, energy.current - spent - planned)
  const short = Math.max(0, spent + planned - energy.current)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-8">
        <Stat
          label="Energy left"
          value={`${Math.max(0, left).toFixed(0)} / ${energy.cap}`}
          sub={`+${energy.regenPerHour}/h · full in ${hours(energy.hoursToFull)}`}
        />
        <Stat
          label="Gain locked in"
          value={`${gold(banked)}/day`}
          positive={banked > 0}
          sub={`${done.size} of ${items.length} done`}
        />
      </div>

      <section aria-label="Energy plan" className="bg-card flex flex-col gap-2 rounded-md border p-4">
        <div className="text-muted-foreground flex flex-wrap justify-between gap-2 text-sm">
          <span>
            <span className="text-foreground font-medium">{energy.current} energy</span>
            {' '}now
          </span>
          <span>Spent {spent} · planned {planned}{short > 0 ? ` · ${short} more than you have` : ''}</span>
        </div>
        <StackedBar
          className="bg-muted h-3"
          total={Math.max(energy.current, spent + planned)}
          segments={[
            { key: 'spent', value: spent, color: 'var(--heat-slate)' },
            { key: 'planned', value: planned, color: 'var(--fire)' },
            { key: 'spare', value: spare, color: 'var(--muted)' },
          ]}
        />
        <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
          <Legend color="var(--heat-slate)" label="Done" />
          <Legend color="var(--fire)" label="Still to do" />
          <Legend color="var(--muted)" label="Spare" bordered />
        </div>
      </section>

      <div className="flex flex-wrap items-start gap-5">
        <section
          aria-labelledby="todo-heading"
          className="bg-card min-w-0 flex-[999_1_560px] overflow-hidden rounded-md border"
        >
          <h2 id="todo-heading" className="border-b px-4 py-3 text-base font-semibold">Best first</h2>
          {items.length === 0 && (
            <p className="text-muted-foreground px-4 py-6 text-sm">Nothing worth doing right now.</p>
          )}
          <ul>
            {items.map(item => (
              <Row key={item.id} item={item} done={done.has(item.id)} onToggle={() => toggle(item.id)} />
            ))}
          </ul>
        </section>

        {result.skipped.length > 0 && (
          <aside className="bg-card flex min-w-0 flex-[1_1_280px] flex-col gap-2 rounded-md border p-4">
            <h2 className="text-sm font-semibold">Not worth it today</h2>
            <ul className="text-muted-foreground flex flex-col gap-1.5 text-sm">
              {result.skipped.map(s => (
                <li key={s.title}>
                  <span className="text-foreground">{s.title}</span>
                  {': '}
                  {s.why}
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  )
}

function Row({ item, done, onToggle }: { item: TodoItem, done: boolean, onToggle: () => void }) {
  return (
    <li className={cn('border-b last:border-b-0', item.urgent && 'bg-destructive/10', done && 'bg-muted/40')}>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={done}
        className="grid min-h-16 w-full grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left"
      >
        <span
          className={cn(
            'flex size-5 items-center justify-center rounded border-2',
            done ? 'border-green-700 bg-green-700 text-white' : 'border-border',
          )}
        >
          {done && <Check aria-hidden className="size-3.5" strokeWidth={3} />}
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant={item.urgent ? 'destructive' : 'secondary'}>{KIND_LABEL[item.kind]}</Badge>
            <span className={cn('text-sm font-semibold', done && 'text-muted-foreground line-through')}>
              {item.title}
            </span>
          </span>
          <span className="text-muted-foreground text-xs">{item.why}</span>
        </span>
        <span className="flex flex-col items-end gap-1 text-right">
          {item.gainPerDay != null && (
            <span className="text-sm text-green-700 tabular-nums dark:text-green-400">{gold(item.gainPerDay)}/day</span>
          )}
          <span className="text-muted-foreground text-xs whitespace-nowrap">
            {item.energy > 0 ? `${item.energy} energy` : 'no energy'}
          </span>
        </span>
      </button>
    </li>
  )
}

function Stat({ label, value, sub, positive }: { label: string, value: string, sub: string, positive?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className={cn('text-2xl font-semibold tabular-nums', positive && 'text-green-700 dark:text-green-400')}>
        {value}
      </span>
      <span className="text-muted-foreground text-xs">{sub}</span>
    </div>
  )
}

function Legend({ color, label, bordered }: { color: string, label: string, bordered?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('size-2.5 rounded-sm', bordered && 'border')} style={{ background: color }} />
      {label}
    </span>
  )
}
