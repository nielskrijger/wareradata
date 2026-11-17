import type { EmployeeLike } from '../model'
import type { Plan, SimWorker, World } from '../sim/world'
import type { AdvisorCompany, TodoItem } from '../types'

import { employeeNetPerDay, HOURS_PER_DAY, RULES } from '../model'
import { firstName, fmt, MIN_GAIN_PER_DAY, titleAt } from '../shared'
import { companyDaily } from '../sim/world'

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

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b)

  return s[Math.floor(s.length / 2)] ?? 0
}

/**
 * A stand-in for a candidate nobody has seen yet: the owner's median worker,
 * with no traits, no tool and no specialization, who stays the whole horizon.
 */
function typicalHire(world: World, k: number, n: number): SimWorker {
  const { workers } = world

  return {
    e: { _id: `hire-${k}-${n}`, name: 'New hire', traits: [], specializations: {} } as unknown as EmployeeLike,
    home: k,
    days: RULES.horizonDays,
    wage: median(workers.map(w => w.wage)),
    fixedStat: median(workers.map(w => w.fixedStat)),
    fixedPct: median(workers.map(w => w.fixedPct)),
    happyFixed: 0,
    happyTemp: [],
    homeRegion: world.companies[k].c.regionId,
    regionStat: 0,
    regionHappy: 0,
    movePenalty: false,
  }
}

/**
 * Empty slots at company `k` under the plan, valued by putting typical hires
 * into them in the simulator, so the team, item, manager and region all count.
 */
export function hireItem(world: World, plan: Plan, k: number): TodoItem | null {
  const { c, idle } = world.companies[k]
  const open = c.employeeCap - idle - plan.team[k].length
  if (open <= 0 || !world.workers.length) {
    return null
  }

  const hires = Array.from({ length: open }, (_, n) => typicalHire(world, k, n))
  const hired: World = {
    ...world,
    workers: [...world.workers, ...hires],
    wages: new Map([...world.wages, ...hires.map(h => [h.e, h.wage] as const)]),
  }

  const ids = hires.map((_, n) => world.workers.length + n)
  const after: Plan = {
    ...plan,
    team: plan.team.map((t, j) => (j === k ? [...t, ...ids] : t)),
    toolOf: [...plan.toolOf, ...ids.map(() => -1)],
  }

  const before = companyDaily(hired, plan, k)
  const output = companyDaily(hired, after, k).reduce((s, g, d) => s + g - before[d], 0) / RULES.horizonDays
  const wages = open * HOURS_PER_DAY * hires[0].wage
  const gain = output - wages
  if (gain < MIN_GAIN_PER_DAY) {
    return null
  }

  return {
    id: `hire-${c.id}`,
    kind: 'hire',
    ...titleAt(`Hire into ${open === 1 ? 'the empty slot' : `${open} empty slots`} at `, c),
    why: `A hire as good as your median worker adds ${fmt(gain / open)} gold a day here, after wages.`
      + ' Pick the candidate with the lowest wage per Production point.'
      + ' Trait and potential only show after hiring; firing is free once they have worked 12 hours.',
    facts: [
      { label: 'Output', value: `${fmt(output)} g/day`, brief: `makes ${fmt(output)} g/day` },
      { label: 'Wages', value: `${fmt(wages)} g/day`, brief: `costs ${fmt(wages)}` },
      { label: 'Pick', value: 'lowest wage per Production point' },
      { label: 'Free to fire', value: 'after 12 h' },
    ],
    gainPerDay: gain,
    energy: HIRE_ENERGY,
  }
}
