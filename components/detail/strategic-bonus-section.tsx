import type { StrategicBonusRow } from '@/lib/rows'

import { Fact, SidebarSection } from '@/components/detail/detail-sidebar'
import { SectionHeading } from '@/components/detail/section-heading'
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
 * The strategic resource bonuses every citizen gets, as a sidebar section:
 * skill bonus points, then the regions held per resource with the level they
 * reach. Nothing when the country or alliance holds no strategic resource.
 */
export function StrategicBonusSection({ bonus, scope }: Props) {
  if (!bonus || (bonus.skills.length === 0 && bonus.resources.length === 0)) {
    return null
  }

  const shared = scope === 'country' && bonus.allianceId !== null

  return (
    <SidebarSection>
      <SectionHeading
        title="Strategic resources"
        aside={shared && <span className="text-muted-foreground text-xs">alliance-wide</span>}
      />
      <dl className="space-y-1 text-sm">
        {bonus.skills.map(s => (
          <Fact key={s.skill} label={label(s.skill, SKILL_LABELS)}>{`+${formatNumber(s.value)}`}</Fact>
        ))}
        {bonus.resources.map(r => (
          <Fact key={r.resource} label={label(r.resource, RESOURCE_LABELS)}>
            {`${formatNumber(r.regionCount)} ${r.regionCount === 1 ? 'region' : 'regions'} · L${r.level}`}
          </Fact>
        ))}
      </dl>
    </SidebarSection>
  )
}
