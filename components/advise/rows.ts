import type { Fact, TodoItem } from '@/lib/advisor/types'

/**
 * Actions earning less than this a day each count as small stuff and fold away.
 */
export const SMALL_GAIN_PER_DAY = 1

/**
 * One line of the table.
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
}

function toRow(item: TodoItem): AdviseRow {
  return {
    id: item.id,
    kind: item.kind,
    title: item.title,
    titleParts: item.titleParts,
    why: item.why,
    facts: item.facts ?? [],
    gainPerDay: item.gainPerDay ?? 0,
    energy: item.energy ?? 0,
  }
}

/**
 * Splits the list, already sorted by gain, into actions worth doing on their own and small stuff.
 */
export function splitBySize(items: TodoItem[]): { big: AdviseRow[], small: AdviseRow[] } {
  const isBig = (i: TodoItem) => (i.gainPerDay ?? 0) >= SMALL_GAIN_PER_DAY

  return { big: items.filter(isBig).map(toRow), small: items.filter(i => !isBig(i)).map(toRow) }
}
