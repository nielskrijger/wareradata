import type { EmployeeLike } from '../model'

/**
 * What a trait rule sees: the worker, their coworkers that day, and the place.
 */
export interface RuleContext {
  e: EmployeeLike
  others: EmployeeLike[]
  wageOf: (e: EmployeeLike) => number
  itemCode: string
  rawGood: boolean
  storageLevel: number

  /**
   * Holding a tool that works on the item.
   */
  toolUsable: boolean
}

/**
 * One trait effect that depends on the place or the team. `code` names the
 * breakdown entry it stands for: a Production stat contribution, a production
 * bonus source, or a happiness contribution.
 */
export interface TraitRule {
  kind: 'stat' | 'bonus' | 'happiness'
  code: string
  amount: (c: RuleContext) => number
}

export function owns(e: EmployeeLike, code: string): boolean {
  return (e.traits ?? []).some(t => t.code === code)
}

const women = (c: RuleContext) => c.others.filter(o => o.gender === 'female').length
const men = (c: RuleContext) => c.others.filter(o => o.gender === 'male').length
const alone = (c: RuleContext) => c.others.length === 0
const topWage = (c: RuleContext) => !alone(c) && c.others.every(o => c.wageOf(o) < c.wageOf(c.e))
function foreignNationalities(c: RuleContext) {
  return new Set(c.others.map(o => o.nationality).filter(n => n && n !== c.e.nationality)).size
}

const coworkersWith = (c: RuleContext, code: string) => c.others.filter(o => owns(o, code)).length
const onItem = (c: RuleContext, code: string) => c.e.traits?.find(t => t.code === code)?.arg === c.itemCode

/**
 * A rule for the holder of `trait` only.
 */
function held(kind: TraitRule['kind'], trait: string, amount: (c: RuleContext) => number, code = trait): TraitRule {
  return { kind, code, amount: c => (owns(c.e, trait) ? amount(c) : 0) }
}

/**
 * A partner trait, which counts while its named coworker is on the team.
 */
function partner(trait: string, pct: number): TraitRule {
  return {
    kind: 'bonus',
    code: trait,
    amount: c => c.e.traits?.some(t => t.code === trait && c.others.some(o => o._id === t.arg)) ? pct : 0,
  }
}

/**
 * Trait rules the API doesn't document, read off the breakdowns of 7,083
 * employees across 2,835 companies; `check-advisor` re-checks them on the
 * owner's roster.
 */
export const TRAIT_RULES: TraitRule[] = [
  // Production stat points raise base output but not the wage.
  held('stat', 'craftsman', c => (c.rawGood ? -1 : 3)),
  held('stat', 'laborer', c => (c.rawGood ? 3 : -1)),
  held('stat', 'specialist', c => (onItem(c, 'specialist') ? 3 : 0)),
  held('stat', 'cosmopolitan', c => 2 * foreignNationalities(c)),
  held('stat', 'xenophobe', c => (foreignNationalities(c) > 0 ? -2 : 0)),
  held('stat', 'comic', c => (alone(c) ? 0 : -1)),
  held('stat', 'bully', c => (alone(c) ? 0 : 2)),

  // Production bonus percent.
  held('bonus', 'sociable', c => 25 * c.others.length),
  held('bonus', 'girlPower', c => 15 * women(c)),
  held('bonus', 'bandOfBrothers', c => 15 * men(c)),
  held('bonus', 'misogynist', c => -15 * women(c)),
  held('bonus', 'manHater', c => -15 * men(c)),
  held('bonus', 'loner', c => (alone(c) ? 100 : 0)),
  held('bonus', 'primaDonna', c => (topWage(c) ? 20 : 0)),
  held('bonus', 'handy', c => (c.toolUsable ? 40 : 0)),
  held('bonus', 'improviser', c => (c.toolUsable ? 0 : 25)),
  held('bonus', 'claustrophobe', c => (c.storageLevel < 3 ? -20 : 0)),
  partner('oldFriends', 15),
  partner('sweethearts', 20),
  partner('nemesis', -15),

  // Happiness points, each a production percent.
  held('happiness', 'loner', c => (alone(c) ? 5 : 0)),
  held('happiness', 'sociable', c => (alone(c) ? -10 : 0)),
  held('happiness', 'primaDonna', c => (!alone(c) && !topWage(c) ? -10 : 0)),
  held('happiness', 'envious', c => -5 * c.others.filter(o => c.wageOf(o) > c.wageOf(c.e)).length),
  held('happiness', 'xenophobe', c => (foreignNationalities(c) > 0 ? -5 : 0)),
  held('happiness', 'specialist', c => (onItem(c, 'specialist') ? 5 : 0)),
  { kind: 'happiness', code: 'comic', amount: c => (coworkersWith(c, 'comic') > 0 ? 10 : 0) },
  { kind: 'happiness', code: 'foreman', amount: c => 9 * coworkersWith(c, 'foreman') },
  { kind: 'happiness', code: 'bully', amount: c => -10 * coworkersWith(c, 'bully') },
]

export const RULE_CODES = {
  stat: new Set(TRAIT_RULES.filter(r => r.kind === 'stat').map(r => r.code)),
  bonus: new Set(TRAIT_RULES.filter(r => r.kind === 'bonus').map(r => r.code)),
  happiness: new Set(TRAIT_RULES.filter(r => r.kind === 'happiness').map(r => r.code)),
}

export function ruleTotals(c: RuleContext): Record<TraitRule['kind'], number> {
  const totals = { stat: 0, bonus: 0, happiness: 0 }
  for (const r of TRAIT_RULES) {
    totals[r.kind] += r.amount(c)
  }

  return totals
}

/**
 * The same totals as the game shows them, for the check.
 */
export function gameTotals(e: EmployeeLike): Record<TraitRule['kind'], number> {
  const sum = <T>(xs: T[], pick: (x: T) => number) => xs.reduce((s, x) => s + pick(x), 0)

  return {
    stat: sum(
      (e.breakdown?.production?.contributions ?? []).filter(x => !x.percent && RULE_CODES.stat.has(x.code)),
      x => x.delta,
    ),
    bonus: sum((e.productionBonus?.contributions ?? []).filter(x => RULE_CODES.bonus.has(x.source)), x => x.percent),
    happiness: sum(
      (e.happinessBreakdown?.contributions ?? []).filter(x => x.code && RULE_CODES.happiness.has(x.code)),
      x => x.delta,
    ),
  }
}

/**
 * Own traits tied to the region, whose country the roster doesn't give: they
 * keep today's effect within the same region and are dropped elsewhere.
 */
export const REGION_TRAITS = new Set(['patriot', 'nationalist', 'homesick', 'expat'])

/**
 * Temporary costs of a move. Some owners' moved workers lose 10 happiness for
 * 7 days and others' don't; a creature of habit loses 30% for 3 days.
 */
export const MOVE_COST = {
  happiness: -10,
  happinessDays: 7,
  creatureOfHabitPct: -30,
  creatureOfHabitDays: 3,
}

/**
 * Happiness adds a production percent per point away from 50, within this.
 */
export const HAPPINESS_CAP = 50
