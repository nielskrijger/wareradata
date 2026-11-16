import type { AdvisorCompany, TodoItem } from '../types'

import {
  employeeNetPerDay,
  HOURS_PER_DAY,
} from '../model'
import { firstName, fmt, MIN_GAIN_PER_DAY } from '../shared'

const HIRE_ENERGY = 10

/**
 * Traits that help coworkers, so firing their holder costs more than their own net.
 */
const TEAM_TRAITS = new Set(['mentor', 'foreman', 'trainer', 'recruiter', 'oldFriends', 'sociable'])

/**
 * Employees whose output is worth less than their wage.
 */
export function fireItems(c: AdvisorCompany, vpp: number): TodoItem[] {
  const items: TodoItem[] = []

  for (const e of c.employees) {
    const net = employeeNetPerDay(e, vpp)
    if (net > -MIN_GAIN_PER_DAY || e.companyDisabled) {
      continue
    }

    const helpsTeam = (e.traits ?? []).some(t => TEAM_TRAITS.has(t.code))
    const leanedOn = c.employees.some(o => o._id !== e._id && (o.traits ?? []).some(t => t.arg === e._id))
    items.push({
      id: `fire-${e._id}`,
      kind: 'employee',
      title: `Fire ${firstName(e.name)} (${c.name})`,
      why: `Their output is worth ${fmt(HOURS_PER_DAY * (e.estimate?.production ?? 0) * vpp)} a day and they cost ${fmt(HOURS_PER_DAY * (e.estimate?.wage ?? 0))} in wages.${helpsTeam || leanedOn ? ' A trait links them to coworkers, so check those first.' : ''}`,
      gainPerDay: -net,
    })
  }

  return items
}

/**
 * Empty slots, valued at the median employee's net.
 */
export function hireItem(c: AdvisorCompany, medianNet: number | null): TodoItem | null {
  const open = c.employeeCap - c.employees.length
  if (open <= 0) {
    return null
  }

  return {
    id: `hire-${c.id}`,
    kind: 'hire',
    title: `Hire into ${open === 1 ? 'the empty slot' : `${open} empty slots`} at ${c.name}`,
    why: 'Pick the candidate with the lowest wage per Production. Trait and potential show after hiring, and a new hire can be fired for free after 12 hours.',
    gainPerDay: medianNet,
    energy: HIRE_ENERGY,
  }
}
