import type { CardKind } from '../model'
import type { AdvisorCompany, AdvisorInput, SkippedItem, TodoItem } from '../types'

import {
  cardGainsPerDay,
  payingDays,
  RULES,
  trainingsLeft,
} from '../model'
import { firstName, MIN_GAIN_PER_DAY, signedFmt, titleAt } from '../shared'

export const TRAIN_ENERGY = 10

const CARD_LABEL: Record<CardKind, string> = {
  production: 'Production',
  negotiation: 'Negotiation (lower wage)',
  responsibility: 'Responsibility',
}

/**
 * Per trainable employee, the common card that adds the most gold a day.
 *
 * Skipped when they retire within a day or no card pays for itself.
 */
export function trainingItems(input: AdvisorInput, c: AdvisorCompany, vpp: number, skipped: SkippedItem[]): TodoItem[] {
  const items: TodoItem[] = []

  for (const e of c.employees) {
    const draws = trainingsLeft(e)
    if (!draws) {
      continue
    }

    const days = payingDays(e)
    const gains = cardGainsPerDay(e, vpp, input.ppValue)
    const ranked = (Object.keys(gains) as CardKind[]).sort((a, b) => gains[b] - gains[a])
    const best = ranked[0]
    if (days <= 1 || gains[best] * days < MIN_GAIN_PER_DAY) {
      skipped.push({
        title: `Training ${firstName(e.name)}`,
        why: days <= 1 ? `Retires in ${e.retireInDays} days.` : 'No common card pays for itself.',
      })

      continue
    }

    const card = (k: CardKind) => CARD_LABEL[k].split(' ')[0]
    const others = ranked.slice(1).map(k => `${signedFmt(gains[k])} for ${card(k)}`).join(' and ')
    items.push({
      id: `train-${e._id}`,
      kind: 'train',
      ...titleAt(`Train ${firstName(e.name)} at `, c, `: pick ${CARD_LABEL[best]}`),
      why: `${card(best)} earns ${signedFmt(gains[best])} gold a day, against ${others}. Keeps paying for ${days} days.`,
      facts: [
        ...ranked.map(k => ({
          label: card(k),
          value: `${signedFmt(gains[k])} g/day`,
          brief: k === best ? `${card(k)} ${signedFmt(gains[k])}` : undefined,
        })),
        { label: 'Keeps paying', value: `${days} days`, brief: `pays ${days} days` },
      ],
      gainPerDay: gains[best] * draws,
      energy: TRAIN_ENERGY * draws,
    })
  }

  return items
}

/**
 * Trims training items to the owner's daily limit, keeping the best gain per draw.
 */
export function capTrainings(input: AdvisorInput, items: TodoItem[], skipped: SkippedItem[]): TodoItem[] {
  const used = input.companies.flatMap(c => c.employees).reduce((s, e) => s + (e.trainingsToday ?? 0), 0)
  let left = Math.max(0, RULES.trainingsPerOwnerDay - used)
  const perDraw = (i: TodoItem) => (i.gainPerDay ?? 0) / (i.energy! / TRAIN_ENERGY)
  const trains = items.filter(i => i.kind === 'train').sort((a, b) => perDraw(b) - perDraw(a))
  const kept = new Set<TodoItem>()
  for (const i of trains) {
    const draws = Math.min(left, i.energy! / TRAIN_ENERGY)
    if (draws > 0) {
      left -= draws
      i.gainPerDay = perDraw(i) * draws
      i.energy = TRAIN_ENERGY * draws
      kept.add(i)
    }
  }

  if (kept.size < trains.length) {
    const waiting = trains.length - kept.size
    skipped.push({
      title: 'More training today',
      why: `All ${RULES.trainingsPerOwnerDay} of today's trainings are used, so ${waiting} ${waiting === 1 ? 'employee waits' : 'employees wait'} until midnight UTC.`,
    })
  }

  return items.filter(i => i.kind !== 'train' || kept.has(i))
}
