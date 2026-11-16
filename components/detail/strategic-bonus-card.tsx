import type { StrategicBonusRow } from '@/lib/rows'

import { MultiStatCard } from '@/components/detail/multi-stat-card'
import { formatNumber } from '@/lib/format'

/**
 * Display names for the skill codes the bonuses use.
 */
const SKILL_LABELS: Record<string, string> = {
  production: 'Production',
  management: 'Management',
  energy: 'Energy',
  precision: 'Precision',
  health: 'Health',
  lootChance: 'Loot chance',
}

const RESOURCE_LABELS: Record<string, string> = {
  rareEarths: 'Rare earths',
}

function label(code: string, labels: Record<string, string>): string {
  if (labels[code]) {
    return labels[code]
  }

  const words = code.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()

  return words.charAt(0).toUpperCase() + words.slice(1)
}

interface Props {
  bonus: StrategicBonusRow | null

  /**
   * Wording for the caption: whose regions these are.
   */
  scope: 'country' | 'alliance'
}

/**
 * The strategic resource bonuses every citizen gets: skill bonus
 * points, then the regions held per resource with the level they reach.
 * Renders nothing when the country or alliance holds no strategic resource.
 */
export function StrategicBonusCard({ bonus, scope }: Props) {
  if (!bonus || (bonus.skills.length === 0 && bonus.resources.length === 0)) {
    return null
  }

  const shared = scope === 'country' && bonus.allianceId !== null

  return (
    <MultiStatCard
      label={shared ? 'Strategic resources (alliance)' : 'Strategic resources'}
      rows={[
        ...bonus.skills.map(s => ({
          label: label(s.skill, SKILL_LABELS),
          value: s.value,
          display: `+${formatNumber(s.value)}`,
        })),
        ...bonus.resources.map(r => ({
          label: label(r.resource, RESOURCE_LABELS),
          value: r.regionCount,
          display: `${formatNumber(r.regionCount)} ${r.regionCount === 1 ? 'region' : 'regions'} · L${r.level}`,
        })),
      ]}
    />
  )
}
