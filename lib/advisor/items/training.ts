import type { CardKind } from '../model'
import type { AdvisorCompany, AdvisorInput, SkippedItem, TodoItem } from '../types'

import {
  canTrain,
  cardGainsPerDay,
  payingDays,
} from '../model'
import { firstName, MIN_GAIN_PER_DAY, signedFmt } from '../shared'

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
    if (!canTrain(e)) {
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

    const draws = Math.min(e.potential ?? 0, (e.trainingsPerDay ?? 1) - (e.trainingsToday ?? 0))
    const perCard = ranked.map(k => `${CARD_LABEL[k].split(' ')[0]} ${signedFmt(gains[k])}`).join(', ')
    items.push({
      id: `train-${e._id}`,
      kind: 'train',
      title: `Train ${firstName(e.name)} (${c.name}): pick ${CARD_LABEL[best]}`,
      why: `Per day: ${perCard}. Pays for ${days} days.`,
      gainPerDay: gains[best] * draws,
      energy: TRAIN_ENERGY * draws,
    })
  }

  return items
}
