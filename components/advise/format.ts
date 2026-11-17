import type { LucideIcon } from 'lucide-react'
import type { AdviseRow } from './rows'
import type { TodoItem } from '@/lib/advisor/types'
import { ArrowLeftRight, Briefcase, Coins, Dumbbell, Factory, UserCog, UserPlus, Users, Wrench } from 'lucide-react'

/**
 * Label, colour and icon per kind of action, shared by the bar, the table and the cards.
 */
export const KIND: Record<TodoItem['kind'], { label: string, color: string, icon: LucideIcon }> = {
  money: { label: 'Money', color: 'var(--heat-red)', icon: Coins },
  item: { label: 'Production', color: 'var(--heat-gold)', icon: Factory },
  manager: { label: 'Manager', color: 'var(--heat-purple)', icon: UserCog },
  train: { label: 'Training', color: 'var(--fire)', icon: Dumbbell },
  move: { label: 'Moves', color: 'var(--heat-orange)', icon: ArrowLeftRight },
  tool: { label: 'Tools', color: 'var(--heat-teal)', icon: Wrench },
  employee: { label: 'Staff', color: 'var(--heat-blue)', icon: Users },
  hire: { label: 'Hiring', color: 'var(--heat-green)', icon: UserPlus },
  work: { label: 'Work', color: 'var(--heat-slate)', icon: Briefcase },
}

export const GAIN = 'var(--heat-green-text)'

/**
 * Shared by the header and every row, so the columns line up.
 */
export const COLUMNS = 'md:grid-cols-[28px_minmax(0,1fr)_70px_140px]'

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
