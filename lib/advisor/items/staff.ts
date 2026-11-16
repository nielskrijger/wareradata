import type { AdvisorCompany, TodoItem } from '../types'

import {
  employeeNetPerDay,
  HOURS_PER_DAY,
} from '../model'
import { firstName, fmt, MIN_GAIN_PER_DAY, titleAt } from '../shared'

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
    const linked = helpsTeam || leanedOn
    const output = fmt(HOURS_PER_DAY * (e.estimate?.production ?? 0) * vpp)
    const wages = fmt(HOURS_PER_DAY * (e.estimate?.wage ?? 0))
    items.push({
      id: `fire-${e._id}`,
      kind: 'employee',
      ...titleAt(`Fire ${firstName(e.name)} at `, c),
      why: `They make ${output} gold of output a day but cost ${wages} in wages.${linked ? ' A trait links them to coworkers, so check those first.' : ''}`,
      facts: [
        { label: 'Output', value: `${output} g/day`, brief: `makes ${output} g/day` },
        { label: 'Wages', value: `${wages} g/day`, brief: `costs ${wages}` },
        ...(linked ? [{ label: 'Trait', value: 'linked to coworkers', brief: 'check linked coworkers' }] : []),
      ],
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
    ...titleAt(`Hire into ${open === 1 ? 'the empty slot' : `${open} empty slots`} at `, c),
    why: 'Pick the candidate with the lowest wage per Production point. Trait and potential only show after hiring; firing is free once they have worked 12 hours.',
    facts: [
      { label: 'Pick', value: 'lowest wage per Production point', brief: 'lowest wage per point' },
      { label: 'Shown after hiring', value: 'trait, potential' },
      { label: 'Free to fire', value: 'after 12 h', brief: 'free to fire after 12 h' },
    ],
    gainPerDay: medianNet,
    energy: HIRE_ENERGY,
  }
}
