import type { AdviseRow } from './rows'
import type { TodoItem } from '@/lib/advisor/types'

/**
 * Label and colour per kind of action, shared by the bar, the table and the cards.
 */
export const KIND: Record<TodoItem['kind'], { label: string, color: string }> = {
  money: { label: 'Money', color: 'var(--heat-red)' },
  item: { label: 'Production', color: 'var(--heat-gold)' },
  manager: { label: 'Manager', color: 'var(--heat-purple)' },
  train: { label: 'Training', color: 'var(--fire)' },
  tool: { label: 'Tools', color: 'var(--heat-teal)' },
  employee: { label: 'Staff', color: 'var(--heat-blue)' },
  hire: { label: 'Hiring', color: 'var(--heat-green)' },
  work: { label: 'Work', color: 'var(--heat-slate)' },
}

export const GAIN = 'var(--heat-green-text)'

/**
 * Shared by the header and every row, so the columns line up.
 */
export const COLUMNS = 'md:grid-cols-[28px_minmax(0,1fr)_110px_70px_140px]'

export function gain(value: number): string {
  return `+${value.toFixed(2)}`
}

export function pct(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function sum(rows: AdviseRow[], key: 'gainPerDay' | 'energy'): number {
  return rows.reduce((s, r) => s + r[key], 0)
}

export function things(n: number): string {
  return `${n} small ${n === 1 ? 'thing' : 'things'}`
}
