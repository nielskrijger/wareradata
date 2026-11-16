import type { AdvisorInput, TodoItem } from '../types'

import {
  HOURS_PER_DAY,
} from '../model'
import { fmt } from '../shared'

/**
 * Urgent when cash covers less than a day of wages, since an unpaid hour stops the company.
 */
export function moneyItem(input: AdvisorInput, hourlyCost: number): TodoItem | null {
  if (input.cash == null || hourlyCost <= 0) {
    return null
  }

  const hours = input.cash / hourlyCost
  if (hours >= HOURS_PER_DAY) {
    return null
  }

  const short = hourlyCost * HOURS_PER_DAY - input.cash

  return {
    id: 'money',
    kind: 'money',
    title: `Add ${fmt(short, 1)} gold: wages run out in ${fmt(hours, 1)} h`,
    why: `Wages and managers cost ${fmt(hourlyCost)} an hour and you hold ${fmt(input.cash, 1)}. An hour that can't be paid in full stops that company for the hour.`,
    gainPerDay: null,
    energy: 0,
    urgent: true,
  }
}
