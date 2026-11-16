import type { CompanyRef, Fact, TodoItem } from '@/lib/advisor/types'

/**
 * Actions earning less than this a day each count as small stuff and fold away.
 */
export const SMALL_GAIN_PER_DAY = 1

/**
 * One line of the table: a single action, or like actions folded together.
 */
export interface AdviseRow {
  id: string
  kind: TodoItem['kind']
  title: string
  why: string
  facts: Fact[]
  gainPerDay: number
  energy: number
  titleParts?: TodoItem['titleParts']
  parts: { short: string, company?: CompanyRef, gainPerDay: number }[]
  switch?: TodoItem['switch']
}

type GroupKey = NonNullable<TodoItem['group']>['key']

const GROUP: Record<GroupKey, { title: (n: number) => string, why?: string }> = {
  // Each manager reason reads the same, so the first one stands for all.
  'manager-job': { title: n => `Post manager jobs at ${n} companies` },
  'tool-move': {
    title: n => `Make ${n} tool moves`,
    why: 'A tool adds a percent of base output, so it earns most with your fastest workers.',
  },
}

function single(item: TodoItem): AdviseRow {
  return {
    id: item.id,
    kind: item.kind,
    title: item.title,
    titleParts: item.titleParts,
    why: item.why,
    facts: item.facts ?? [],
    gainPerDay: item.gainPerDay ?? 0,
    energy: item.energy ?? 0,
    parts: [],
    switch: item.switch,
  }
}

/**
 * Folds actions that share a group into one row and sorts by gain. A group of
 * one stays a plain row, keeping its own title and reason.
 */
export function toRows(items: TodoItem[]): AdviseRow[] {
  const groups = new Map<string, TodoItem[]>()
  const rows: AdviseRow[] = []
  for (const item of items) {
    if (!item.group) {
      rows.push(single(item))
      continue
    }

    const list = groups.get(item.group.key) ?? []
    list.push(item)
    groups.set(item.group.key, list)
  }

  for (const [key, list] of groups) {
    if (list.length === 1) {
      rows.push(single(list[0]))
      continue
    }

    const sorted = [...list].sort((a, b) => (b.gainPerDay ?? 0) - (a.gainPerDay ?? 0))
    rows.push({
      id: `group-${key}-${sorted[0].id}`,
      kind: sorted[0].kind,
      title: GROUP[key as GroupKey].title(sorted.length),
      why: GROUP[key as GroupKey].why ?? sorted[0].why,
      // A group's own reason has no breakdown; otherwise the first stands for all.
      facts: GROUP[key as GroupKey].why ? [] : sorted[0].facts ?? [],
      gainPerDay: sorted.reduce((s, i) => s + (i.gainPerDay ?? 0), 0),
      energy: sorted.reduce((s, i) => s + (i.energy ?? 0), 0),
      parts: sorted.map(i => ({ short: i.group!.short, company: i.group!.company, gainPerDay: i.gainPerDay ?? 0 })),
    })
  }

  return rows.sort((a, b) => b.gainPerDay - a.gainPerDay)
}

/**
 * Splits the list into actions worth doing on their own and small stuff, each
 * side grouped separately so a group never mixes big and small actions.
 */
export function splitBySize(items: TodoItem[]): { big: AdviseRow[], small: AdviseRow[] } {
  const isBig = (i: TodoItem) => (i.gainPerDay ?? 0) >= SMALL_GAIN_PER_DAY

  return { big: toRows(items.filter(isBig)), small: toRows(items.filter(i => !isBig(i))) }
}
